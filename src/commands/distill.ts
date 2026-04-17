/**
 * distill.ts
 *
 * `memex distill [input]`
 *
 * Distill a conversation session (JSONL or plain text) into a raw wiki document.
 * The agent extracts best practices, decisions, and knowledge from the session.
 *
 * KEY DESIGN PRINCIPLE:
 *   Like ingest, the CLI only builds the prompt. The agent uses its own
 *   file tools to find and read the input. Fuzzy paths and natural language
 *   descriptions are fully supported.
 *
 * Examples:
 *   memex distill session.jsonl           → distill a JSONL session file
 *   memex distill ~/Downloads/chat.json   → tilde path
 *   memex distill .\sessions\today.jsonl  → Windows relative path
 *   memex distill "today's session"       → natural language (agent searches)
 *   memex distill --role backend-engineer → extract role-specific best practices
 *   memex distill --agent codex           → use Codex instead of default
 *   memex distill --no-llm session.jsonl  → mechanical extraction only
 */

import { resolveGlobalVaultPath } from '../core/vault.js';
import { readFileUtf8, writeFileUtf8, pathExists, normalizePath } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { createProgressBar, createSpinner } from '../utils/progress.js';
import {
  parseSessionStructured,
  renderSessionMarkdown,
} from '../core/distiller.js';
import { runCommand } from '../utils/exec.js';
import { readConfig } from '../core/config.js';
import { resolveAgent, buildAgentArgs, printAgentTable, AGENT_PROFILES, type AgentId } from '../core/agent-adapter.js';
import { readGlobalConfig } from '../core/config.js';
import { basename, extname, join } from 'node:path';
import { homedir } from 'node:os';
import { mkdir, readdir, stat } from 'node:fs/promises';

export interface DistillOptions {
  /**
   * Input hint: path to JSONL/JSON/text file, or natural language description.
   * If omitted, agent will look for recent session files.
   */
  input?: string;
  /** Output path for the distilled markdown */
  out?: string;
  /** Role/persona to extract best practices for (e.g., backend-engineer, tech-lead) */
  role?: string;
  /** Skip LLM, use mechanical extraction only */
  noLlm?: boolean;
  /** Override agent */
  agent?: string;
  /** Print prompt only, don't execute */
  dryRun?: boolean;
  /** Explicit vault path */
  vault?: string;
  /** Auto-discover and use the latest session file from the agent's session directory */
  latest?: boolean;
  /**
   * Wiki scene to file sessions under (personal/research/reading/team).
   * Sessions默认放在 `team`，因为它们代表团队可共享的会话产出。
   */
  scene?: 'personal' | 'research' | 'reading' | 'team';
}

/** Session-scoped raw dir within the vault, e.g. `<vault>/raw/team/sessions`. */
function sessionsDir(vault: string, scene: string = 'team'): string {
  return join(vault, 'raw', scene, 'sessions').replace(/\\/g, '/');
}

export async function distillCommand(options: DistillOptions, cwd: string): Promise<void> {
  const vault = await resolveGlobalVaultPath({ explicitPath: options.vault }, cwd);
  const config = await readConfig(vault);
  const date = new Date().toISOString().split('T')[0];

  // ── No-LLM mechanical mode (single file) ─────────────────────────────────
  if (options.noLlm && options.input) {
    await mechanicalDistill(options, vault, cwd, date);
    return;
  }

  // ── No-arg capture mode ───────────────────────────────────────────────────
  // `memex distill` 无参数时：直接从 onboard 选定智能体的会话目录**就地读取**
  // 全部会话（JSONL/JSON），解析成结构化 Markdown 写到
  // `<vault>/raw/<scene>/sessions/`（默认 scene=team，因为会话是团队可共享产出）。
  // 不再把原始 JSONL 拷贝到 vault。
  // 要走「让 agent 去找并写 markdown」的旧行为，请显式加 `--latest` 或传 input。
  if (!options.input && !options.latest && !options.out) {
    const globalCfg = await readGlobalConfig();
    const agentIdResolved =
      (options.agent as AgentId | undefined) ??
      (config.distill.agent as AgentId | undefined) ??
      (globalCfg.agent as AgentId | undefined);
    const configSessionDir = (globalCfg as Record<string, unknown>).sessionDir as string | undefined;
    await convertAllSessionsToMarkdown({
      vault,
      agentId: agentIdResolved,
      configSessionDir,
      scene: options.scene ?? 'team',
      dryRun: options.dryRun,
    });
    return;
  }

  // ── Resolve agent ─────────────────────────────────────────────────────────
  const agentIdHint = options.agent ?? config.distill.agent;
  const agentResult = await resolveAgent(agentIdHint);

  if (!agentResult && !options.dryRun) {
    logger.error('No AI agent found. Install one of the following:');
    await printAgentTable();
    logger.info('Then set your default: memex config set agent claude-code');
    logger.info('Or use --no-llm for mechanical extraction (requires a concrete file path).');
    return;
  }

  const profile = agentResult?.profile ?? AGENT_PROFILES['claude-code'];
  const resolvedBin = agentResult?.resolvedBin ?? 'claude';

  // ── Resolve agent from global config if not explicitly set ────────────────
  const globalCfg = await readGlobalConfig();
  const agentIdResolved = agentResult?.id ?? (globalCfg.agent as AgentId) ?? (agentIdHint as AgentId) ?? undefined;
  const configSessionDir = (globalCfg as Record<string, unknown>).sessionDir as string | undefined;

  // ── Build target hint ─────────────────────────────────────────────────────
  const inputHint = await buildInputHint(options.input, vault, cwd, {
    latest: options.latest,
    agentId: agentIdResolved,
    configSessionDir,
  });

  // ── Read vault context ────────────────────────────────────────────────────
  const agentsPath = join(vault, 'AGENTS.md').replace(/\\/g, '/');
  const agentsContent = (await pathExists(agentsPath)) ? await readFileUtf8(agentsPath) : '';
  const indexPath = join(vault, 'index.md').replace(/\\/g, '/');
  const indexContent = (await pathExists(indexPath)) ? await readFileUtf8(indexPath) : '';

  // ── Determine output path ─────────────────────────────────────────────────
  const inputSlug = options.input
    ? basename(options.input).replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
    : 'session';
  const outPath = options.out ?? join(sessionsDir(vault, options.scene), `session-${date}-${inputSlug}.md`).replace(/\\/g, '/');

  // ── Build prompt ──────────────────────────────────────────────────────────
  const prompt = buildAgentDistillPrompt({
    inputHint,
    outPath,
    vault,
    role: options.role,
    agentsContent,
    indexContent,
    contextFile: profile.contextFile,
    date,
  });

  if (options.dryRun) {
    logger.info(`Agent: ${profile.name} (${resolvedBin})`);
    logger.info(`Input hint: ${inputHint}`);
    logger.info(`Output: ${outPath}`);
    console.log('\n--- PROMPT ---\n');
    console.log(prompt);
    console.log('\n--- END PROMPT ---');
    return;
  }

  // ── Execute ───────────────────────────────────────────────────────────────
  logger.info(`Input: ${inputHint}`);
  logger.info(`Output: ${outPath}`);

  const args = buildAgentArgs(profile, resolvedBin, prompt);
  const spinner = createSpinner(`正在调用 ${profile.name} 提炼会话…`);

  try {
    const { stdout, stderr } = await runCommand(resolvedBin, args, { cwd: vault });
    spinner.stop(`Distilled to ${outPath}`, 'ok');
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    logger.info(`Next: run \`memex ingest ${outPath}\` to process into wiki pages.`);
  } catch (e) {
    spinner.stop(`Distill failed: ${e instanceof Error ? e.message : String(e)}`, 'err');
  }
}

// ── Session → Markdown (no-arg default) ─────────────────────────────────────

interface ConvertAllOptions {
  vault: string;
  agentId?: AgentId;
  configSessionDir?: string;
  /** personal / research / reading / team；默认 team */
  scene?: string;
  dryRun?: boolean;
}

/**
 * 直接从 onboard 选定智能体的会话目录读取全部 JSONL/JSON，解析成结构化
 * Markdown 写到 `<vault>/raw/<scene>/sessions/`（默认 scene=team）。
 * **不拷贝原始 JSONL**。幂等：若目标 `.md` 的 mtime ≥ 源文件 mtime，则跳过。
 */
async function convertAllSessionsToMarkdown(opts: ConvertAllOptions): Promise<void> {
  const base = await resolveAgentSessionBase(opts.agentId, opts.configSessionDir);
  if (!base) {
    logger.error('未能定位到会话目录：当前未选择智能体，或该智能体没有已知的会话目录。');
    logger.info('请先运行：memex onboard          # 向导式选择 agent 并记录 sessionDir');
    logger.info('或传入路径：memex distill <file> # 直接指定会话文件');
    return;
  }
  if (!(await pathExists(base))) {
    logger.error(`会话目录不存在：${base}`);
    logger.info('请确认你已使用该智能体产生过至少一次会话。');
    return;
  }

  const pattern = opts.agentId ? AGENT_PROFILES[opts.agentId]?.sessionPattern : undefined;
  const extRegex = sessionExtRegex(pattern);
  const files = await findAllFiles(base, extRegex);
  if (files.length === 0) {
    logger.warn(`在 ${base} 下未找到匹配的会话文件（${pattern ?? 'jsonl/json'}）。`);
    return;
  }

  const destDir = sessionsDir(opts.vault, opts.scene);

  if (opts.dryRun) {
    logger.info(`[dry-run] 将从 ${base} 读取 ${files.length} 个会话 → ${destDir}（仅写 .md）`);
    for (const f of files.slice(0, 20)) {
      const mdName = deriveDestName(base, f.path).replace(/\.[^.]+$/, '.md');
      const dest = join(destDir, mdName).replace(/\\/g, '/');
      logger.info(`  ${f.path}  →  ${dest}`);
    }
    if (files.length > 20) logger.info(`  … 其余 ${files.length - 20} 个已省略`);
    return;
  }

  await mkdir(destDir, { recursive: true });
  let converted = 0;
  let skipped = 0;
  let failed = 0;
  const bar = createProgressBar(files.length, '转换会话');
  for (const f of files) {
    const mdName = deriveDestName(base, f.path).replace(/\.[^.]+$/, '.md');
    const dest = join(destDir, mdName).replace(/\\/g, '/');
    try {
      const existing = await statSafe(dest);
      if (existing && existing.mtimeMs >= f.mtimeMs) {
        skipped++;
        bar.tick(basename(f.path) + ' (skip)');
        continue;
      }
      const raw = await readFileUtf8(f.path);
      const messages = parseSessionStructured(raw);
      const output =
        messages.length > 0
          ? renderSessionMarkdown(messages, { sourcePath: f.path })
          : renderSessionMarkdown(
              [{ role: 'user', text: raw }],
              { sourcePath: f.path }
            );
      await writeFileUtf8(dest, output);
      converted++;
      bar.tick(basename(f.path));
    } catch (e) {
      failed++;
      bar.tick(basename(f.path) + ' (fail)');
      logger.warn(`转换失败：${f.path} (${e instanceof Error ? e.message : String(e)})`);
    }
  }
  bar.done(
    `会话转换完成：新增/更新 ${converted}，跳过 ${skipped}${failed ? `，失败 ${failed}` : ''}`
  );
  logger.info(`  来源：${base}`);
  logger.info(`  目标：${destDir}`);
  logger.info(`下一步：memex ingest                 # 让 agent 读取这些 .md 并更新 wiki`);
}

/** 解析 agent 会话根目录：优先 global config.sessionDir，其次 profile.sessionDir。 */
async function resolveAgentSessionBase(
  agentId: AgentId | undefined,
  configSessionDir: string | undefined
): Promise<string | null> {
  if (configSessionDir) {
    return normalizePath(configSessionDir);
  }
  if (!agentId) return null;
  const profile = AGENT_PROFILES[agentId];
  if (!profile?.sessionDir) return null;
  return join(homedir(), profile.sessionDir).replace(/\\/g, '/');
}

/** 由 glob 模式（如 `** /*.jsonl`）推出扩展名正则；未知则默认匹配 .jsonl/.json。 */
function sessionExtRegex(pattern: string | undefined): RegExp {
  if (!pattern) return /\.(jsonl|json)$/i;
  const m = /\.([a-z0-9]+)$/i.exec(pattern);
  if (!m) return /\.(jsonl|json)$/i;
  return new RegExp(`\\.${m[1]}$`, 'i');
}

interface FoundFile {
  path: string;
  mtimeMs: number;
  size: number;
}

/** 递归收集目录下所有匹配文件（限制深度）。 */
async function findAllFiles(root: string, pattern: RegExp, maxDepth = 8): Promise<FoundFile[]> {
  const results: FoundFile[] = [];
  async function walk(cur: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = await readdir(cur, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const p = join(cur, ent.name).replace(/\\/g, '/');
      if (ent.isDirectory()) {
        await walk(p, depth + 1);
      } else if (ent.isFile() && pattern.test(ent.name)) {
        try {
          const s = await stat(p);
          results.push({ path: p, mtimeMs: s.mtimeMs, size: s.size });
        } catch {
          /* ignore */
        }
      }
    }
  }
  await walk(root, 0);
  return results;
}

async function statSafe(p: string): Promise<{ size: number; mtimeMs: number } | null> {
  try {
    const s = await stat(p);
    return { size: s.size, mtimeMs: s.mtimeMs };
  } catch {
    return null;
  }
}

/**
 * 为源文件生成稳定的目标文件名：
 *  - 相对 base 的目录前缀用 `-` 拼接，避免跨项目/子目录重名
 *  - 非法字符规整为 `-`，整体小写
 *  - 保留原扩展名（.jsonl / .json）
 */
function deriveDestName(baseDir: string, absFile: string): string {
  const baseNorm = baseDir.replace(/\\/g, '/').replace(/\/+$/, '');
  const absNorm = absFile.replace(/\\/g, '/');
  let rel = absNorm.startsWith(baseNorm + '/') ? absNorm.slice(baseNorm.length + 1) : absNorm;
  const ext = extname(rel) || '.jsonl';
  const stem = rel.slice(0, rel.length - ext.length);
  const safe = stem
    .replace(/[\\/]+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `session-${safe || 'session'}${ext}`;
}

// ── Mechanical distill (no LLM) ───────────────────────────────────────────────

async function mechanicalDistill(
  options: DistillOptions,
  vault: string,
  cwd: string,
  date: string
): Promise<void> {
  if (!options.input) {
    logger.error('--no-llm requires a concrete file path as input.');
    return;
  }

  const normalized = normalizePath(options.input, cwd);
  if (!(await pathExists(normalized))) {
    logger.error(`Input file not found: ${normalized}`);
    return;
  }

  const raw = await readFileUtf8(normalized);
  const messages = parseSessionStructured(raw);

  const inputSlug = basename(normalized).replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  const outPath = options.out ?? join(sessionsDir(vault, options.scene), `session-${date}-${inputSlug}.md`).replace(/\\/g, '/');

  let output: string;
  if (messages.length > 0) {
    output = renderSessionMarkdown(messages, { sourcePath: normalized });
  } else {
    logger.warn('未能从输入中解析出结构化消息，按纯文本回退。');
    output = renderSessionMarkdown(
      [{ role: 'user', text: raw }],
      { sourcePath: normalized }
    );
  }

  await writeFileUtf8(outPath, output);
  logger.success(`Mechanically distilled to ${outPath}`);
}

// ── Input hint builder ────────────────────────────────────────────────────────

async function buildInputHint(
  input: string | undefined,
  vault: string,
  cwd: string,
  options: { latest?: boolean; agentId?: string; configSessionDir?: string }
): Promise<string> {
  // --latest: auto-discover from agent's session directory
  if (options.latest || (!input && options.agentId)) {
    const sessionInfo = await discoverLatestSession(options.agentId, options.configSessionDir);
    if (sessionInfo) {
      return sessionInfo;
    }
    // fallback
    return `the most recent session file in ${vault}/raw/team/sessions/ or current directory`;
  }

  if (!input) {
    return `the most recent session file in ${vault}/raw/team/sessions/ or current directory`;
  }

  try {
    const normalized = normalizePath(input, cwd);
    if (normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized)) {
      return normalized;
    }
  } catch {
    // ignore
  }

  return input;
}

/**
 * Discover the latest session file from the configured agent's session directory.
 * Uses fuzzy matching — returns a description for the agent to search.
 */
async function discoverLatestSession(agentId?: string, configSessionDir?: string): Promise<string | null> {
  const home = homedir();

  // Priority 1: Use configSessionDir from global config (set during onboard)
  if (configSessionDir) {
    const resolved = normalizePath(configSessionDir);
    const exists = await pathExists(resolved);
    if (exists) {
      const id = agentId as AgentId | undefined;
      const pattern = id ? (AGENT_PROFILES[id]?.sessionPattern ?? '**/*') : '**/*';
      return `Find the most recently modified session file in: ${resolved}\n` +
        `File pattern: ${pattern}\n` +
        `Sort by modification time descending and use the first (most recent) file.\n` +
        `If the directory contains project subdirectories, search recursively.`;
    }
  }

  // Priority 2: Use agent profile's default sessionDir
  if (!agentId) return null;

  const id = agentId as AgentId;
  const profile = AGENT_PROFILES[id];
  if (!profile?.sessionDir) return null;

  const sessionBase = join(home, profile.sessionDir).replace(/\\/g, '/');
  const exists = await pathExists(sessionBase);

  if (!exists) {
    // Still return the hint — the agent can try to find it
    return `Find the most recently modified session file.\n` +
      `Expected location: ${sessionBase}\n` +
      `This directory may not exist yet. Try searching in: ${home}\n` +
      `Look for ${profile.name} session/conversation files (${profile.sessionPattern ?? '*'}).`;
  }

  const pattern = profile.sessionPattern ?? '**/*';
  return `Find the most recently modified session file in: ${sessionBase}\n` +
    `File pattern: ${pattern}\n` +
    `Sort by modification time descending and use the first (most recent) file.\n` +
    `If the directory contains project subdirectories, search recursively.`;
}

// ── Agent prompt builder ──────────────────────────────────────────────────────

interface DistillPromptOptions {
  inputHint: string;
  outPath: string;
  vault: string;
  role?: string;
  agentsContent: string;
  indexContent: string;
  contextFile: string;
  date: string;
}

function buildAgentDistillPrompt(opts: DistillPromptOptions): string {
  const { inputHint, outPath, vault, role, agentsContent, indexContent, contextFile, date } = opts;

  const roleSection = role
    ? `## Target Role\n\nExtract best practices specifically for the role: **${role}**\nFocus on decisions, patterns, and lessons relevant to this role.`
    : `## Target Role\n\nExtract general best practices applicable to the whole team.`;

  return `You are a knowledge distillation agent for the LLM Wiki system.

## Your Task

Read a conversation session and distill it into a structured raw knowledge document.

## Input

${inputHint}

Use your file tools (Read, Glob) to find and read the input file.
- If it's a JSONL file, parse each line as a JSON object with \`role\` and \`content\` fields.
- If it's a plain text or markdown file, read it as-is.
- If it's a JSON array, treat each element as a message.

${roleSection}

## Wiki Context

${agentsContent ? `### AGENTS.md\n${agentsContent}` : '(no AGENTS.md found — use general wiki conventions)'}

### Current Index
${indexContent || '(empty)'}

## Output Format

Write the distilled document to: **${outPath}**

The document MUST follow this structure:

\`\`\`markdown
---
title: "Session Distillation: <brief topic>"
source-type: session
distilled: ${date}
role: ${role ?? 'general'}
tags: [tag1, tag2, tag3]
---

# Session Distillation: <brief topic>

## Summary
<2-3 sentence summary of what this session covered>

## Key Decisions
<List of concrete decisions made, with rationale>

## Best Practices Discovered
<Actionable best practices extracted from the session>

## Patterns & Anti-patterns
<Patterns to follow and anti-patterns to avoid>

## Code Examples
<Any significant code snippets from the session>

## Open Questions
<Unresolved questions or areas needing follow-up>

## References
<Links, docs, or resources mentioned>
\`\`\`

## Quality Standards

- Be concrete and actionable, not vague.
- Preserve exact code snippets with correct language tags.
- Extract implicit knowledge, not just explicit statements.
- If the session is in a non-English language, write the distillation in the same language.
- Do NOT include personal information or credentials.

After writing the file, also update ${vault}/${contextFile} if it exists, appending a brief note about this session's key learnings.

Begin now.`;
}
