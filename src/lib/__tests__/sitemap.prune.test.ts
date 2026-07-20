import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('sitemap prune — no commercial trade product URLs', () => {
  it('generate-sitemap.ts does not list /trade or /trade-fx', () => {
    const src = readFileSync(resolve(root, 'scripts/generate-sitemap.ts'), 'utf8');
    expect(src).not.toMatch(/url:\s*'\/trade'/);
    expect(src).not.toMatch(/url:\s*'\/trade-fx'/);
  });

  it('_redirects 301 retired trade surfaces to /', () => {
    const redirects = readFileSync(resolve(root, 'public/_redirects'), 'utf8');
    expect(redirects).toMatch(/\/trade\s+\/\s+301/);
    expect(redirects).toMatch(/\/trade-fx\s+\/\s+301/);
  });
});
