import { mkdir, readFile, writeFile, access, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function readFileUtf8(path: string): Promise<string> {
  return readFile(path, 'utf-8');
}

export async function writeFileUtf8(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf-8');
}

export async function appendFileUtf8(path: string, content: string): Promise<void> {
  const existing = (await pathExists(path)) ? await readFileUtf8(path) : '';
  await writeFileUtf8(path, existing + content);
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function listMarkdownFiles(dir: string): Promise<string[]> {
  if (!(await pathExists(dir))) return [];
  const results: string[] = [];
  await walkDir(dir, results);
  return results.sort();
}

async function walkDir(dir: string, results: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== '.gitkeep') {
      results.push(fullPath.replace(/\\/g, '/'));
    }
  }
}
