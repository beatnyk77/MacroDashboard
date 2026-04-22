import { useMemo } from 'react';
import { useNetLiquidity } from '../../hooks/useNetLiquidity';
import { useGoldRatios } from '../../hooks/useGoldRatios';
import { useUSDebtGoldBacking } from '../../hooks/useUSDebtGoldBacking';
import { useDeDollarization } from '../../hooks/useDeDollarization';
import { useRegime } from '../../hooks/useRegime';
import { useUSFiscalStress } from '../../hooks/useUSFiscalStress';
import { useUSTreasuryAuctions } from '../../hooks/useUSTreasuryAuctions';
import { useLatestMetric } from '../../hooks/useLatestMetric';

/**
 * LATEST_METRIC_MAP maps glossary slugs to generic metric IDs
 * used by the useLatestMetric hook.
 */
export const LATEST_METRIC_MAP: Record<string, string> = {
    'breakeven-inflation-rate': 'T10YIE',
    'yield-curve-control': 'BOJ_TOTAL_ASSETS_TRJPY',
    'standing-repo-facility-srf': 'FED_SRF_USAGE',
    'bank-term-funding-program-btfp': 'FED_BTFP_TOTAL',
    'excess-reserves': 'WRESBAL',
    'gold-oil-ratio': 'GOLD_OIL_RATIO',
    'copper-gold-ratio': 'HG1_GC1_RATIO',
    'real-interest-rates': 'REAINTRATREARAT10Y',
    'public-debt-to-gdp': 'GFDEGDQ188S',
    'central-bank-gold-purchases': 'CB_GOLD_RESERVES'
};

/**
 * useGlossaryDataHub
 * 
 * A centralized data orchestrator for the glossary.
 * Consolidates all macro telemetry hooks into a single interface.
 */
export const useGlossaryDataHub = (slug: string | undefined) => {
    // 1. Hook Invocation (Must be top-level)
    const { data: netLiquidity } = useNetLiquidity();
    const { data: goldRatios } = useGoldRatios();
    const { data: debtGold } = useUSDebtGoldBacking();
    const { data: deDollarization } = useDeDollarization();
    const { data: regime } = useRegime();
    const { data: fiscalStress } = useUSFiscalStress();
    const { data: auctions } = useUSTreasuryAuctions();
    
    const metricId = slug ? LATEST_METRIC_MAP[slug] : '';
    const { data: latestMetric } = useLatestMetric(metricId || '');

    // 2. Resolver Logic
    const resolvedData = useMemo(() => {
        if (!slug) return null;

        let rawData: any = null;
        let lastUpdated: string = '';

        if (slug === 'net-liquidity-z-score' || slug === 'tga' || slug === 'reverse-repo-facility-rrp' || slug === 'sofr') {
            rawData = netLiquidity;
            lastUpdated = netLiquidity?.as_of_date || '';
        } else if (slug === 'm2-gold-ratio') {
            rawData = goldRatios?.find(r => r.ratio_name === 'M2/Gold');
            lastUpdated = rawData?.last_updated || '';
        } else if (slug === 'gold-silver-ratio') {
            rawData = goldRatios?.find(r => r.ratio_name === 'Gold/Silver');
            lastUpdated = rawData?.last_updated || '';
        } else if (slug === 'debt-gold-z-score') {
            rawData = debtGold;
            lastUpdated = debtGold?.as_of_date || '';
        } else if (slug === 'de-dollarization' || slug === 'reserve-currency-composition') {
            rawData = deDollarization;
            lastUpdated = deDollarization?.usdShare?.as_of_date || '';
        } else if (slug === 'macro-regime-classification') {
            rawData = regime;
            lastUpdated = regime?.timestamp || '';
        } else if (slug === 'fiscal-dominance' || slug === 'fiscal-dominance-meter' || slug === 'interest-expense-to-tax-revenue') {
            rawData = fiscalStress?.[fiscalStress.length - 1];
            lastUpdated = rawData?.date || '';
        } else if (slug === 'bid-to-cover-ratio') {
            rawData = auctions?.[0];
            lastUpdated = rawData?.auction_date || '';
        } else if (metricId) {
            rawData = latestMetric;
            lastUpdated = latestMetric?.lastUpdated || '';
        }

        return { rawData, lastUpdated, metricId };
    }, [slug, netLiquidity, goldRatios, debtGold, deDollarization, regime, fiscalStress, auctions, latestMetric, metricId]);

    return resolvedData;
};
