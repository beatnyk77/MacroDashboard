import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';

export interface SovereignHolderFlow {
  country: string;
  totalHeldBn: number | null;
  momChangePct: number | null;
  yoyChangePct: number | null;
  pctOfTotalForeign: number | null;
  strategicMotivation: string;
  asOfDate: string | null;
}

export interface SovereignStressDeskData {
  gauges: {
    totalForeignHoldingsBn: number | null;
    totalForeignYoYPct: number | null;
    chinaHeldBn: number | null;
    chinaYoYPct: number | null;
    japanHeldBn: number | null;
    japanYoYPct: number | null;
    asOfDate: string | null;
  };
  ticHolders: SovereignHolderFlow[];
  fundingStress: {
    swapLinesOutstandingMn: number | null;
    swapLinesDate: string | null;
  };
  lastUpdated: string | null;
  hasData: boolean;
}

const DEFAULT_HOLDERS: SovereignHolderFlow[] = [
  {
    country: 'Japan',
    totalHeldBn: null,
    momChangePct: null,
    yoyChangePct: null,
    pctOfTotalForeign: null,
    strategicMotivation: 'Tactical FX Defense / Yield Arbitrage',
    asOfDate: null,
  },
  {
    country: 'China',
    totalHeldBn: null,
    momChangePct: null,
    yoyChangePct: null,
    pctOfTotalForeign: null,
    strategicMotivation: 'Strategic De-Dollarization / Gold Substitution',
    asOfDate: null,
  },
  {
    country: 'United Kingdom',
    totalHeldBn: null,
    momChangePct: null,
    yoyChangePct: null,
    pctOfTotalForeign: null,
    strategicMotivation: 'Offshore Eurodollar Custody Hub',
    asOfDate: null,
  },
  {
    country: 'Cayman Islands',
    totalHeldBn: null,
    momChangePct: null,
    yoyChangePct: null,
    pctOfTotalForeign: null,
    strategicMotivation: 'Hedge Fund Treasury Cash-Futures Basis',
    asOfDate: null,
  },
  {
    country: 'Luxembourg',
    totalHeldBn: null,
    momChangePct: null,
    yoyChangePct: null,
    pctOfTotalForeign: null,
    strategicMotivation: 'European UCITS Institutional Custody',
    asOfDate: null,
  },
  {
    country: 'Belgium',
    totalHeldBn: null,
    momChangePct: null,
    yoyChangePct: null,
    pctOfTotalForeign: null,
    strategicMotivation: 'Euroclear Clearinghouse Custody',
    asOfDate: null,
  },
  {
    country: 'India',
    totalHeldBn: null,
    momChangePct: null,
    yoyChangePct: null,
    pctOfTotalForeign: null,
    strategicMotivation: 'FX Reserve Diversification',
    asOfDate: null,
  },
];

const STRATEGIC_INTENTS: Record<string, string> = {
  China: 'Strategic De-Dollarization / Gold Substitution',
  Japan: 'Tactical FX Defense / Yield Arbitrage',
  'United Kingdom': 'Offshore Eurodollar Custody Hub',
  'Cayman Islands': 'Hedge Fund Treasury Cash-Futures Basis',
  Luxembourg: 'European UCITS Institutional Custody',
  Belgium: 'Euroclear Clearinghouse Custody',
  India: 'FX Reserve Diversification',
};

export function useSovereignStressDesk() {
  return useQuery<SovereignStressDeskData>({
    queryKey: ['sovereign-stress-desk-telemetry'],
    queryFn: async () => {
      if (!supabase) {
        return {
          gauges: {
            totalForeignHoldingsBn: null,
            totalForeignYoYPct: null,
            chinaHeldBn: null,
            chinaYoYPct: null,
            japanHeldBn: null,
            japanYoYPct: null,
            asOfDate: null,
          },
          ticHolders: DEFAULT_HOLDERS,
          fundingStress: {
            swapLinesOutstandingMn: null,
            swapLinesDate: null,
          },
          lastUpdated: null,
          hasData: false,
        };
      }

      // 1. Query TIC foreign holders view
      const { data: ticData, error: ticErr } = await supabase
        .from('vw_tic_foreign_holders')
        .select('*')
        .order('as_of_date', { ascending: false });

      // 2. Query FX Swap Lines from metric_observations
      const { data: swapData } = await supabase
        .from('metric_observations')
        .select('as_of_date, value, last_updated_at')
        .eq('metric_id', MID.FX_SWAP_LINES || 'FX_SWAP_LINES')
        .order('as_of_date', { ascending: false })
        .limit(1);

      const hasTic = !ticErr && ticData && ticData.length > 0;

      let totalForeignHoldingsBn: number | null = null;
      let totalForeignYoYPct: number | null = null;
      let chinaHeldBn: number | null = null;
      let chinaYoYPct: number | null = null;
      let japanHeldBn: number | null = null;
      let japanYoYPct: number | null = null;
      let latestAsOfDate: string | null = null;
      const ticHolders: SovereignHolderFlow[] = [];

      if (hasTic) {
        latestAsOfDate = ticData[0].as_of_date;
        const currentPeriodRows = ticData.filter((r) => r.as_of_date === latestAsOfDate);

        totalForeignHoldingsBn = currentPeriodRows.reduce(
          (acc, r) => acc + (Number(r.holdings_usd_bn) || 0),
          0
        );

        for (const row of currentPeriodRows) {
          const cName = row.country_name || 'Unknown';
          const held = Number(row.holdings_usd_bn) || 0;
          const mom = row.mom_pct_change !== null ? Number(row.mom_pct_change) : null;
          const yoy = row.yoy_pct_change !== null ? Number(row.yoy_pct_change) : null;
          const pctForeign = row.pct_of_total_foreign !== null ? Number(row.pct_of_total_foreign) : null;

          if (cName.toLowerCase().includes('china')) {
            chinaHeldBn = held;
            chinaYoYPct = yoy;
          }
          if (cName.toLowerCase().includes('japan')) {
            japanHeldBn = held;
            japanYoYPct = yoy;
          }

          ticHolders.push({
            country: cName,
            totalHeldBn: held,
            momChangePct: mom,
            yoyChangePct: yoy,
            pctOfTotalForeign: pctForeign,
            strategicMotivation: STRATEGIC_INTENTS[cName] || 'Reserve Asset Management',
            asOfDate: row.as_of_date || '',
          });
        }

        ticHolders.sort((a, b) => (b.totalHeldBn || 0) - (a.totalHeldBn || 0));
      }

      const swapRow = swapData && swapData.length > 0 ? swapData[0] : null;

      return {
        gauges: {
          totalForeignHoldingsBn,
          totalForeignYoYPct,
          chinaHeldBn,
          chinaYoYPct,
          japanHeldBn,
          japanYoYPct,
          asOfDate: latestAsOfDate,
        },
        ticHolders: ticHolders.length > 0 ? ticHolders : DEFAULT_HOLDERS,
        fundingStress: {
          swapLinesOutstandingMn: swapRow ? Number(swapRow.value) : null,
          swapLinesDate: swapRow ? swapRow.as_of_date : null,
        },
        lastUpdated: latestAsOfDate || swapRow?.last_updated_at || null,
        hasData: hasTic || Boolean(swapRow),
      };
    },
    staleTime: 1000 * 60 * 30, // 30 mins
  });
}
