import Conf from 'conf';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { findKbRoot } from './kb.js';

// Global config stored in user home
export const globalConfig = new Conf({
  projectName: 'memex',
  schema: {
    llm: {
      type: 'object',
      properties: {
        provider: { type: 'string', default: 'openai' },
        model: { type: 'string', default: 'gpt-4.1-mini' },
        apiKey: { type: 'string', default: '' },
        baseUrl: { type: 'string', default: '' },
      },
    },
    defaultKb: { type: 'string', default: '' },
    activeKbs: { type: 'object', default: {} },
  },
});

/**
 * Get the LLM configuration, merging global config with env vars
 */
export function getLLMConfig() {
  const llm = globalConfig.get('llm') || {};
  return {
    provider: llm.provider || 'openai',
    model: llm.model || process.env.MEMEX_MODEL || 'gpt-4.1-mini',
    apiKey: llm.apiKey || process.env.OPENAI_API_KEY || process.env.MEMEX_API_KEY || '',
    baseUrl: llm.baseUrl || process.env.OPENAI_BASE_URL || '',
  };
}

/**
 * Get the active knowledge base path for the current working directory
 */
export function getActiveKbPath(kbName) {
  if (kbName) {
    // Look up named KB from global registry
    const activeKbs = globalConfig.get('activeKbs') || {};
    if (activeKbs[kbName]) return activeKbs[kbName];
    throw new Error(`Knowledge base "${kbName}" not found. Run \`memex kb list\` to see available KBs.`);
  }

  // Try to find .memex directory walking up from cwd
  const kbRoot = findKbRoot(process.cwd());
  if (kbRoot) return kbRoot;

  // Fall back to default KB
  const defaultKb = globalConfig.get('defaultKb');
  if (defaultKb) return defaultKb;

  throw new Error(
    'No knowledge base found. Run `memex init` to create one, or use --kb <name> to specify one.'
  );
}

/**
 * Register a knowledge base in global config
 */
export function registerKb(name, path) {
  const activeKbs = globalConfig.get('activeKbs') || {};
  activeKbs[name] = path;
  globalConfig.set('activeKbs', activeKbs);

  // Set as default if it's the first one
  if (!globalConfig.get('defaultKb')) {
    globalConfig.set('defaultKb', name);
  }
}

/**
 * Load KB-local config (from .memex/config.json)
 */
export function loadKbConfig(kbPath) {
  const configPath = join(kbPath, '.memex', 'config.json');
  if (!existsSync(configPath)) return {};
  try {
    return JSON.parse(readFileSync(configPath, 'utf8'));
  } catch {
    return {};
  }
}
