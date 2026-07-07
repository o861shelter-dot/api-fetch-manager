import { describe, it, expect } from 'vitest';
import { parseCurl } from '../src/modules/parse-curl.js';

describe('parse-curl', () => {
  it('parse method/url/headers/body', () => {
    const cmd = `curl -X POST https://api.github.com/user/repos \\
      -H "Authorization: Bearer ghp_xxx" \\
      -H "Content-Type: application/json" \\
      -d '{"name":"demo"}'`;
    const r = parseCurl(cmd);
    expect(r.step.method).toBe('POST');
    expect(r.step.urlTemplate).toBe('https://api.github.com/user/repos');
    expect(r.step.headers?.['Content-Type']).toBe('application/json');
    expect(r.step.bodyTemplate).toBe('{"name":"demo"}');
  });

  it('phát hiện Authorization → placeholder + credentialRef', () => {
    const r = parseCurl(`curl https://x.com -H "Authorization: Bearer secret123"`);
    expect(r.step.headers?.['Authorization']).toBe('Bearer {{auth.token}}');
    expect(r.credentialRefs[0].key).toBe('auth.token');
  });

  it('mặc định GET khi không có body', () => {
    expect(parseCurl('curl https://x.com').step.method).toBe('GET');
  });

  it('mặc định POST khi có -d', () => {
    expect(parseCurl(`curl https://x.com -d 'a=1'`).step.method).toBe('POST');
  });
});
