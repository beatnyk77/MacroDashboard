import React, { useMemo, useState } from 'react';
import { MotionCard } from '@/components/MotionCard';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { useFuelSecurityIndia } from '../hooks/useFuelSecurityIndia';
import { cn } from '@/lib/utils';


const getRiskColor = (score: number): string => {
  if (score < 30) return '#10b981'; // emerald
  if (score < 60) return '#f59e0b'; // amber
  return '#ef4444'; // rose
};

const getRiskLevel = (days: number): { label: string; colorClass: string } => {
  if (days >= 15) return { label: 'SAFE', colorClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
  if (days >= 7) return { label: 'WATCH', colorClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
  return { label: 'CRITICAL', colorClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
};

const projectionData = (base: number, disruption: number, rationing: number) => {
  const data = [];
  const today = new Date();
  for (let i = 0; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    data.push({
      date: date.toISOString().split('T')[0],
      baseline: Math.max(0, base - i * (base / 60)),
      disruption: Math.max(0, disruption - i * (disruption / 45)),
      rationing: Math.max(0, rationing - i * (rationing / 90))
    });
  }
  return data;
};

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground/60">{label}</span>
  </div>
);

export const FuelSecurityClockIndia: React.FC = () => {
  const { data: apiData, isError } = useFuelSecurityIndia();

  // Capture "now" once on mount using useState lazy initializer (allowed by lint)
  const [now] = useState(() => Date.now());

  // Compute projection data
  const projData = useMemo(() => {
    if (!apiData || apiData.scenario_baseline_days === null || apiData.scenario_disruption_days === null || apiData.scenario_rationing_days === null) {
      return [];
    }
    return projectionData(
      apiData.scenario_baseline_days,
      apiData.scenario_disruption_days,
      apiData.scenario_rationing_days
    );
  }, [apiData]);

  const tankersWithDays = useMemo(() => {
    if (!apiData) return [];
    const pipeline = Array.isArray(apiData.tanker_pipeline_json) ? apiData.tanker_pipeline_json : [];
    return pipeline.slice(0, 15).map(tanker => {
      const etaTime = tanker.eta ? new Date(tanker.eta).getTime() : 0;
      return {
        ...tanker,
        daysRemaining: etaTime > 0 ? Math.max(0, Math.ceil((etaTime - now) / (1000 * 60 * 60 * 24))) : 0
      };
    });
  }, [apiData, now]);

  // If no data or error, show empty state (after all hooks)
  if (isError || !apiData) {
    return (
      <MotionCard className="w-full" delay={0.35}>
        <div className="h-[400px] flex flex-col items-center justify-center bg-black/40 border border-white/12 rounded-[2.5rem] backdrop-blur-3xl">
          <span className="text-sm font-black text-rose-500/50 uppercase tracking-uppercase mb-2">Fuel Security Data Not Available</span>
          <p className="text-xs text-muted-foreground/40 italic">The ingestion pipeline has not yet produced data. Please check back later.</p>
        </div>
      </MotionCard>
    );
  }

  const data = apiData;

  return (
    <MotionCard className="w-full" delay={0.35}>

      {/* Header */}
      <div className="mb-8 pl-4 border-l-4 border-amber-500/30">
        <h3 className="text-2xl font-black text-white uppercase tracking-heading">
          Fuel Security Clock – India
        </h3>
        <p className="text-xs text-muted-foreground/60 mt-2 max-w-2xl font-medium tracking-wide">
          Real-time strategic petroleum coverage, tanker pipeline, and geopolitical stress testing.
        </p>
      </div>

      <div className="space-y-8">
        {/* Row 1: Countdown Clock + Official/Actual */}
        {data.reserves_days_coverage != null ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-8 rounded-[2rem] bg-amber-500/[0.03] border border-amber-500/10 backdrop-blur-sm">
              <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-4">Reserves Coverage</h4>
              <div className="flex items-end gap-4">
                <div className="text-8xl font-black italic tracking-tighter text-white">
                  {Math.round(data.reserves_days_coverage)}
                </div>
                <div className="text-2xl font-black text-amber-500/60 mb-2">days</div>
              </div>
              <div className="mt-4">
                <div className={cn(
                  "px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider inline-block border",
                  getRiskLevel(data.reserves_days_coverage).colorClass
                )}>
                  {getRiskLevel(data.reserves_days_coverage).label}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/40 mt-3 uppercase tracking-wide">
                * Days of coverage = Total reserves / Daily consumption
              </p>
            </div>

            <div className="p-8 rounded-[2rem] bg-blue-500/[0.03] border border-blue-500/10 backdrop-blur-sm">
              <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4">Official vs Independent Estimate</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Official (PPAC)', value: data.reserves_days_official },
                    { name: 'Actual (Estimate)', value: data.reserves_days_actual }
                  ]}>
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      <Cell fill="#3b82f6" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {data.deviation_pct !== null && (
                <p className="text-xs text-muted-foreground/60 mt-4 text-center">
                  Deviation: <span className={cn("font-black", data.deviation_pct > 0 ? "text-emerald-500" : "text-rose-500")}>
                    {data.deviation_pct > 0 ? '+' : ''}{data.deviation_pct.toFixed(1)}%
                  </span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/10">
            <p className="text-sm text-muted-foreground">Reserves coverage data not yet available. Ingestion in progress.</p>
          </div>
        )}

        {/* Row 2: Tanker Pipeline */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-white">
              Tanker Pipeline to India (Vessels En Route)
            </h4>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <span className="text-[10px] font-black uppercase tracking-uppercase text-muted-foreground/60">
                {data.active_tankers_count} vessels estimated
              </span>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] overflow-hidden">
            <table className="w-full text-xs font-black uppercase tracking-wider">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-muted-foreground/60">Vessel</th>
                  <th className="px-6 py-4 text-left text-muted-foreground/60">Origin</th>
                  <th className="px-6 py-4 text-left text-muted-foreground/60">ETA</th>
                  <th className="px-6 py-4 text-right text-muted-foreground/60">Vol (Mbbl)</th>
                  <th className="px-6 py-4 text-center text-muted-foreground/60">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tankersWithDays.map((tanker, i) => (
                  <tr key={tanker.id || i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-white font-black">{tanker.vessel_name}</td>
                    <td className="px-6 py-4 text-white/80">{tanker.origin}</td>
                    <td className="px-6 py-4 text-white/80">
                      {new Date(tanker.eta).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <span className="text-[10px] text-muted-foreground/40 ml-2">
                        {tanker.daysRemaining}d
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-white font-black">
                      {tanker.volume_mbbl.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        tanker.risk_flag === 'chokepoint_exposed'
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      )}>
                        {tanker.risk_flag === 'chokepoint_exposed' ? 'Exposed' : 'Standard'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.tanker_pipeline_json.length > 15 && (
              <div className="px-6 py-4 text-center border-t border-white/10">
                <span className="text-[10px] text-muted-foreground/40">
                  +{data.tanker_pipeline_json.length - 15} more vessels (full view in Physical Flows Terminal)
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-2">
            * Based on import volume heuristics + average transit times. V1: not actual AIS data.
          </p>
        </div>

        {/* Row 3: Consumption Projections */}
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4">
            Consumption Trajectory & Stress Scenarios
          </h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickFormatter={d => {
                    const date = new Date(d);
                    return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
                  }}
                />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} unit=" days" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px'
                  }}
                  labelFormatter={label => new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="baseline" stroke="#3b82f6" strokeWidth={3} dot={false} name="Baseline" />
                <Line type="monotone" dataKey="disruption" stroke="#f59e0b" strokeWidth={3} dot={false} name="Disruption (-30% imports)" />
                <Line type="monotone" dataKey="rationing" stroke="#ef4444" strokeWidth={3} dot={false} name="Rationing (-50% consumption)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-8 mt-4 justify-center">
            <LegendItem color="#3b82f6" label="Baseline" />
            <LegendItem color="#f59e0b" label="Disruption" />
            <LegendItem color="#ef4444" label="Rationing" />
          </div>
        </div>

        {/* Row 4: Cost Pressure + Geopolitical Overlay */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-[2rem] bg-blue-500/[0.03] border border-blue-500/10 backdrop-blur-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4">Import Cost Pressure (Local Currency)</h4>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-white tracking-heading italic">
                {data.inr_per_barrel?.toLocaleString('en-IN') || 'N/A'}
              </span>
              <span className="text-sm font-black text-blue-500/40 uppercase tracking-uppercase">INR/barrel</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-uppercase text-muted-foreground/40">Brent USD</span>
              <span className="text-sm font-black text-white">${data.brent_price_usd?.toFixed(2) || 'N/A'}</span>
            </div>
            <p className="text-[10px] text-muted-foreground/40 mt-3 uppercase tracking-wide">
              * Higher INR/barrel increases energy import bill and current account deficit
            </p>
          </div>

          <div className="p-6 rounded-[2rem] bg-rose-500/[0.03] border border-rose-500/10 backdrop-blur-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-rose-400 mb-4">Geopolitical Risk Overlay</h4>
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.1 a 15.9 15.9 0 0 1 0 31.8" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <path
                    d="M18 2.1 a 15.9 15.9 0 0 1 0 31.8"
                    fill="none"
                    stroke={getRiskColor(data.geopolitical_risk_score)}
                    strokeWidth="3"
                    strokeDasharray={`${data.geopolitical_risk_score}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black text-white">{data.geopolitical_risk_score}</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {['Hormuz', 'Malacca', 'Red Sea'].map(chokepoint => {
                  // Simple status logic: if score > 70 = critical, >40 = elevated, else normal
                  const status = data.geopolitical_risk_score > 70 ? 'critical' :
                                data.geopolitical_risk_score > 40 ? 'elevated' : 'normal';
                  return (
                    <div key={chokepoint} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground/60 uppercase tracking-wider">{chokepoint}</span>
                      <span className={cn(
                        "font-black px-2 py-0.5 rounded text-[10px]",
                        status === 'critical' ? "bg-rose-500/10 text-rose-500" :
                        status === 'elevated' ? "bg-amber-500/10 text-amber-500" :
                        "bg-emerald-500/10 text-emerald-500"
                      )}>
                        {status === 'critical' ? 'Critical' : status === 'elevated' ? 'Elevated' : 'Normal'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionCard>
  );
};

export default FuelSecurityClockIndia;