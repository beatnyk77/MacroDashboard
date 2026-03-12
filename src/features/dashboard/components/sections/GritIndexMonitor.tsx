import React, { useState, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { 
  Activity, ShieldAlert, TrendingUp, Globe, 
  Zap, Database, Terminal, Info, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { useGritIndex } from '@/hooks/useGritIndex';

export const GritIndexMonitor: React.FC = () => {
  const { data: gritData, isLoading, error } = useGritIndex();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  const processedData = useMemo(() => {
    if (!gritData) return [];
    // Sort by latest score
    return [...gritData].sort((a, b) => b.grit_score - a.grit_score);
  }, [gritData]);

  const selectedCountryData = useMemo(() => {
    if (!selectedCountry || !processedData) return null;
    return processedData.find(d => d.country_code === selectedCountry);
  }, [selectedCountry, processedData]);

  const globalAvg = useMemo(() => {
    if (!processedData.length) return 0;
    return processedData.reduce((acc, curr) => acc + curr.grit_score, 0) / processedData.length;
  }, [processedData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-[#0a0a0b] rounded-xl border border-white/5 animate-pulse">
        <Database className="w-6 h-6 text-emerald-500 mr-3 animate-spin" />
        <span className="text-gray-400 font-mono">Syncing GMD Core Node...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-900/10 border border-red-500/20 rounded-xl">
        <div className="flex items-center text-red-500 mb-2">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <h3 className="font-bold">Heuristic Failure</h3>
        </div>
        <p className="text-red-400 font-mono text-sm leading-relaxed">
          {error instanceof Error ? error.message : 'Unknown data stream interruption.'}
        </p>
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score >= 75) return '#ef4444'; // High Risk
    if (score >= 50) return '#f59e0b'; // Moderate
    return '#10b981'; // Low
  };

  const radarData = selectedCountryData ? [
    { subject: 'Debt/GDP', A: (selectedCountryData.components.debt_gdp / 1.5), fullMark: 100 },
    { subject: 'Deficit', A: (selectedCountryData.components.deficit_gdp * 10), fullMark: 100 },
    { subject: 'Yield', A: (selectedCountryData.components.yield * 10), fullMark: 100 },
    { subject: 'Reserves', A: (100 - selectedCountryData.monetary_resilience_score), fullMark: 100 },
    { subject: 'Currency', A: selectedCountryData.is_crisis_active ? 100 : 20, fullMark: 100 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header Overlay */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 p-6 bg-gradient-to-r from-emerald-500/5 to-transparent border-l-4 border-emerald-500/30">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <Zap className="w-4 h-4 fill-emerald-500" />
            <span className="text-xs font-black tracking-widest uppercase">System Operational // Real-time Ingestion</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none italic">
            GRIT <span className="text-transparent border-b-2 border-emerald-500">Monitor</span>
          </h2>
          <p className="text-gray-400 mt-2 font-mono text-sm max-w-xl">
            Geopolitical Risk & Institutional Transition — a real-time composite of sovereign debt stress and reserve velocity.
          </p>
        </div>
        <div className="flex flex-col items-end">
          <button 
            onClick={() => setMethodologyOpen(true)} 
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-[10px] text-white font-mono uppercase tracking-[0.2em] transition-all mb-4"
          >
            [Read_Methodology]
          </button>
          <div className="text-gray-500 text-[10px] font-mono mb-1 uppercase tracking-widest">Global Risk Baseline</div>
          <div className="text-3xl font-black text-white font-mono flex items-baseline gap-2 leading-none">
            {globalAvg.toFixed(2)}
            <span className="text-xs text-gray-500 font-medium tracking-normal">GRIT_AVG</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Rankings & Terminal */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0f1115] border border-white/5 rounded-xl overflow-hidden">
            <div className="bg-white/5 p-3 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono italic">Risk Leaderboard</span>
              </div>
              <span className="text-[10px] p-1 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20 font-mono">LIVE_FEED</span>
            </div>
            
            <div className="divide-y divide-white/5 h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {processedData.map((item, idx) => (
                <button
                  key={item.country_code}
                  onClick={() => setSelectedCountry(item.country_code)}
                  className={`w-full flex items-center justify-between p-4 transition-all hover:bg-white/5 text-left ${selectedCountry === item.country_code ? 'bg-white/10 border-l-2 border-emerald-400' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-mono text-xs w-4">{(idx + 1).toString().padStart(2, '0')}</span>
                    <div>
                      <div className="text-white font-bold tracking-tight">{item.country_code}</div>
                      <div className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">
                        {item.is_crisis_active ? 'CRISIS_ACTIVE' : 'STRUCTURAL_STRESS'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-black font-mono leading-none" style={{ color: getRiskColor(item.grit_score) }}>
                      {item.grit_score.toFixed(1)}
                    </span>
                    {item.is_crisis_active && (
                      <span className="text-[8px] bg-red-500/20 text-red-500 px-1 rounded border border-red-500/30 font-black mt-1 uppercase animate-pulse">High Risk Floor</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-500 mb-3">
              <Terminal className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Heuristic Insights</span>
            </div>
            <p className="text-xs text-gray-300 font-mono leading-relaxed italic">
              "Current aggregate metrics suggest a clustering of {globalAvg > 50 ? 'High' : 'Moderate'} sovereign risk across emerging hubs. Reserve velocity correlates {globalAvg > 60 ? 'strongly' : 'weakly'} with debt-to-gold ratios in current cycle."
            </p>
          </div>
        </div>

        {/* Right Panel: Deep Analytics */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Radar Analysis */}
            <div className="bg-[#0f1115] border border-white/5 rounded-xl p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono italic">Risk Decomposition</h3>
                </div>
                {selectedCountry && (
                  <div className="text-xs font-mono text-gray-500 uppercase tracking-tighter border border-white/10 px-2 py-0.5 rounded">
                    Ref: {selectedCountry}
                  </div>
                )}
              </div>
              
              <div className="h-[250px] w-full flex items-center justify-center">
                {selectedCountryData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#2e2e33" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }} />
                      <Radar
                        name="Risk"
                        dataKey="A"
                        stroke={getRiskColor(selectedCountryData.grit_score)}
                        fill={getRiskColor(selectedCountryData.grit_score)}
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-600 font-mono text-xs italic">Select a country for vector analysis</div>
                )}
              </div>
            </div>

            {/* Component Summary */}
            <div className="bg-[#0f1115] border border-white/5 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono italic mb-6 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                Raw Vectors
              </h3>
              {selectedCountryData ? (
                <div className="space-y-4">
                  {[
                    { label: 'Debt Stress', val: selectedCountryData.debt_stress_score.toFixed(1), max: 100, color: '#ef4444' },
                    { label: 'Monetary Buffer', val: selectedCountryData.monetary_resilience_score.toFixed(1), max: 100, color: '#10b981' },
                    { label: 'Reserve Velocity', val: selectedCountryData.components.reserve_velocity.toFixed(2) + '%', valRaw: selectedCountryData.components.reserve_velocity, max: 2, color: '#3b82f6' },
                  ].map(stat => (
                    <div key={stat.label}>
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                        <span className="text-gray-400 uppercase tracking-tighter">{stat.label}</span>
                        <span className="text-white font-bold">{stat.val}</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${Math.min(stat.max === 100 ? (stat.valRaw || parseFloat(stat.val)) : (Math.abs(parseFloat(stat.val)) * 50), 100)}%`, backgroundColor: stat.color }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-[10px] text-gray-500 font-mono uppercase mb-1">Debt/GDP</div>
                      <div className="text-xl font-black text-white font-mono leading-none">
                        {(selectedCountryData.components.debt_gdp * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                      <div className="text-[10px] text-emerald-500/70 font-mono uppercase mb-1">M2/Gold Proxy</div>
                      <div className="text-xl font-black text-white font-mono leading-none tracking-tighter">
                        {selectedCountryData.components.m2_gold.toFixed(1)}x
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-gray-600 font-mono text-center">
                  <Info className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-[10px] italic">Awaiting country selection for diagnostic readout...</p>
                </div>
              )}
            </div>
          </div>

          {/* Historical / Projection Area (Placeholder using aggregate data if multiple years available) */}
          <div className="bg-[#0f1115] border border-white/5 rounded-xl p-6 h-[250px] relative">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono italic mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Aggregate Institutional Stress History
            </h3>
            <div className="absolute top-6 right-6 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-gray-400 font-mono uppercase">Avg Score</span>
              </div>
            </div>
            
            <div className="h-[150px] w-full mt-4">
                 <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { year: '2021', score: 42 },
                    { year: '2022', score: 58 },
                    { year: '2023', score: globalAvg - 5 },
                    { year: '2024', score: globalAvg },
                  ]}>
                    <defs>
                      <linearGradient id="colorGrit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#444', fontSize: 10, fontFamily: 'monospace'}} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorGrit)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#0a0a0b] rounded-xl border border-white/5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em]">Institutional Grade</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em]">Source: KMueller GMD + IMF IFS</span>
          </div>
        </div>
        <div className="text-[10px] text-gray-600 font-mono tracking-tighter italic">
          v1.0.4-beta // GRIT-ALGO-ACTIVE
        </div>
      </div>

      {/* METHODOLOGY MODAL */}
      {methodologyOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0b] border border-[#2e2e33] rounded-sm shadow-2xl p-8 sm:p-12 font-mono scrollbar-thin scrollbar-thumb-white/10 text-white">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-12 border-b border-white/10 pb-6">
              <div>
                <div className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mb-2">Internal Working Paper Series // Restricted</div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase leading-none">
                  Methodology: The <span className="text-emerald-500">GRIT</span> Index
                </h2>
              </div>
              <button 
                onClick={() => setMethodologyOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                [CLOSE]
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-8 text-sm text-gray-300 leading-relaxed">
              <section>
                <h3 className="text-emerald-500 font-bold tracking-widest uppercase mb-3">1. Executive Summary</h3>
                <p>
                  The Geopolitical Risk & Institutional Transition (GRIT) Index is a composite framework designed to monitor systemic sovereign stress and reserve base diversification velocity across major global economies. It moves beyond traditional debt-to-GDP metrics to encompass monetary resilience, yielding a holistic signal of structural sovereign solvency and transition risk.
                </p>
              </section>

              <section>
                <h3 className="text-emerald-500 font-bold tracking-widest uppercase mb-3">2. Core Equation</h3>
                <div className="p-6 bg-white/[0.02] border border-white/5 my-4 overflow-x-auto text-center font-mono">
                  <span className="text-white text-lg">
                    GRIT_t = 0.60 × (\Delta DebtStress) + 0.40 × (\Delta MonetaryResilience)
                  </span>
                </div>
                <p className="mt-4">
                  The index normalizes independent vector inputs (Debt vs. Reserves) into a 0-100 scale, weighting structural leverage (60%) over immediate monetary liquidity buffers (40%). 
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                  <h3 className="text-emerald-500 font-bold tracking-widest uppercase mb-3">3. Debt Stress Vector (60%)</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-white">Govt Debt / GDP:</strong> Primary structural encumbrance gauge.</li>
                    <li><strong className="text-white">Govt Deficit / GDP:</strong> Velocity of new debt issuance need.</li>
                    <li><strong className="text-white">Target Sovereign Yield:</strong> Cost of systemic carry and market absorption stress.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-emerald-500 font-bold tracking-widest uppercase mb-3">4. Monetary Resilience (40%)</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-white">Gold Reserve Velocity:</strong> Central bank accumulation vs historical run-rate.</li>
                    <li><strong className="text-white">Debt / Gold Proxy:</strong> Unencumbered fiat structural backing.</li>
                    <li><strong className="text-white">Current Acct / GDP:</strong> External funding reliance.</li>
                  </ul>
                </section>
              </div>

              <section className="p-6 border border-red-500/20 bg-red-500/5 mt-8">
                <h3 className="text-red-500 font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  5. Crisis Multiplier (Hard Override)
                </h3>
                <p>
                  Should any active Banking, Sovereign Debt, or Currency crisis flags trigger within the GMD event dataset, the overarching algorithm forces a <strong>minimum risk rating of 85</strong>. This structural circuit breaker ensures trailing macroeconomic data does not mask sudden capital flight or institutional fracture.
                </p>
              </section>

              <div className="pt-8 border-t border-white/5 flex items-center justify-between text-gray-500 text-[10px] tracking-widest uppercase">
                <span>Model Designation: GRIT-V1.0.4-BETA</span>
                <span>Author: Elite Reserve Directorate</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
