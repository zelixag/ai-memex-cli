/**
 * context-registry.ts
 *
 * Tracks which project directories have the memex bootstrap context block
 * installed, so that `memex ingest` / `memex watch` can transparently refresh
 * them after a successful run.
 *
 * Stored at `~/.llmwiki/contexts.json`:
 *   {
 *     "version": 1,
 *     "entries": [
 *       {
 *         "project": "C:/Users/.../my-app",
 *         "agent": "claude-code",
 *         "host": "C:/Users/.../my-app/CLAUDE.md",
 *         "mode": "digest",
 *         "installed": "2026-04-17T09:00:00.000Z"
 *       }
 *     ]
 *   }
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileUtf8, writeFileUtf8, pathExists, normalizePath } from '../utils/fs.js';

export interface ContextEntry {
  project: string;
  agent: string;
  host: string;
  mode: 'minimal' | 'digest';
  installed: string;
}

interface Registry {
  version: 1;
  entries: ContextEntry[];
}

const REGISTRY_PATH = join(homedir(), '.llmwiki', 'contexts.json').replace(/\\/g, '/');

export function registryPath(): string {
  return REGISTRY_PATH;
}

export async function readRegistry(): Promise<Registry> {
  if (!(await pathExists(REGISTRY_PATH))) {
    return { version: 1, entries: [] };
  }
  try {
    const raw = await readFileUtf8(REGISTRY_PATH);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { version: 1, entries: [] };
    return {
      version: 1,
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    };
  } catch {
    return { version: 1, entries: [] };
  }
}

async function writeRegistry(reg: Registry): Promise<void> {
  await writeFileUtf8(REGISTRY_PATH, JSON.stringify(reg, null, 2) + '\n');
}

function normKey(project: string, agent: string): string {
  return `${normalizePath(project)}|${agent}`;
}

export async function upsertContext(entry: Omit<ContextEntry, 'installed'> & { installed?: string }): Promise<void> {
  const reg = await readRegistry();
  const key = normKey(entry.project, entry.agent);
  const existing = reg.entries.findIndex((e) => normKey(e.project, e.agent) === key);
  const installed = entry.installed ?? new Date().toISOString();
  const record: ContextEntry = {
    project: normalizePath(entry.project),
    agent: entry.agent,
    host: normalizePath(entry.host),
    mode: entry.mode,
    installed,
  };
  if (existing >= 0) reg.entries[existing] = record;
  else reg.entries.push(record);
  await writeRegistry(reg);
}

export async function removeContext(project: string, agent: string): Promise<boolean> {
  const reg = await readRegistry();
  const key = normKey(project, agent);
  const before = reg.entries.length;
  reg.entries = reg.entries.filter((e) => normKey(e.project, e.agent) !== key);
  if (reg.entries.length === before) return false;
  await writeRegistry(reg);
  return true;
}

export async function listContexts(): Promise<ContextEntry[]> {
  const reg = await readRegistry();
  return reg.entries;
}
