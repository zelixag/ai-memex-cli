import { resolveVaultPath } from '../core/vault.js';
import { writeFileUtf8, readFileUtf8, pathExists } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { pluralizeType, type WikiType, type WikiScene } from '../core/schema.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export interface NewOptions {
  type: WikiType;
  name: string;
  scene: WikiScene;
  tags?: string[];
  vault?: string;
}

export async function newCommand(options: NewOptions, cwd: string): Promise<void> {
  // ── Input validation ──────────────────────────────────────────────────────
  const validTypes = ['entity', 'concept', 'source', 'comparison', 'overview', 'synthesis'];
  if (!options.name || !options.name.trim()) {
    logger.error('Page name is required. Usage: memex new <type> <name>');
    logger.info('Example: memex new concept "React Hooks"');
    return;
  }
  if (!options.type || !validTypes.includes(options.type)) {
    logger.error(`Invalid type: "${options.type || ''}". Must be one of: ${validTypes.join(', ')}`);
    logger.info('Example: memex new entity "TypeScript"');
    return;
  }
  // Default scene to research if not provided
  if (!options.scene) {
    options.scene = 'research' as WikiScene;
  }

  const vault = await resolveVaultPath({ explicitPath: options.vault }, cwd);
  const id = toKebabCase(options.name);
  const typeDir = pluralizeType(options.type);
  const filePath = `${vault}/wiki/${options.scene}/${typeDir}/${id}.md`;

  if (await pathExists(filePath)) {
    logger.warn(`Page already exists: ${filePath}`);
    return;
  }

  const template = await loadTemplate(`${options.type}.md`);
  const date = new Date().toISOString().split('T')[0];
  const content = template
    .replace(/\{\{name\}\}/g, options.name)
    .replace(/\{\{scene\}\}/g, options.scene)
    .replace(/\{\{date\}\}/g, date);

  await writeFileUtf8(filePath, content);
  logger.success(`Created ${filePath}`);
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function loadTemplate(name: string): Promise<string> {
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const templateDir = join(dirname(currentFile), '..', '..', 'templates');
    const templatePath = join(templateDir, name);
    if (await pathExists(templatePath)) {
      return readFileUtf8(templatePath);
    }
  } catch { /* ignore */ }
  return `---\nname: {{name}}\ntype: \nscene: {{scene}}\n---\n\n# {{name}}\n`;
}
