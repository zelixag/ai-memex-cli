/**
 * context-block.ts
 *
 * Pure helpers that render and splice the "memex bootstrap" context block
 * into an agent's project-root auto-loaded file (CLAUDE.md / AGENTS.md /
 * GEMINI.md / .cursor/rules/memex.mdc).
 *
 * The block is delimited by HTML comments so the user's own prose around it
 * stays untouched across reinstalls / refreshes:
 *
 *   <!-- memex:context:start v=1 vault=... updated=... -->
 *   ...generated content...
 *   <!-- memex:context:end -->
 */
import { join } from 'node:path';
import type { WikiPage } from './wiki-index.js';
import type { SceneManifest } from './scene-manifest.js';

export type ContextMode = 'minimal' | 'digest';

export const BLOCK_START_RE = /<!--\s*memex:context:start[^>]*-->/;
export const BLOCK_END_RE = /<!--\s*memex:context:end\s*-->/;

export interface ContextBuildInput {
  vault: string;
  pages: WikiPage[];
  mode: ContextMode;
  /** number of pages per scene to list in digest mode */
  topPerScene?: number;
  agentId: string;
  /** bound scene manifests — drives the "when to use" section */
  scenes?: SceneManifest[];
}

/** Build the inner markdown body of the context block (no start/end markers). */
export function buildContextBody(input: ContextBuildInput): string {
  const { vault, pages, mode, agentId } = input;
  const topPerScene = input.topPerScene ?? 5;
  const today = new Date().toISOString().slice(0, 10);

  const byScene = groupByScene(pages);
  const sceneCountLine = formatSceneCounts(byScene);

  const header = [
    '## 🧠 Memex Knowledge Base',
    '',
    'This project is connected to a persistent knowledge base (LLM Wiki) managed by the `memex` CLI.',
    '',
    `- **Vault**: \`${vault}\``,
    `- **Pages**: ${pages.length}${sceneCountLine ? ` (${sceneCountLine})` : ''}`,
    `- **Updated**: ${today}`,
    `- **Agent**: ${agentId}`,
    '',
  ];

  // Scene-driven "when to use" section (shown when scenes are bound)
  const scenesSection: string[] = [];
  if (input.scenes && input.scenes.length > 0) {
    scenesSection.push('### When to consult the knowledge base');
    scenesSection.push('');
    for (const scene of input.scenes) {
      const wikiPath = `${vault}/wiki/${scene.name}/`;
      const heading = scene.description
        ? `**${scene.name}** — ${scene.description}`
        : `**${scene.name}**`;
      scenesSection.push(heading);
      if (scene.triggers.length > 0) {
        scenesSection.push(`Read \`${wikiPath}\` when:`);
        for (const t of scene.triggers) {
          scenesSection.push(`- ${t}`);
        }
      } else {
        scenesSection.push(`Path: \`${wikiPath}\``);
      }
      scenesSection.push('');
    }
    scenesSection.push('> Read the relevant file from the path above. No extra CLI commands needed.');
    scenesSection.push('');
  }

  const digest: string[] = [];
  if (mode === 'digest' && pages.length > 0) {
    digest.push('### Index digest');
    digest.push('');
    for (const [scene, list] of Object.entries(byScene)) {
      if (list.length === 0) continue;
      digest.push(`**${scene}** — ${list.length} page${list.length === 1 ? '' : 's'}`);
      const top = list.slice(0, topPerScene);
      for (const p of top) {
        const desc = shortDesc(p);
        digest.push(`- [[${p.id}]]${desc ? ` — ${desc}` : ''}`);
      }
      if (list.length > top.length) {
        digest.push(`- …${list.length - top.length} more (run \`memex status --scene ${scene}\`)`);
      }
      digest.push('');
    }
  }

  const hasBoundScenes = input.scenes && input.scenes.length > 0;
  const usage = hasBoundScenes
    ? [
        '### memex CLI',
        '',
        '- `memex search "<topic>"` — keyword search across the wiki',
        '- `memex context refresh` — sync latest wiki updates to this block',
        '- `memex --help` — full command list',
      ]
    : [
        '### How to use memex from this session',
        '',
        '- `memex search "<topic>"` — keyword + full-text search across the wiki',
        '- `memex inject --task "<current goal>"` — pull the most relevant pages for your task',
        '- `memex fetch <url|query>` — fetch web docs / search results into `raw/`',
        '- `memex distill` / `memex ingest` — convert sessions/raw into structured wiki',
        '- `memex watch` — auto ingest → lint → ingest loop when `raw/` changes',
        '- `memex --help` — full command list',
        '',
        '> 💡 **Before answering domain questions or starting non-trivial work, consult ' +
          '`memex inject --task "<what you are trying to do>"` to load relevant wiki pages.**',
      ];

  return [...header, ...scenesSection, ...digest, ...usage].join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** Render the full block (with markers) for a markdown host file. */
export function renderMarkdownBlock(input: ContextBuildInput): string {
  const body = buildContextBody(input);
  const meta = `v=1 vault=${sanitizeMeta(input.vault)} mode=${input.mode} updated=${new Date()
    .toISOString()
    .slice(0, 10)}`;
  return `<!-- memex:context:start ${meta} -->\n${body}\n<!-- memex:context:end -->`;
}

/** Render a Cursor `.mdc` rule file (frontmatter + body, not markers). */
export function renderCursorRule(input: ContextBuildInput): string {
  const body = buildContextBody(input);
  return `---
description: memex knowledge base bootstrap — index digest + command reference
globs: ["**/*"]
alwaysApply: true
---

${body}`;
}

/**
 * Insert or replace the block inside an existing host file content.
 * When no block exists yet, append the block after one blank line.
 * Returns the new full content.
 */
export function spliceBlock(existing: string, newBlock: string): string {
  const s = existing.search(BLOCK_START_RE);
  const e = existing.search(BLOCK_END_RE);
  if (s >= 0 && e > s) {
    const endMarkerMatch = existing.slice(e).match(BLOCK_END_RE)!;
    const endPos = e + endMarkerMatch[0].length;
    return (
      existing.slice(0, s) +
      newBlock +
      existing.slice(endPos)
    );
  }
  const trimmed = existing.replace(/\s+$/, '');
  const sep = trimmed.length > 0 ? '\n\n' : '';
  return trimmed + sep + newBlock + '\n';
}

/** Remove the block; return the new content. Returns null if the block was absent. */
export function removeBlock(existing: string): string | null {
  const s = existing.search(BLOCK_START_RE);
  const e = existing.search(BLOCK_END_RE);
  if (s < 0 || e <= s) return null;
  const endMarkerMatch = existing.slice(e).match(BLOCK_END_RE)!;
  const endPos = e + endMarkerMatch[0].length;
  // Also strip one surrounding blank line if present
  let start = s;
  let end = endPos;
  while (start > 0 && existing[start - 1] === '\n') start--;
  while (end < existing.length && existing[end] === '\n') end++;
  return existing.slice(0, start) + '\n' + existing.slice(end);
}

/** Return target host file path for a given agent at the project root. */
export function resolveHostFile(agentId: string, projectDir: string): string | null {
  switch (agentId) {
    case 'claude-code':
      return join(projectDir, 'CLAUDE.md').replace(/\\/g, '/');
    case 'codex':
    case 'opencode':
    case 'generic':
      return join(projectDir, 'AGENTS.md').replace(/\\/g, '/');
    case 'gemini-cli':
      return join(projectDir, 'GEMINI.md').replace(/\\/g, '/');
    case 'cursor':
      return join(projectDir, '.cursor', 'rules', 'memex.mdc').replace(/\\/g, '/');
    // aider / continue: no commonly-auto-loaded project file → skip L0
    case 'aider':
    case 'continue':
      return null;
    default:
      return null;
  }
}

/** Return true when this agent wants a raw .mdc cursor rule (single-file replace). */
export function isCursorAgent(agentId: string): boolean {
  return agentId === 'cursor';
}

// ── Private helpers ──────────────────────────────────────────────────────────

function groupByScene(pages: WikiPage[]): Record<string, WikiPage[]> {
  const order = ['personal', 'team', 'research', 'reading'];
  const buckets: Record<string, WikiPage[]> = Object.fromEntries(order.map((s) => [s, []]));
  for (const p of pages) {
    const k = (p.scene || 'unknown').toLowerCase();
    if (!(k in buckets)) buckets[k] = [];
    buckets[k]!.push(p);
  }
  // drop empty buckets but keep ordering
  const out: Record<string, WikiPage[]> = {};
  for (const k of [...order, ...Object.keys(buckets).filter((x) => !order.includes(x))]) {
    if (buckets[k] && buckets[k]!.length > 0) out[k] = buckets[k]!;
  }
  return out;
}

function formatSceneCounts(byScene: Record<string, WikiPage[]>): string {
  return Object.entries(byScene)
    .map(([s, list]) => `${s}: ${list.length}`)
    .join(' · ');
}

function shortDesc(p: WikiPage): string {
  const d = (p.frontmatter.description as string | undefined) ?? '';
  if (!d) return '';
  const oneLine = d.replace(/\s+/g, ' ').trim();
  return oneLine.length > 80 ? oneLine.slice(0, 77) + '…' : oneLine;
}

function sanitizeMeta(value: string): string {
  return value.replace(/-->/g, '--&gt;').replace(/\s+/g, ' ').trim();
}
