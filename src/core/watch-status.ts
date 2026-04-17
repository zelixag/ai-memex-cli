/**
 * watch-status.ts
 *
 * Live status snapshot of a running `memex watch` daemon, written to
 * `<vault>/.llmwiki/watch.status.json` after every meaningful state
 * transition.  `memex watch --status` reads this file to show the user
 * exactly where the pipeline is right now (which phase, which files).
 *
 * The writer is deliberately fire-and-forget and debounced to a minimum
 * interval so we don't thrash the disk while iterating quickly.
 */
import { writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { readFileUtf8, pathExists } from '../utils/fs.js';

export type WatchPhase =
  | 'starting'
  | 'idle'
  | 'debouncing'
  | 'batch-start'
  | 'health-check'
  | 'healing'
  | 'ingest'
  | 'lint'
  | 'refresh'
  | 'clean'
  | 'stalled'
  | 'error'
  | 'stopped';

export interface WatchStats {
  batches: number;
  iterations: number;
  cleanRuns: number;
  stalledRuns: number;
  errors: number;
  healChecks: number;
  healTriggers: number;
}

export interface WatchStatus {
  pid: number;
  started: string;
  vault: string;
  watchPath: string;
  maxIterLabel: string;
  force: boolean;
  phase: WatchPhase;
  iteration: number;
  batchId: number;
  batchSize: number;
  currentFiles: string[];
  issuesRemaining: number | null;
  lastActivity: string;
  lastError?: string;
  stats: WatchStats;
}

export function watchStatusPath(vault: string): string {
  return join(vault, '.llmwiki', 'watch.status.json').replace(/\\/g, '/');
}

export async function readStatus(vault: string): Promise<WatchStatus | null> {
  const p = watchStatusPath(vault);
  if (!(await pathExists(p))) return null;
  try {
    const raw = await readFileUtf8(p);
    return JSON.parse(raw) as WatchStatus;
  } catch {
    return null;
  }
}

/**
 * StatusWriter: in-memory status snapshot for the current daemon,
 * flushed atomically to disk. Call `update(partial)` to mutate and flush.
 */
export class StatusWriter {
  private path: string;
  private tmp: string;
  private state: WatchStatus;
  private pending: ReturnType<typeof setTimeout> | null = null;
  private dirty = false;
  private lastFlush = 0;
  private minIntervalMs: number;

  constructor(initial: WatchStatus, minIntervalMs = 150) {
    this.state = initial;
    this.path = watchStatusPath(initial.vault);
    this.tmp = this.path + '.tmp';
    this.minIntervalMs = minIntervalMs;
  }

  snapshot(): WatchStatus {
    return { ...this.state };
  }

  /** Merge partial state, stamp `lastActivity`, then debounce-flush. */
  update(patch: Partial<WatchStatus>): void {
    this.state = {
      ...this.state,
      ...patch,
      // stats is shallow-merged if provided
      stats: patch.stats ? { ...this.state.stats, ...patch.stats } : this.state.stats,
      lastActivity: new Date().toISOString(),
    };
    this.dirty = true;
    const now = Date.now();
    const wait = Math.max(0, this.lastFlush + this.minIntervalMs - now);
    if (this.pending) clearTimeout(this.pending);
    this.pending = setTimeout(() => void this.flush(), wait);
  }

  /** Force an immediate write (best-effort). */
  async flush(): Promise<void> {
    if (!this.dirty) return;
    this.dirty = false;
    this.lastFlush = Date.now();
    try {
      await mkdir(dirname(this.path), { recursive: true });
      const json = JSON.stringify(this.state, null, 2) + '\n';
      await writeFile(this.tmp, json, 'utf-8');
      await rename(this.tmp, this.path);
    } catch {
      /* best-effort */
    }
  }

  bumpStats(patch: Partial<WatchStats>): void {
    this.update({ stats: { ...this.state.stats, ...patch } });
  }

  increment(key: keyof WatchStats, by = 1): void {
    const next = { ...this.state.stats, [key]: (this.state.stats[key] ?? 0) + by };
    this.update({ stats: next });
  }
}

export function emptyStats(): WatchStats {
  return {
    batches: 0,
    iterations: 0,
    cleanRuns: 0,
    stalledRuns: 0,
    errors: 0,
    healChecks: 0,
    healTriggers: 0,
  };
}
