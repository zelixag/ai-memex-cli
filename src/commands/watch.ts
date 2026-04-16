import { resolveGlobalVaultPath } from '../core/vault.js';
import { pathExists } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { ingestCommand } from './ingest.js';
import { watch as chokidarWatch } from 'chokidar';
import { writeFile, readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export interface WatchOptions {
  path?: string;
  daemon?: boolean;
  vault?: string;
}

export async function watchCommand(options: WatchOptions, cwd: string): Promise<void> {
  const vault = await resolveGlobalVaultPath({ explicitPath: options.vault }, cwd);
  const watchPath = options.path || `${vault}/raw`;

  if (!(await pathExists(watchPath))) {
    logger.error(`Watch path does not exist: ${watchPath}`);
    return;
  }

  if (options.daemon) {
    // Write PID file for daemon mode
    const pidPath = join(vault, '.llmwiki', 'watch.pid');
    await writeFile(pidPath, String(process.pid));
    logger.info(`Daemon PID written to ${pidPath}`);

    // Handle cleanup
    const cleanup = async () => {
      try { await unlink(pidPath); } catch { /* ignore */ }
      process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  logger.info(`Watching ${watchPath} for new .md files...`);
  logger.info('Press Ctrl+C to stop.');

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const pendingFiles = new Set<string>();

  const watcher = chokidarWatch(watchPath, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  });

  watcher.on('add', (filePath: string) => {
    if (!filePath.endsWith('.md')) return;

    logger.info(`New file detected: ${filePath}`);
    pendingFiles.add(filePath);

    // Debounce: wait 3 seconds after last file before ingesting
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const files = [...pendingFiles];
      pendingFiles.clear();

      for (const file of files) {
        try {
          await ingestCommand({ target: file, vault: options.vault }, cwd);
        } catch (e) {
          logger.error(`Failed to ingest ${file}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }, 3000);
  });

  watcher.on('error', (error: unknown) => {
    logger.error(`Watcher error: ${error instanceof Error ? error.message : String(error)}`);
  });

  // Keep process alive
  await new Promise(() => {});
}
