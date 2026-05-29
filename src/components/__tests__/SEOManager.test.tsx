import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { render, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SEOManager } from '@/components/SEOManager';

// react-helmet-async defers DOM writes via requestAnimationFrame.
// jsdom doesn't auto-advance rAF, so we replace it with a synchronous
// implementation so that Helmet flushes immediately inside act().
beforeAll(() => {
    (window as any).requestAnimationFrame = (cb: (timestamp: number) => void) => {
        cb(0);
        return 0;
    };
    (window as any).cancelAnimationFrame = () => {};
});

afterEach(() => {
    // Reset head so canonical links don't bleed between tests
    document.head.innerHTML = '';
});

async function renderSEOManager(path: string, canonicalUrl?: string) {
    await act(async () => {
        render(
            <HelmetProvider>
                <MemoryRouter initialEntries={[path]}>
                    <SEOManager
                        title="Test"
                        description="Test description"
                        canonicalUrl={canonicalUrl}
                    />
                </MemoryRouter>
            </HelmetProvider>
        );
    });
    return document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
}

describe('SEOManager canonical URL', () => {
    it('root path "/" stays as https://graphiquestor.com/', async () => {
        const link = await renderSEOManager('/');
        expect(link?.href).toBe('https://graphiquestor.com/');
    });

    it('path without trailing slash is unchanged', async () => {
        const link = await renderSEOManager('/about');
        expect(link?.href).toBe('https://graphiquestor.com/about');
    });

    it('path with trailing slash is normalized to no-slash canonical', async () => {
        const link = await renderSEOManager('/about/');
        expect(link?.href).toBe('https://graphiquestor.com/about');
    });

    it('multi-segment path with trailing slash is normalized', async () => {
        const link = await renderSEOManager('/labs/us-macro-fiscal/');
        expect(link?.href).toBe('https://graphiquestor.com/labs/us-macro-fiscal');
    });

    it('dynamic segment path with trailing slash is normalized', async () => {
        const link = await renderSEOManager('/countries/IN/');
        expect(link?.href).toBe('https://graphiquestor.com/countries/IN');
    });

    it('explicit canonicalUrl prop overrides auto-generation entirely', async () => {
        const link = await renderSEOManager('/about/', 'https://graphiquestor.com/about');
        expect(link?.href).toBe('https://graphiquestor.com/about');
    });

    it('embed-mode path (no trailing slash) generates correct canonical', async () => {
        // ?embed=true is a query param — location.pathname excludes it
        const link = await renderSEOManager('/tools/net-liquidity-gauge');
        expect(link?.href).toBe('https://graphiquestor.com/tools/net-liquidity-gauge');
    });
});
