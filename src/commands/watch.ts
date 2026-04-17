/**
 * watch.ts
 *
 * `memex watch`
 *
 * Watches `<vault>/raw/` (or a custom path) for new / changed source files and
 * drives the ingest→lint→ingest self-healing loop. Designed to be run either
 * in the foreground or as a detached background daemon.
 *
 *   memex watch                     # foreground
 *   memex watch --daemon            # spawn detached background process
 *   memex watch --stop              # kill running daemon
 *   memex watch --status            # show daemon state + recent log tail
 *   memex watch --once              # run one loop now and exit (no watcher)
 *   memex watch --max-iter 5        # cap ingest↔lint loops per batch
 */
import { resolveGlobalVaultPath } from '../core/vault.js';
import { pathExists } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { runIngestLintLoop } from '../core/ingest-lint-loop.js';
import { runLint } from './lint.js';
import {
  StatusWriter,
  emptyStats,
  readStatus,
  watchStatusPath,
  type WatchStatus,
} from '../core/watch-status.js';
import { watch as chokidarWatch } from 'chokidar';
import {
  writeFile,
  readFile,
  unlink,
  mkdir,
  stat,
  appendFile,
  open,
} from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, join, resolve as pathResolve, relative as pathRelative } from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';

export interface WatchOptions {
  path?: string;
  daemon?: boolean;
  stop?: boolean;
  status?: boolean;
  /** Live-tail the daemon log (like `tail -f`). */
  follow?: boolean;
  once?: boolean;
  agent?: string;
  /**
   * Health-driven auto-heal: periodically run `lint`, and whenever it
   * reports issues, enter the ingest→lint loop until clean — even without
   * any file events. Runs in parallel with file-event triggering.
   */
  heal?: boolean;
  /** Heal-check interval in ms (default 60000). Ignored unless `heal` is set. */
  healInterval?: number;
  /**
   * Run a heal check once at startup (default: true when `heal` is set).
   * Pass `--no-heal-on-start` to suppress the immediate check.
   */
  healOnStart?: boolean;
  /**
   * Ingest↔lint loop cap per batch. `0` / negative / omitted → unlimited
   * (loop until clean or user-stop). Defaults to unlimited in watch mode.
   */
  maxIter?: number;
  /**
   * Disable the "same issues twice in a row" convergence guard so the
   * loop literally keeps retrying until lint is clean or the user stops
   * the watcher. Intended for long-running daemons.
   */
  force?: boolean;
  /** debounce window in ms (default 3000) */
  debounce?: number;
  /** file extensions to react to (default: md,jsonl,json,txt) */
  ext?: string;
  vault?: string;
}

interface RunState {
  vault: string;
  watchPath: string;
  agent?: string;
  /** `Infinity` means unlimited. */
  maxIter: number;
  disableNoChangeGuard: boolean;
  debounceMs: number;
  extensions: Set<string>;
  cwd: string;
  writer: StatusWriter;
  batchCounter: { id: number };
  heal: boolean;
  healIntervalMs: number;
  healOnStart: boolean;
}

const DEFAULT_EXT = ['md', 'jsonl', 'json', 'txt'] as const;

export async function watchCommand(options: WatchOptions, cwd: string): Promise<void> {
  const vault = await resolveGlobalVaultPath({ explicitPath: options.vault }, cwd);
  const pidPath = daemonPidPath(vault);
  const logPath = daemonLogPath(vault);

  if (options.status) {
    await showStatus(pidPath, logPath, vault);
    return;
  }

  if (options.follow) {
    await followLog(logPath);
    return;
  }

  if (options.stop) {
    await stopDaemon(pidPath);
    return;
  }

  const watchPath = pathResolve(options.path || join(vault, 'raw'));
  if (!(await pathExists(watchPath))) {
    logger.error(`Watch path does not exist: ${watchPath}`);
    return;
  }

  if (options.daemon) {
    await spawnDaemon({ ...options, vault, path: watchPath }, pidPath, logPath);
    return;
  }

  const resolvedMax = resolveMaxIter(options.maxIter);
  const maxLabel = Number.isFinite(resolvedMax) ? String(resolvedMax) : '∞';
  const writer = new StatusWriter({
    pid: process.pid,
    started: new Date().toISOString(),
    vault,
    watchPath,
    maxIterLabel: maxLabel,
    force: !!options.force,
    phase: 'starting',
    iteration: 0,
    batchId: 0,
    batchSize: 0,
    currentFiles: [],
    issuesRemaining: null,
    lastActivity: new Date().toISOString(),
    stats: emptyStats(),
  });
  await writer.flush();

  const state: RunState = {
    vault,
    watchPath,
    agent: options.agent,
    maxIter: resolvedMax,
    disableNoChangeGuard: !!options.force,
    debounceMs: Math.max(500, options.debounce ?? 3000),
    extensions: parseExtensions(options.ext),
    cwd,
    writer,
    batchCounter: { id: 0 },
    heal: !!options.heal,
    healIntervalMs: Math.max(5_000, options.healInterval ?? 60_000),
    healOnStart: options.healOnStart ?? true,
  };

  // Mark ourselves in the PID file so `--stop` from another shell can find us
  // even when we were started without --daemon.
  await ensureDir(dirname(pidPath));
  await writeFile(pidPath, `${process.pid}\n${new Date().toISOString()}\n${watchPath}\n`);

  const cleanup = async (code = 0) => {
    try { state.writer.update({ phase: 'stopped' }); await state.writer.flush(); } catch { /* ignore */ }
    try { await unlink(pidPath); } catch { /* ignore */ }
    try { await unlink(watchStatusPath(vault)); } catch { /* ignore */ }
    process.exit(code);
  };
  process.on('SIGINT', () => { void cleanup(0); });
  process.on('SIGTERM', () => { void cleanup(0); });

  if (options.once) {
    logger.info(`Running one ingest→lint pass over ${watchPath}`);
    state.batchCounter.id += 1;
    state.writer.update({
      phase: 'batch-start',
      batchId: state.batchCounter.id,
      batchSize: 0,
      currentFiles: [],
    });
    state.writer.increment('batches');
    await runLoopSafe(state, { skipFirstIngest: options.heal });
    await cleanup(0);
    return;
  }

  logger.info(pc.cyan(`memex watch — vault ${vault}`));
  logger.info(`watching: ${watchPath}`);
  logger.info(
    `extensions: ${[...state.extensions].join(',')} · debounce: ${state.debounceMs}ms · max-iter: ${maxLabel}` +
      (state.disableNoChangeGuard ? ' · --force (no-change guard off)' : ''),
  );
  if (state.heal) {
    logger.info(
      `heal: every ${Math.round(state.healIntervalMs / 1000)}s` +
        (state.healOnStart ? ' · heal-on-start' : ''),
    );
  }
  logger.info('Press Ctrl+C to stop (or run `memex watch --stop` from another shell).');
  state.writer.update({ phase: 'idle' });

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let busy = false;
  let rerun = false;
  const pendingFiles = new Set<string>();

  // Common batch runner: bumps batchId, updates status, logs the batch
  // header, then runs the ingest↔lint loop.
  async function runBatch(args: {
    files: string[];
    source: 'files' | 'heal';
    issuesHint?: number;
  }): Promise<void> {
    state.batchCounter.id += 1;
    const batchId = state.batchCounter.id;
    const rels = args.files.map((f) => toRel(f, state.watchPath));
    state.writer.update({
      phase: args.source === 'heal' ? 'healing' : 'batch-start',
      batchId,
      batchSize: rels.length,
      currentFiles: rels,
      iteration: 0,
      issuesRemaining: args.issuesHint ?? null,
    });
    state.writer.increment('batches');
    if (args.source === 'heal') {
      logger.info(
        pc.yellow(
          `\n── heal batch #${batchId} · lint reports ${args.issuesHint ?? '?'} issue(s) ──`,
        ),
      );
    } else if (rels.length > 0) {
      logger.info(
        pc.cyan(
          `\n── batch #${batchId} (${rels.length} file${rels.length === 1 ? '' : 's'}) ──`,
        ),
      );
      for (const f of rels.slice(0, 10)) logger.info(`  • ${f}`);
      if (rels.length > 10) logger.info(`  … and ${rels.length - 10} more`);
    }
    // For heal-triggered batches we already know lint is dirty, so skip the
    // initial plain ingest and let iter 1 run a lint that attaches the report
    // — then iter 2 ingests with the report attached.
    await runLoopSafe(state, { skipFirstIngest: args.source === 'heal' });
    state.writer.update({ phase: 'idle', currentFiles: [], batchSize: 0 });
  }

  const triggerFiles = async (): Promise<void> => {
    if (busy) {
      rerun = true;
      return;
    }
    busy = true;
    try {
      do {
        rerun = false;
        const batch = [...pendingFiles];
        pendingFiles.clear();
        if (batch.length === 0) break;
        await runBatch({ files: batch, source: 'files' });
      } while (rerun);
    } finally {
      busy = false;
    }
  };

  const triggerHeal = async (initial = false): Promise<void> => {
    if (busy) return; // a real batch is in flight; next tick is fine
    busy = true;
    try {
      state.writer.update({ phase: 'health-check' });
      state.writer.increment('healChecks');
      let report;
      try {
        report = await runLint({ vault: state.vault }, state.cwd);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logger.error(`heal: lint failed: ${msg}`);
        state.writer.update({ phase: 'error', lastError: msg });
        state.writer.increment('errors');
        return;
      }
      if (report.issues.length === 0) {
        if (initial) logger.success('heal: lint clean on startup — nothing to do.');
        state.writer.update({ phase: 'idle', issuesRemaining: 0 });
        return;
      }
      state.writer.increment('healTriggers');
      logger.warn(
        `heal: lint found ${report.issues.length} issue(s) ` +
          `(orphans=${report.summary.orphans}, broken=${report.summary.brokenLinks}, ` +
          `frontmatter=${report.summary.frontmatterErrors}) — auto-healing.`,
      );
      logger.info(pc.dim('── heal: issues ──'));
      for (const issue of report.issues.slice(0, 50)) {
        if (issue.type === 'orphan') {
          logger.warn(`  orphan       ${issue.page}  (${issue.path})`);
        } else if (issue.type === 'broken-link') {
          logger.warn(`  broken-link  ${issue.source} → [[${issue.target}]]`);
        } else if (issue.type === 'missing-frontmatter') {
          logger.warn(`  frontmatter  ${issue.page} — missing: ${(issue.errors ?? []).join(', ')}`);
        }
      }
      if (report.issues.length > 50) {
        logger.info(pc.dim(`  … ${report.issues.length - 50} more elided`));
      }
      logger.info(pc.dim('── heal: issues end ──'));
      await runBatch({ files: [], source: 'heal', issuesHint: report.issues.length });
    } finally {
      busy = false;
    }
  };

  const onChange = (filePath: string) => {
    if (!shouldReact(filePath, state.extensions)) return;
    pendingFiles.add(filePath);
    state.writer.update({
      phase: 'debouncing',
      currentFiles: [...pendingFiles].map((f) => toRel(f, state.watchPath)),
      batchSize: pendingFiles.size,
    });
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void triggerFiles();
    }, state.debounceMs);
  };

  const watcher = chokidarWatch(watchPath, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 1500, pollInterval: 100 },
  });
  watcher.on('add', onChange);
  watcher.on('change', onChange);
  watcher.on('error', (error: unknown) => {
    logger.error(`watcher error: ${error instanceof Error ? error.message : String(error)}`);
  });

  // Health-driven auto-heal loop — runs alongside file events.
  if (state.heal) {
    if (state.healOnStart) {
      // Give chokidar a tick to warm up; no hard requirement.
      setTimeout(() => void triggerHeal(true), 500);
    }
    setInterval(() => void triggerHeal(false), state.healIntervalMs).unref();
  }

  await new Promise<void>(() => { /* run forever */ });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseExtensions(raw?: string): Set<string> {
  const list = raw
    ? raw.split(',').map((s) => s.trim().replace(/^\./, '').toLowerCase()).filter(Boolean)
    : DEFAULT_EXT.slice();
  return new Set(list);
}

function shouldReact(file: string, exts: Set<string>): boolean {
  const m = file.match(/\.([A-Za-z0-9]+)$/);
  if (!m) return false;
  return exts.has(m[1]!.toLowerCase());
}

async function runLoopSafe(
  state: RunState,
  extra: { skipFirstIngest?: boolean } = {},
): Promise<void> {
  try {
    await runIngestLintLoop({
      vault: state.vault,
      cwd: state.cwd,
      agent: state.agent,
      target: state.watchPath,
      maxIter: state.maxIter,
      disableNoChangeGuard: state.disableNoChangeGuard,
      skipFirstIngest: extra.skipFirstIngest,
      reporter: (evt) => {
        switch (evt.phase) {
          case 'ingest':
            state.writer.update({ phase: 'ingest', iteration: evt.iteration });
            break;
          case 'ingest-done':
            state.writer.increment('iterations');
            break;
          case 'lint':
            state.writer.update({ phase: 'lint', iteration: evt.iteration });
            break;
          case 'lint-done':
            state.writer.update({
              iteration: evt.iteration,
              issuesRemaining: evt.issues ?? 0,
            });
            break;
          case 'clean':
            state.writer.update({
              phase: 'clean',
              issuesRemaining: 0,
            });
            state.writer.increment('cleanRuns');
            break;
          case 'stalled':
            state.writer.update({
              phase: 'stalled',
              issuesRemaining: evt.issues ?? null,
            });
            state.writer.increment('stalledRuns');
            break;
        }
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error(`loop error: ${msg}`);
    state.writer.update({ phase: 'error', lastError: msg });
    state.writer.increment('errors');
  }
}

function toRel(file: string, root: string): string {
  try {
    const r = pathRelative(root, file).replace(/\\/g, '/');
    return r && !r.startsWith('..') ? r : file.replace(/\\/g, '/');
  } catch {
    return file.replace(/\\/g, '/');
  }
}

function resolveMaxIter(raw: number | undefined): number {
  if (raw === undefined || raw === null) return Number.POSITIVE_INFINITY;
  if (!Number.isFinite(raw)) return Number.POSITIVE_INFINITY;
  if (raw <= 0) return Number.POSITIVE_INFINITY;
  return Math.floor(raw);
}

function daemonPidPath(vault: string): string {
  return join(vault, '.llmwiki', 'watch.pid');
}

function daemonLogPath(vault: string): string {
  return join(vault, '.llmwiki', 'watch.log');
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

async function showStatus(pidPath: string, logPath: string, vault: string): Promise<void> {
  const pid = await readPid(pidPath);
  const alive = pid != null && isProcessAlive(pid);
  if (alive) {
    logger.success(`watch daemon alive — pid ${pid}`);
  } else {
    logger.warn('no running watch daemon.');
    if (pid) logger.warn(`stale pid file at ${pidPath} — will be ignored.`);
  }

  const snapshot = await readStatus(vault);
  if (snapshot) {
    renderStatusSnapshot(snapshot, alive);
  } else {
    console.log(pc.dim('(no status snapshot yet — waiting for first event)'));
  }

  if (await pathExists(logPath)) {
    const tail = await tailFile(logPath, 20);
    if (tail.trim().length > 0) {
      console.log();
      console.log(pc.dim('── last 20 log lines ──'));
      console.log(tail);
      console.log(pc.dim(`(live-tail with: memex watch --follow)`));
    }
  }
}

function renderStatusSnapshot(s: WatchStatus, alive: boolean): void {
  const phaseColor = phaseColorFor(s.phase);
  console.log();
  console.log(`  ${phaseColor(s.phase.padEnd(12))} ${pc.dim(`iter ${s.iteration}/${s.maxIterLabel}`)}`);
  console.log(`  ${pc.dim('vault    :')} ${s.vault}`);
  console.log(`  ${pc.dim('watching :')} ${s.watchPath}`);
  const ago = timeAgo(s.lastActivity);
  console.log(`  ${pc.dim('updated  :')} ${ago}${alive ? '' : pc.red('  (process not running)')}`);
  if (s.issuesRemaining !== null) {
    console.log(`  ${pc.dim('issues   :')} ${s.issuesRemaining}`);
  }
  if (s.batchSize > 0) {
    console.log(`  ${pc.dim('batch    :')} #${s.batchId} · ${s.batchSize} file${s.batchSize === 1 ? '' : 's'}`);
    for (const f of s.currentFiles.slice(0, 10)) {
      console.log(`             • ${f}`);
    }
    if (s.currentFiles.length > 10) {
      console.log(`             … ${s.currentFiles.length - 10} more`);
    }
  }
  const st = s.stats;
  console.log(
    `  ${pc.dim('stats    :')} batches=${st.batches} iters=${st.iterations} clean=${st.cleanRuns} stalled=${st.stalledRuns} errors=${st.errors}`,
  );
  if ((st.healChecks ?? 0) > 0 || (st.healTriggers ?? 0) > 0) {
    console.log(
      `  ${pc.dim('heal     :')} checks=${st.healChecks ?? 0} triggers=${st.healTriggers ?? 0}`,
    );
  }
  if (s.lastError) {
    console.log(`  ${pc.dim('error    :')} ${pc.red(s.lastError)}`);
  }
  if (s.force) {
    console.log(`  ${pc.dim('flags    :')} --force (no-change guard off)`);
  }
  console.log();
}

function phaseColorFor(phase: WatchStatus['phase']): (s: string) => string {
  switch (phase) {
    case 'ingest':
    case 'lint':
    case 'refresh':
      return pc.cyan;
    case 'clean':
      return pc.green;
    case 'stalled':
    case 'error':
      return pc.red;
    case 'debouncing':
    case 'batch-start':
    case 'health-check':
    case 'healing':
      return pc.yellow;
    case 'stopped':
      return pc.dim;
    default:
      return pc.dim;
  }
}

function timeAgo(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const sec = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  return `${hr}h ago`;
}

async function followLog(logPath: string): Promise<void> {
  if (!(await pathExists(logPath))) {
    logger.warn(`no log file yet at ${logPath}`);
    logger.info('start the daemon with `memex watch --daemon` first.');
    return;
  }
  logger.info(pc.cyan(`following ${logPath} — Ctrl+C to stop`));
  console.log();
  let offset = 0;
  try {
    const s = await stat(logPath);
    offset = Math.max(0, s.size - 4096);
  } catch {
    /* ignore */
  }

  let running = true;
  const onExit = () => { running = false; };
  process.on('SIGINT', onExit);
  process.on('SIGTERM', onExit);

  while (running) {
    try {
      const s = await stat(logPath);
      if (s.size < offset) offset = 0; // file was rotated / truncated
      if (s.size > offset) {
        const fh = await open(logPath, 'r');
        try {
          const len = s.size - offset;
          const buf = Buffer.alloc(len);
          await fh.read(buf, 0, len, offset);
          process.stdout.write(buf.toString('utf-8'));
          offset = s.size;
        } finally {
          await fh.close();
        }
      }
    } catch {
      /* file may be mid-rotation; retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function stopDaemon(pidPath: string): Promise<void> {
  const pid = await readPid(pidPath);
  if (!pid) {
    logger.warn('no watch daemon pid file found — nothing to stop.');
    return;
  }
  if (!isProcessAlive(pid)) {
    try { await unlink(pidPath); } catch { /* ignore */ }
    logger.warn(`pid ${pid} not running — cleared stale pid file.`);
    return;
  }
  try {
    process.kill(pid, 'SIGTERM');
    logger.success(`sent SIGTERM to pid ${pid}.`);
  } catch (e) {
    logger.error(`failed to signal pid ${pid}: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }
  // best-effort wait
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && isProcessAlive(pid)) {
    await new Promise((r) => setTimeout(r, 200));
  }
  if (isProcessAlive(pid)) {
    logger.warn(`pid ${pid} still alive after 5s; escalating to SIGKILL.`);
    try { process.kill(pid, 'SIGKILL'); } catch { /* ignore */ }
  }
  try { await unlink(pidPath); } catch { /* ignore */ }
  logger.success('watch daemon stopped.');
}

async function readPid(pidPath: string): Promise<number | null> {
  try {
    const content = await readFile(pidPath, 'utf-8');
    const first = content.split(/\r?\n/)[0]!.trim();
    const n = Number.parseInt(first, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    // signal 0 → probe only, throws if the process does not exist
    process.kill(pid, 0);
    return true;
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    // EPERM means the process exists but we're not allowed to signal it.
    return err.code === 'EPERM';
  }
}

async function tailFile(path: string, lines: number): Promise<string> {
  try {
    const content = await readFile(path, 'utf-8');
    const arr = content.split(/\r?\n/);
    return arr.slice(-lines - 1).join('\n');
  } catch {
    return '';
  }
}

async function spawnDaemon(
  opts: WatchOptions & { vault: string; path: string },
  pidPath: string,
  logPath: string,
): Promise<void> {
  await ensureDir(dirname(pidPath));
  await ensureDir(dirname(logPath));
  // Resolve the CLI entry — this file lives at dist/commands/watch.js at runtime,
  // so cli.js sits one level up.
  const here = dirname(fileURLToPath(import.meta.url));
  const cliEntry = pathResolve(here, '..', 'cli.js');

  const args: string[] = [cliEntry, 'watch'];
  if (opts.path) args.push('--path', opts.path);
  if (opts.agent) args.push('--agent', opts.agent);
  // `0` is our sentinel for "unlimited"; forward it so the child uses the
  // same semantics as the parent. Omit entirely when user didn't pass one
  // (defaults to unlimited downstream).
  if (opts.maxIter !== undefined) {
    const n = Number.isFinite(opts.maxIter) && (opts.maxIter as number) > 0 ? (opts.maxIter as number) : 0;
    args.push('--max-iter', String(n));
  }
  if (opts.force) args.push('--force');
  if (opts.heal) args.push('--heal');
  if (opts.healInterval !== undefined) args.push('--heal-interval', String(opts.healInterval));
  if (opts.healOnStart === false) args.push('--no-heal-on-start');
  if (opts.debounce) args.push('--debounce', String(opts.debounce));
  if (opts.ext) args.push('--ext', opts.ext);
  if (opts.vault) args.push('--vault', opts.vault);

  const logFd = await open(logPath, 'a');
  const header = `\n── daemon start ${new Date().toISOString()} ──\n`;
  await appendFile(logPath, header);

  const child = spawn(process.execPath, args, {
    detached: true,
    stdio: ['ignore', logFd.fd, logFd.fd],
    cwd: opts.vault,
    env: { ...process.env, MEMEX_WATCH_DAEMON: '1' },
  });
  child.unref();
  // Close our handle; the child has its own dup via spawn.
  await logFd.close();

  // Give the child a moment to register its own pid file. If it crashes
  // before that, we still surface something useful.
  await new Promise((r) => setTimeout(r, 300));
  const pid = await readPid(pidPath);
  const reportedPid = pid ?? child.pid ?? 0;

  logger.success(`watch daemon started — pid ${reportedPid}`);
  logger.info(`log : ${logPath}`);
  logger.info(`pid : ${pidPath}`);
  logger.info(`stop: memex watch --stop`);
}
