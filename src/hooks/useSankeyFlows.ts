import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getMetricLabel } from '@/lib/metricLabels';

export interface SankeyNode {
    index: number;
    name: string;
    category: 'capital_flows' | 'inflation_regime' | 'balance_of_payments' | 'housing_cycle' | 'activity_regime' | 'labor_market';
    color: string;
    value?: number;
    unit?: string;
    z_score?: number;
    change?: number;
    change_period?: string;
}

export interface SankeyLink {
    source: number;
    target: number;
    value: number;
}

export interface SankeyFlowData {
    nodes: SankeyNode[];
    links: SankeyLink[];
    last_updated: string;
}

const CATEGORY_COLORS = {
    capital_flows: '#3b82f6',      // Blue
    inflation_regime: '#f97316',   // Orange
    balance_of_payments: '#8b5cf6', // Purple
    housing_cycle: '#ef4444',      // Red
    activity_regime: '#10b981',    // Green
    labor_market: '#f59e0b'        // Amber
};

export function useSankeyFlows() {
    return useQuery({
        queryKey: ['sankey-flows'],
        queryFn: async (): Promise<SankeyFlowData> => {
            // Define all source and sink node metric IDs
            const nodeMetrics = [
                // Capital Flows
                'CAPITAL_FROM_TREASURIES_BN',
                'CAPITAL_FROM_EM_DEBT_BN',
                'CAPITAL_FROM_GOLD_ETF_BN',
                'CAPITAL_FROM_EQUITY_ETF_BN',
                'FLOW_TO_RISK_ASSETS',
                'FLOW_TO_SAFE_HAVENS',

                // Inflation Regime
                'INFLATION_HEADLINE_YOY',
                'INFLATION_CORE_YOY',
                'INFLATION_BREAKEVEN_5Y',
                'INFLATION_EXPECTATIONS_UM',
                'INFLATION_REGIME_SCORE',

                // Balance of Payments
                'BOP_CURRENT_ACCOUNT_GDP',
                'BOP_RESERVES_MONTHS',
                'BOP_SHORT_TERM_DEBT_GDP',
                'BOP_VULNERABILITY_SCORE',

                // Housing Cycle
                'HOUSING_PRICE_INDEX',
                'HOUSING_MEDIAN_INCOME_RATIO',
                'HOUSING_MORTGAGE_RATE_30Y',
                'HOUSING_REGIME_SCORE',

                // Activity Regime
                'PMI_US_MFG',
                'PMI_US_SERVICES',
                'PMI_EA_COMPOSITE_PROXY',
                'ACTIVITY_REGIME_SCORE',

                // Labor Market
                'LABOR_VACANCIES_JOLTS',
                'LABOR_UNEMPLOYMENT_RATE',
                'LABOR_WAGE_GROWTH_YOY',
                'LABOR_TIGHTNESS_SCORE'
            ];

            // Fetch latest values for all metrics
            const { data: metricsData, error: metricsError } = await supabase
                .from('vw_latest_metrics')
                .select('*')
                .in('metric_id', nodeMetrics);

            if (metricsError) throw metricsError;

            // Build node index map and nodes array
            const nodeMap = new Map<string, { index: number; data: any }>();
            const nodes: SankeyNode[] = [];

            nodeMetrics.forEach((metricId, idx) => {
                const metric = metricsData?.find(m => m.metric_id === metricId);
                let rawCategory = metric?.category || 'capital_flows';

                // Consistency fix: Normalize category string to match CATEGORY_COLORS keys
                const category = rawCategory.toLowerCase().replace(/\s+/g, '_') as SankeyNode['category'];

                nodeMap.set(metricId, {
                    index: idx,
                    data: metric
                });

                nodes.push({
                    index: idx,
                    name: getMetricLabel(metricId),
                    category: category as SankeyNode['category'],
                    color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6b7280',
                    // Pass through raw data for card display
                    value: metric?.value,
                    unit: metric?.unit,
                    z_score: metric?.z_score,
                    change: metric?.delta_qoq || metric?.delta_yoy,
                    change_period: metric?.delta_qoq ? 'QoQ' : 'YoY'
                });
            });

            // Define flow links (source -> target with magnitude)
            const links: SankeyLink[] = [];

            // Helper to add link
            const addLink = (sourceId: string, targetId: string, valueMetricId?: string) => {
                const source = nodeMap.get(sourceId);
                const target = nodeMap.get(targetId);

                if (!source || !target) return;

                // Use value from valueMetricId if provided, otherwise from source
                const valueSource = valueMetricId ? nodeMap.get(valueMetricId)?.data : source.data;
                const value = Math.abs(Number(valueSource?.value || 0));

                if (value > 0) {
                    links.push({
                        source: source.index,
                        target: target.index,
                        value
                    });
                }
            };

            // Capital Flows links
            addLink('CAPITAL_FROM_TREASURIES_BN', 'FLOW_TO_SAFE_HAVENS');
            addLink('CAPITAL_FROM_GOLD_ETF_BN', 'FLOW_TO_SAFE_HAVENS');
            addLink('CAPITAL_FROM_EM_DEBT_BN', 'FLOW_TO_RISK_ASSETS');
            addLink('CAPITAL_FROM_EQUITY_ETF_BN', 'FLOW_TO_RISK_ASSETS');

            // Inflation Regime links
            addLink('INFLATION_HEADLINE_YOY', 'INFLATION_REGIME_SCORE');
            addLink('INFLATION_CORE_YOY', 'INFLATION_REGIME_SCORE');
            addLink('INFLATION_BREAKEVEN_5Y', 'INFLATION_REGIME_SCORE');
            addLink('INFLATION_EXPECTATIONS_UM', 'INFLATION_REGIME_SCORE');

            // BOP links
            addLink('BOP_CURRENT_ACCOUNT_GDP', 'BOP_VULNERABILITY_SCORE');
            addLink('BOP_RESERVES_MONTHS', 'BOP_VULNERABILITY_SCORE');
            addLink('BOP_SHORT_TERM_DEBT_GDP', 'BOP_VULNERABILITY_SCORE');

            // Housing links
            addLink('HOUSING_PRICE_INDEX', 'HOUSING_REGIME_SCORE');
            addLink('HOUSING_MEDIAN_INCOME_RATIO', 'HOUSING_REGIME_SCORE');
            addLink('HOUSING_MORTGAGE_RATE_30Y', 'HOUSING_REGIME_SCORE');

            // Activity Regime links
            addLink('PMI_US_MFG', 'ACTIVITY_REGIME_SCORE');
            addLink('PMI_US_SERVICES', 'ACTIVITY_REGIME_SCORE');
            addLink('PMI_EA_COMPOSITE_PROXY', 'ACTIVITY_REGIME_SCORE');

            // Labor Market links
            addLink('LABOR_VACANCIES_JOLTS', 'LABOR_TIGHTNESS_SCORE');
            addLink('LABOR_UNEMPLOYMENT_RATE', 'LABOR_TIGHTNESS_SCORE');
            addLink('LABOR_WAGE_GROWTH_YOY', 'LABOR_TIGHTNESS_SCORE');

            const lastUpdated = metricsData?.reduce((latest, m) => {
                const mDate = new Date(m.as_of_date || 0);
                return mDate > latest ? mDate : latest;
            }, new Date(0));

            return {
                nodes,
                links,
                last_updated: lastUpdated?.toISOString() || new Date().toISOString()
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
