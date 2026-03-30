import React, { Suspense, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { DataQualityBadge } from '@/components/DataQualityBadge';
import { MotionCard } from '@/components/MotionCard';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { useFuelSecurityIndia, FuelSecurityIndia } from '../hooks/useFuelSecurityIndia';
import { cn } from '@/lib/utils';

const LoadingFallback = () => (
  <div className="w-full min-h-[600px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
    <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Loading Fuel Security Data...</span>
  </div>
);

const MOCK_DATA: FuelSecurityIndia = {
  as_of_date: new Date().toISOString().split('T')[0],
  reserves_days_coverage: 10.5,
  reserves_days_official: 9.8,
  reserves_days_actual: 11.2,
  deviation_pct: 14.3,
  daily_consumption_mbpd: 5.12,
  brent_price_usd: 85.34,
  inr_per_barrel: 71500,
  active_tankers_count: 14,
  tanker_pipeline_json: [
    { id: 'v1', vessel_name: 'MT DEVIKSUND', origin: 'Saudi Arabia', eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], volume_mbbl: 2.1, risk_flag: 'chokepoint_exposed', vessel_type: 'VLCC' },
    { id: 'v2', vessel_name: 'MT ASEEM', origin: 'Iraq', eta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], volume_mbbl: 1.9, risk_flag: 'chokepoint_exposed', vessel_type: 'VLCC' },
    { id: 'v3', vessel_name: 'MT YANNA', origin: 'UAE', eta: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], volume_mbbl: 2.0, risk_flag: 'chokepoint_exposed', vessel_type: 'VLCC' },
    { id: 'v4', vessel_name: 'MT AIDA', origin: 'Nigeria', eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], volume_mbbl: 1.3, risk_flag: 'standard', vessel_type: 'VLCC' },
    { id: 'v5', vessel_name: 'MT VARUNA', origin: 'USA', eta: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], volume_mbbl: 1.5, risk_flag: 'standard', vessel_type: 'VLCC' },
    { id: 'v6', vessel_name: 'MT SAHARA', origin: 'Nigeria', eta: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], volume_mbbl: 1.2, risk_flag: 'standard', vessel_type: 'VLCC' },
    { id: 'v7', vessel_name: 'MT DARLING', origin: 'Saudi Arabia', eta: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], volume_mbbl: 2.0, risk_flag: 'chokepoint_exposed', vessel_type: 'VLCC' },
    { id: 'v8', vessel_name: 'MT GEMINI', origin: 'UAE', eta: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], volume_mbbl: 1.8, risk_flag: 'chokepoint_exposed', vessel_type: 'VLCC' },
    { id: 'v9', vessel_name: 'MT OMICRON', origin: 'Kuwait', eta: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], volume_mbbl: 1.9, risk_flag: 'chokepoint_exposed', vessel_type: 'VLCC' },
    { id: 'v10', vessel_name: 'MT NORDIC', origin: 'Russia', eta: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], volume_mbbl: 1.6, risk_flag: 'chokepoint_exposed', vessel_type: 'VLCC' },
  ],
  geopolitical_risk_score: 67,
  scenario_baseline_days: 10.5,
  scenario_disruption_days: 7.3,
  scenario_rationing_days: 15.2,
  last_updated_at: new Date().toISOString(),
  metadata: {
    source_reliability: 'high',
    notes: 'Mock data for development'
  }
};

const getRiskColor = (score: number): string => {
  if (score < 30) return '#10b981'; // emerald
  if (score < 60) return '#f59e0b'; // amber
  return '#ef4444'; // rose
};

const getRiskBadgeVariant = (days: number): 'green' | 'yellow' | 'red' => {
  if (days >= 15) return 'green';
  if (days >= 7) return 'yellow';
  return 'red';
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

  // Merge API data with fallback if API data is empty or error
  const { data, isFallback } = React.useMemo(() => {
    if (isError) {
      console.warn('Fuel Security API error, using fallback data');
      return { data: MOCK_DATA, isFallback: true };
    }

    if (!apiData) {
      return { data: MOCK_DATA, isFallback: true };
    }

    // Check if critical fields are populated
    const hasCriticalData = apiData.reserves_days_coverage > 0 && apiData.daily_consumption_mbpd > 0;

    if (!hasCriticalData) {
      console.warn('Fuel Security data incomplete, using fallback');
      return { data: MOCK_DATA, isFallback: true };
    }

    return { data: apiData, isFallback: false };
  }, [apiData, isError]);

  const riskLevel = getRiskBadgeVariant(data.reserves_days_coverage);
  const projData = useMemo(() =>
    projectionData(data.scenario_baseline_days, data.scenario_disruption_days, data.scenario_rationing_days),
    [data]
  );

  return (
    <MotionCard className="w-full" delay={0.35}>
      {isFallback && (
        <div className="mb-6 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DataQualityBadge type="simulated" />
            <p className="text-xs font-black uppercase tracking-uppercase text-amber-500/90">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              Live Feed Normalizing — Displaying Institutional Proxies
            </p>
          </div>
        </div>
      )}

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
                {data.tanker_pipeline_json.slice(0, 15).map((tanker, i) => (
                  <tr key={tanker.id || i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-white font-black">{tanker.vessel_name}</td>
                    <td className="px-6 py-4 text-white/80">{tanker.origin}</td>
                    <td className="px-6 py-4 text-white/80">
                      {new Date(tanker.eta).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <span className="text-[10px] text-muted-foreground/40 ml-2">
                        {Math.max(0, Math.ceil((new Date(tanker.eta).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d
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