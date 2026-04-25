import { readFileUtf8, writeFileUtf8, pathExists, normalizePath } from '../utils/fs.js';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { AgentId } from './agent-adapter.js';

// ── Config Schema ─────────────────────────────────────────────────────────────

export interface VaultConfig {
  version: string;
  /** Fallback agent for commands that cannot infer their current runtime agent */
  agent?: AgentId;
  /** Agents configured or installed during onboarding. */
  agents?: AgentId[];
  /** Per-agent session roots used by `memex distill --agent <id>`. */
  sessionDirs?: Partial<Record<AgentId, string>>;
  distill: {
    /** @deprecated use top-level agent */
    agentCommand?: string;
    agent?: AgentId;
  };
  ingest: {
    /** @deprecated use top-level agent */
    agentCommand?: string;
    agent?: AgentId;
  };
  glob: {
    maxPages: number;
    mode: 'copy' | 'link';
  };
  search: {
    defaultEngine: 'ripgrep' | 'qmd' | 'hybrid';
  };
}

const DEFAULT_CONFIG: VaultConfig = {
  version: '0.1.0',
  distill: {},
  ingest: {},
  glob: {
    maxPages: 30,
    mode: 'copy',
  },
  search: {
    defaultEngine: 'ripgrep',
  },
};

// ── Global user config (~/.llmwiki/config.json) ───────────────────────────────

const GLOBAL_CONFIG_PATH = join(homedir(), '.llmwiki', 'config.json').replace(/\\/g, '/');

export async function readGlobalConfig(): Promise<Partial<VaultConfig>> {
  if (await pathExists(GLOBAL_CONFIG_PATH)) {
    try {
      const raw = await readFileUtf8(GLOBAL_CONFIG_PATH);
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}

export async function writeGlobalConfig(patch: Partial<VaultConfig>): Promise<void> {
  const existing = await readGlobalConfig();
  const merged = deepMerge(existing as unknown as Record<string, unknown>, patch as unknown as Record<string, unknown>);
  await writeFileUtf8(GLOBAL_CONFIG_PATH, JSON.stringify(merged, null, 2) + '\n');
}

// ── Vault config ──────────────────────────────────────────────────────────────

export async function readConfig(vaultPath: string): Promise<VaultConfig> {
  // Layer 1: defaults
  let config: VaultConfig = { ...DEFAULT_CONFIG, distill: {}, ingest: {} };

  // Layer 2: global user config (~/.llmwiki/config.json)
  const globalCfg = await readGlobalConfig();
  config = deepMerge(config as unknown as Record<string, unknown>, globalCfg) as unknown as VaultConfig;

  // Layer 3: vault-local config (.llmwiki/config.json inside vault)
  const vaultConfigPath = join(vaultPath, '.llmwiki', 'config.json').replace(/\\/g, '/');
  if (await pathExists(vaultConfigPath)) {
    try {
      const raw = await readFileUtf8(vaultConfigPath);
      const vaultCfg = JSON.parse(raw);
      config = deepMerge(config as unknown as Record<string, unknown>, vaultCfg) as unknown as VaultConfig;
    } catch {
      // ignore parse errors
    }
  }

  // Back-compat: if old agentCommand fields exist, derive agent from them
  if (!config.agent) {
    const cmd = config.ingest.agentCommand ?? config.distill.agentCommand ?? '';
    if (cmd.startsWith('claude')) config.agent = 'claude-code';
    else if (cmd.startsWith('codex')) config.agent = 'codex';
    else if (cmd.startsWith('opencode')) config.agent = 'opencode';
    else if (cmd.startsWith('gemini')) config.agent = 'gemini-cli';
    else if (cmd.startsWith('aider')) config.agent = 'aider';
  }

  // Propagate top-level agent to sub-configs
  if (config.agent) {
    config.ingest.agent = config.ingest.agent ?? config.agent;
    config.distill.agent = config.distill.agent ?? config.agent;
    if (!config.agents || config.agents.length === 0) {
      config.agents = [config.agent];
    }
  }

  return config;
}

export async function writeConfig(vaultPath: string, patch: Partial<VaultConfig>): Promise<void> {
  const vaultConfigPath = join(vaultPath, '.llmwiki', 'config.json').replace(/\\/g, '/');
  const existing = await readConfig(vaultPath);
  const merged = deepMerge(existing as unknown as Record<string, unknown>, patch as unknown as Record<string, unknown>);
  await writeFileUtf8(vaultConfigPath, JSON.stringify(merged, null, 2) + '\n');
}

// ── Deep merge helper ─────────────────────────────────────────────────────────

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (sv !== null && typeof sv === 'object' && !Array.isArray(sv) &&
        tv !== null && typeof tv === 'object' && !Array.isArray(tv)) {
      result[key] = deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>);
    } else if (sv !== undefined) {
      result[key] = sv;
    }
  }
  return result;
}
