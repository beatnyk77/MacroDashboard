import { useMemo } from 'react';
import { useG20SovereignMatrix, G20MatrixPoint } from '@/hooks/useG20SovereignMatrix';
import { CohortGroup, BENCHMARK_METRICS, calculatePercentile, BenchmarkDistribution } from '@/config/benchmarksConfig';

export interface MacroBenchmarkResult {
    distributions: Record<string, BenchmarkDistribution>;
    isLoading: boolean;
    isError: boolean;
    getMetricCohortData: (metricId: string, cohort?: CohortGroup) => BenchmarkDistribution | null;
    getCountryRelativeRank: (countryCode: string, metricId: string, cohort?: CohortGroup) => {
        value: number;
        percentile: number;
        cohortMedian: number;
        diffFromMedian: number;
    } | null;
}

export function useMacroBenchmarks(activeCohort: CohortGroup = 'G20') {
    const { data: matrixData, isLoading, isError } = useG20SovereignMatrix();

    const distributions = useMemo(() => {
        if (!matrixData || !matrixData.length) return {};

        // Filter by cohort if not G20
        const cohortPoints = matrixData.filter(pt => {
            if (activeCohort === 'G20') return true;
            if (activeCohort === 'G7') return pt.region === 'G7';
            if (activeCohort === 'BRICS') return pt.region === 'BRICS';
            if (activeCohort === 'EM') return pt.region === 'BRICS' || pt.region === 'Other';
            return true;
        });

        const distMap: Record<string, BenchmarkDistribution> = {};

        for (const benchmarkMetric of BENCHMARK_METRICS) {
            const validPoints = cohortPoints.filter(p => typeof (p as any)[benchmarkMetric.id] === 'number' && !isNaN((p as any)[benchmarkMetric.id]));
            const values = validPoints.map(p => (p as any)[benchmarkMetric.id] as number);

            if (!values.length) continue;

            const sorted = [...values].sort((a, b) => a - b);
            const count = sorted.length;
            const sum = sorted.reduce((a, b) => a + b, 0);
            const mean = sum / count;
            const median = count % 2 === 0
                ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
                : sorted[Math.floor(count / 2)];
            const p25 = sorted[Math.floor(count * 0.25)] ?? sorted[0];
            const p75 = sorted[Math.floor(count * 0.75)] ?? sorted[count - 1];

            const rankings = validPoints.map(pt => {
                const val = (pt as any)[benchmarkMetric.id];
                return {
                    code: pt.code,
                    name: pt.name,
                    flag: pt.flag,
                    value: val,
                    percentile: calculatePercentile(val, values, benchmarkMetric.lowerIsBetter)
                };
            }).sort((a, b) => b.percentile - a.percentile);

            distMap[benchmarkMetric.id] = {
                metricId: benchmarkMetric.id,
                cohort: activeCohort,
                count,
                median,
                mean,
                p25,
                p75,
                min: sorted[0],
                max: sorted[count - 1],
                rankings
            };
        }

        return distMap;
    }, [matrixData, activeCohort]);

    const getMetricCohortData = (metricId: string, cohort: CohortGroup = activeCohort): BenchmarkDistribution | null => {
        return distributions[metricId] || null;
    };

    const getCountryRelativeRank = (countryCode: string, metricId: string, cohort: CohortGroup = activeCohort) => {
        const dist = distributions[metricId];
        if (!dist) return null;

        const rankEntry = dist.rankings.find(r => r.code.toUpperCase() === countryCode.toUpperCase());
        if (!rankEntry) return null;

        return {
            value: rankEntry.value,
            percentile: rankEntry.percentile,
            cohortMedian: dist.median,
            diffFromMedian: rankEntry.value - dist.median
        };
    };

    return {
        distributions,
        isLoading,
        isError,
        getMetricCohortData,
        getCountryRelativeRank
    };
}
