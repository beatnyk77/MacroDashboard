import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AssetClassAllocation {
    equity_pct: number;
    bond_pct: number;
    gold_pct: number;
    other_pct: number;
}

export interface HistoricalAllocationPoint {
    quarter: string;
    equity_pct: number;
    bond_pct: number;
    gold_pct: number;
    other_pct: number;
}

export interface TopHolding {
    cusip: string;
    ticker: string | null;
    name: string | null;
    value: number;
    sector: string | null;
    concentration_contribution: number;
}

export interface InstitutionalHolding {
    id: string;
    fund_name: string;
    fund_type: string;
    cik: string;
    total_aum: number;
    top_sectors: Record<string, number>;
    qoq_delta: number;
    as_of_date: string;
    last_updated: string;
    // New enriched fields
    asset_class_allocation: AssetClassAllocation;
    top_holdings: TopHolding[];
    concentration_score: number;
    sector_rotation_signal: 'ACCUMULATE' | 'REDUCE' | 'NEUTRAL';
    spy_comparison: number;
    tlt_comparison: number;
    gld_comparison: number;
    regime_z_score: number;
    historical_allocation: HistoricalAllocationPoint[];
}

export interface CollectiveSmartMoney {
    as_of_date: string;
    total_aum: number;
    avg_equity: number;
    avg_bond: number;
    avg_gold: number;
    avg_other: number;
    avg_regime_z: number;
    avg_concentration: number;
    institution_count: number;
    risk_signal: 'RISK_ON' | 'RISK_OFF' | 'NEUTRAL';
    regime_label: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export function useSmartMoneyHoldings() {
    // Fetch all institution holdings (ordered by AUM descending)
    const { data: institutions = [] } = useSuspenseQuery({
        queryKey: ['smart_money_institutions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('institutional_13f_holdings')
                .select('*')
                .order('total_aum', { ascending: false });

            if (error) throw error;
            return (data as any[]) as InstitutionalHolding[];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    // Fetch collective signals (single row)
    const { data: collective } = useSuspenseQuery({
        queryKey: ['smart_money_collective'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_smart_money_collective')
                .select('*')
                .single();

            if (error) throw error;
            return data as CollectiveSmartMoney;
        },
        staleTime: 1000 * 60 * 60,
    });

    // Derived: top 5 institutions by AUM (already sorted)
    const topInstitutions = institutions.slice(0, 8);

    // Derived: Get key institutions by name for cards
    const keyInstitutions = ['Norges Bank', 'GIC Private Ltd', 'Abu Dhabi Investment Authority', 'CPPIB', 'CalPERS'];
    const institutionCards = institutions
        .filter(inst => keyInstitutions.includes(inst.fund_name))
        .slice(0, 5); // Keep order consistent

    // Derived: aggregate top holdings across all institutions
    // Build a map: cusip/ticker -> holding data with total value
    const holdingMap = new Map<string, TopHolding & { totalValue: number }>();
    institutions.forEach(inst => {
        inst.top_holdings.forEach(h => {
            const key = h.ticker || h.cusip;
            if (!key) return;
            const existing = holdingMap.get(key);
            if (existing) {
                existing.totalValue += h.value;
                existing.concentration_contribution += h.concentration_contribution;
            } else {
                holdingMap.set(key, {
                    ...h,
                    totalValue: h.value,
                    concentration_contribution: h.concentration_contribution
                });
            }
        });
    });

    const aggregatedTopHoldings = Array.from(holdingMap.values())
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 15) // Top 15 overall
        .map(h => ({
            cusip: h.cusip,
            ticker: h.ticker,
            name: h.name,
            value: h.totalValue,
            sector: h.sector,
            concentration_contribution: h.concentration_contribution
        }));

    // Derived: sector rotation heatmap data with direction
    // Get all unique sectors from topInstitutions
    const allSectors = new Set<string>();
    topInstitutions.forEach(inst => {
        Object.keys(inst.top_sectors).forEach(s => allSectors.add(s));
    });
    const sectorsList = Array.from(allSectors).sort();

    // For each institution, compute per-sector delta vs previous quarter
    const heatmapData = topInstitutions.map(inst => {
        // Find previous quarter for this institution
        const prev = institutions.find(i => i.cik === inst.cik && i.as_of_date < inst.as_of_date) || null;
        const sectorsWithDelta: Record<string, { allocation: number; delta: number }> = {};
        Object.entries(inst.top_sectors).forEach(([sector, allocation]) => {
            const prevAllocation = prev?.top_sectors?.[sector] || 0;
            sectorsWithDelta[sector] = {
                allocation,
                delta: allocation - prevAllocation
            };
        });
        return {
            fund: inst.fund_name,
            type: inst.fund_type,
            sectors: sectorsWithDelta,
            regime_z: inst.regime_z_score
        };
    });

    // Derived: collective allocation history for stacked area chart (use the institution with longest history as proxy? Or we can combine)
    // We'll use the collective view if it had history, but it doesn't. So we'll take average of historical_allocation arrays across institutions
    // Build combined history: for each quarter present in any institution, compute average allocations
    const historyMap = new Map<string, { equity: number; bond: number; gold: number; other: number; count: number }>();
    institutions.forEach(inst => {
        inst.historical_allocation.forEach(point => {
            const existing = historyMap.get(point.quarter);
            if (existing) {
                existing.equity += point.equity_pct;
                existing.bond += point.bond_pct;
                existing.gold += point.gold_pct;
                existing.other += point.other_pct;
                existing.count++;
            } else {
                historyMap.set(point.quarter, {
                    equity: point.equity_pct,
                    bond: point.bond_pct,
                    gold: point.gold_pct,
                    other: point.other_pct,
                    count: 1
                });
            }
        });
    });

    const collectiveHistory = Array.from(historyMap.entries())
        .map(([quarter, data]) => ({
            quarter,
            equity_pct: data.equity / data.count,
            bond_pct: data.bond / data.count,
            gold_pct: data.gold / data.count,
            other_pct: data.other / data.count
        }))
        .sort((a, b) => a.quarter.localeCompare(b.quarter));

    // Format AUM helper
    const formatAUM = (value: number) => {
        if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
        if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
        return `$${value.toFixed(0)}`;
    };

    return {
        institutions,
        topInstitutions,
        institutionCards,
        collective: collective || null,
        aggregatedTopHoldings,
        sectorsList,
        heatmapData,
        collectiveHistory,
        formatAUM
    };
}
