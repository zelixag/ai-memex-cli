import { describe, it, expect } from 'vitest';
import { decodeChildStderr } from '../../src/utils/exec.js';

describe('decodeChildStderr', () => {
  it('decodes plain UTF-8', () => {
    expect(decodeChildStderr(Buffer.from('hello'))).toBe('hello');
  });
});
