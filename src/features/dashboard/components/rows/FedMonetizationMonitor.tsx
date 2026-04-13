import React, { useMemo } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, BarChart3, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────

interface DataPoint {
  date: string;
  fedBalanceT?: number;     // Fed assets in trillions
  debtT?: number;           // Total US debt in trillions
  ratioPct?: number;        // Fed ownership %
  yield10Y?: number;        // 10Y Treasury yield %
  m2GrowthYoY?: number;     // M2 YoY growth %
  cpiYoY?: number;          // CPI YoY %
  realYield?: number;       // Approx real yield = 10Y - CPI
  somaChange?: number;      // Weekly SOMA change ( billions ) for QE/QT shading
}

// ── Custom Tooltip ─────────────────────────────────────────────────

const ChartTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as DataPoint;
    const date = new Date(label!).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // Build a dynamic body based on which fields are present
    const rows: React.ReactNode[] = [];
    if (data.fedBalanceT !== undefined) {
      rows.push(
        <div key="fed" className="flex justify-between gap-8">
          <span className="text-slate-400 text-xs">Fed Balance Sheet</span>
          <span className="text-cyan-400 text-xs font-mono">${data.fedBalanceT.toFixed(2)}T</span>
        </div>
      );
    }
    if (data.debtT !== undefined) {
      rows.push(
        <div key="debt" className="flex justify-between gap-8">
          <span className="text-slate-400 text-xs">US Marketable Debt</span>
          <span className="text-white text-xs font-mono">${data.debtT.toFixed(2)}T</span>
        </div>
      );
    }
    if (data.ratioPct !== undefined) {
      rows.push(
        <div key="ratio" className="flex justify-between gap-8">
          <span className="text-slate-400 text-xs">Monetization Ratio</span>
          <span className="text-emerald-400 text-xs font-mono">{data.ratioPct.toFixed(2)}%</span>
        </div>
      );
    }
    if (data.yield10Y !== undefined) {
      rows.push(
        <div key="yield" className="flex justify-between gap-8">
          <span className="text-slate-400 text-xs">10Y Treasury Yield</span>
          <span className="text-amber-400 text-xs font-mono">{data.yield10Y.toFixed(2)}%</span>
        </div>
      );
    }
    if (data.m2GrowthYoY !== undefined) {
      rows.push(
        <div key="m2" className="flex justify-between gap-8">
          <span className="text-slate-400 text-xs">M2 Money Growth</span>
          <span className={cn('text-xs font-mono', data.m2GrowthYoY >= 0 ? 'text-blue-400' : 'text-rose-500')}>
            {data.m2GrowthYoY.toFixed(2)}%
          </span>
        </div>
      );
    }
    if (data.cpiYoY !== undefined) {
      rows.push(
        <div key="cpi" className="flex justify-between gap-8">
          <span className="text-slate-400 text-xs">CPI Inflation</span>
          <span className="text-rose-500 text-xs font-mono">{data.cpiYoY.toFixed(2)}%</span>
        </div>
      );
    }
    if (data.realYield !== undefined) {
      rows.push(
        <div key="real" className="flex justify-between gap-8">
          <span className="text-slate-400 text-xs">Real Yield (est.)</span>
          <span className={cn('text-xs font-mono', data.realYield >= 0 ? 'text-emerald-400' : 'text-rose-500')}>
            {data.realYield >= 0 ? '+' : ''}{data.realYield.toFixed(2)}%
          </span>
        </div>
      );
    }

    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl z-50 min-w-[160px]">
        <p className="text-slate-300 font-semibold mb-2 border-b border-slate-700 pb-1 text-xs uppercase tracking-wide">
          {date}
        </p>
        <div className="space-y-1.5">{rows}</div>
      </div>
    );
  }
  return null;
};

// ── Chart Shared Styles ─────────────────────────────────────────────

const chartCommon = {
  tick: { fontSize: 11, fill: '#94a3b8' },
  stroke: '#64748b',
} as const;

// ── Chart 1: Monetization Gauge ────────────────────────────────────

const MonetizationGauge: React.FC<{ data: DataPoint[] }> = ({ data }) => {
  const latest = data[0];
  const latestRatio = latest?.ratioPct;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <div className="w-1 h-5 bg-cyan-400 rounded-full" />
          Monetization Gauge
        </h4>
        {latestRatio !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-uppercase">
              Fed owns
            </span>
            <span className="text-lg font-black text-cyan-400 tabular-nums">
              {latestRatio.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      <div className="h-[280px] w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              tick={chartCommon.tick}
              stroke={chartCommon.stroke}
            />
            <YAxis
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              domain={['auto', 'auto']}
              tick={chartCommon.tick}
              stroke={chartCommon.stroke}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="ratioPct"
              name="Monetization %"
              stroke="#06b6d4"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-slate-500 text-xs italic text-center mt-2">
        <span className="font-semibold text-slate-400">Formula:</span> Fed Assets (FRED: WALCL) ÷ Total Marketable Debt (FRED: GFDEBTN)
      </p>
    </div>
  );
};

// ── Chart 2: Yield Suppression ─────────────────────────────────────

const YieldSuppression: React.FC<{ data: DataPoint[] }> = ({ data }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <div className="w-1 h-5 bg-amber-400 rounded-full" />
          Yield Suppression
        </h4>
      </div>

      <div className="h-[280px] w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              tick={chartCommon.tick}
              stroke={chartCommon.stroke}
            />
            {/* Left axis: Fed Balance Sheet (primary) */}
            <YAxis
              yAxisId="left"
              orientation="left"
              tickFormatter={(v) => `$${v.toFixed(0)}T`}
              domain={['auto', 'auto']}
              tick={chartCommon.tick}
              stroke="#06b6d4"
            />
            {/* Right axis: 10Y Yield (%) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              domain={['auto', 'auto']}
              tick={chartCommon.tick}
              stroke="#f59e0b"
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="fedBalanceT"
              name="Fed Assets"
              stroke="#06b6d4"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="yield10Y"
              name="10Y Yield"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-slate-500 text-xs italic text-center mt-2">
        <span className="font-semibold text-slate-400">Data:</span> Fed Assets (FRED: WALCL) vs 10Y Yield (FRED: DGS10)
      </p>
    </div>
  );
};

// ── Chart 3: Inflation Transmission ─────────────────────────────────

const InflationTransmission: React.FC<{ data: DataPoint[] }> = ({ data }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <div className="w-1 h-5 bg-rose-400 rounded-full" />
          Inflation Transmission
        </h4>
      </div>

      <div className="h-[280px] w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              tick={chartCommon.tick}
              stroke={chartCommon.stroke}
            />
            <YAxis
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              domain={['auto', 'auto']}
              tick={chartCommon.tick}
              stroke={chartCommon.stroke}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="m2GrowthYoY"
              name="M2 Growth YoY"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="cpiYoY"
              name="CPI YoY"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-slate-500 text-xs italic text-center mt-2">
        <span className="font-semibold text-slate-400">Data:</span> M2 YoY (FRED: WM2NS or M2SL) vs Headline CPI YoY (FRED: CPIAUCSL)
      </p>
    </div>
  );
};

// ── Chart 4: Real Yield & QE/QT ────────────────────────────────────

const RealYieldMonitor: React.FC<{ data: DataPoint[] }> = ({ data }) => {
  const hasRealYieldData = data.some(d => d.realYield !== undefined);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <div className="w-1 h-5 bg-emerald-400 rounded-full" />
          Real Yield & QE/QT
        </h4>
      </div>

      <div className="h-[280px] w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 relative">
        {!hasRealYieldData ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs font-black text-slate-500 uppercase tracking-uppercase">
              TIPS real-yield data pending ingestion (FRED: T10YIE)
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="qeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="qtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />

              <XAxis
                dataKey="date"
                tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                tick={chartCommon.tick}
                stroke={chartCommon.stroke}
              />

              <YAxis
                tickFormatter={(v) => `${v.toFixed(1)}%`}
                domain={['auto', 'auto']}
                tick={chartCommon.tick}
                stroke={chartCommon.stroke}
              />

              <Tooltip content={<ChartTooltip />} />

              {/* Zero-line reference */}
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" strokeOpacity={0.6} />

              {/* Real yield line */}
              <Line
                type="monotone"
                dataKey="realYield"
                name="Real Yield"
                stroke="#a855f7"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />

              {/* Conditional area fill based on somaChange sign */}
              <Area
                type="monotone"
                dataKey="realYield"
                stroke="none"
                fill="url(#qeGrad)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="text-slate-500 text-xs italic text-center mt-2">
        <span className="font-semibold text-slate-400">Formula:</span> Real Yield = 10Y Yield (DGS10) − CPI YoY. QE/QT shading: SOMA cumulative changes.
      </p>
    </div>
  );
};

// ── Metric Card (Top-level summary) ─────────────────────────────────

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ icon, label, value, sub, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-cyan-500/30 transition-colors"
  >
    <div className="flex items-center justify-between gap-2 mb-1">
      <div className="flex items-center gap-2 text-slate-400 text-xs">{icon}</div>
      {trend && (
        <span
          className={cn(
            'text-[10px] font-black uppercase px-1.5 py-0.5 rounded',
            trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-500'
          )}
        >
          {trend}
        </span>
      )}
    </div>
    <div className="text-xl font-bold text-white tabular-nums">{value}</div>
    <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    {sub && <div className="text-[10px] text-slate-600 mt-1">{sub}</div>}
  </motion.div>
);

// ── Main Export ─────────────────────────────────────────────────────

export const FedMonetizationMonitor: React.FC = () => {
  // All data comes from metric_observations (FRED-sourced)
  const { data: fedAssets } = useSuspenseQuery({
    queryKey: ['fed-balance-sheet-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metric_observations')
        .select('as_of_date, value')
        .eq('metric_id', 'FED_BALANCE_SHEET')
        .order('as_of_date', { ascending: false })
        .limit(104); // 2 years weekly
      if (error || !data) return [];
      // FRED WALCL is normally reported in millions. Convert to Trillions.
      return data.map(d => ({ date: d.as_of_date, fedBalanceT: d.value > 1000000 ? d.value / 1000000 : d.value / 1000 }));
    },
    staleTime: 1000 * 60 * 60, // 1h
  });

  const { data: debtData } = useSuspenseQuery({
    queryKey: ['us-debt-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metric_observations')
        .select('as_of_date, value')
        .eq('metric_id', 'US_DEBT_USD_TN')
        .order('as_of_date', { ascending: false })
        .limit(104);
      if (error || !data) return [];
      return data.map(d => ({ date: d.as_of_date, debtT: d.value }));
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: yieldData } = useSuspenseQuery({
    queryKey: ['us-10y-yield-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metric_observations')
        .select('as_of_date, value')
        .eq('metric_id', 'US_10Y_YIELD')
        .order('as_of_date', { ascending: false })
        .limit(104);
      if (error || !data) return [];
      return data.map(d => ({ date: d.as_of_date, yield10Y: d.value }));
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: m2Data } = useSuspenseQuery({
    queryKey: ['us-m2-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metric_observations')
        .select('as_of_date, value')
        .eq('metric_id', 'US_M2')
        .order('as_of_date', { ascending: false })
        .limit(104);
      if (error || !data) return [];
      // Convert to YoY growth internally by computing 52-week lag (weekly M2)
      // We return level now; computing change below
      return data.map(d => ({ date: d.as_of_date, m2Level: d.value }));
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: cpiData } = useSuspenseQuery({
    queryKey: ['us-cpi-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metric_observations')
        .select('as_of_date, value')
        .eq('metric_id', 'US_CPI_YOY')
        .order('as_of_date', { ascending: false })
        .limit(104);
      if (error || !data) return [];
      return data.map(d => ({ date: d.as_of_date, cpiYoY: d.value }));
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: tipsData } = useSuspenseQuery({
    queryKey: ['tips-10y-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metric_observations')
        .select('as_of_date, value')
        .eq('metric_id', 'TIPS_10Y_YIELD')
        .order('as_of_date', { ascending: false })
        .limit(104);
      if (error || !data) return [];
      return data.map(d => ({ date: d.as_of_date, realYield: d.value }));
    },
    staleTime: 1000 * 60 * 60,
  });

  // SOMA change (weekly) for QE/QT shading
  const { data: somaData } = useSuspenseQuery({
    queryKey: ['soma-change'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metric_observations')
        .select('as_of_date, value')
        .eq('metric_id', 'FED_SOMA_CHANGE')
        .order('as_of_date', { ascending: false })
        .limit(104);
      if (error || !data) return [];
      return data.map(d => ({ date: d.as_of_date, somaChange: d.value }));
    },
    staleTime: 1000 * 60 * 60,
  });

  // Build unified chart data by inner-joining on date
  const chartData: DataPoint[] = useMemo(() => {
    // Helper to compute YoY robustly using chronological offsets
    const computeYoY = (dateStr: string, map: Map<string, number>, dates: string[]) => {
      const t = new Date(dateStr).getTime();
      const tPrev = t - 365.25 * 24 * 60 * 60 * 1000;
      let closestDate = '';
      let minDiff = Infinity;
      for (const d of dates) {
        const diff = Math.abs(new Date(d).getTime() - tPrev);
        if (diff < minDiff) {
          minDiff = diff;
          closestDate = d;
        }
      }
      if (minDiff <= 45 * 24 * 60 * 60 * 1000) {
        const curVal = map.get(dateStr);
        const prevVal = map.get(closestDate);
        if (curVal !== undefined && prevVal && prevVal !== 0) {
          return ((curVal - prevVal) / prevVal) * 100;
        }
      }
      return undefined;
    };

    // Build index by date for each dataset
    const debtMap = new Map(debtData.map(d => [d.date, d.debtT]));
    const yieldMap = new Map(yieldData.map(d => [d.date, d.yield10Y]));
    const somaMap = new Map(somaData.map(d => [d.date, d.somaChange]));

    const m2LevelMap = new Map(m2Data.map(d => [d.date, d.m2Level]));
    const m2Dates = Array.from(m2LevelMap.keys());
    
    // CPI could be an index instead of YoY %
    const cpiLevelMap = new Map(cpiData.map(d => [d.date, d.cpiYoY]));
    const cpiDates = Array.from(cpiLevelMap.keys());

    const tipsMap = new Map(tipsData.map(d => [d.date, d.realYield]));

    // Build output array, anchored on fedAssets dates (the longest common)
    const result: DataPoint[] = [];

    for (const row of fedAssets) {
      const debtT = debtMap.get(row.date);
      const debtTotal = debtT ?? debtData[0]?.debtT; 

      const fedBal = row.fedBalanceT;
      const ratio = debtTotal ? (fedBal! / debtTotal) * 100 : undefined;

      const y10 = yieldMap.get(row.date) ?? yieldData[0]?.yield10Y;

      // Handle M2 YoY safely
      let m2Growth = m2LevelMap.get(row.date);
      if (m2Growth !== undefined && Math.abs(m2Growth) > 500) {
        m2Growth = computeYoY(row.date, m2LevelMap, m2Dates);
      }

      // Handle CPI: if > 50, it's an index, compute YoY
      let cpiRaw = cpiData.find(d => d.date <= row.date)?.cpiYoY ?? cpiData[0]?.cpiYoY;
      let cpi = cpiRaw;
      if (cpiRaw !== undefined && cpiRaw > 50) {
        const nearestCpiDate = cpiData.find(d => d.date <= row.date)?.date ?? cpiDates[0];
        cpi = computeYoY(nearestCpiDate, cpiLevelMap, cpiDates);
      }

      const realYield = y10 !== undefined && cpi !== undefined ? y10 - cpi : (tipsMap.get(row.date) ?? undefined);
      const soma = somaMap.get(row.date) ?? somaData[0]?.somaChange;

      // Only include if we have at least one metric
      if (fedBal !== undefined || y10 !== undefined || m2Growth !== undefined || realYield !== undefined) {
        result.push({
          date: row.date,
          fedBalanceT: fedBal,
          debtT: debtTotal,
          ratioPct: ratio,
          yield10Y: y10,
          m2GrowthYoY: m2Growth,
          cpiYoY: cpi,
          realYield,
          somaChange: soma,
        });
      }
    }

    return result.sort((a, b) => a.date.localeCompare(b.date)); // chronological
  }, [fedAssets, debtData, yieldData, m2Data, cpiData, somaData, tipsData]);

  // ── Header summary cards ──────────────────────────────────────────
  const latest = chartData[0];
  const isDebtRatioUp = chartData.length > 1 && (latest?.ratioPct ?? 0) > (chartData[1]?.ratioPct ?? 0);

  return (
    <section className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Activity className="w-7 h-7 text-cyan-400" />
              FED Debt Monetization & Yield Control
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl">
              Federal Reserve balance sheet dynamics · Yield suppression transmission · Real rates
            </p>
          </div>
          {latest && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span>Updated: {new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 md:p-8 bg-slate-800/20">
        <MetricCard
          icon={<DollarSign className="w-5 h-5 text-cyan-400" />}
          label="Fed Assets"
          value={latest?.fedBalanceT ? `$${latest.fedBalanceT.toFixed(2)}T` : '—'}
          sub="WALCL weekly"
          trend={isDebtRatioUp ? 'up' : 'down'}
        />
        <MetricCard
          icon={<BarChart3 className="w-5 h-5 text-amber-400" />}
          label="Monetization Ratio"
          value={latest?.ratioPct ? `${latest.ratioPct.toFixed(2)}%` : '—'}
          sub="of US debt"
        />
        <MetricCard
          icon={<TrendingUp className="w-5 h-5 text-rose-400" />}
          label="10Y Real Yield"
          value={latest?.realYield !== undefined ? `${latest.realYield >= 0 ? '+' : ''}${latest.realYield.toFixed(2)}%` : '—'}
          sub="approx. nom−CPI"
        />
        <MetricCard
          icon={<Activity className="w-5 h-5 text-emerald-400" />}
          label="M2 vs CPI"
          value={latest?.m2GrowthYoY !== undefined ? `${latest.m2GrowthYoY.toFixed(1)}%` : '—'}
          sub={`CPI: ${latest?.cpiYoY?.toFixed(1) || '—'}%`}
        />
      </div>

      {/* Charts Grid */}
      <div className="p-6 md:p-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MonetizationGauge data={chartData} />
          <YieldSuppression data={chartData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <InflationTransmission data={chartData} />
          <RealYieldMonitor data={chartData} />
        </div>
      </div>

      {/* Source footer */}
      <div className="flex justify-center pb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/30">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-uppercase">
            Sources: FRED · Federal Reserve (H.4.1) · BLS · U.S. Treasury
          </span>
        </div>
      </div>
    </section>
  );
};
