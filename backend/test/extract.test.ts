import { describe, it, expect } from 'vitest';
import { extractJsonPath, runExtract, parseJsonPath } from '../src/engine/extract.js';

const data = {
  data: { items: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }] },
  html_url: 'https://github.com/x/y',
  nested: { a: { b: { c: 'deep' } } },
};

describe('JSONPath extraction', () => {
  it('nested path', () => {
    expect(extractJsonPath(data, '$.nested.a.b.c')).toBe('deep');
    expect(extractJsonPath(data, '$.html_url')).toBe('https://github.com/x/y');
  });

  it('array index', () => {
    expect(extractJsonPath(data, '$.data.items[0].id')).toBe(1);
    expect(extractJsonPath(data, '$.data.items[1].name')).toBe('b');
  });

  it('wildcard → mảng', () => {
    expect(extractJsonPath(data, '$.data.items[*].id')).toEqual([1, 2]);
    expect(extractJsonPath(data, '$.data.items[*].name')).toEqual(['a', 'b']);
  });

  it('path không tồn tại → undefined', () => {
    expect(extractJsonPath(data, '$.nope.here')).toBeUndefined();
  });

  it('runExtract + pinToVar', () => {
    const res = runExtract(data, [
      { field: 'repoUrl', jsonPath: '$.html_url', pinToVar: 'github.lastRepoUrl' },
      { field: 'ids', jsonPath: '$.data.items[*].id' },
    ]);
    expect(res.values.repoUrl).toBe('https://github.com/x/y');
    expect(res.values.ids).toEqual([1, 2]);
    expect(res.pins).toHaveLength(1);
    expect(res.pins[0].varKey).toBe('github.lastRepoUrl');
  });

  it('parseJsonPath tokens', () => {
    expect(parseJsonPath('$.a.b[0].c')).toEqual([
      { type: 'key', value: 'a' },
      { type: 'key', value: 'b' },
      { type: 'index', value: 0 },
      { type: 'key', value: 'c' },
    ]);
  });
});
