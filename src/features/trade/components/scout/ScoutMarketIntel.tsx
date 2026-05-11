import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ShieldCheck, Zap } from 'lucide-react';

interface ScoutMarketIntelProps {
  intel: {
    top_trends: string[];
    india_vs_competitors: string;
    path_of_least_resistance: string;
  };
  recommendations: {
    phase_1_markets: string[];
    phase_2_markets: string[];
    certification_notes: string;
    key_risks: string[];
  };
}

export const ScoutMarketIntel: React.FC<ScoutMarketIntelProps> = ({ intel, recommendations }) => {
  return (
    <div className="px-8 lg:px-20 py-32 bg-[#020617]">
      <div className="max-w-[1300px] mx-auto">
        <div className="mb-20 text-center">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-6">Intelligence Synthesis</h2>
          <h3 className="text-5xl lg:text-7xl font-black tracking-tighter text-white font-syne">Strategic Market Intelligence</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Trends */}
          <div className="p-10 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-2xl h-full flex flex-col group hover:bg-slate-900/60 transition-all duration-500">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400 border border-blue-500/10 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="font-black text-2xl text-white tracking-tight">Market Momentum</h3>
            </div>
            <ul className="space-y-6 flex-1">
              {intel.top_trends.map((t, idx) => (
                <li key={idx} className="flex gap-4 text-white/50 text-base leading-relaxed group-hover:text-white/70 transition-colors">
                  <span className="text-blue-500 font-black font-mono mt-1 text-xs">{String(idx + 1).padStart(2, '0')}</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Competitive Context */}
          <div className="p-10 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-2xl h-full flex flex-col group hover:bg-slate-900/60 transition-all duration-500">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-emerald-600/10 rounded-2xl text-emerald-400 border border-emerald-500/10 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-black text-2xl text-white tracking-tight">Competitive Advantage</h3>
            </div>
            <p className="text-white/50 text-base leading-relaxed mb-10 group-hover:text-white/70 transition-colors">
              {intel.india_vs_competitors}
            </p>
            <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl backdrop-blur-md">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">Certification & Compliance</div>
              <p className="text-sm text-emerald-400/80 font-medium leading-snug">{recommendations.certification_notes}</p>
            </div>
          </div>

          {/* Strategic Posture */}
          <div className="p-10 bg-blue-600 border border-blue-500/20 rounded-[2.5rem] shadow-[0_30px_100px_rgba(37,99,235,0.2)] h-full flex flex-col group hover:scale-[1.02] transition-all duration-500 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.2),transparent)]" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-white/10 rounded-2xl text-white border border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-black text-2xl text-white tracking-tight">Path of Success</h3>
              </div>
              <p className="text-white/90 text-xl font-bold leading-relaxed mb-12 italic tracking-tight">
                "{intel.path_of_least_resistance}"
              </p>
              <div className="space-y-6">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Primary Launch Vector</div>
                <div className="flex flex-wrap gap-3">
                  {recommendations.phase_1_markets.map(m => (
                    <Badge key={m} className="bg-white/10 text-white hover:bg-white/20 border-white/20 font-black px-4 py-1.5 rounded-xl tracking-widest text-[10px] shadow-sm">{m}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
