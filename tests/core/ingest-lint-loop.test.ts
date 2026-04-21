/**
 * TDD spec for `runIngestLintLoop` ? the wiki self-healing loop.
 *
 * These tests exercise the loop's control flow in isolation by injecting
 * stubs for `ingest` and `lint`. This keeps the suite hermetic (no agent
 * process, no filesystem work) and lets us assert the exact contract:
 *
 *  - clean vault ? one iteration, `stopped: 'clean'`.
 *  - dirty vault ? loop until clean, passing the prior lint report into
 *    each subsequent ingest so the agent knows what to fix.
 *  - non-converging agent ? stops at `maxIter` with `stopped: 'max-iter'`.
 *  - repeated identical issue set ? stops with `stopped: 'no-change'`,
 *    unless `disableNoChangeGuard` (i.e. `--force`) is set.
 *  - cooperative cancellation via `stopSignal()`.
 *  - `skipFirstIngest` mode (used by `memex watch --heal` when the trigger
 *    was a lint check rather than a raw/ file change).
 *  - reporter emits the documented phase sequence.
 *  - `maxIter = 0 / Infinity` means unlimited and is labelled "?" in logs.
 *  - an ingest that throws does NOT kill the loop ? we still get a lint
 *    pass and, if it happens to be clean, a clean finish.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  runIngestLintLoop,
  type LoopReport,
  type IngestFn,
  type LintFn,
} from '../../src/core/ingest-lint-loop.js';
import type { LintReport } from '../../src/commands/lint.js';

// ?? Stub factories ???????????????????????????????????????????????????????????

function cleanReport(vault = '/vault'): LintReport {
  return {
    vault,
    checks: ['orphans', 'broken-links', 'missing-frontmatter'],
    issues: [],
    summary: { total: 0, orphans: 0, brokenLinks: 0, frontmatterErrors: 0 },
  };
}

function dirtyReport(vault = '/vault', issueIds: string[] = ['a']): LintReport {
  return {
    vault,
    checks: ['orphans', 'broken-links', 'missing-frontmatter'],
    issues: issueIds.map((id) => ({ type: 'orphan', page: id, path: `wiki/${id}.md` })),
    summary: {
      total: issueIds.length,
      orphans: issueIds.length,
      brokenLinks: 0,
      frontmatterErrors: 0,
    },
  };
}

/**
 * Scripted lint stub: on each call returns the next canned report. If the
 * script is exhausted, reuses the final entry (simulating a non-converging
 * agent).
 */
function scriptedLint(reports: LintReport[]) {
  let i = 0;
  const fn: LintFn = async () => {
    const r = reports[Math.min(i, reports.length - 1)];
    i++;
    return r;
  };
  return vi.fn(fn);
}

function stubIngest(impl?: IngestFn) {
  const fn: IngestFn = impl ?? (async () => {});
  return vi.fn(fn);
}

function stubLint(impl: LintFn) {
  return vi.fn(impl);
}

const noopIngest = stubIngest();

// ?? Tests ????????????????????????????????????????????????????????????????????

describe('runIngestLintLoop (wiki self-healing)', () => {
  it('clean vault: finishes after one iteration with stopped=clean', async () => {
    const ingest = stubIngest();
    const lint = scriptedLint([cleanReport()]);

    const result = await runIngestLintLoop({
      vault: '/vault',
      cwd: '/cwd',
      ingestFn: ingest,
      lintFn: lint,
      skipContextRefresh: true,
    });

    expect(result.stopped).toBe('clean');
    expect(result.iterations).toBe(1);
    expect(result.finalReport.issues).toHaveLength(0);
    expect(ingest).toHaveBeenCalledTimes(1);
    expect(lint).toHaveBeenCalledTimes(1);
    // First ingest must NOT receive a lintReport (no prior lint yet).
    expect(ingest.mock.calls[0][0].lintReport).toBeUndefined();
  });

  it('heals a dirty vault and passes the prior lint report to the fixing ingest', async () => {
    const dirty = dirtyReport('/vault', ['orphan-1', 'orphan-2']);
    const ingest = stubIngest();
    const lint = scriptedLint([dirty, cleanReport()]);

    const result = await runIngestLintLoop({
      vault: '/vault',
      cwd: '/cwd',
      ingestFn: ingest,
      lintFn: lint,
      skipContextRefresh: true,
    });

    expect(result.stopped).toBe('clean');
    expect(result.iterations).toBe(2);
    expect(ingest).toHaveBeenCalledTimes(2);
    // Iter 1 ingest has no lint report yet.
    expect(ingest.mock.calls[0][0].lintReport).toBeUndefined();
    // Iter 2 ingest MUST receive iter-1's lint report so the agent can fix it.
    expect(ingest.mock.calls[1][0].lintReport).toEqual(dirty);
  });

  it('stops at maxIter with stopped=max-iter when never converging', async () => {
    // Always dirty, but the issue SET rotates so the no-change guard won't
    // fire ? we want to exercise the max-iter path specifically.
    const lint = stubLint(async () =>
      dirtyReport('/vault', [`orphan-${Math.random()}`]),
    );

    const result = await runIngestLintLoop({
      vault: '/vault',
      cwd: '/cwd',
      ingestFn: noopIngest,
      lintFn: lint,
      maxIter: 3,
      skipContextRefresh: true,
    });

    expect(result.stopped).toBe('max-iter');
    expect(result.iterations).toBe(3);
    expect(result.finalReport.issues.length).toBeGreaterThan(0);
    expect(lint).toHaveBeenCalledTimes(3);
  });

  it('stops with stopped=no-change when two consecutive lint reports are identical', async () => {
    const stuck = () => dirtyReport('/vault', ['orphan-stuck']);
    const lint = scriptedLint([stuck(), stuck()]);
    const ingest = stubIngest();

    const result = await runIngestLintLoop({
      vault: '/vault',
      cwd: '/cwd',
      ingestFn: ingest,
      lintFn: lint,
      maxIter: 10,
      skipContextRefresh: true,
    });

    expect(result.stopped).toBe('no-change');
    expect(result.iterations).toBe(2);
    expect(result.finalReport.issues).toHaveLength(1);
    expect(ingest).toHaveBeenCalledTimes(2);
  });

  it('disableNoChangeGuard (--force) bypasses the no-change early-exit', async () => {
    const stuck = () => dirtyReport('/vault', ['orphan-stuck']);
    // Force the loop to burn all iterations even though the set never
    // changes; we assert `max-iter` instead of `no-change`.
    const lint = stubLint(async () => stuck());

    const result = await runIngestLintLoop({
      vault: '/vault',
      cwd: '/cwd',
      ingestFn: noopIngest,
      lintFn: lint,
      maxIter: 4,
      disableNoChangeGuard: true,
      skipContextRefresh: true,
    });

    expect(result.stopped).toBe('max-iter');
    expect(result.iterations).toBe(4);
    expect(lint).toHaveBeenCalledTimes(4);
  });

  it('stopSignal flips mid-loop then stops with stopped=signal', async () => {
    let calls = 0;
    const lint = stubLint(async () =>
      dirtyReport('/vault', [`issue-${calls++}`]),
    );

    let shouldStop = false;
    const result = await runIngestLintLoop({
      vault: '/vault',
      cwd: '/cwd',
      ingestFn: stubIngest(async () => {
        shouldStop = calls >= 1;
      }),
      lintFn: lint,
      stopSignal: () => shouldStop,
      maxIter: 10,
      skipContextRefresh: true,
    });

    expect(result.stopped).toBe('signal');
    // We allowed 1 full iteration before flipping the signal.
    expect(result.iterations).toBeLessThanOrEqual(2);
  });

  it('skipFirstIngest: first iteration runs lint only; ingest starts at iter 2 when dirty', async () => {
    const dirty = dirtyReport('/vault', ['orphan-1']);
    const lint = scriptedLint([dirty, cleanReport()]);
    const ingest = stubIngest();

    const result = await runIngestLintLoop({
      vault: '/vault',
      cwd: '/cwd',
      ingestFn: ingest,
      lintFn: lint,
      skipFirstIngest: true,
      skipContextRefresh: true,
    });

    expect(result.stopped).toBe('clean');
    expect(result.iterations).toBe(2);
    // skipFirstIngest means iter 1 was pure lint; only iter 2 calls ingest.
    expect(ingest).toHaveBeenCalledTimes(1);
    // And that single ingest MUST carry the dirty report so the agent can
    // target the heal work.
    expect(ingest.mock.calls[0][0].lintReport).toEqual(dirty);
  });

  it('skipFirstIngest + clean on first lint: finishes without any ingest', async () => {
    const lint = scriptedLint([cleanReport()]);
    const ingest = stubIngest();

    const result = await runIngestLintLoop({
      vault: '/vault',
      cwd: '/cwd',
      ingestFn: ingest,
      lintFn: lint,
      skipFirstIngest: true,
      skipContextRefresh: true,
    });

    expect(result.stopped).toBe('clean');
    expect(result.iterations).toBe(1);
    expect(ingest).not.toHaveBeenCalled();
  });

  it('reporter emits the full phase sequence for a heal then clean trajectory', async () => {
    const events: LoopReport[] = [];
    const reporter = (e: LoopReport) => {
      events.push({ ...e });
    };
    const lint = scriptedLint([dirtyReport('/vault', ['x']), cleanReport()]);

    await runIngestLintLoop({
      vault: '/vault',
      cwd: '/cwd',
      ingestFn: noopIngest,
      lintFn: lint,
      reporter,
      skipContextRefresh: true,
    });

    const phases = events.map((e) => e.phase);
    // iter 1: ingest, ingest-done, lint, lint-done
    // iter 2: ingest, ingest-done, lint, lint-done, clean
    expect(phases).toEqual([
      'ingest',
      'ingest-done',
      'lint',
      'lint-done',
      'ingest',
      'ingest-done',
      'lint',
      'lint-done',
      'clean',
    ]);
    // lint-done events carry the remaining-issue count.
    const lintDones = events.filter((e) => e.phase === 'lint-done');
    expect(lintDones[0].issues).toBe(1);
    expect(lintDones[1].issues).toBe(0);
    // Iter-2 ingest event MUST advertise that it's fixing 1 issue.
    const secondIngest = events.filter((e) => e.phase === 'ingest')[1];
    expect(secondIngest.fixing).toBe(1);
  });

  it('reporter emits a stalled event when the no-change guard triggers', async () => {
    const events: LoopReport[] = [];
    const stuck = () => dirtyReport('/vault', ['same']);
    const lint = scriptedLint([stuck(), stuck()]);

    const result = await runIngestLintLoop({
      vault: '/vault',
      cwd: '/cwd',
      ingestFn: noopIngest,
      lintFn: lint,
      reporter: (e) => events.push({ ...e }),
      skipContextRefresh: true,
    });

    expect(result.stopped).toBe('no-change');
    expect(events.some((e) => e.phase === 'stalled')).toBe(true);
  });

  it('maxIter = 0 means unlimited (label "\u221e") and still converges when clean', async () => {
    const lint = scriptedLint([
      dirtyReport('/vault', ['a']),
      dirtyReport('/vault', ['b']), // different set so guard doesn't trip
      cleanReport(),
    ]);
    const events: LoopReport[] = [];

    const result = await runIngestLintLoop({
      vault: '/vault',
      cwd: '/cwd',
      ingestFn: noopIngest,
      lintFn: lint,
      maxIter: 0,
      reporter: (e) => events.push({ ...e }),
      skipContextRefresh: true,
    });

    expect(result.stopped).toBe('clean');
    expect(result.iterations).toBe(3);
    // Every emitted event should carry the unlimited label.
    expect(events.every((e) => e.maxLabel === '\u221e')).toBe(true);
  });

  it('an ingest that throws does not kill the loop: lint still runs', async () => {
    const lint = scriptedLint([cleanReport()]);
    const boom = stubIngest(async () => {
      throw new Error('agent exploded');
    });

    const result = await runIngestLintLoop({
      vault: '/vault',
      cwd: '/cwd',
      ingestFn: boom,
      lintFn: lint,
      skipContextRefresh: true,
    });

    // Lint happened despite ingest failing, and it was clean, so the loop
    // still reports success.
    expect(result.stopped).toBe('clean');
    expect(lint).toHaveBeenCalledTimes(1);
    expect(boom).toHaveBeenCalledTimes(1);
  });
});
