import React, { useState, useMemo } from 'react';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar
} from 'recharts';
import { 
  Wind, Sun, Droplets, Leaf, Activity, 
  Globe, Zap, Database, 
  AlertTriangle, ShieldCheck, Thermometer
} from 'lucide-react';
import { useClimateRisk } from '@/hooks/useClimateRisk';

export const ClimateRiskDashboard: React.FC = () => {
  const { data: climateData, isLoading, error } = useClimateRisk();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const processedData = useMemo(() => {
    if (!climateData) return [];
    // Sort by latest risk score
    return [...climateData].sort((a, b) => b.transition_risk_score - a.transition_risk_score);
  }, [climateData]);

  const countryDisplayData = useMemo(() => {
    if (!selectedCountry) return processedData.find(d => d.country_code === 'IND' && !d.region_code) || processedData[0];
    return processedData.find(d => d.country_code === selectedCountry && !d.region_code);
  }, [selectedCountry, processedData]);

  const globalAvgRisk = useMemo(() => {
    if (!processedData.length) return 0;
    const totals = processedData.filter(d => !d.region_code);
    return totals.reduce((acc, curr) => acc + curr.transition_risk_score, 0) / totals.length;
  }, [processedData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-[#0a0a0b] rounded-xl border border-white/5 animate-pulse">
        <Leaf className="w-8 h-8 text-emerald-500 mb-4 animate-bounce" />
        <span className="text-gray-400 font-mono text-xs uppercase tracking-[0.3em]">Calibrating Planetary Boundaries...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-900/10 border border-red-500/20 rounded-xl">
        <div className="flex items-center text-red-500 mb-2">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <h3 className="font-bold">Stream Disruption</h3>
        </div>
        <p className="text-red-400 font-mono text-sm">Failed to ingest climate risk telemetry.</p>
      </div>
    );
  }

  const getIntensityColor = (score: number) => {
    if (score >= 500) return '#ef4444'; // Dirty
    if (score >= 200) return '#f59e0b'; // Transition
    return '#10b981'; // Clean
  };

  const getTempColor = (temp: number) => {
    if (temp >= 2.5) return '#ef4444';
    if (temp >= 2.0) return '#f59e0b';
    return '#10b981';
  };

  const radarData = countryDisplayData ? [
    { subject: 'Transition Risk', A: countryDisplayData.transition_risk_score, fullMark: 100 },
    { subject: 'Emissions', A: Math.min(countryDisplayData.total_ghg_emissions_mt / 100, 100), fullMark: 100 },
    { subject: 'Grid Intensity', A: countryDisplayData.grid_co2_intensity / 8, fullMark: 100 },
    { subject: 'Renewable %', A: 100 - countryDisplayData.renewable_share_pct, fullMark: 100 },
    { subject: 'Temp Alignment', A: countryDisplayData.temperature_alignment_c * 20, fullMark: 100 },
  ] : [];

  return (
    <div className="space-y-8">
      {/* HUD Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-6 bg-emerald-500/5 border-l-4 border-emerald-500 rounded-r-xl">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <Leaf className="w-4 h-4" />
            <span className="text-[10px] font-black tracking-widest uppercase">Transition Signal active</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
            Transition <span className="text-emerald-500">Risk Matrix</span>
          </h2>
          <p className="text-gray-400 mt-2 font-mono text-xs max-w-xl">
            Institutional tracking of grid carbon intensity, sovereign temperature alignment, and sector-level transition exposure.
          </p>
        </div>
        
        <div className="bg-[#0f1115] border border-white/5 rounded-xl p-6 flex flex-col justify-center items-end">
          <div className="text-[10px] text-gray-500 font-mono uppercase mb-1">Global Baseline alignment</div>
          <div className="text-4xl font-black text-white font-mono leading-none flex items-baseline gap-2">
            {globalAvgRisk.toFixed(1)}
            <span className="text-xs text-emerald-500/70">TR_SCORE</span>
          </div>
          <div className="text-[10px] text-gray-600 font-mono mt-2 uppercase tracking-tighter">v1.2.0-CLIMATE-CORE</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Global Feed */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0f1115] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-white/5 p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono italic">Market Pulse</span>
              </div>
              <Activity className="w-3 h-3 text-emerald-500/50 animate-pulse" />
            </div>
            
            <div className="divide-y divide-white/5 h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {processedData.filter(d => !d.region_code).map((item, idx) => (
                <button
                  key={item.country_code}
                  onClick={() => setSelectedCountry(item.country_code)}
                  className={`w-full flex items-center justify-between p-4 transition-all hover:bg-white/5 text-left ${selectedCountry === item.country_code ? 'bg-white/10 border-l-2 border-emerald-400 shadow-inner' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-mono text-[10px] w-4">{(idx + 1).toString().padStart(2, '0')}</span>
                    <div>
                      <div className="text-white font-bold text-sm tracking-tight">{item.country_code}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Thermometer size={10} style={{ color: getTempColor(item.temperature_alignment_c) }} />
                        <span className="text-[9px] font-mono" style={{ color: getTempColor(item.temperature_alignment_c) }}>
                          {item.temperature_alignment_c}°C Align
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black font-mono leading-none text-white">
                      {item.transition_risk_score.toFixed(1)}
                    </div>
                    <div className="text-[8px] text-gray-500 font-mono uppercase tracking-tighter mt-1">RI_SCORE</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Deep Analytics */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vector Analysis */}
            <div className="bg-[#0f1115] border border-white/10 rounded-xl p-6 relative group overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />
              <div className="flex items-center justify-between mb-8 relative">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono italic">Exposure vectors</h3>
                </div>
                {countryDisplayData && (
                  <div className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10 text-emerald-400">
                    {countryDisplayData.country_code}
                  </div>
                )}
              </div>
              
              <div className="h-[280px] w-full flex items-center justify-center relative">
                {countryDisplayData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#2e2e33" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }} />
                      <Radar
                        name="Risk"
                        dataKey="A"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-600 font-mono text-xs italic">Awaiting Telemetry...</div>
                )}
              </div>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-rows-2 gap-4">
              <div className="bg-[#0f1115] border border-white/5 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-amber-500 mb-4 border-b border-white/5 pb-2">
                    <Zap size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Grid Intensity</span>
                  </div>
                  {countryDisplayData ? (
                    <div className="flex items-end gap-3">
                      <div className="text-4xl font-black text-white font-mono leading-none tracking-tighter">
                        {countryDisplayData.grid_co2_intensity}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mb-1">gCO₂/kWh</div>
                    </div>
                  ) : null}
                </div>
                {countryDisplayData && (
                   <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000" 
                        style={{ 
                          width: `${(countryDisplayData.grid_co2_intensity / 800) * 100}%`,
                          backgroundColor: getIntensityColor(countryDisplayData.grid_co2_intensity)
                        }}
                      />
                   </div>
                )}
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 flex flex-col justify-between">
                 <div>
                  <div className="flex items-center gap-2 text-emerald-500 mb-4 border-b border-emerald-500/10 pb-2">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Renewable Share</span>
                  </div>
                  {countryDisplayData ? (
                    <div className="flex items-end gap-2">
                      <div className="text-4xl font-black text-white font-mono leading-none">
                        {countryDisplayData.renewable_share_pct.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-emerald-500/70 font-mono mb-1 uppercase italic">Generation mix</div>
                    </div>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Wind size={12} className="text-emerald-500/40" />
                  <Sun size={12} className="text-emerald-500/40" />
                  <Droplets size={12} className="text-emerald-500/40" />
                </div>
              </div>
            </div>
          </div>

          {/* India Regional Analysis */}
          <div className="bg-[#0f1115] border border-white/5 rounded-xl p-6 relative overflow-hidden">
             <div className="flex items-center gap-2 mb-6">
               <Database className="w-4 h-4 text-emerald-500" />
               <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono italic">India State telemetry</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 {processedData.filter(d => d.country_code === 'IND' && d.region_code).map(state => (
                   <div key={state.region_code} className="p-4 bg-white/[0.02] border border-white/5 rounded-lg">
                     <div className="flex justify-between items-center mb-3">
                       <span className="text-xs font-bold text-white font-mono uppercase">{state.region_code === 'MH' ? 'Maharashtra' : 'Karnataka'}</span>
                       <span className="text-[10px] text-gray-500 font-mono tracking-tighter">NODE_ID: {state.region_code}</span>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[8px] text-gray-600 uppercase font-mono mb-1 underline decoration-emerald-500/30 underline-offset-2">Intensity</div>
                          <div className="text-sm font-black text-white font-mono">{state.grid_co2_intensity} g</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-gray-600 uppercase font-mono mb-1 underline decoration-emerald-500/30 underline-offset-2">RE_Share</div>
                          <div className="text-sm font-black text-white font-mono">{state.renewable_share_pct}%</div>
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
               
               <div className="h-[200px] bg-white/[0.02] border border-white/5 rounded-xl p-4">
                 <div className="text-[10px] text-gray-500 font-mono uppercase mb-4 text-center">Inferred Transition Path</div>
                 <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={processedData.filter(d => d.country_code === 'IND' && d.region_code)}>
                      <Bar dataKey="transition_risk_score" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <XAxis dataKey="region_code" hide />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        contentStyle={{ backgroundColor: '#0a0a0b', border: '1px solid #333', fontSize: '10px' }}
                      />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Footer System Signal */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#0a0a0b] rounded-xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 group cursor-help">
            <ShieldCheck className="w-4 h-4 text-emerald-500 transform group-hover:scale-110 transition-transform" />
            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] group-hover:text-emerald-400 transition-colors">Institutional Node</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em]">EDGAR GHG Tier-1 Source</span>
          </div>
        </div>
        <div className="text-[10px] text-gray-600 font-mono tracking-tighter italic border-l border-white/10 pl-4">
          SYSTEM_ALIGNED // PACTA_METHODOLOGY_V3
        </div>
      </div>
    </div>
  );
};
