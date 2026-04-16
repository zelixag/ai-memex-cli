import { readFileUtf8, writeFileUtf8, pathExists } from '../utils/fs.js';
import { join } from 'node:path';

export interface VaultConfig {
  version: string;
  distill: {
    agentCommand: string;
  };
  ingest: {
    agentCommand: string;
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
  distill: {
    agentCommand: 'claude -p',
  },
  ingest: {
    agentCommand: 'claude -p',
  },
  glob: {
    maxPages: 30,
    mode: 'copy',
  },
  search: {
    defaultEngine: 'ripgrep',
  },
};

export async function readConfig(vaultPath: string): Promise<VaultConfig> {
  const configPath = join(vaultPath, '.llmwiki', 'config.json');
  if (await pathExists(configPath)) {
    const raw = await readFileUtf8(configPath);
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  return DEFAULT_CONFIG;
}

export async function writeConfig(vaultPath: string, config: Partial<VaultConfig>): Promise<void> {
  const configPath = join(vaultPath, '.llmwiki', 'config.json');
  const existing = await readConfig(vaultPath);
  const merged = { ...existing, ...config };
  await writeFileUtf8(configPath, JSON.stringify(merged, null, 2) + '\n');
}
