import React from 'react';
import { Globe, TrendingUp, Target, Zap } from 'lucide-react';

interface ScoutMetricCardsProps {
  metadata: {
    total_market: string;
    india_share: string;
    opportunity_score: number;
    markets_analyzed?: number;
  };
}

export const ScoutMetricCards: React.FC<ScoutMetricCardsProps> = ({ metadata }) => {
  const isValidValue = (val: string | number | undefined) => {
    if (val === undefined || val === null) return false;
    const str = String(val).trim();
    return str !== '' && str !== '0' && str !== '$0' && str !== '$0M' && str !== '0%' && str !== 'undefined';
  };

  const metrics = [
    {
      label: 'Global TAM',
      value: isValidValue(metadata.total_market) ? metadata.total_market : null,
      sub: 'Total Addressable Market',
      icon: Globe,
      accent: '#3b82f6',
      accentBg: 'rgba(59,130,246,0.08)',
      accentBorder: 'rgba(59,130,246,0.2)',
    },
    {
      label: "India's Share",
      value: isValidValue(metadata.india_share) ? metadata.india_share : null,
      sub: 'Of Global Imports',
      icon: TrendingUp,
      accent: '#10b981',
      accentBg: 'rgba(16,185,129,0.08)',
      accentBorder: 'rgba(16,185,129,0.2)',
    },
    {
      label: 'Opportunity Score',
      value: isValidValue(metadata.opportunity_score) ? `${metadata.opportunity_score}` : null,
      suffix: '/100',
      sub: 'Alpha Index',
      icon: Target,
      accent: '#f59e0b',
      accentBg: 'rgba(245,158,11,0.08)',
      accentBorder: 'rgba(245,158,11,0.2)',
    },
    {
      label: 'Execution Posture',
      value: isValidValue(metadata.opportunity_score)
        ? metadata.opportunity_score > 75 ? 'Aggressive' : metadata.opportunity_score > 50 ? 'Strategic' : 'Selective'
        : null,
      sub: 'Recommended Mode',
      icon: Zap,
      accent: '#8b5cf6',
      accentBg: 'rgba(139,92,246,0.08)',
      accentBorder: 'rgba(139,92,246,0.2)',
    },
  ].filter(m => m.value !== null);

  if (metrics.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-8 lg:px-16 -mt-8 relative z-20 pb-2">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-2xl p-6 border backdrop-blur-xl flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02]"
          style={{ background: m.accentBg, borderColor: m.accentBorder }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">{m.label}</span>
            <m.icon className="w-4 h-4 opacity-40" style={{ color: m.accent }} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black tracking-tight text-white">{m.value}</span>
            {m.suffix && <span className="text-sm text-white/20 font-mono">{m.suffix}</span>}
          </div>
          <span className="text-[9px] text-white/20 font-medium uppercase tracking-widest">{m.sub}</span>
        </div>
      ))}
    </div>
  );
};
