/**
 * Run with an explicit path (not auto-included by vitest.config.ts):
 *   npx vitest run supabase/functions/ingest-macro-news-headlines/index.test.ts
 */
import { describe, it, expect, vi, afterAll, beforeEach } from 'vitest';

vi.mock('https://esm.sh/fast-xml-parser@4.3.2', () => ({
    XMLParser: class {
        parse() {
            return { rss: { channel: { item: [] } } };
        }
    },
}));

vi.mock('../_shared/logging.ts', () => ({
    logIngestionStart: vi.fn().mockResolvedValue('log-1'),
    logIngestionEnd: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../_shared/timeout-guard.ts', () => ({
    withTimeout: (p: Promise<unknown>) => p,
}));

vi.mock('../_shared/handler.ts', () => ({
    serveIngest: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({})),
}));

const originalFetch = globalThis.fetch;

beforeEach(() => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network disabled in test'));
});

afterAll(() => {
    globalThis.fetch = originalFetch;
});

import { doIngestMacroNewsHeadlines } from './index.ts';

describe('doIngestMacroNewsHeadlines', () => {
    it('resolves with a real upserted count instead of throwing on an undefined variable', async () => {
        const supabase = {
            from: () => ({
                upsert: () => Promise.resolve({ error: null }),
                delete: () => ({ lt: () => Promise.resolve({ error: null }) }),
            }),
        };
        const result = await doIngestMacroNewsHeadlines(supabase as any);
        expect(result).toEqual({ ok: true, counts: { upserted: 0 } });
    });

    it('rethrows the real error on failure, not a ReferenceError for undefined e/rows_inserted', async () => {
        // Force zero-article path to complete, then fail delete — actually better:
        // inject a throw after feeds by making logIngestionEnd success path OK and
        // delete throw via from() selecting table. Simpler: make from().delete().lt throw.
        const supabase = {
            from: (table: string) => {
                if (table === 'macro_news_headlines') {
                    return {
                        upsert: () => Promise.resolve({ error: null }),
                        delete: () => ({
                            lt: () => Promise.resolve({ error: null }),
                        }),
                    };
                }
                throw new Error('unexpected table ' + table);
            },
        };
        // Zero articles → success. To hit catch path, make logIngestionStart throw after... 
        // Use a proxy that throws when delete is chained after a successful zero-article run
        // is not the catch path. Force failure by making logIngestionEnd throw mid-success:
        // Actually: throw from from() delete lt:
        const failing = {
            from: () => ({
                upsert: () => Promise.resolve({ error: { message: 'boom' } }),
                delete: () => ({
                    lt: () => {
                        throw new Error('boom');
                    },
                }),
            }),
        };
        // With zero articles, upsert is skipped; delete still runs and throws "boom"
        await expect(doIngestMacroNewsHeadlines(failing as any)).rejects.toThrow('boom');
        await expect(doIngestMacroNewsHeadlines(failing as any)).rejects.not.toThrow(/is not defined/);
    });
});
