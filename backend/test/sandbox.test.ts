import { describe, it, expect } from 'vitest';
import { runSandbox } from '../src/engine/sandbox.js';

describe('sandbox JS cô lập', () => {
  it('chạy biểu thức đơn giản', () => {
    expect(runSandbox('inputs.a + inputs.b', { inputs: { a: 'x', b: 'y' } })).toBe('xy');
  });

  it('hỗ trợ return statement', () => {
    const code = `return (inputs.repoName || 'repo').replace(/\\s+/g, '-').toLowerCase();`;
    expect(runSandbox(code, { inputs: { repoName: 'My Repo Name' } })).toBe('my-repo-name');
  });

  it('CẤM truy cập process', () => {
    expect(() => runSandbox('process.env.SECRET', {})).toThrow();
  });

  it('CẤM require/import', () => {
    expect(() => runSandbox('require("fs")', {})).toThrow();
  });

  it('CẤM network (fetch không tồn tại)', () => {
    expect(() => runSandbox('fetch("http://evil.com")', {})).toThrow();
  });

  it('CẤM filesystem (không có global)', () => {
    expect(() => runSandbox('globalThis.process.mainModule', {})).toThrow();
  });

  it('timeout với vòng lặp vô hạn', () => {
    expect(() => runSandbox('while(true){}', {})).toThrow(/timeout/i);
  });


});
