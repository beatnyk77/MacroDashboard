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
  ResponsiveContainer, 
  Legend
} from 'recharts';
import { useRBIMoneyMarket } from '@/hooks/useRBIMoneyMarket';

export const RBIMoneyMarketMonitor: React.FC = () => {
  const { ops, liq, isLoading, isError } = useRBIMoneyMarket();

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
      <div className="w-full h-96 bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="text-blue-500/20 animate-spin" size={40} />
          <span className="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em]">Synchronizing RBI Telemetry...</span>
        </div>
      </div>
    );
  }

  if (isError || !latestLiq) {
    return (
      <div className="w-full h-48 bg-rose-500/5 border border-rose-500/10 rounded-3xl flex items-center justify-center">
        <span className="text-xs text-rose-500 font-bold tracking-widest uppercase">Failed to load RBI Data</span>
      </div>
    );
  }

  const isSurplus = latestLiq.net_liquidity_total < 0; // Negative in RBI PR means absorption/surplus

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* 1. Liquidity HUD */}
      <div className="xl:col-span-3">
        <div className="p-8 rounded-[32px] bg-slate-900/40 border border-white/10 backdrop-blur-xl relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="text-blue-400" size={16} />
                <span className="text-[0.65rem] font-black text-muted-foreground uppercase tracking-widest">
                  RBI System Liquidity Position
                </span>
              </div>
              <div className="flex items-baseline gap-4">
                <h2 className="text-5xl font-black tracking-tighter text-white uppercase leading-none">
                  {Math.abs(latestLiq.net_liquidity_total).toLocaleString('en-IN')}
                  <span className="text-xl ml-2 text-muted-foreground/50 italic capitalize font-medium tracking-normal text-none">Cr</span>
                </h2>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[0.65rem] font-black uppercase tracking-widest ${
                  isSurplus ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {isSurplus ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                  {isSurplus ? 'Liquidity Surplus' : 'Liquidity Deficit'}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full md:w-auto mt-4 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-white/5">
              {[
                { label: 'SDF Rate', val: '6.25%', sub: 'Standing Deposit' },
                { label: 'Repo Rate', val: '6.50%', sub: 'Policy Anchor' },
                { label: 'MSF Rate', val: '6.75%', sub: 'Marginal Standing' },
                { label: 'WACR', val: `${latestOps?.call_money_rate?.toFixed(2)}%`, sub: 'Market Reality' }
              ].map((m, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest mb-1">{m.label}</span>
                  <span className="text-lg font-black text-white">{m.val}</span>
                  <span className="text-[0.55rem] font-medium text-muted-foreground/40 uppercase">{m.sub}</span>
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
        <div className="p-8 rounded-[32px] bg-white/[0.01] border border-white/5 h-full">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-blue-500" />
              Interest Rate Corridor Dynamics
            </h3>
            <div className="text-[0.6rem] text-muted-foreground font-medium uppercase tracking-widest">
              Last 30 Operations
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  domain={[6.0, 7.0]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em' }} />
                <Line 
                  type="monotone" 
                  dataKey="wacr" 
                  name="WACR" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="triparty" 
                  name="Triparty Repo" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="market" 
                  name="Market Repo" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Operations Breakdown & Insights */}
      <div className="xl:col-span-1 space-y-8">
        <div className="p-8 rounded-[32px] bg-white/[0.01] border border-white/5 flex flex-col h-full">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-8">
            <Zap size={16} className="text-amber-500" />
            Segment Allocation
          </h3>
          
          <div className="space-y-6 flex-1">
            {[
              { label: 'Call Money', vol: latestOps?.call_money_vol, rate: latestOps?.call_money_rate, color: 'bg-blue-500' },
              { label: 'Triparty Repo', vol: latestOps?.triparty_repo_vol, rate: latestOps?.triparty_repo_rate, color: 'bg-emerald-500' },
              { label: 'Market Repo', vol: latestOps?.market_repo_vol, rate: latestOps?.market_repo_rate, color: 'bg-amber-500' },
            ].map((s, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[0.65rem] font-black text-white uppercase tracking-wider">{s.label}</span>
                  <span className="text-xs font-black text-blue-400">{s.rate?.toFixed(2)}%</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white tracking-tighter">₹{s.vol?.toLocaleString('en-IN')}</span>
                  <span className="text-[0.6rem] text-muted-foreground/50 font-black uppercase">Cr</span>
                </div>
                <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} opacity-40`} style={{ width: '80%' }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
            <Info className="text-blue-400 shrink-0" size={16} />
            <p className="text-[0.65rem] text-muted-foreground/80 leading-relaxed italic">
              <span className="text-blue-400 font-bold not-italic">Institutional Insight:</span> WACR is currently trading {(latestOps?.call_money_rate || 0) < 6.50 ? 'below' : 'above'} the Policy Repo Rate, reflecting {isSurplus ? 'comfortable liquidity' : 'tight interbank conditions'}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
