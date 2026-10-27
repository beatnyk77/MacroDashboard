import React, { useMemo } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  Landmark, 
  ArrowUpRight, 
  ArrowDownRight,
  Info 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_TOOLTIP_ITEM_STYLE, DEFAULT_TOOLTIP_LABEL_STYLE, DEFAULT_TOOLTIP_STYLE, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS, WHITE_ALPHA } from '@/constants/chartDefaults';
import { useRBIMoneyMarket } from '@/hooks/useRBIMoneyMarket';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

export const RBIMoneyMarketMonitor: React.FC = () => {
  const { ops, liq, repoRate, isLoading, isError } = useRBIMoneyMarket();

  const latestLiq = liq?.[0];
  const latestOps = ops?.[0];

  const chartData = useMemo(() => {
    if (!ops || !liq) return [];
    // Merge data by date for the corridor chart
    return ops.slice().reverse().map(op => {
      const l = liq.find(ld => ld.date === op.date);
      return {
        date: new Date(op.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        wacr: op.call_money_rate,
        triparty: op.triparty_repo_rate,
        market: op.market_repo_rate,
        netLiq: l?.net_liquidity_total || 0,
      };
    });
  }, [ops, liq]);

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-white/[0.02] border border-border rounded-xl animate-pulse flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="text-blue-500/20 animate-spin" size={40} />
          <span className="text-xs font-semibold text-white/20 uppercase tracking-wider">Synchronizing RBI Telemetry...</span>
        </div>
      </div>
    );
  }

  if (isError || !latestLiq) {
    return (
      <div className="w-full h-48 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center justify-center">
        <span className="text-xs text-rose-500 font-semibold tracking-wider uppercase">Failed to load RBI Data</span>
      </div>
    );
  }

  const netLiquidity = latestLiq?.net_liquidity_total ?? 0;
  const isSurplus = netLiquidity < 0; // Negative in RBI PR means absorption/surplus

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* 1. Liquidity HUD */}
      <div className="xl:col-span-3">
        <div className="p-8 rounded-xl bg-card/40 border border-border backdrop-blur-xl relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="text-blue-400" size={16} />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  RBI System Liquidity Position
                </span>
              </div>
              <div className="flex items-baseline gap-4">
                <h2 className="text-5xl font-bold tracking-heading text-white uppercase leading-none">
                  {Math.abs(netLiquidity).toLocaleString('en-IN')}
                  <span className="text-xl ml-2 text-terminal-dim italic capitalize font-medium tracking-normal text-none">Cr</span>
                </h2>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  isSurplus ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {isSurplus ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                  {isSurplus ? 'Liquidity Surplus' : 'Liquidity Deficit'}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full md:w-auto mt-4 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-border">
              {[
                {
                  label: 'SDF Rate',
                  val: latestLiq?.sdf_rate ? `${latestLiq.sdf_rate.toFixed(2)}%` : '—',
                  sub: 'Standing Deposit'
                },
                {
                  label: 'Repo Rate',
                  val: repoRate ? `${repoRate.toFixed(2)}%` : '—',
                  sub: 'Policy Anchor'
                },
                {
                  label: 'MSF Rate',
                  val: latestLiq?.msf_rate ? `${latestLiq.msf_rate.toFixed(2)}%` : '—',
                  sub: 'Marginal Standing'
                },
                {
                  label: 'WACR',
                  val: latestOps?.call_money_rate ? `${latestOps.call_money_rate.toFixed(2)}%` : '—',
                  sub: 'Market Reality'
                }
              ].map((m, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{m.label}</span>
                  <span className="text-lg font-bold text-white">{m.val}</span>
                  <span className="text-xs font-medium text-terminal-dim uppercase">{m.sub}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 opacity-[0.03] scale-150 rotate-12 pointer-events-none group-hover:opacity-[0.05] transition-opacity">
            <TrendingUp size={300} />
          </div>
        </div>
      </div>

      {/* 2. Interest Rate Corridor Chart */}
      <div className="xl:col-span-2">
        <div className="p-8 rounded-xl bg-white/[0.01] border border-border h-full">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-blue-500" />
              Interest Rate Corridor Dynamics
            </h3>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Historical Series
            </div>
          </div>
          
          <MacroChartContainer height={CHART_HEIGHTS.tall}>
              <LineChart data={chartData}>
                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} vertical={false} />
                <XAxis
                  {...DEFAULT_XAXIS_PROPS}
                  dataKey="date"
                  stroke={WHITE_ALPHA.dim}
                  fontSize={11}
                  axisLine={false}
                />
                <YAxis
                  {...DEFAULT_YAXIS_PROPS}
                  width={60}
                  stroke={WHITE_ALPHA.dim}
                  fontSize={11}
                  axisLine={false}
                  domain={[6.0, 7.0]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={DEFAULT_TOOLTIP_STYLE}
                  labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
                  itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em' }} />
                <Line 
                  type="monotone" 
                  dataKey="wacr" 
                  name="WACR" 
                  stroke={CHART_COLORS.west} 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="triparty" 
                  name="Triparty Repo" 
                  stroke={CHART_COLORS.expansion} 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="market" 
                  name="Market Repo" 
                  stroke={CHART_COLORS.gold} 
                  strokeWidth={2} 
                  dot={false}
                />
              </LineChart>
          </MacroChartContainer>
        </div>
      </div>

      {/* 3. Operations Breakdown & Insights */}
      <div className="xl:col-span-1 space-y-8">
        <div className="p-8 rounded-xl bg-white/[0.01] border border-border flex flex-col h-full">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-8">
            <Zap size={16} className="text-amber-500" />
            Segment Allocation
          </h3>
          
          <div className="space-y-6 flex-1">
            {[
              { label: 'Call Money', vol: latestOps?.call_money_vol, rate: latestOps?.call_money_rate, color: 'bg-blue-500' },
              { label: 'Triparty Repo', vol: latestOps?.triparty_repo_vol, rate: latestOps?.triparty_repo_rate, color: 'bg-emerald-500' },
              { label: 'Market Repo', vol: latestOps?.market_repo_vol, rate: latestOps?.market_repo_rate, color: 'bg-amber-500' },
            ].map((s, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-border hover:bg-white/[0.04] transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">{s.label}</span>
                  <span className="text-xs font-bold text-blue-400">{s.rate ? `${s.rate.toFixed(2)}%` : '—'}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white tracking-heading">₹{s.vol != null ? s.vol.toLocaleString('en-IN') : '—'}</span>
                  <span className="text-xs text-terminal-dim font-semibold uppercase">Cr</span>
                </div>
                <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} opacity-40`} style={{ width: '80%' }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
            <Info className="text-blue-400 shrink-0" size={16} />
            <p className="text-xs text-muted-foreground/80 leading-relaxed italic">
              <span className="text-blue-400 font-bold not-italic">Institutional Insight:</span> WACR is currently trading {(latestOps?.call_money_rate || 0) < 6.50 ? 'below' : 'above'} the Policy Repo Rate, reflecting {isSurplus ? 'comfortable liquidity' : 'tight interbank conditions'}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
