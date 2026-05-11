import React from 'react';
import { TrendingUp, Globe, Target, Zap } from 'lucide-react';

interface ScoutMetricCardsProps {
  metadata: {
    total_market: string;
    india_share: string;
    opportunity_score: number;
  };
}

export const ScoutMetricCards: React.FC<ScoutMetricCardsProps> = ({ metadata }) => {
  const metrics = [
    {
      label: 'Global Market Size (TAM)',
      value: metadata.total_market,
      sub: 'Annual Cumulative Value',
      icon: Globe,
      color: 'text-blue-400',
      glow: 'shadow-blue-500/20',
      border: 'hover:border-blue-500/30',
    },
    {
      label: "India's Current Share",
      value: metadata.india_share,
      sub: 'Share of Global Trade',
      icon: TrendingUp,
      color: 'text-emerald-400',
      glow: 'shadow-emerald-500/20',
      border: 'hover:border-emerald-500/30',
    },
    {
      label: 'Strategic Opportunity',
      value: `${metadata.opportunity_score}`,
      sub: 'Institutional Alpha Score',
      icon: Target,
      color: 'text-amber-400',
      glow: 'shadow-amber-500/20',
      border: 'hover:border-amber-500/30',
    },
    {
      label: 'Execution Posture',
      value: metadata.opportunity_score > 75 ? 'Aggressive' : 'Strategic',
      sub: 'Recommended Mode',
      icon: Zap,
      color: 'text-purple-400',
      glow: 'shadow-purple-500/20',
      border: 'hover:border-purple-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-8 lg:px-20 -mt-12 relative z-20">
      {metrics.map((m) => (
        <div 
          key={m.label} 
          className={`bg-slate-900/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between transition-all duration-500 group cursor-default shadow-2xl ${m.border}`}
        >
          <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:scale-110 transition-transform duration-500 ${m.glow} shadow-2xl`}>
              <m.icon className={`w-6 h-6 ${m.color}`} />
            </div>
          </div>
          <div>
            <div className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{m.label}</div>
            <div className={`text-4xl font-black tracking-tighter text-white font-syne`}>
              {m.value}
              {m.label.includes('Opportunity') && <span className="text-sm text-white/20 ml-1 font-mono">/ 100</span>}
            </div>
            <div className="text-white/20 text-[10px] mt-2 font-black uppercase tracking-widest">{m.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
