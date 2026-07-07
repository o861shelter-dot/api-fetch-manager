import { describe, it, expect } from 'vitest';
import { resolveTemplate, resolveExpression } from '../src/engine/placeholder.js';

describe('placeholder engine', () => {
  const scope = {
    credentials: { 'github.token': 'ghp_secret' },
    vars: { 'github.lastRepoUrl': 'https://github.com/x/y' },
    ctx: { auth: { accessToken: 'tok_123' } },
    inputs: { repoName: 'My Repo' },
  };

  it('resolve credential', () => {
    expect(resolveTemplate('Bearer {{github.token}}', scope)).toBe('Bearer ghp_secret');
  });

  it('resolve var.*', () => {
    expect(resolveTemplate('{{var.github.lastRepoUrl}}', scope)).toBe('https://github.com/x/y');
  });

  it('resolve ctx.*', () => {
    expect(resolveTemplate('{{ctx.auth.accessToken}}', scope)).toBe('tok_123');
  });

  it('resolve input & transform pipe', () => {
    expect(resolveTemplate('{{repoName | lower | replace(" ", "-")}}', scope)).toBe('my-repo');
  });

  it('nhiều placeholder trong 1 string', () => {
    expect(resolveTemplate('{{repoName}}@{{github.token}}', scope)).toBe('My Repo@ghp_secret');
  });

  it('advanced JS {{= }} chạy sandbox', () => {
    const out = resolveExpression("= inputs.repoName.toUpperCase()", scope);
    expect(out).toBe('MY REPO');
  });

  it('resolve order: credential > var > input', () => {
    const s = { credentials: { x: 'cred' }, vars: { x: 'var' }, inputs: { x: 'input' } };
    expect(resolveTemplate('{{x}}', s)).toBe('cred');
  });
});
