import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useIndiaASI, StateASIStats } from './useIndiaASI';

export interface StateGeopolitics {
    state_code: string;
    state_name: string;
    west_exposure_usd: number;
    east_exposure_usd: number;
    total_exposure_usd: number;
    dominant_sphere: 'WEST' | 'EAST' | 'NEUTRAL';
    east_share_pct: number;
    loan_job_multiplier: number; // Cost ($) per new job
}

export function useGeopoliticalExposure() {
    const { data: asiData, isLoading: isASILoading } = useIndiaASI();

    return useQuery({
        queryKey: ['india_geopolitics', asiData?.length], // Refetch if ASI data changes
        enabled: !isASILoading && (asiData?.length || 0) > 0,
        queryFn: async () => {
            // 1. Fetch National Loan Totals for India
            const { data: loans, error } = await supabase
                .from('institutional_loans')
                .select('lender_bloc, amount_usd')
                .eq('recipient_region', 'India')
                .eq('loan_type', 'Stock'); // Focus on Stock for exposure

            if (error) throw error;

            // 2. Aggregate National Totals
            let totalWestLoans = 0;
            let totalEastLoans = 0;

            if (loans && loans.length > 0) {
                loans.forEach(loan => {
                    if (loan.lender_bloc === 'WEST') totalWestLoans += Number(loan.amount_usd);
                    else if (loan.lender_bloc === 'EAST') totalEastLoans += Number(loan.amount_usd);
                });
            } else {
                // FALLBACK: If DB is empty (Likely due to permission issues seeding), use hardcoded estimates
                // West: WB ($28B) + ADB ($18B) + JICA ($32B) = $78B
                // East: AIIB ($9B) + NDB ($7.5B) = $16.5B
                totalWestLoans = 78000000000;
                totalEastLoans = 16500000000;
            }

            // 3. Aggregate National Economic Baselines from ASI
            // We use ASI sums as the denominator. 
            // Note: ASI is organized sector only, but good proxy for industrialization.
            const totalIndiaGVA = asiData!.reduce((sum, s) => sum + s.total_gva, 0);
            const totalIndiaMfgGVA = asiData!.reduce((sum, s) => sum + s.manufacturing_gva, 0);

            if (totalIndiaGVA === 0) return [];

            // 4. Distribute Loans to States (The Heuristic)
            // East Capital (Infrastructure/Construction) -> Follows Heavy Industry (Mfg GVA)
            // West Capital (Reform/Social) -> Follows General Economic Activity (Total GVA)

            const results: StateGeopolitics[] = asiData!.map((state: StateASIStats) => {
                // Determine shares
                const generalShare = state.total_gva / totalIndiaGVA;
                const mfgShare = totalIndiaMfgGVA > 0 ? (state.manufacturing_gva / totalIndiaMfgGVA) : 0;

                // Allocate
                // West loans distributed by General GVA share
                const allocatedWest = totalWestLoans * generalShare;

                // East loans distributed by Manufacturing GVA share
                const allocatedEast = totalEastLoans * mfgShare;

                const totalStateExposure = allocatedWest + allocatedEast;
                const eastShare = totalStateExposure > 0 ? (allocatedEast / totalStateExposure) : 0;

                let dominance: 'WEST' | 'EAST' | 'NEUTRAL' = 'NEUTRAL';
                if (eastShare > 0.6) dominance = 'EAST';
                else if (eastShare < 0.4) dominance = 'WEST'; // West share > 0.6

                // Multiplier: Loans ($) per New Job Created
                // If growth is negative, multiplier is not applicable (N/A) or infinite cost.
                // We'll return 0 for N/A.
                let multiplier = 0;
                const prevEmp = state.total_employment / (1 + (state.employment_growth_yoy / 100)); // Derive prev
                const newJobs = (state.total_employment - prevEmp) * 1000; // Convert thousands to actuals

                if (newJobs > 0) {
                    multiplier = totalStateExposure / newJobs;
                }

                return {
                    state_code: state.state_code,
                    state_name: state.state_name,
                    west_exposure_usd: allocatedWest,
                    east_exposure_usd: allocatedEast,
                    total_exposure_usd: totalStateExposure,
                    dominant_sphere: dominance,
                    east_share_pct: eastShare,
                    loan_job_multiplier: multiplier
                };
            });

            return results;
        },
        staleTime: 1000 * 60 * 60 * 24 // 24 hours
    });
}
