/**
 * update.ts
 *
 * `memex update`
 *
 * Self-update ai-memex-cli to the latest version.
 *
 * Strategy (in priority order):
 *   1. If installed via npm → `npm update -g ai-memex-cli`
 *   2. If installed from git clone → `git pull && npm run build`
 *   3. Fallback → show manual instructions
 *
 * Also supports:
 *   --check    Only check for updates, don't install
 *   --source   Force update source: npm | github
 */

import { logger } from '../utils/logger.js';
import { runCommand, commandExists } from '../utils/exec.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathExists } from '../utils/fs.js';
import { getPackageVersion } from '../version.js';

export interface UpdateOptions {
  /** Only check for updates without installing */
  check?: boolean;
  /** Force update source: npm or github */
  source?: 'npm' | 'github';
}

/** Get the current installed version from package.json (same as `memex -v`) */
function getCurrentVersion(): string {
  const v = getPackageVersion();
  return v === '0.0.0' ? 'unknown' : v;
}

/** Detect how memex was installed */
async function detectInstallMethod(): Promise<'npm-global' | 'git-clone' | 'unknown'> {
  try {
    const thisFile = fileURLToPath(import.meta.url);
    const projectRoot = join(dirname(thisFile), '..', '..');

    // Check if it's a git repo
    const gitDir = join(projectRoot, '.git');
    if (await pathExists(gitDir)) {
      return 'git-clone';
    }

    // Check if it's in a global npm directory
    const { stdout } = await runCommand('npm', ['root', '-g'], {});
    const npmGlobalRoot = stdout.trim();
    if (thisFile.includes('node_modules')) {
      return 'npm-global';
    }

    // If project root is inside npm global root
    if (projectRoot.startsWith(npmGlobalRoot)) {
      return 'npm-global';
    }

    return 'npm-global'; // default assumption
  } catch {
    return 'unknown';
  }
}

/** Check latest version on npm registry */
async function getLatestNpmVersion(): Promise<string | null> {
  try {
    const { stdout } = await runCommand('npm', ['view', 'ai-memex-cli', 'version'], {});
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

/** Check latest version on GitHub */
async function getLatestGitHubVersion(): Promise<string | null> {
  try {
    if (!(await commandExists('gh'))) return null;
    const { stdout } = await runCommand('gh', [
      'api', 'repos/zelixag/ai-memex-cli/commits/master',
      '--jq', '.sha'
    ], {});
    return stdout.trim().substring(0, 7) || null;
  } catch {
    return null;
  }
}

/** Get current git commit hash */
async function getCurrentGitHash(): Promise<string | null> {
  try {
    const thisFile = fileURLToPath(import.meta.url);
    const projectRoot = join(dirname(thisFile), '..', '..');
    const { stdout } = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { cwd: projectRoot });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function updateCommand(options: UpdateOptions): Promise<void> {
  const currentVersion = getCurrentVersion();
  const installMethod = options.source
    ? (options.source === 'npm' ? 'npm-global' : 'git-clone')
    : await detectInstallMethod();

  console.log();
  logger.info(`Current version: ${currentVersion}`);
  logger.info(`Install method:  ${installMethod}`);

  // ── Check mode ────────────────────────────────────────────────────────────

  if (options.check) {
    if (installMethod === 'npm-global') {
      const latest = await getLatestNpmVersion();
      if (latest) {
        if (latest === currentVersion) {
          logger.success(`You are on the latest version (${currentVersion}).`);
        } else {
          logger.info(`Latest npm version: ${latest}`);
          logger.info(`Run \`memex update\` to upgrade.`);
        }
      } else {
        logger.warn('Package not published to npm yet. Try: memex update --source github');
      }
    } else if (installMethod === 'git-clone') {
      const localHash = await getCurrentGitHash();
      const remoteHash = await getLatestGitHubVersion();
      logger.info(`Local commit:  ${localHash ?? 'unknown'}`);
      logger.info(`Remote commit: ${remoteHash ?? 'unknown'}`);
      if (localHash && remoteHash && localHash === remoteHash) {
        logger.success('You are on the latest commit.');
      } else {
        logger.info('Run `memex update` to pull the latest changes.');
      }
    } else {
      logger.warn('Cannot determine install method. Try: memex update --source npm');
    }
    return;
  }

  // ── Update ────────────────────────────────────────────────────────────────

  if (installMethod === 'npm-global') {
    await updateFromNpm();
  } else if (installMethod === 'git-clone') {
    await updateFromGit();
  } else {
    logger.error('Cannot determine how memex was installed.');
    showManualInstructions();
  }
}

async function updateFromNpm(): Promise<void> {
  logger.info('Updating via npm...\n');

  try {
    // Check if published
    const latest = await getLatestNpmVersion();
    if (!latest) {
      logger.warn('ai-memex-cli is not yet published to npm.');
      logger.info('Falling back to GitHub update...\n');
      await updateFromGitHubDirect();
      return;
    }

    const { stdout, stderr } = await runCommand('npm', ['install', '-g', 'ai-memex-cli@latest'], {});
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('npm warn')) console.error(stderr);

    const newVersion = getCurrentVersion();
    logger.success(`Updated to version ${newVersion}`);
  } catch (e) {
    logger.error(`npm update failed: ${e instanceof Error ? e.message : String(e)}`);
    logger.info('\nTry manually:');
    logger.info('  npm install -g ai-memex-cli@latest');
  }
}

async function updateFromGit(): Promise<void> {
  const thisFile = fileURLToPath(import.meta.url);
  const projectRoot = join(dirname(thisFile), '..', '..');

  logger.info('Updating via git pull...\n');

  try {
    // Step 1: git pull
    logger.info('Pulling latest changes...');
    const { stdout: pullOut } = await runCommand('git', ['pull', '--rebase'], { cwd: projectRoot });
    console.log(pullOut);

    if (pullOut.includes('Already up to date')) {
      logger.success('Already on the latest version.');
      return;
    }

    // Step 2: install deps
    logger.info('Installing dependencies...');
    const pkgManager = (await commandExists('pnpm')) ? 'pnpm' : 'npm';
    await runCommand(pkgManager, ['install'], { cwd: projectRoot });

    // Step 3: build
    logger.info('Building...');
    await runCommand(pkgManager, ['run', 'build'], { cwd: projectRoot });

    // Step 4: re-link if needed
    logger.info('Re-linking global binary...');
    await runCommand('npm', ['link'], { cwd: projectRoot });

    const newVersion = getCurrentVersion();
    logger.success(`Updated to version ${newVersion}`);
    logger.info('Run `memex --help` to see all commands.');
  } catch (e) {
    logger.error(`Git update failed: ${e instanceof Error ? e.message : String(e)}`);
    showManualInstructions();
  }
}

async function updateFromGitHubDirect(): Promise<void> {
  logger.info('Installing latest from GitHub...\n');

  try {
    const { stdout, stderr } = await runCommand('npm', [
      'install', '-g', 'github:zelixag/ai-memex-cli'
    ], {});
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('npm warn')) console.error(stderr);

    logger.success('Installed latest from GitHub.');
    logger.info('Run `memex --help` to verify.');
  } catch (e) {
    logger.error(`GitHub install failed: ${e instanceof Error ? e.message : String(e)}`);
    showManualInstructions();
  }
}

function showManualInstructions(): void {
  console.log();
  logger.info('Manual update instructions:\n');
  console.log('  Option 1 — npm (if published):');
  console.log('    npm install -g ai-memex-cli@latest\n');
  console.log('  Option 2 — GitHub direct:');
  console.log('    npm install -g github:zelixag/ai-memex-cli\n');
  console.log('  Option 3 — Git clone:');
  console.log('    git clone https://github.com/zelixag/ai-memex-cli.git');
  console.log('    cd ai-memex-cli');
  console.log('    npm install && npm run build && npm link\n');
}
