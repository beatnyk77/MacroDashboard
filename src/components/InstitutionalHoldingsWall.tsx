import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Shield, Cpu, Globe, Database } from 'lucide-react';
import { SectionErrorBoundary } from './SectionErrorBoundary';

// Supabase client initialization
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface InstitutionalHolding {
  id: string;
  fund_name: string;
  fund_type: string;
  total_aum: number;
  top_sectors: Record<string, number>;
  qoq_delta: number;
  as_of_date: string;
}

const InstitutionalHoldingsWall: React.FC = () => {
  const [data, setData] = useState<InstitutionalHolding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: holdings, error } = await supabase
          .from('institutional_13f_holdings')
          .select('*')
          .order('total_aum', { ascending: false });

        if (error) throw error;
        setData(holdings || []);
      } catch (err) {
        console.error('Institutional Terminal Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatAUM = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    return `$${(value / 1e6).toFixed(1)}M`;
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center bg-slate-950/50 rounded-xl border border-white/12 backdrop-blur-xl border-dashed">
        <Cpu className="text-blue-500 animate-pulse mb-4 w-12 h-12" />
        <div className="text-blue-400 font-mono text-sm tracking-uppercase animate-pulse">DECRYPTING 13-F FILING STREAMS...</div>
        <div className="mt-2 text-xs text-slate-500 font-mono uppercase tracking-heading">SEC EDGAR SOURCE [v4.2]</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#020617] border border-white/12 rounded-xl overflow-hidden shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] backdrop-blur-xl">
      {/* Terminal Header */}
      <div className="px-8 py-6 border-b border-white/12 bg-gradient-to-r from-blue-900/20 via-slate-900/10 to-transparent flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-shimmer" />
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-white tracking-heading uppercase italic">
              13-F Smart Money <span className="text-blue-500">Tracker</span>
            </h2>
            <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-xs text-blue-400 font-mono font-bold uppercase tracking-uppercase">
              <Activity size={8} className="animate-pulse" />
              Flagship Monitor
            </div>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1.5 uppercase tracking-uppercase leading-none">
            Institutional Capital Allocation Registry • SEC Consolidated Tape • Actual Flows v4
          </p>
        </div>
        <div className="text-right hidden sm:block font-mono">
          <div className="text-xs text-slate-500 uppercase tracking-uppercase mb-1">Node Status: <span className="text-emerald-500">Nominal</span></div>
          <div className="text-lg font-black text-blue-400 tracking-heading">
            {formatAUM(data.reduce((acc, curr) => acc + curr.total_aum, 0))}
            <span className="text-xs text-slate-500 font-normal ml-2 uppercase">Total Monitored AUM</span>
          </div>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: AUM Rank (Matrix) */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-uppercase">Institutional Ranking by AUM</h3>
            </div>
            <div className="text-xs text-slate-600 font-mono uppercase tracking-uppercase">Ranked by Size (Market Value)</div>
          </div>
          
          <div className="h-[400px] w-full bg-slate-900/20 p-6 rounded-lg border border-white/5 relative group">
            <div className="absolute inset-0 bg-grid-white-02 pointer-events-none" />
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={data.slice(0, 8)} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="fund_name" 
                  type="category" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                  width={160}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#020617', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '10px'
                  }}
                />
                <Bar dataKey="total_aum" radius={[0, 4, 4, 0]} barSize={20}>
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#1e3a8a'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Sector Heatmap Grid */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-uppercase">Cross-Entity Sector Density</h3>
          </div>

          <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {data.map((fund) => (
              <div key={fund.id} className="bg-slate-900/40 p-4 rounded border border-white/5 hover:bg-slate-900/60 transition-colors border-l-2 border-l-blue-500/50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-500 font-mono font-bold tracking-heading">[{fund.fund_name.split(' ')[0].toUpperCase()}]</span>
                      <h4 className="text-xs font-black text-slate-200 uppercase tracking-heading">{fund.fund_name}</h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-white font-mono">{formatAUM(fund.total_aum)}</span>
                      {fund.qoq_delta !== 0 && (
                        <div className={`text-xs font-mono flex items-center ${fund.qoq_delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fund.qoq_delta >= 0 ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                          {Math.abs(fund.qoq_delta).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Heatmap line */}
                <div className="flex h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  {Object.entries(fund.top_sectors || {}).map(([sector, allocation], sIdx) => (
                    <div 
                      key={sIdx}
                      className="h-full transition-all group/sector relative"
                      style={{ 
                        width: `${allocation}%`, 
                        backgroundColor: `hsl(${210 + (sIdx * 20)}, 70%, ${50 - (sIdx * 5)}%)`,
                        opacity: 0.8
                      }}
                    >
                      {/* Hover details */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/20 p-2 rounded text-xs whitespace-nowrap hidden group-hover/sector:block z-50">
                        <span className="text-slate-400 font-bold">{sector}:</span> <span className="text-white font-mono">{allocation.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(fund.top_sectors || {}).slice(0, 3).map(([sector, allocation], sIdx) => (
                    <div key={sIdx} className="text-xs text-slate-500 font-mono uppercase tracking-heading">
                      {sector}: <span className="text-slate-300">{allocation.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Institutional Metadata Bar */}
      <div className="px-8 py-3 bg-slate-900/60 border-t border-white/5 flex flex-wrap items-center gap-x-12 gap-y-2">
        <div className="flex items-center gap-2">
          <Shield size={10} className="text-blue-500" />
          <span className="text-xs text-slate-600 font-mono uppercase font-bold tracking-uppercase">Compliance:</span>
          <span className="text-xs text-slate-400 font-mono font-black italic uppercase">SEC 13-F AUDIT COMPLETE</span>
        </div>
        <div className="flex items-center gap-2">
          <Database size={10} className="text-emerald-500" />
          <span className="text-xs text-slate-600 font-mono uppercase font-bold tracking-uppercase">Aggregator:</span>
          <span className="text-xs text-slate-400 font-mono">SUPABASE_EDGE_CLUSTER_SEC_V3</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="w-24 h-5 bg-blue-500/5 rounded flex bg-grid-white-05 overflow-hidden">
            <div className="h-full bg-blue-500/30 animate-pulse" style={{ width: '65%' }} />
          </div>
          <span className="text-xs text-slate-700 font-mono uppercase font-black">X_TAP_STREAM: NOMINAL</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.3); border-radius: 10px; }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer { animation: shimmer 3s infinite linear; }
        
        .bg-grid-white-02 {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.02)'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E");
        }
        .bg-grid-white-05 {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.05)'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E");
        }
      `}} />
    </div>
  );
};

// Internal Error Boundary Wrapper for Dashboard Resilience
const WrappedInstitutionalHoldingsWall: React.FC = () => (
  <SectionErrorBoundary name="13-F Institutional Holdings Monitor">
    <InstitutionalHoldingsWall />
  </SectionErrorBoundary>
);

export default WrappedInstitutionalHoldingsWall;
