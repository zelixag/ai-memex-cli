/**
 * context.ts — `memex context <install|refresh|uninstall|status>`
 *
 * L0 bootstrap: write a marker-delimited block into the agent's
 * project-root auto-loaded file (CLAUDE.md / AGENTS.md / GEMINI.md /
 * .cursor/rules/memex.mdc) so every new session immediately knows:
 *
 *   - where the global vault lives
 *   - a digest of available wiki pages (scene → top N)
 *   - the most useful memex CLI commands for this session
 *
 * The block is idempotent: re-running `install` / `refresh` replaces it
 * in-place without touching any prose around it. `uninstall` removes
 * only the block.
 */
import pc from 'picocolors';
import { join } from 'node:path';
import { logger } from '../utils/logger.js';
import { pathExists, readFileUtf8, writeFileUtf8, normalizePath } from '../utils/fs.js';
import { readConfig } from '../core/config.js';
import { resolveVaultPath, isValidVault } from '../core/vault.js';
import { buildWikiIndex } from '../core/wiki-index.js';
import {
  renderMarkdownBlock,
  renderCursorRule,
  spliceBlock,
  removeBlock,
  resolveHostFile,
  isCursorAgent,
  BLOCK_START_RE,
  type ContextMode,
} from '../core/context-block.js';
import {
  upsertContext,
  removeContext,
  listContexts,
  registryPath,
} from '../core/context-registry.js';
import { readAllSceneManifests } from '../core/scene-manifest.js';
import { AGENT_PROFILES, type AgentId } from '../core/agent-adapter.js';

export interface ContextCommandOptions {
  subcommand: 'install' | 'refresh' | 'uninstall' | 'status';
  project?: string;
  agent?: string;
  mode?: ContextMode;
  vault?: string;
  all?: boolean;
  quiet?: boolean;
  dryRun?: boolean;
  scene?: string;
}

export async function contextCommand(options: ContextCommandOptions, cwd: string): Promise<void> {
  switch (options.subcommand) {
    case 'install':
      await doInstall(options, cwd, /* asRefresh */ false);
      return;
    case 'refresh':
      if (options.all) await doRefreshAll(options, cwd);
      else await doInstall(options, cwd, /* asRefresh */ true);
      return;
    case 'uninstall':
      await doUninstall(options, cwd);
      return;
    case 'status':
      await doStatus();
      return;
  }
}

// ── install / refresh ────────────────────────────────────────────────────────

async function doInstall(
  options: ContextCommandOptions,
  cwd: string,
  asRefresh: boolean
): Promise<void> {
  const projectDir = normalizePath(options.project ?? cwd);

  const vault = await resolveVaultPath({ explicitPath: options.vault }, cwd);
  if (!(await isValidVault(vault))) {
    logger.error('Vault 不可用，无法生成 context 块。');
    logger.info(`先执行：${pc.cyan('memex onboard')} 或 ${pc.cyan('memex init')}`);
    process.exit(2);
  }

  // Determine which agents to install for.
  const agents = await resolveAgents(options.agent, vault);
  if (agents.length === 0) {
    logger.error('未检测到可用 agent；请指定 --agent 或执行 memex onboard。');
    process.exit(2);
  }

  const mode: ContextMode = options.mode ?? 'digest';
  const wikiDir = join(vault, 'wiki').replace(/\\/g, '/');
  const pages = (await buildWikiIndex(wikiDir)).pages;

  // Resolve scenes: from --scene flag, or carry over from existing registry entry
  const existingEntries = await listContexts();
  const existingScenes = existingEntries.find(
    e => normalizePath(e.project) === normalizePath(projectDir)
  )?.scenes ?? [];
  const sceneNames = options.scene
    ? options.scene.split(',').map(s => s.trim()).filter(Boolean)
    : existingScenes;
  const sceneManifests = sceneNames.length > 0
    ? await readAllSceneManifests(wikiDir, sceneNames)
    : undefined;

  let installed = 0;
  let skipped = 0;
  for (const agentId of agents) {
    const host = resolveHostFile(agentId, projectDir);
    if (!host) {
      if (!options.quiet) {
        logger.warn(`agent=${agentId} 无支持的项目根 bootstrap 文件，跳过。`);
      }
      skipped++;
      continue;
    }

    const payload = isCursorAgent(agentId)
      ? renderCursorRule({ vault, pages, mode, agentId, scenes: sceneManifests })
      : renderMarkdownBlock({ vault, pages, mode, agentId, scenes: sceneManifests });

    if (options.dryRun) {
      console.log();
      logger.info(`[dry-run] ${asRefresh ? 'refresh' : 'install'} → ${host}`);
      console.log(pc.dim('─'.repeat(60)));
      console.log(payload);
      console.log(pc.dim('─'.repeat(60)));
      continue;
    }

    if (isCursorAgent(agentId)) {
      await writeFileUtf8(host, payload);
    } else {
      const existing = (await pathExists(host)) ? await readFileUtf8(host) : '';
      const next = spliceBlock(existing, payload);
      if (next === existing) {
        skipped++;
        continue;
      }
      await writeFileUtf8(host, next);
    }

    await upsertContext({
      project: projectDir,
      agent: agentId,
      host,
      mode,
      scenes: sceneNames.length > 0 ? sceneNames : undefined,
    });

    installed++;
    if (!options.quiet) {
      const sceneLabel = sceneNames.length > 0 ? `, scenes: ${sceneNames.join(',')}` : '';
      logger.success(`${asRefresh ? 'Refreshed' : 'Installed'} ${host}  ${pc.dim(`(${agentId}, ${pages.length} pages${sceneLabel})`)}`);
    }
  }

  if (!options.quiet && !options.dryRun) {
    console.log();
    logger.info(
      `context ${asRefresh ? 'refresh' : 'install'} 完成 · ${installed} 更新 / ${skipped} 跳过 · vault=${vault}`
    );
    if (!asRefresh) {
      console.log();
      logger.info('下一步：');
      console.log(`  ${pc.cyan('memex context status')}    ${pc.dim('# 查看所有已注册项目')}`);
      console.log(`  ${pc.cyan('memex context refresh')}   ${pc.dim('# 同步最新 wiki 摘要到该项目')}`);
      console.log(`  ${pc.cyan('memex context uninstall')} ${pc.dim('# 从该项目移除 context 块')}`);
    }
  }
}

async function doRefreshAll(options: ContextCommandOptions, cwd: string): Promise<void> {
  const entries = await listContexts();
  if (entries.length === 0) {
    if (!options.quiet) logger.info('暂无已注册的 context 项目。先执行 memex context install。');
    return;
  }

  const vault = await resolveVaultPath({ explicitPath: options.vault }, cwd);
  if (!(await isValidVault(vault))) {
    if (!options.quiet) logger.warn('vault 不可用，跳过批量 refresh。');
    return;
  }

  const wikiDir = join(vault, 'wiki').replace(/\\/g, '/');
  const pages = (await buildWikiIndex(wikiDir)).pages;

  let ok = 0;
  let fail = 0;
  for (const e of entries) {
    try {
      const entryScenes = e.scenes && e.scenes.length > 0
        ? await readAllSceneManifests(wikiDir, e.scenes)
        : undefined;
      const payload = isCursorAgent(e.agent)
        ? renderCursorRule({ vault, pages, mode: e.mode, agentId: e.agent, scenes: entryScenes })
        : renderMarkdownBlock({ vault, pages, mode: e.mode, agentId: e.agent, scenes: entryScenes });

      if (isCursorAgent(e.agent)) {
        await writeFileUtf8(e.host, payload);
      } else {
        const existing = (await pathExists(e.host)) ? await readFileUtf8(e.host) : '';
        const next = spliceBlock(existing, payload);
        if (next !== existing) await writeFileUtf8(e.host, next);
      }

      await upsertContext({ project: e.project, agent: e.agent, host: e.host, mode: e.mode });
      ok++;
      if (!options.quiet) logger.success(`refreshed ${e.host}`);
    } catch (err) {
      fail++;
      if (!options.quiet) logger.warn(`${e.host}: ${(err as Error).message}`);
    }
  }

  if (!options.quiet) {
    logger.info(`refresh --all 完成 · ${ok} 成功 / ${fail} 失败`);
  }
}

// ── uninstall ────────────────────────────────────────────────────────────────

async function doUninstall(options: ContextCommandOptions, cwd: string): Promise<void> {
  const projectDir = normalizePath(options.project ?? cwd);
  const entries = await listContexts();
  const targets = entries.filter((e) => {
    if (e.project !== projectDir) return false;
    if (options.agent && e.agent !== options.agent) return false;
    return true;
  });

  if (targets.length === 0) {
    logger.info(`未在注册表中找到 ${projectDir}${options.agent ? ` (${options.agent})` : ''}。`);
    return;
  }

  for (const e of targets) {
    if (!(await pathExists(e.host))) {
      await removeContext(e.project, e.agent);
      logger.info(`宿主文件已不存在，仅清理注册：${e.host}`);
      continue;
    }
    if (isCursorAgent(e.agent)) {
      // cursor rule file is fully ours; delete it
      const existing = await readFileUtf8(e.host);
      if (existing.includes('memex knowledge base bootstrap')) {
        await writeFileUtf8(e.host, ''); // best-effort: empty the file
      }
    } else {
      const existing = await readFileUtf8(e.host);
      const next = removeBlock(existing);
      if (next !== null) await writeFileUtf8(e.host, next);
    }
    await removeContext(e.project, e.agent);
    logger.success(`Removed memex block from ${e.host}`);
  }
}

// ── status ───────────────────────────────────────────────────────────────────

async function doStatus(): Promise<void> {
  const entries = await listContexts();
  logger.info(`context registry: ${registryPath()}`);
  logger.info(`entries: ${entries.length}`);
  console.log();

  if (entries.length === 0) {
    console.log(pc.dim('（空）运行 `memex context install` 将当前项目加入注册。'));
    return;
  }

  for (const e of entries) {
    const hostExists = await pathExists(e.host);
    const marker = hostExists
      ? await hostHasBlock(e.host, e.agent)
        ? pc.green('●')
        : pc.yellow('○')
      : pc.red('×');
    console.log(`  ${marker} ${pc.bold(e.agent.padEnd(12))} ${e.host}`);
    console.log(`    ${pc.dim(`mode=${e.mode}  installed=${e.installed}`)}`);
  }
  console.log();
  console.log(pc.dim('● 块存在   ○ 宿主存在但块缺失   × 宿主文件缺失'));
}

async function hostHasBlock(host: string, agent: string): Promise<boolean> {
  try {
    const txt = await readFileUtf8(host);
    if (isCursorAgent(agent)) return txt.includes('memex knowledge base bootstrap');
    return BLOCK_START_RE.test(txt);
  } catch {
    return false;
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function resolveAgents(explicit: string | undefined, vault: string): Promise<string[]> {
  if (explicit) {
    const set = explicit
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    return set.filter((a) => a in AGENT_PROFILES);
  }
  try {
    const cfg = await readConfig(vault);
    if (cfg.agents?.length) return cfg.agents;
    if (cfg.agent) return [cfg.agent];
  } catch {
    /* empty */
  }
  return [];
}

// Re-export convenience for other commands
export { registryPath as contextRegistryPath };

export type { AgentId };
