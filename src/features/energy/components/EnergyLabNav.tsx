import React, { useState, useEffect, useRef } from 'react';

const SECTIONS = [
    { label: 'Regime', id: 'energy-regime' },
    { label: 'WTI Spread', id: 'wti-spread' },
    { label: 'Prices', id: 'commodity-prices' },
    { label: 'Sovereign Security', id: 'sovereign-security' },
    { label: 'Asia Flows', id: 'asia-flows' },
    { label: 'Refining', id: 'refining-imbalance' },
    { label: 'Fuel Clock', id: 'fuel-clock' },
    { label: 'Flows Terminal', id: 'flows-terminal' },
] as const;

export const EnergyLabNav: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [activeId, setActiveId] = useState<string>('');
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 300);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        observerRef.current?.disconnect();
        observerRef.current = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length > 0) setActiveId(visible[0].target.id);
            },
            { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
        );
        SECTIONS.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observerRef.current!.observe(el);
        });
        return () => observerRef.current?.disconnect();
    }, []);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div
            className="fixed top-[64px] left-0 right-0 z-40 flex justify-center pointer-events-none"
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(-8px)',
                transition: 'opacity 200ms ease, transform 200ms ease',
            }}
        >
            <div className="pointer-events-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                {SECTIONS.map(({ label, id }) => {
                    const isActive = activeId === id;
                    return (
                        <button
                            key={id}
                            onClick={() => scrollTo(id)}
                            className={[
                                'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] cursor-pointer transition-colors',
                                isActive
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                    : 'text-white/30 hover:text-white/60 border border-transparent',
                            ].join(' ')}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
