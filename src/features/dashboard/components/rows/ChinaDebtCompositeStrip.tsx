import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CompositeIndexCard } from '@/features/dashboard/components/sections/CompositeIndexCard';
import { useChinaDebtComposites, useLatestChinaDebtComposites } from '@/hooks/useChinaDebt';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { BookOpen } from 'lucide-react';

const COMPOSITE_CONFIG = [
    {
        id: 'CN_ICEBERG_RATIO',
        metricId: MID.CN_ICEBERG_RATIO,
        title: 'Iceberg Ratio',
        formula: 'Consolidated debt (high) ÷ official central debt',
        sources: ['IMF WEO', 'IMF Article IV'],
        description: 'Measures how much larger the true public sector balance sheet is versus MoF-reported central government debt. Above 2.0× signals significant shadow debt accumulation.',
        suffix: '×',
        directionality: 'Higher = more hidden leverage',
        statusFn: (v: number) => v > 2.5 ? 'danger' as const : v > 2.0 ? 'warning' as const : 'safe' as const,
    },
    {
        id: 'CN_LGFV_STRESS_INDEX',
        metricId: MID.CN_LGFV_STRESS_INDEX,
        title: 'LGFV Stress Index',
        formula: '0.6×LGFV level + 3×ΔLGFV + fiscal deficit penalty',
        sources: ['IMF Article IV', 'IMF WEO'],
        description: 'Composite proxy for local government financing vehicle distress. Tracks LGFV layer growth and fiscal balance deterioration until bond-level spreads are available.',
        suffix: '',
        directionality: '0–100 scale; above 60 = elevated stress',
        statusFn: (v: number) => v > 65 ? 'danger' as const : v > 45 ? 'warning' as const : 'safe' as const,
    },
    {
        id: 'CN_MONETIZATION_PRESSURE',
        metricId: MID.CN_MONETIZATION_PRESSURE,
        title: 'Monetization Pressure',
        formula: '8×(M2 growth − GDP growth) + credit/GDP component',
        sources: ['PBOC', 'FRED', 'BIS'],
        description: 'Detects quasi-fiscal monetary financing. Above 60 indicates fiscal dominance risk zone where independent monetary tightening becomes constrained.',
        suffix: '',
        directionality: '0–100 scale; above 60 = fiscal dominance zone',
        statusFn: (v: number) => v > 60 ? 'danger' as const : v > 40 ? 'warning' as const : 'safe' as const,
    },
    {
        id: 'CN_DEBT_WALL_PROXIMITY',
        metricId: MID.CN_DEBT_WALL_PROXIMITY,
        title: 'Debt Wall Proximity',
        formula: 'LGFV maturities ÷ estimated refinancing capacity',
        sources: ['IMF Article IV', 'BIS credit data'],
        description: 'Rolling proxy for LGFV rollover crisis risk. Above 80% signals refinancing capacity may be insufficient for near-term maturity wall.',
        suffix: '',
        directionality: '0–100 scale; above 80 = rollover crisis risk',
        statusFn: (v: number) => v > 80 ? 'danger' as const : v > 60 ? 'warning' as const : 'safe' as const,
    },
    {
        id: 'CN_LAND_FISCAL_DEPENDENCE',
        metricId: MID.CN_LAND_FISCAL_DEPENDENCE,
        title: 'Land Fiscal Dependence',
        formula: 'Land sale revenue ÷ total local government revenue',
        sources: ['IMF Article IV', 'NBS', 'MoF'],
        description: 'Tracks the fiscal cliff from land sales collapse. Was 40%+ in 2021; now ~20%. Below 20% signals structural LG revenue shortfall.',
        suffix: '%',
        directionality: 'Lower = more fiscal stress from land dependency unwind',
        statusFn: (v: number) => v < 18 ? 'danger' as const : v < 25 ? 'warning' as const : 'safe' as const,
    },
];

function useCompositeMetricFallback(metricId: string) {
    const { data } = useLatestMetric(metricId);
    return data?.value;
}

export const ChinaDebtCompositeStrip: React.FC = () => {
    const { data: composites, isLoading } = useLatestChinaDebtComposites();
    const { data: allComposites } = useChinaDebtComposites();

    const icebergFallback = useCompositeMetricFallback(MID.CN_ICEBERG_RATIO);
    const lgfvFallback = useCompositeMetricFallback(MID.CN_LGFV_STRESS_INDEX);
    const monetFallback = useCompositeMetricFallback(MID.CN_MONETIZATION_PRESSURE);
    const wallFallback = useCompositeMetricFallback(MID.CN_DEBT_WALL_PROXIMITY);
    const landFallback = useCompositeMetricFallback(MID.CN_LAND_FISCAL_DEPENDENCE);

    const metricFallbacks: Record<string, number | undefined> = {
        CN_ICEBERG_RATIO: icebergFallback,
        CN_LGFV_STRESS_INDEX: lgfvFallback,
        CN_MONETIZATION_PRESSURE: monetFallback,
        CN_DEBT_WALL_PROXIMITY: wallFallback,
        CN_LAND_FISCAL_DEPENDENCE: landFallback,
    };

    const historyById = useMemo(() => {
        const map: Record<string, { date: string; value: number }[]> = {};
        allComposites?.forEach(row => {
            if (!map[row.composite_id]) map[row.composite_id] = [];
            map[row.composite_id].push({ date: row.as_of_date, value: row.value });
        });
        Object.values(map).forEach(arr => arr.sort((a, b) => a.date.localeCompare(b.date)));
        return map;
    }, [allComposites]);

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-uppercase italic mb-1">
                        GraphiQuestor Proprietary Debt Signals
                    </h3>
                    <p className="text-xs text-muted-foreground/60">
                        Five composite indices — live inputs from IMF/BIS/PBOC, refreshed weekly
                    </p>
                </div>
                <Link
                    to="/methods/china-debt-iceberg"
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400/70 hover:text-amber-300 shrink-0"
                >
                    <BookOpen size={12} />
                    Methodology
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {COMPOSITE_CONFIG.map(cfg => {
                    const composite = composites?.[cfg.id];
                    const value = composite?.value ?? metricFallbacks[cfg.id];
                    return (
                        <CompositeIndexCard
                            key={cfg.id}
                            title={cfg.title}
                            value={value}
                            formula={cfg.formula}
                            sources={cfg.sources}
                            status={value != null ? cfg.statusFn(value) : 'neutral'}
                            suffix={cfg.suffix}
                            description={cfg.description}
                            isLoading={isLoading}
                            directionality={cfg.directionality}
                            history={historyById[cfg.id]?.map(h => ({ date: h.date, value: h.value }))}
                        />
                    );
                })}
            </div>
        </div>
    );
};