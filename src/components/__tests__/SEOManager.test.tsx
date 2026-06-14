import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import { render, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SEOManager } from '@/components/SEOManager';
import { DefaultSEO } from '@/components/DefaultSEO';

// react-helmet-async defers DOM writes via requestAnimationFrame.
// jsdom doesn't auto-advance rAF, so we replace it with a synchronous
// implementation so that Helmet flushes immediately inside act().
let originalRAF: typeof window.requestAnimationFrame;

beforeAll(() => {
    originalRAF = window.requestAnimationFrame;
    (window as any).requestAnimationFrame = (cb: (timestamp: number) => void) => {
        cb(0);
        return 0;
    };
    (window as any).cancelAnimationFrame = () => {};
});

afterAll(() => {
    window.requestAnimationFrame = originalRAF;
});

afterEach(() => {
    // Remove only canonical link elements so other head tags are unaffected
    document.querySelectorAll('link[rel="canonical"]').forEach(el => el.remove());
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
        expect(link).not.toBeNull();
        expect(link!.href).toBe('https://graphiquestor.com/');
    });

    it('path without trailing slash is unchanged', async () => {
        const link = await renderSEOManager('/about');
        expect(link).not.toBeNull();
        expect(link!.href).toBe('https://graphiquestor.com/about');
    });

    it('path with trailing slash is normalized to no-slash canonical', async () => {
        const link = await renderSEOManager('/about/');
        expect(link).not.toBeNull();
        expect(link!.href).toBe('https://graphiquestor.com/about');
    });

    it('multi-segment path with trailing slash is normalized', async () => {
        const link = await renderSEOManager('/labs/us-macro-fiscal/');
        expect(link).not.toBeNull();
        expect(link!.href).toBe('https://graphiquestor.com/labs/us-macro-fiscal');
    });

    it('dynamic segment path with trailing slash is normalized', async () => {
        const link = await renderSEOManager('/countries/IN/');
        expect(link).not.toBeNull();
        expect(link!.href).toBe('https://graphiquestor.com/countries/IN');
    });

    it('explicit canonicalUrl prop overrides auto-generation entirely', async () => {
        const link = await renderSEOManager('/about/', 'https://graphiquestor.com/about');
        expect(link).not.toBeNull();
        expect(link!.href).toBe('https://graphiquestor.com/about');
    });

    it('embed-mode path (no trailing slash) generates correct canonical', async () => {
        // ?embed=true is a query param — location.pathname excludes it
        const link = await renderSEOManager('/tools/net-liquidity-gauge');
        expect(link).not.toBeNull();
        expect(link!.href).toBe('https://graphiquestor.com/tools/net-liquidity-gauge');
    });
});

describe('DefaultSEO — router-level canonical fallback', () => {
    it('(a) route with no SEOManager renders exactly one self-referencing canonical', async () => {
        await act(async () => {
            render(
                <HelmetProvider>
                    <MemoryRouter initialEntries={['/intel/india']}>
                        <DefaultSEO />
                        {/* No SEOManager — simulates the 39 pages that omit it */}
                    </MemoryRouter>
                </HelmetProvider>
            );
        });
        const links = document.querySelectorAll('link[rel="canonical"]');
        expect(links).toHaveLength(1);
        expect((links[0] as HTMLLinkElement).href).toBe('https://graphiquestor.com/intel/india');
    });

    it('(b) route with SEOManager: page canonical wins, exactly one canonical tag', async () => {
        // DefaultSEO is mounted first (layout level); SEOManager is mounted second
        // (page level). react-helmet-async last-mounted-wins means SEOManager's
        // canonical must be the one that survives.
        await act(async () => {
            render(
                <HelmetProvider>
                    <MemoryRouter initialEntries={['/intel/india']}>
                        <DefaultSEO />
                        <SEOManager
                            title="India Macro"
                            description="India macro intelligence"
                            canonicalUrl="https://graphiquestor.com/intel/india"
                        />
                    </MemoryRouter>
                </HelmetProvider>
            );
        });
        const links = document.querySelectorAll('link[rel="canonical"]');
        expect(links).toHaveLength(1);
        expect((links[0] as HTMLLinkElement).href).toBe('https://graphiquestor.com/intel/india');
    });
});
