# Windows-specific notes

The release pipeline ran into two Windows-only failure modes during its previous incarnation. Both have workarounds baked in; document them here so future maintainers don't strip them out by accident.

## 1. pnpm cmd-shim → libuv `process_title` assertion

### Symptom

When you run `pnpm build` from a Node script (specifically `spawnSync("pnpm", ...)` with `shell: true`), the eventual `tsc.cmd` child crashes with:

```
exit code: 3221226505 (0xC0000409 STATUS_STACK_BUFFER_OVERRUN)
```

The actual error is a libuv assertion in `uv_set_process_title` — the cmd.exe call chain (`cmd.exe → pnpm.cmd → cmd.exe → tsc.cmd`) somehow corrupts the process-title buffer.

### Workaround (in `_shared/shell.mjs`)

`resolvePnpmEntry()` parses `where pnpm` → reads each `.cmd` shim → extracts the actual `pnpm.cjs` (or `corepack/dist/pnpm.js`) path. We then call `node <pnpm.cjs> <args>` directly, bypassing the cmd.exe shim chain entirely.

`shPnpm()` uses this when on Windows; on Linux/macOS it falls back to plain `pnpm`.

### Verifying the bypass works

`01-preflight.mjs` prints:

```
✓ pnpm available (Windows shim bypass: node "C:\...\pnpm.cjs")
```

If you instead see:

```
! pnpm available, but cmd-shim bypass failed — may trip libuv assertion on Windows
```

…then `where pnpm` returned an unexpected layout. Investigate `resolvePnpmEntry()` against your install.

## 2. Claude Code TUI leaves ANSI state dirty

### Symptom

After phase 2 (which spawns `claude -p` whose ink-based TUI takes over the terminal), the *next* spawned process crashes — even simple `git status`. The same `STATUS_STACK_BUFFER_OVERRUN` exit code as above, but caused by leftover terminal state, not the pnpm shim.

### Workaround (in `_shared/shell.mjs`)

`resetConsole()` writes:

```
\x1b[0m       SGR reset (clears bold, color, etc.)
\x1b]0;\x07   OSC empty title (clears window title)
```

This is called:
- Before every `sh()` / `shPnpm()` / `spawnInherit()` invocation
- Specifically right after `claude` exits in phase 2

### Smell test

If on Windows you see weird residual coloring or window title between phases, `resetConsole()` is missing somewhere. It must run *before* the next `spawn`/`spawnSync`.

## 3. Path separators

The CLI itself normalizes paths to forward slashes via `normalizePath()` in `src/utils/fs.ts`. The release scripts use Node's `node:path` (which uses `\` on Windows) for filesystem operations — that's fine because they only build paths, never compare them with frontend-reported paths.

When matching against `git status --porcelain` output, the release scripts use regex like `/website\/client\/src\//` — git always emits forward slashes regardless of platform.

## 4. Long command lines

Windows cmd.exe caps command-line arguments at ~8192 characters. Phase 2 (sync-docs) writes the full prompt (with git log + diff) to a temp file and hands `claude -p` only a tiny wrapper instruction that says "Read this file." This works on every OS and avoids the cap.

## 5. `pnpm exec` vs direct node

Inside `_shared/shell.mjs` we sometimes invoke `process.execPath` (the absolute path to the running node binary) instead of `"node"`. Reason: in a corepack/Volta setup, plain `node` may resolve to a shim that introduces its own cmd-chain. Using `process.execPath` always hits the real Node binary.
