import React, { lazy, Suspense } from 'react';

const M2GoldRatioExplorer = lazy(() =>
    import('@/components/engagement/M2GoldRatioExplorer').then((m) => ({ default: m.M2GoldRatioExplorer }))
);
const BreakevenExplorer = lazy(() =>
    import('@/components/engagement/BreakevenExplorer').then((m) => ({ default: m.BreakevenExplorer }))
);

const EXPLORER_SLUGS: Record<string, React.LazyExoticComponent<React.FC<{ className?: string }>>> = {
    'm2-gold-ratio': M2GoldRatioExplorer,
    'breakeven-inflation-rate': BreakevenExplorer,
};

interface GlossaryInteractiveToolsProps {
    slug: string;
    className?: string;
}

export const GlossaryInteractiveTools: React.FC<GlossaryInteractiveToolsProps> = ({ slug, className }) => {
    const Explorer = EXPLORER_SLUGS[slug];
    if (!Explorer) return null;

    return (
        <Suspense
            fallback={
                <div className="h-32 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]" />
            }
        >
            <Explorer className={className} />
        </Suspense>
    );
};