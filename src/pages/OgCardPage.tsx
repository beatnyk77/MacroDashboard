import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SEOManager } from '@/components/SEOManager';
import { BrandConfig } from '@/config/brandConfig';

/**
 * OgCardPage — fixed 1200×630 social card rendered at /og-card/:kind/:slug.
 *
 * Never linked from the UI and excluded from the sitemap/prerender crawl;
 * it exists solely for scripts/prerender.mjs to screenshot into dist/og/*.png,
 * which content pages reference via SEOManager's ogImage prop.
 *
 * Kinds:
 *   brief     — slug = YYYY-MM-DD  → daily_macro_briefs
 *   digest    — slug = YYYY-MM     → monthly_regime_digests
 *   narrative — slug = YYYY-MM-DD  → weekly_regime_digests
 *
 * The card sets data-og-ready="true" once its query settles so the
 * screenshot step knows when it is safe to capture.
 */

interface CardData {
    kicker: string;
    headline: string;
    body: string;
    dateLabel: string;
    regimeLabel?: string | null;
    regimeScore?: number | null;
}

function formatDateLabel(iso: string): string {
    const d = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function useOgCardData(kind?: string, slug?: string) {
    return useQuery({
        queryKey: ['og-card', kind, slug],
        staleTime: Infinity,
        retry: 1,
        queryFn: async (): Promise<CardData | null> => {
            if (!kind || !slug) return null;

            if (kind === 'brief') {
                const { data } = await supabase
                    .from('daily_macro_briefs')
                    .select('brief_date, regime_label, regime_score, content')
                    .eq('brief_date', slug)
                    .order('generated_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (!data) return null;
                const content = data.content as { regime_status?: string } | null;
                return {
                    kicker: 'Morning Macro Brief',
                    headline: content?.regime_status?.trim() || 'Daily institutional macro intelligence',
                    body: 'Regime signals across India, US, and global macro — liquidity, rates, dollar, metals.',
                    dateLabel: formatDateLabel(data.brief_date),
                    regimeLabel: data.regime_label,
                    regimeScore: data.regime_score,
                };
            }

            if (kind === 'digest') {
                const { data } = await supabase
                    .from('monthly_regime_digests')
                    .select('year_month, subject_line, plain_text')
                    .eq('year_month', slug)
                    .maybeSingle();
                if (!data) return null;
                return {
                    kicker: 'Monthly Regime Digest',
                    headline: data.subject_line || `Macro Regime Digest — ${slug}`,
                    body: (data.plain_text || '').slice(0, 160),
                    dateLabel: slug,
                };
            }

            if (kind === 'narrative') {
                const { data } = await supabase
                    .from('weekly_regime_digests')
                    .select('week_ending_date, executive_summary')
                    .eq('week_ending_date', slug)
                    .maybeSingle();
                if (!data) return null;
                return {
                    kicker: 'Weekly Macro Narrative',
                    headline: (data.executive_summary || '').slice(0, 140) || 'Weekly macro regime intelligence',
                    body: 'Global liquidity, sovereign risk, and de-dollarization dynamics — the week in structural macro.',
                    dateLabel: `Week ending ${formatDateLabel(data.week_ending_date)}`,
                };
            }

            return null;
        },
    });
}

function regimeColor(label?: string | null): string {
    const l = (label || '').toUpperCase();
    if (l.includes('RISK_ON') || l.includes('RISK ON')) return '#22c55e';
    if (l.includes('RISK_OFF') || l.includes('RISK OFF')) return '#ef4444';
    return '#f59e0b';
}

export const OgCardPage: React.FC = () => {
    const { kind, slug } = useParams<{ kind: string; slug: string }>();
    const { data, isFetched } = useOgCardData(kind, slug);

    const headline = data?.headline ?? 'Global Macro Intelligence Terminal';
    const truncatedHeadline = headline.length > 120 ? `${headline.slice(0, 117)}…` : headline;

    return (
        <>
            <SEOManager
                title="Social Card"
                description="Internal social-card render target."
                robots="noindex, nofollow"
            />
            <div
                data-og-ready={isFetched ? 'true' : 'false'}
                style={{
                    position: 'fixed',
                    inset: 0,
                    width: 1200,
                    height: 630,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '64px 72px',
                    boxSizing: 'border-box',
                    background: 'radial-gradient(ellipse at top left, #0c1a33 0%, #05080f 60%, #030509 100%)',
                    color: '#ffffff',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    zIndex: 9999,
                }}
            >
                {/* Top row: brand + regime badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                        <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.03em' }}>
                            <span style={{ color: BrandConfig.colors.primary }}>{BrandConfig.namePrefix}</span>
                            {BrandConfig.nameSuffix}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.35)' }}>
                            Macro Terminal
                        </span>
                    </div>
                    {data?.regimeLabel && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                                padding: '14px 26px',
                                borderRadius: 16,
                                border: `2px solid ${regimeColor(data.regimeLabel)}55`,
                                background: `${regimeColor(data.regimeLabel)}14`,
                            }}
                        >
                            <span style={{ width: 14, height: 14, borderRadius: '50%', background: regimeColor(data.regimeLabel) }} />
                            <span style={{ fontSize: 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: regimeColor(data.regimeLabel) }}>
                                {data.regimeLabel.replace(/_/g, ' ')}
                                {typeof data.regimeScore === 'number' ? ` · ${Math.round(data.regimeScore)}` : ''}
                            </span>
                        </div>
                    )}
                </div>

                {/* Middle: kicker + headline */}
                <div style={{ maxWidth: 1020 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3em', color: BrandConfig.colors.primary, marginBottom: 22 }}>
                        {data?.kicker ?? 'Macro Intelligence'}
                    </div>
                    <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                        {truncatedHeadline}
                    </div>
                    {data?.body && (
                        <div style={{ fontSize: 24, lineHeight: 1.45, color: 'rgba(255,255,255,0.55)', marginTop: 24, maxWidth: 900 }}>
                            {data.body.length > 140 ? `${data.body.slice(0, 137)}…` : data.body}
                        </div>
                    )}
                </div>

                {/* Bottom row: date + domain */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 28 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {data?.dateLabel ?? ''}
                    </span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: BrandConfig.colors.primary, letterSpacing: '0.02em' }}>
                        {BrandConfig.domain}
                    </span>
                </div>
            </div>
        </>
    );
};
