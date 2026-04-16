export interface SessionLine {
  role: string;
  content: string;
  type?: string;
  timestamp?: string;
}

/**
 * Parse Claude Code session JSONL into structured lines.
 */
export function parseJsonlLines(raw: string): SessionLine[] {
  const lines: SessionLine[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.role && parsed.content) {
        lines.push({
          role: parsed.role,
          content: typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed.content),
          type: parsed.type,
          timestamp: parsed.timestamp,
        });
      }
    } catch {
      // Not valid JSON — skip this line
      continue;
    }
  }
  return lines;
}

/**
 * Mechanical extraction: strip tool calls, keep user/assistant text.
 */
export function mechanicalExtract(lines: SessionLine[]): string {
  const parts: string[] = [];
  for (const line of lines) {
    // Skip tool_use, tool_result, and system messages
    if (line.type === 'tool_use' || line.type === 'tool_result') continue;
    if (line.role === 'system') continue;
    if (line.role === 'unknown' && !line.content.trim()) continue;

    const roleLabel = line.role === 'user' ? 'User' :
                      line.role === 'assistant' ? 'Assistant' :
                      line.role;
    parts.push(`## ${roleLabel}\n\n${line.content}`);
  }
  return parts.join('\n\n---\n\n');
}

/**
 * Build a distillation prompt for the LLM agent.
 */
export function buildDistillPrompt(rawMarkdown: string): string {
  return `Compress the following conversation into a concise markdown summary suitable for a knowledge base. Preserve key decisions, insights, and conclusions. Remove tangents and debugging steps. Output only markdown content without explanations.\n\n${rawMarkdown}`;
}
