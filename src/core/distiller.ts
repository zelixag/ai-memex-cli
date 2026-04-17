export interface SessionLine {
  role: string;
  content: string;
  type?: string;
  timestamp?: string;
}

/**
 * Parse 1 或多种会话格式为简易 SessionLine 数组（向后兼容）。
 *
 * 支持：
 *  - OpenAI 风格：`{role, content, timestamp?}`
 *  - Claude Code 风格：`{type, message: {role, content}, timestamp}`，
 *    `content` 可能是字符串，也可能是 `[{type:'text', text:...}, {type:'tool_use', ...}]` 数组。
 */
export function parseJsonlLines(raw: string): SessionLine[] {
  const lines: SessionLine[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      const norm = toSessionLine(parsed);
      if (norm) lines.push(norm);
    } catch {
      /* 非 JSON 行：跳过 */
    }
  }
  return lines;
}

function toSessionLine(obj: unknown): SessionLine | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;

  // Claude Code style: {type, message:{role,content}, timestamp}
  if (o.message && typeof o.message === 'object') {
    const m = o.message as Record<string, unknown>;
    const role = (m.role ?? o.type ?? 'unknown') as string;
    const { text, toolCalls } = flattenContent(m.content);
    return {
      role: normalizeRole(role),
      content: text,
      type: toolCalls.length > 0 && !text ? 'tool_use' : (o.type as string | undefined),
      timestamp: typeof o.timestamp === 'string' ? o.timestamp : undefined,
    };
  }

  // OpenAI / generic: {role, content, timestamp|created_at}
  if (o.role && o.content !== undefined) {
    const { text } = flattenContent(o.content);
    return {
      role: normalizeRole(String(o.role)),
      content: text,
      type: typeof o.type === 'string' ? o.type : undefined,
      timestamp:
        typeof o.timestamp === 'string'
          ? o.timestamp
          : typeof o.created_at === 'string'
          ? o.created_at
          : undefined,
    };
  }
  return null;
}

function normalizeRole(role: string): string {
  const r = role.toLowerCase();
  if (r === 'user' || r === 'human') return 'user';
  if (r === 'assistant' || r === 'model' || r === 'ai') return 'assistant';
  if (r === 'tool' || r === 'function') return 'tool';
  if (r === 'system') return 'system';
  return r;
}

function flattenContent(content: unknown): { text: string; toolCalls: string[] } {
  if (content == null) return { text: '', toolCalls: [] };
  if (typeof content === 'string') return { text: content, toolCalls: [] };
  if (!Array.isArray(content)) {
    return { text: typeof content === 'object' ? JSON.stringify(content) : String(content), toolCalls: [] };
  }
  const parts: string[] = [];
  const tools: string[] = [];
  for (const block of content) {
    if (!block || typeof block !== 'object') continue;
    const b = block as Record<string, unknown>;
    const t = typeof b.type === 'string' ? b.type : undefined;
    if (t === 'text' && typeof b.text === 'string') {
      parts.push(b.text);
    } else if (t === 'tool_use' && typeof b.name === 'string') {
      tools.push(b.name);
    } else if (t === 'tool_result') {
      /* 丢弃工具结果 */
    } else if (typeof b.text === 'string') {
      parts.push(b.text);
    }
  }
  return { text: parts.join('\n\n'), toolCalls: tools };
}

/**
 * Mechanical extraction: strip tool calls, keep user/assistant text.
 */
export function mechanicalExtract(lines: SessionLine[]): string {
  const parts: string[] = [];
  for (const line of lines) {
    if (line.type === 'tool_use' || line.type === 'tool_result') continue;
    if (line.role === 'system') continue;
    if (line.role === 'unknown' && !line.content.trim()) continue;

    const roleLabel =
      line.role === 'user'
        ? 'User'
        : line.role === 'assistant'
        ? 'Assistant'
        : line.role;
    parts.push(`## ${roleLabel}\n\n${line.content}`);
  }
  return parts.join('\n\n---\n\n');
}

// ── 结构化会话解析与渲染 ────────────────────────────────────────────────────

export interface StructuredMessage {
  /** user | assistant | tool | system | ... */
  role: string;
  /** 纯文本内容（已合并 content 数组中的 text 块） */
  text: string;
  /** ISO 8601 时间戳，若源数据提供则带上 */
  timestamp?: string;
  /** 该轮里调用过的工具名（仅记录名称，不记录参数） */
  toolCalls?: string[];
}

export interface SessionMeta {
  /** 源文件绝对路径 */
  sourcePath: string;
  /** 标题；默认用文件名 */
  title?: string;
}

/**
 * 结构化解析一个会话文件（JSONL 或单个 JSON 对象/数组），返回按顺序的消息列表，
 * 每条带 role / text / timestamp / toolCalls。
 */
export function parseSessionStructured(raw: string): StructuredMessage[] {
  const text = raw.trim();
  if (!text) return [];

  const ndjson = parseNdjson(text);
  if (ndjson.length > 0) return ndjson;

  try {
    const obj = JSON.parse(text);
    if (Array.isArray(obj)) return mapToStructured(obj);
    if (obj && typeof obj === 'object') {
      const o = obj as Record<string, unknown>;
      if (Array.isArray(o.messages)) return mapToStructured(o.messages as unknown[]);
      if (Array.isArray(o.conversation)) return mapToStructured(o.conversation as unknown[]);
      if (Array.isArray(o.history)) return mapToStructured(o.history as unknown[]);
    }
  } catch {
    /* 不是合法 JSON 对象，回退为空 */
  }
  return [];
}

function parseNdjson(raw: string): StructuredMessage[] {
  const out: StructuredMessage[] = [];
  let sawMultipleLines = false;
  const lines = raw.split(/\r?\n/);
  if (lines.filter((l) => l.trim().length > 0).length > 1) sawMultipleLines = true;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed);
      const m = toStructured(obj);
      if (m) out.push(m);
    } catch {
      /* 非 JSON 行：跳过 */
    }
  }
  // 单行但其实是 JSON 数组的情况，交给 parseSessionStructured 的 JSON 分支处理
  return sawMultipleLines ? out : out.length > 0 ? out : [];
}

function mapToStructured(arr: unknown[]): StructuredMessage[] {
  const out: StructuredMessage[] = [];
  for (const it of arr) {
    const m = toStructured(it);
    if (m) out.push(m);
  }
  return out;
}

function toStructured(obj: unknown): StructuredMessage | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;

  // Claude Code: {type, message:{role,content}, timestamp}
  if (o.message && typeof o.message === 'object') {
    const m = o.message as Record<string, unknown>;
    const role = normalizeRole(String(m.role ?? o.type ?? 'unknown'));
    const { text, toolCalls } = flattenContent(m.content);
    if (role === 'system' && !text.trim()) return null;
    if (!text.trim() && toolCalls.length === 0) return null;
    return {
      role,
      text,
      timestamp: typeof o.timestamp === 'string' ? o.timestamp : undefined,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }

  // OpenAI / generic
  if (o.role !== undefined && o.content !== undefined) {
    const role = normalizeRole(String(o.role));
    const { text, toolCalls } = flattenContent(o.content);
    if (role === 'system' && !text.trim()) return null;
    if (!text.trim() && toolCalls.length === 0) return null;
    return {
      role,
      text,
      timestamp:
        typeof o.timestamp === 'string'
          ? o.timestamp
          : typeof o.created_at === 'string'
          ? o.created_at
          : undefined,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }
  return null;
}

/**
 * 将结构化消息渲染为 Markdown：
 *  - frontmatter 带起止时间、轮数
 *  - 每一轮带日期、角色标签，工具调用折叠为单行注记
 */
export function renderSessionMarkdown(
  messages: StructuredMessage[],
  meta: SessionMeta
): string {
  const today = new Date().toISOString().split('T')[0];
  const baseTitle =
    meta.title ?? meta.sourcePath.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '') ?? 'session';

  const firstTs = messages.find((m) => m.timestamp)?.timestamp;
  const lastTs = [...messages].reverse().find((m) => m.timestamp)?.timestamp;

  const fmHeader = [
    '---',
    `title: "Session: ${escapeYaml(baseTitle)}"`,
    'source-type: session',
    `distilled: ${today}`,
    firstTs ? `started: "${firstTs}"` : null,
    lastTs ? `ended: "${lastTs}"` : null,
    `turns: ${messages.length}`,
    `sources: ["${escapeYaml(meta.sourcePath)}"]`,
    '---',
    '',
    `# Session: ${baseTitle}`,
    '',
    `> 起始：${formatTimestamp(firstTs)}　|　结束：${formatTimestamp(lastTs)}　|　消息数：${messages.length}`,
    '',
    '',
  ].filter((x): x is string => x !== null);

  if (messages.length === 0) {
    return fmHeader.join('\n') + '_(空会话)_\n';
  }

  const body = messages
    .map((m) => {
      const label = roleLabel(m.role);
      const ts = m.timestamp ? ` — ${formatTimestamp(m.timestamp)}` : '';
      const toolLine =
        m.toolCalls && m.toolCalls.length > 0
          ? `\n\n_(工具调用：${m.toolCalls.join(', ')})_`
          : '';
      const bodyText = m.text.trim() || '_(空)_';
      return `## ${label}${ts}\n\n${bodyText}${toolLine}`;
    })
    .join('\n\n---\n\n');

  return fmHeader.join('\n') + body + '\n';
}

function roleLabel(role: string): string {
  if (role === 'user') return '👤 User';
  if (role === 'assistant') return '🤖 Assistant';
  if (role === 'tool') return '🛠 Tool';
  if (role === 'system') return '⚙ System';
  return role;
}

function formatTimestamp(ts?: string): string {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function escapeYaml(s: string): string {
  return s.replace(/\\/g, '/').replace(/"/g, '\\"');
}

/**
 * Build a distillation prompt for the LLM agent.
 */
export function buildDistillPrompt(rawMarkdown: string): string {
  return `Compress the following conversation into a concise markdown summary suitable for a knowledge base. Preserve key decisions, insights, and conclusions. Remove tangents and debugging steps. Output only markdown content without explanations.\n\n${rawMarkdown}`;
}
