/**
 * prereqs.ts
 *
 * 运行命令前的前置条件检查：
 * - 必须先有一个可用的知识库（vault）目录（含 AGENTS.md）；
 * - 语义类命令（distill / ingest 等）还必须配置好默认 AI agent。
 *
 * 未满足时友好报错并指向 `memex onboard`，避免后续命令因路径/配置缺失
 * 抛出不可读的错误栈。
 */

import pc from 'picocolors';
import { logger } from '../utils/logger.js';
import { resolveVaultPath, isValidVault } from './vault.js';
import { readConfig } from './config.js';

/**
 * 校验 vault 是否存在；缺失时打印引导并以退出码 2 终止进程。
 * 返回规范化后的 vault 路径供后续复用。
 */
export async function ensureVault(explicit: string | undefined, cwd: string): Promise<string> {
  const vault = await resolveVaultPath({ explicitPath: explicit }, cwd);
  if (await isValidVault(vault)) return vault;

  logger.error('未找到可用的知识库（vault）目录。');
  console.log();
  if (explicit) {
    logger.warn(`--vault 指向的路径不是有效 vault：${explicit}`);
    console.log();
  }
  logger.info(`建议先执行： ${pc.cyan('memex onboard')}          ${pc.dim('# 向导式选择 agent 并初始化 vault（推荐）')}`);
  logger.info(`或者直接执行：${pc.cyan('memex init')}             ${pc.dim('# 仅初始化全局 vault（~/.llmwiki/global）')}`);
  logger.info(`指定已有路径：${pc.cyan('memex <cmd> --vault <path>')}`);
  process.exit(2);
}

/**
 * 校验是否已选择默认 agent；命令上显式传入 `--agent <name>` 视为已满足。
 * 未满足时打印引导并以退出码 2 终止进程。
 */
export async function ensureAgent(explicit: string | undefined, vaultPath: string): Promise<void> {
  if (explicit && explicit.trim().length > 0) return;

  let agent: string | undefined;
  try {
    const cfg = await readConfig(vaultPath);
    agent = cfg.agent;
  } catch {
    /* 忽略读取失败，按未配置处理 */
  }
  if (agent && agent.trim().length > 0) return;

  logger.error('尚未选择默认 AI agent。');
  console.log();
  logger.info(`建议先执行： ${pc.cyan('memex onboard')}                              ${pc.dim('# 向导式选择 agent')}`);
  logger.info(`或手动设置： ${pc.cyan('memex config set agent <name>')}`);
  logger.info(`  ${pc.dim('可选：claude-code | codex | opencode | gemini-cli | aider')}`);
  logger.info(`本次临时用： ${pc.cyan('memex <cmd> --agent claude-code')}`);
  process.exit(2);
}
