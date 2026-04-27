import matter from 'gray-matter';

export type WikiType = 'entity' | 'concept' | 'source' | 'comparison' | 'overview' | 'synthesis';

/**
 * Scene is an OPEN set: any kebab-case identifier is valid.
 *
 * RECOMMENDED_SCENES are the curated starters seeded by `memex init`,
 * but users are free to add `competitive-analysis`, `trip-planning`,
 * `course-notes`, etc. to fit their domain. This matches the spirit
 * of the LLM Wiki pattern, where "contexts" are domain-driven.
 */
export type WikiScene = string;

export const RECOMMENDED_SCENES = ['personal', 'research', 'reading', 'team'] as const;

export interface Frontmatter {
  name: string;
  description: string;
  type: WikiType;
  scene: WikiScene;
  tags?: string[];
  updated?: string;
  sources?: string[];
  related?: string[];
  'source-url'?: string;
  'source-date'?: string;
  ingested?: string;
}

export function parseFrontmatter(content: string): { data: Partial<Frontmatter>; body: string } {
  if (!content || typeof content !== 'string') {
    return { data: {}, body: '' };
  }
  try {
    const parsed = matter(content);
    return {
      data: parsed.data as Partial<Frontmatter>,
      body: parsed.content,
    };
  } catch {
    // Malformed frontmatter — return empty data and full content as body
    return { data: {}, body: content };
  }
}

export function stringifyFrontmatter(data: Partial<Frontmatter>, body: string): string {
  return matter.stringify(body, data as Record<string, unknown>);
}

export const REQUIRED_FIELDS: (keyof Frontmatter)[] = ['name', 'description', 'type', 'scene'];

const TYPE_DIRS: Record<WikiType, string> = {
  entity: 'entities',
  concept: 'concepts',
  source: 'sources',
  comparison: 'comparisons',
  overview: 'overviews',
  synthesis: 'syntheses',
};

export function pluralizeType(type: string): string {
  return TYPE_DIRS[type as WikiType] ?? 'sources';
}

export function validateFrontmatter(data: Partial<Frontmatter>): string[] {
  const errors: string[] = [];
  for (const field of REQUIRED_FIELDS) {
    if (data[field] == null || data[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }
  if (data.type && !['entity', 'concept', 'source', 'comparison', 'overview', 'synthesis'].includes(data.type)) {
    errors.push(`Invalid type: ${data.type}`);
  }
  if (data.scene != null && data.scene !== '' && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.scene)) {
    errors.push(`Invalid scene format: ${data.scene} (must be kebab-case, e.g. "personal", "competitive-analysis")`);
  }
  return errors;
}
