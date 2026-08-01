/**
 * Run with an explicit path (not auto-included by vitest.config.ts):
 *   npx vitest run supabase/functions/ingest-fiscaldata/index.test.ts
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('ingest-fiscaldata IMF endpoint', () => {
    it('uses https, not http, for the IMF SDMX endpoint', () => {
        const source = readFileSync(join(__dirname, 'index.ts'), 'utf-8');
        expect(source).not.toContain('http://dataservices.imf.org');
        expect(source).toContain('https://dataservices.imf.org');
    });
});
