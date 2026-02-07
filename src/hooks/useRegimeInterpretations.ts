import { useRegime } from './useRegime';

export const useRegimeInterpretations = (sectionId: string) => {
    const { data: regime } = useRegime();
    const label = regime?.regimeLabel?.toLowerCase() || 'neutral';

    const getInterpretations = () => {
        switch (sectionId) {
            case 'heartbeat':
                if (label.includes('expansion')) return [
                    "Liquidity breadth is high; pro-cyclical sectors favored.",
                    "Credit spreads narrowing; risk appetite remains anchored.",
                    "Monetary signals indicating 'Goldilocks' conditions."
                ];
                if (label.includes('tightening')) return [
                    "Liquidity floor rising; volatility expected to spike.",
                    "Real rates exerting pressure on growth valuations.",
                    "Credit conditions hardening; defensive rotation recommended."
                ];
                return [
                    "System transitioning; watching for liquidity divergence.",
                    "Vol correlations breaking down; selective risk required.",
                    "Interstate flows showing mixed institutional positioning."
                ];
            case 'india':
                if (label.includes('expansion')) return [
                    "Robust Capex cycle supporting GDP growth above 7%.",
                    "PLFS labor data showing efficient capital utilization.",
                    "FPI inflows stabilizing currency volatility."
                ];
                return [
                    "RBI maintains 'Withdrawal of Accommodation' stance.",
                    "Inflation tracking MoSPI forecasts; rates likely sticky.",
                    "Fiscal consolidation supporting sovereign yield stability."
                ];
            case 'china':
                if (label.includes('slowdown') || label.includes('tightening')) return [
                    "PBoC liquidity injections acting as a 'socialist floor'.",
                    "Property sector deleveraging continues to drag on credit.",
                    "Equities decoupled from global growth on structural fears."
                ];
                return [
                    "Stimulus signals monitoring for infrastructure pivot.",
                    "Cap flight risks remaining high despite local yields.",
                    "Geopolitical risk premium suppressing valuation resets."
                ];
            default:
                return [
                    "Analyzing multi-variable divergence in real-time.",
                    "Institutional positioning signals remain fragmented.",
                    "Cross-asset correlations indicating regime transition."
                ];
        }
    };

    return getInterpretations();
};
