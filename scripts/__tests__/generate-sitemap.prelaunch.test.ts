/**
 * Lightweight source checks for pre-launch sitemap hygiene.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

describe('generate-sitemap pre-launch hygiene', () => {
    it('does not list /demo and includes /labs/gov-financial-position', () => {
        const source = readFileSync(join(root, 'scripts/generate-sitemap.ts'), 'utf-8');
        expect(source).not.toMatch(/url:\s*['"]\/demo['"]/);
        expect(source).toMatch(/url:\s*['"]\/labs\/gov-financial-position['"]/);
    });

    it('lab pages no longer link to dead glossary slugs', () => {
        const sovereign = readFileSync(join(root, 'src/pages/labs/SovereignStressLab.tsx'), 'utf-8');
        const shadow = readFileSync(join(root, 'src/pages/labs/ShadowSystemLab.tsx'), 'utf-8');
        expect(sovereign).not.toContain('/glossary/sovereign-risk-matrix');
        expect(shadow).not.toContain('/glossary/shadow-trade-ratio');
    });
});
