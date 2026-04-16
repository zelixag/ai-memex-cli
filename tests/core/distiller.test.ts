import { describe, it, expect } from 'vitest';
import { parseJsonlLines, mechanicalExtract } from '../../src/core/distiller.js';

describe('parseJsonlLines', () => {
  it('should parse valid JSONL', () => {
    const input = `{"role":"user","content":"hello"}
{"role":"assistant","content":"hi there"}`;
    const result = parseJsonlLines(input);
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe('user');
    expect(result[1].content).toBe('hi there');
  });

  it('should handle empty string', () => {
    const result = parseJsonlLines('');
    expect(result).toEqual([]);
  });

  it('should skip malformed lines', () => {
    const input = `{"role":"user","content":"hello"}
this is not json
{"role":"assistant","content":"bye"}`;
    const result = parseJsonlLines(input);
    expect(result).toHaveLength(2);
  });

  it('should handle blank lines', () => {
    const input = `{"role":"user","content":"hello"}

{"role":"assistant","content":"bye"}
`;
    const result = parseJsonlLines(input);
    expect(result).toHaveLength(2);
  });
});

describe('mechanicalExtract', () => {
  it('should extract from messages', () => {
    const messages = [
      { role: 'user', content: 'How do I use React hooks?' },
      { role: 'assistant', content: 'React hooks let you use state in functional components.' },
    ];
    const result = mechanicalExtract(messages);
    expect(result).toContain('React hooks');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle empty messages array', () => {
    const result = mechanicalExtract([]);
    expect(typeof result).toBe('string');
    // Should not crash, may return minimal template
  });

  it('should handle single message', () => {
    const result = mechanicalExtract([{ role: 'user', content: 'test' }]);
    expect(result).toContain('test');
  });
});
