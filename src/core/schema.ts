import matter from 'gray-matter';

export type WikiType = 'entity' | 'concept' | 'source' | 'comparison' | 'overview' | 'synthesis';
export type WikiScene = 'personal' | 'research' | 'reading' | 'team';

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
  if (data.scene && !['personal', 'research', 'reading', 'team'].includes(data.scene)) {
    errors.push(`Invalid scene: ${data.scene}`);
  }
  return errors;
}
