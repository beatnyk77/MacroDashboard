import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
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
    cleanup();
    document.querySelectorAll('link[rel="canonical"]').forEach(el => el.remove());
    document.querySelectorAll('title').forEach(el => el.remove());
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

    it('path without trailing slash gains trailing slash canonical', async () => {
        const link = await renderSEOManager('/about');
        expect(link).not.toBeNull();
        expect(link!.href).toBe('https://graphiquestor.com/about/');
    });

    it('path with trailing slash keeps trailing slash canonical', async () => {
        const link = await renderSEOManager('/about/');
        expect(link).not.toBeNull();
        expect(link!.href).toBe('https://graphiquestor.com/about/');
    });

    it('multi-segment path with trailing slash is preserved', async () => {
        const link = await renderSEOManager('/labs/us-macro-fiscal/');
        expect(link).not.toBeNull();
        expect(link!.href).toBe('https://graphiquestor.com/labs/us-macro-fiscal/');
    });

    it('dynamic segment path with trailing slash is preserved', async () => {
        const link = await renderSEOManager('/countries/IN/');
        expect(link).not.toBeNull();
        expect(link!.href).toBe('https://graphiquestor.com/countries/IN/');
    });

    it('glossary path canonical includes trailing slash', async () => {
        const link = await renderSEOManager('/glossary/net-liquidity-z-score/');
        expect(link).not.toBeNull();
        expect(link!.href).toBe('https://graphiquestor.com/glossary/net-liquidity-z-score/');
    });

    it('explicit canonicalUrl prop overrides auto-generation entirely', async () => {
        const link = await renderSEOManager('/about/', 'https://graphiquestor.com/about/');
        expect(link).not.toBeNull();
        expect(link!.href).toBe('https://graphiquestor.com/about/');
    });

    it('explicit canonical path override is normalized to trailing slash', async () => {
        const link = await renderSEOManager('/about/', '/methods/net-liquidity-z-score');
        expect(link).not.toBeNull();
        expect(link!.href).toBe('https://graphiquestor.com/methods/net-liquidity-z-score/');
    });

    it('embed-mode path (no trailing slash) generates trailing-slash canonical', async () => {
        const link = await renderSEOManager('/tools/net-liquidity-gauge');
        expect(link).not.toBeNull();
        expect(link!.href).toBe('https://graphiquestor.com/tools/net-liquidity-gauge/');
    });
});

describe('DefaultSEO — router-level canonical fallback', () => {
    it('(a) route with no SEOManager renders exactly one self-referencing canonical', async () => {
        await act(async () => {
            render(
                <HelmetProvider>
                    <MemoryRouter initialEntries={['/intel/india/']}>
                        <DefaultSEO />
                    </MemoryRouter>
                </HelmetProvider>
            );
        });
        const links = document.querySelectorAll('link[rel="canonical"]');
        expect(links).toHaveLength(1);
        expect((links[0] as HTMLLinkElement).href).toBe('https://graphiquestor.com/intel/india/');
    });

    it('(b) route with SEOManager: page canonical wins, exactly one canonical tag', async () => {
        await act(async () => {
            render(
                <HelmetProvider>
                    <MemoryRouter initialEntries={['/intel/india/']}>
                        <DefaultSEO />
                        <SEOManager
                            title="India Macro"
                            description="India macro intelligence"
                            canonicalUrl="https://graphiquestor.com/intel/india/"
                        />
                    </MemoryRouter>
                </HelmetProvider>
            );
        });
        const links = document.querySelectorAll('link[rel="canonical"]');
        expect(links).toHaveLength(1);
        expect((links[0] as HTMLLinkElement).href).toBe('https://graphiquestor.com/intel/india/');
    });

    it('(c) layout mode emits canonical only (no title)', async () => {
        await act(async () => {
            render(
                <HelmetProvider>
                    <MemoryRouter initialEntries={['/glossary/foo/']}>
                        <SEOManager mode="layout" />
                    </MemoryRouter>
                </HelmetProvider>
            );
        });
        const links = document.querySelectorAll('link[rel="canonical"]');
        expect(links).toHaveLength(1);
        expect((links[0] as HTMLLinkElement).href).toBe('https://graphiquestor.com/glossary/foo/');
        expect(document.querySelector('title')).toBeNull();
    });
});