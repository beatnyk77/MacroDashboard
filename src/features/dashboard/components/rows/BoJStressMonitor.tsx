import React, { useMemo } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { Activity, Database, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────

interface DataPoint {
  date: string;
  totalAssetsT?: number;   // BoJ assets in trillions JPY
  monetaryBaseT?: number;  // BoJ Monetary Base in trillions JPY
  jgbHoldingsT?: number;   // BoJ JGB holdings in trillions JPY
  assetsRoc?: number;      // 3-Month Rate of Change of Total Assets (%)
  jgbConcentration?: number; // JGBs as % of Total Assets
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

    const rows: React.ReactNode[] = [];
    if (data.totalAssetsT !== undefined) {
      rows.push(
        <div key="assets" className="flex justify-between gap-8">
          <span className="text-slate-400 text-xs">Total Assets</span>
          <span className="text-cyan-400 text-xs font-mono">¥{data.totalAssetsT.toFixed(2)}T</span>
        </div>
      );
    }
    if (data.monetaryBaseT !== undefined) {
      rows.push(
        <div key="base" className="flex justify-between gap-8">
          <span className="text-slate-400 text-xs">Monetary Base</span>
          <span className="text-amber-400 text-xs font-mono">¥{data.monetaryBaseT.toFixed(2)}T</span>
        </div>
      );
    }
    if (data.jgbHoldingsT !== undefined) {
      rows.push(
        <div key="jgb" className="flex justify-between gap-8">
          <span className="text-slate-400 text-xs">JGB Holdings</span>
          <span className="text-indigo-400 text-xs font-mono">¥{data.jgbHoldingsT.toFixed(2)}T</span>
        </div>
      );
    }
    if (data.jgbConcentration !== undefined) {
      rows.push(
        <div key="conc" className="flex justify-between gap-8">
          <span className="text-slate-400 text-xs">JGB Concentration</span>
          <span className="text-emerald-400 text-xs font-mono">{data.jgbConcentration.toFixed(2)}%</span>
        </div>
      );
    }
    if (data.assetsRoc !== undefined) {
      rows.push(
        <div key="roc" className="flex justify-between gap-8">
          <span className="text-slate-400 text-xs">3M Growth %</span>
          <span className={cn("text-xs font-mono", data.assetsRoc >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {data.assetsRoc >= 0 ? '+' : ''}{data.assetsRoc.toFixed(2)}%
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

// ── Chart 1: Balance Sheet Expansion ────────────────────────────────

const BalanceSheetGrowth: React.FC<{ data: DataPoint[] }> = ({ data }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <div className="w-1 h-5 bg-cyan-400 rounded-full" />
          Balance Sheet vs Monetary Base
        </h4>
      </div>

      <div className="h-[280px] w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="assetsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              tick={chartCommon.tick}
              stroke={chartCommon.stroke}
              minTickGap={30}
            />
            <YAxis
              tickFormatter={(v) => `¥${v.toFixed(0)}T`}
              domain={['auto', 'auto']}
              tick={chartCommon.tick}
              stroke={chartCommon.stroke}
            />
            <Tooltip content={<ChartTooltip />} />
            
            <Area
              type="monotone"
              dataKey="totalAssetsT"
              name="Total Assets"
              stroke="none"
              fill="url(#assetsGrad)"
            />
            
            <Line
              type="monotone"
              dataKey="totalAssetsT"
              name="Total Assets"
              stroke="#06b6d4"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            
            <Line
              type="monotone"
              dataKey="monetaryBaseT"
              name="Monetary Base"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-slate-500 text-xs italic text-center">
        BoJ Total Assets and Monetary Base (Trillions JPY) highlighting liquidity scale.
      </p>
    </div>
  );
};

// ── Chart 2: Liquidity Acceleration ──────────────────────────────────

const LiquidityAcceleration: React.FC<{ data: DataPoint[] }> = ({ data }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <div className="w-1 h-5 bg-emerald-400 rounded-full" />
          Liquidity Acceleration (3M Rate of Change)
        </h4>
      </div>

      <div className="h-[280px] w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rocPosGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="rocNegGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.8} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              tick={chartCommon.tick}
              stroke={chartCommon.stroke}
              minTickGap={30}
            />
            <YAxis
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
              domain={['auto', 'auto']}
              tick={chartCommon.tick}
              stroke={chartCommon.stroke}
            />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" />
            
            <Bar
              dataKey="assetsRoc"
              name="3M Growth %"
            >
              {data.map((entry, index) => (
                <rect
                  key={`cell-${index}`}
                  fill={(entry.assetsRoc ?? 0) >= 0 ? "url(#rocPosGrad)" : "url(#rocNegGrad)"}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-slate-500 text-xs italic text-center">
        The speed of BoJ balance sheet expansion/contraction, identifying pivotal shifts in monetary posture.
      </p>
    </div>
  );
};

// ── Chart 3: JGB Concentration ──────────────────────────────────────

const JGBCencentration: React.FC<{ data: DataPoint[] }> = ({ data }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <div className="w-1 h-5 bg-indigo-400 rounded-full" />
          JGB Concentration
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
              minTickGap={30}
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
              dataKey="jgbConcentration"
              name="JGB %"
              stroke="#818cf8"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-slate-500 text-xs italic text-center">
        JGB Holdings as a percentage of Total Assets, measuring direct debt monetization.
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

export const BoJStressMonitor: React.FC = () => {
  // Fetch Total Assets
  const { data: assetsData } = useSuspenseQuery({
    queryKey: ['boj-total-assets-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metric_observations')
        .select('as_of_date, value')
        .eq('metric_id', 'BOJ_TOTAL_ASSETS_TRJPY')
        .order('as_of_date', { ascending: false })
        .limit(104); // roughly 2 years
      if (error || !data) return [];
      return data.map(d => ({ date: d.as_of_date, totalAssetsT: d.value }));
    },
    staleTime: 1000 * 60 * 60, // 1h
  });

  // Fetch Monetary Base
  const { data: baseData } = useSuspenseQuery({
    queryKey: ['boj-monetary-base-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metric_observations')
        .select('as_of_date, value')
        .eq('metric_id', 'BOJ_MONETARY_BASE_TRJPY')
        .order('as_of_date', { ascending: false })
        .limit(104);
      if (error || !data) return [];
      return data.map(d => ({ date: d.as_of_date, monetaryBaseT: d.value })); 
    },
    staleTime: 1000 * 60 * 60,
  });

  // Fetch JGB Holdings
  const { data: jgbData } = useSuspenseQuery({
    queryKey: ['boj-jgb-holdings-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metric_observations')
        .select('as_of_date, value')
        .eq('metric_id', 'BOJ_JGB_HOLDINGS_TRJPY')
        .order('as_of_date', { ascending: false })
        .limit(104);
      if (error || !data) return [];
      return data.map(d => ({ date: d.as_of_date, jgbHoldingsT: d.value }));
    },
    staleTime: 1000 * 60 * 60,
  });

  // Build unified chart data
  const chartData: DataPoint[] = useMemo(() => {
    const baseMap = new Map(baseData.map(d => [d.date, d.monetaryBaseT]));
    const jgbMap = new Map(jgbData.map(d => [d.date, d.jgbHoldingsT]));
    
    // Sort assets strictly by date ascending for sequential processing
    const sortedAssets = [...assetsData].sort((a, b) => a.date.localeCompare(b.date));
    const result: DataPoint[] = [];
    
    // Assuming roughly weekly index spacing. Offset by 13 points = 3 months
    const PERIOD_OFFSET = 13;

    for (let i = 0; i < sortedAssets.length; i++) {
      const row = sortedAssets[i];
      const date = row.date;
      const totalAssetsT = row.totalAssetsT;
      const monetaryBaseT = baseMap.get(date) ?? baseData[baseData.length - 1]?.monetaryBaseT;
      const jgbHoldingsT = jgbMap.get(date) ?? jgbData[jgbData.length - 1]?.jgbHoldingsT;

      let assetsRoc: number | undefined = undefined;
      // Calculate 3-month Rate of Change using the value from PERIOD_OFFSET steps prior
      if (i >= PERIOD_OFFSET) {
        const pastAssetsT = sortedAssets[i - PERIOD_OFFSET].totalAssetsT;
        if (pastAssetsT && pastAssetsT > 0) {
          assetsRoc = ((totalAssetsT - pastAssetsT) / pastAssetsT) * 100;
        }
      }

      let jgbConcentration: number | undefined = undefined;
      if (jgbHoldingsT !== undefined && totalAssetsT !== undefined && totalAssetsT > 0) {
        jgbConcentration = (jgbHoldingsT / totalAssetsT) * 100;
      }
      
      result.push({
        date,
        totalAssetsT,
        monetaryBaseT,
        jgbHoldingsT,
        assetsRoc,
        jgbConcentration,
      });
    }

    return result;
  }, [assetsData, baseData, jgbData]);

  // Output derived metrics for header cards
  const latest = chartData[chartData.length - 1];
  const previous = chartData[Math.max(0, chartData.length - 2)];
  
  const isAssetsGrowing = latest && previous && (latest.totalAssetsT ?? 0) > (previous.totalAssetsT ?? 0);
  const isBaseGrowing = latest && previous && (latest.monetaryBaseT ?? 0) > (previous.monetaryBaseT ?? 0);
  const isJgbGrowing = latest && previous && (latest.jgbHoldingsT ?? 0) > (previous.jgbHoldingsT ?? 0);
  const isRocPositive = latest && (latest.assetsRoc ?? 0) >= 0;

  return (
    <section className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Database className="w-7 h-7 text-cyan-400" />
              BOJ Monetary Dominance
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl">
              Bank of Japan balance sheet dynamics · Liquidity Acceleration · Debt Monetization
            </p>
          </div>
          {latest && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>Updated: {new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 md:p-8 bg-slate-800/20">
        <MetricCard
          icon={<Database className="w-5 h-5 text-cyan-400" />}
          label="Total Assets"
          value={latest?.totalAssetsT ? `¥${latest.totalAssetsT.toFixed(2)}T` : '—'}
          sub="Bank of Japan Holdings"
          trend={isAssetsGrowing ? 'up' : 'down'}
        />
        <MetricCard
          icon={<Activity className="w-5 h-5 text-amber-400" />}
          label="Monetary Base"
          value={latest?.monetaryBaseT ? `¥${latest.monetaryBaseT.toFixed(2)}T` : '—'}
          sub="Base Liquidity"
          trend={isBaseGrowing ? 'up' : 'down'}
        />
        <MetricCard
          icon={<DollarSign className="w-5 h-5 text-indigo-400" />}
          label="JGB Holdings"
          value={latest?.jgbHoldingsT ? `¥${latest.jgbHoldingsT.toFixed(2)}T` : '—'}
          sub="Government Debt Monetized"
          trend={isJgbGrowing ? 'up' : 'down'}
        />
        <MetricCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          label="3M Asset Growth"
          value={latest?.assetsRoc !== undefined ? `${latest.assetsRoc >= 0 ? '+' : ''}${latest.assetsRoc.toFixed(2)}%` : '—'}
          sub="Liquidity Acceleration"
          trend={isRocPositive ? 'up' : 'down'}
        />
      </div>

      {/* Charts Grid */}
      <div className="p-6 md:p-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <BalanceSheetGrowth data={chartData} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <LiquidityAcceleration data={chartData} />
          <JGBCencentration data={chartData} />
        </div>
      </div>

      {/* Source footer */}
      <div className="flex justify-center pb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/30">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-uppercase">
            Sources: Bank of Japan (BOJ)
          </span>
        </div>
      </div>
    </section>
  );
};
