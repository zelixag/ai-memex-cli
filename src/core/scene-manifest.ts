import { join } from 'node:path';
import matter from 'gray-matter';
import { readFileUtf8, pathExists } from '../utils/fs.js';

export interface SceneManifest {
  name: string;
  description: string;
  triggers: string[];
}

export async function readSceneManifest(wikiDir: string, sceneName: string): Promise<SceneManifest | null> {
  const path = join(wikiDir, sceneName, '_scene.md').replace(/\\/g, '/');
  if (!(await pathExists(path))) return null;
  const content = await readFileUtf8(path);
  const data = matter(content).data as Record<string, unknown>;
  if (!data['name']) return null;
  return {
    name: String(data['name']),
    description: String(data['description'] ?? ''),
    triggers: Array.isArray(data['triggers']) ? (data['triggers'] as unknown[]).map(String) : [],
  };
}

export async function readAllSceneManifests(wikiDir: string, scenes: string[]): Promise<SceneManifest[]> {
  const manifests: SceneManifest[] = [];
  for (const scene of scenes) {
    const manifest = await readSceneManifest(wikiDir, scene);
    manifests.push(manifest ?? { name: scene, description: '', triggers: [] });
  }
  return manifests;
}
