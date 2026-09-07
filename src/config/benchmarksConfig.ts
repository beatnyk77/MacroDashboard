/**
 * Cohort Benchmarks Configuration
 * Groupings, decile computations, and peer relative analysis for G20 economies.
 */

export type CohortGroup = 'G20' | 'G7' | 'BRICS' | 'EM';

export interface CohortBenchmarkMetric {
    id: string;
    label: string;
    unit: string;
    lowerIsBetter?: boolean;
    description: string;
}

export const BENCHMARK_METRICS: CohortBenchmarkMetric[] = [
    {
        id: 'debtGdpPct',
        label: 'Gross Debt / GDP',
        unit: '%',
        lowerIsBetter: true,
        description: 'General government gross debt as a percentage of nominal GDP.'
    },
    {
        id: 'gdpGrowthPct',
        label: 'Real GDP Growth YoY',
        unit: '%',
        lowerIsBetter: false,
        description: 'Year-over-year percentage change in constant-price gross domestic product.'
    },
    {
        id: 'nominalGdpUsd',
        label: 'Nominal GDP',
        unit: '$B',
        lowerIsBetter: false,
        description: 'Current price gross domestic product in billions of USD.'
    },
    {
        id: 'goldTonnes',
        label: 'Official Gold Reserves',
        unit: 'Tonnes',
        lowerIsBetter: false,
        description: 'Sovereign central bank officially declared gold holdings in metric tonnes.'
    },
    {
        id: 'debtGoldRatio',
        label: 'Sovereign Debt / Gold Backing',
        unit: 'Ratio',
        lowerIsBetter: true,
        description: 'Gross sovereign debt relative to the market valuation of official central bank gold reserves.'
    }
];

export interface BenchmarkDistribution {
    metricId: string;
    cohort: CohortGroup;
    count: number;
    median: number;
    mean: number;
    p25: number;
    p75: number;
    min: number;
    max: number;
    rankings: {
        code: string;
        name: string;
        flag: string;
        value: number;
        percentile: number;
    }[];
}

/**
 * Calculates percentile rank of a value in an array (0 - 100)
 */
export function calculatePercentile(value: number, allValues: number[], lowerIsBetter = false): number {
    if (!allValues.length) return 50;
    const sorted = [...allValues].sort((a, b) => a - b);
    const countBelow = sorted.filter(v => v < value).length;
    const rawPercentile = (countBelow / sorted.length) * 100;
    return lowerIsBetter ? Math.round(100 - rawPercentile) : Math.round(rawPercentile);
}
