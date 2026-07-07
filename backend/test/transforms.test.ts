import { describe, it, expect } from 'vitest';
import { applyTransform, parseTransformCall, listTransforms } from '../src/engine/transforms.js';

describe('transforms whitelist', () => {
  it('có đủ transform bắt buộc', () => {
    const list = listTransforms();
    for (const t of ['upper', 'lower', 'trim', 'replace', 'slice', 'base64', 'base64decode', 'jsonStringify', 'urlEncode', 'date', 'default']) {
      expect(list).toContain(t);
    }
  });

  it('upper/lower/trim', () => {
    expect(applyTransform('upper', 'abc', [])).toBe('ABC');
    expect(applyTransform('lower', 'ABC', [])).toBe('abc');
    expect(applyTransform('trim', '  x  ', [])).toBe('x');
  });

  it('replace & slice', () => {
    expect(applyTransform('replace', 'a b c', [' ', '-'])).toBe('a-b-c');
    expect(applyTransform('slice', 'abcdef', ['1', '3'])).toBe('bc');
  });

  it('base64 round-trip', () => {
    const enc = applyTransform('base64', 'hello', []);
    expect(applyTransform('base64decode', enc, [])).toBe('hello');
  });

  it('urlEncode & default', () => {
    expect(applyTransform('urlEncode', 'a b&c', [])).toBe('a%20b%26c');
    expect(applyTransform('default', '', ['fallback'])).toBe('fallback');
    expect(applyTransform('default', 'x', ['fallback'])).toBe('x');
  });

  it('date format', () => {
    expect(applyTransform('date', '2026-07-07T00:00:00Z', ['YYYY-MM-DD'])).toMatch(/2026-07-0[67]/);
  });

  it('transform không hợp lệ → ném lỗi', () => {
    expect(() => applyTransform('evil', 'x', [])).toThrow();
  });

  it('parseTransformCall', () => {
    expect(parseTransformCall('replace(" ", "-")')).toEqual({ name: 'replace', args: [' ', '-'] });
    expect(parseTransformCall('upper')).toEqual({ name: 'upper', args: [] });
  });
});
