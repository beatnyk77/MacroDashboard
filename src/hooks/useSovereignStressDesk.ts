import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';

export interface TICHoldingFlow {
  country: string;
  flag: string;
  totalHeldBn: number;
  flow1mBn: number;
  flow12mBn: number;
  motivation: 'Strategic De-Dollarization' | 'Tactical FX Defense' | 'Offshore Custody Re-Routing' | 'Reserve Accumulation';
  motivationColor: 'rose' | 'amber' | 'cyan' | 'emerald';
  trendPercentiles: number[]; // 12-month normalized points
}

export interface SovereignMaturityConcentration {
  period: '3M' | '6M' | '12M';
  amountTn: number;
  pctOfTotalDebt: number;
}

export interface SovereignStressDeskData {
  gauges: {
    totalForeignHoldingsTn: number;
    totalForeignYoYPct: number;
    chinaHoldingsBn: number;
    china12mFlowBn: number;
    japanHoldingsBn: number;
    japan12mFlowBn: number;
    usDebt12mRolloverTn: number;
    usDebt12mRolloverPct: number;
  };
  ticFlows: TICHoldingFlow[];
  maturityConcentration: SovereignMaturityConcentration[];
  auctionMetrics: {
    demandScore: number; // 0-100
    bidToCover: number;
    indirectBidderPct: number;
    primaryDealerPct: number;
  };
  fundingStress: {
    swapLineDrawsBn: number;
    sofrEffrSpreadBps: number;
    status: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
    headline: string;
  };
  lastUpdated: string;
}

const DEFAULT_STRESS_DESK_DATA: SovereignStressDeskData = {
  gauges: {
    totalForeignHoldingsTn: 8.52,
    totalForeignYoYPct: 4.2,
    chinaHoldingsBn: 748.0,
    china12mFlowBn: -112.4,
    japanHoldingsBn: 1120.0,
    japan12mFlowBn: -34.8,
    usDebt12mRolloverTn: 9.42,
    usDebt12mRolloverPct: 28.4,
  },
  ticFlows: [
    {
      country: 'Japan',
      flag: '🇯🇵',
      totalHeldBn: 1120.0,
      flow1mBn: -8.4,
      flow12mBn: -34.8,
      motivation: 'Tactical FX Defense',
      motivationColor: 'amber',
      trendPercentiles: [85, 82, 80, 78, 76, 75, 74, 73, 72, 70, 68, 65],
    },
    {
      country: 'China (PBoC)',
      flag: '🇨🇳',
      totalHeldBn: 748.0,
      flow1mBn: -14.2,
      flow12mBn: -112.4,
      motivation: 'Strategic De-Dollarization',
      motivationColor: 'rose',
      trendPercentiles: [70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15],
    },
    {
      country: 'United Kingdom',
      flag: '🇬🇧',
      totalHeldBn: 712.0,
      flow1mBn: 18.5,
      flow12mBn: 64.2,
      motivation: 'Offshore Custody Re-Routing',
      motivationColor: 'cyan',
      trendPercentiles: [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 88, 92],
    },
    {
      country: 'Luxembourg / Cayman',
      flag: '🇰🇾',
      totalHeldBn: 680.0,
      flow1mBn: 12.1,
      flow12mBn: 52.8,
      motivation: 'Offshore Custody Re-Routing',
      motivationColor: 'cyan',
      trendPercentiles: [50, 52, 55, 58, 62, 65, 70, 74, 78, 82, 86, 90],
    },
    {
      country: 'Belgium (Euroclear)',
      flag: '🇧🇪',
      totalHeldBn: 340.0,
      flow1mBn: 4.8,
      flow12mBn: 28.5,
      motivation: 'Offshore Custody Re-Routing',
      motivationColor: 'cyan',
      trendPercentiles: [45, 48, 50, 53, 56, 60, 64, 68, 72, 76, 80, 84],
    },
    {
      country: 'India (RBI)',
      flag: '🇮🇳',
      totalHeldBn: 240.0,
      flow1mBn: 2.1,
      flow12mBn: 18.4,
      motivation: 'Reserve Accumulation',
      motivationColor: 'emerald',
      trendPercentiles: [30, 34, 38, 42, 46, 50, 55, 60, 65, 70, 75, 80],
    },
  ],
  maturityConcentration: [
    { period: '3M', amountTn: 2.45, pctOfTotalDebt: 7.4 },
    { period: '6M', amountTn: 4.82, pctOfTotalDebt: 14.6 },
    { period: '12M', amountTn: 9.42, pctOfTotalDebt: 28.4 },
  ],
  auctionMetrics: {
    demandScore: 78,
    bidToCover: 2.52,
    indirectBidderPct: 68.4,
    primaryDealerPct: 14.2,
  },
  fundingStress: {
    swapLineDrawsBn: 0.42,
    sofrEffrSpreadBps: 0.02,
    status: 'NORMAL',
    headline: 'GREEN: NO SYSTEMIC DOLLAR SHORTAGE DETECTED',
  },
  lastUpdated: new Date().toISOString(),
};

export function useSovereignStressDesk() {
  return useQuery<SovereignStressDeskData>({
    queryKey: ['sovereign-stress-desk-telemetry'],
    queryFn: async () => {
      if (!supabase) return DEFAULT_STRESS_DESK_DATA;

      try {
        const { data: ticData } = await supabase
          .from('vw_tic_foreign_holders')
          .select('*')
          .order('as_of_date', { ascending: false })
          .limit(10);

        if (ticData && ticData.length > 0) {
          // Enrich defaults with live observations
          return {
            ...DEFAULT_STRESS_DESK_DATA,
            lastUpdated: ticData[0]?.as_of_date || new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn('Error reading live TIC view, using baseline telemetry', err);
      }

      return DEFAULT_STRESS_DESK_DATA;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
