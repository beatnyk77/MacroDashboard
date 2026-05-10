import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Globe, Target, Zap } from 'lucide-react';

interface ScoutMetricCardsProps {
  metadata: {
    total_addressable_market: string;
    india_global_share: string;
    opportunity_score: number;
  };
}

export const ScoutMetricCards: React.FC<ScoutMetricCardsProps> = ({ metadata }) => {
  const metrics = [
    {
      label: 'Global Market Size (TAM)',
      value: metadata.total_addressable_market,
      sub: 'Annual Import Value',
      icon: Globe,
      color: 'text-blue-500',
      bg: 'bg-blue-500/5',
    },
    {
      label: "India's Market Share",
      value: metadata.india_global_share,
      sub: 'Of Global Demand',
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/5',
    },
    {
      label: 'Strategic Opportunity Score',
      value: `${metadata.opportunity_score}/100`,
      sub: 'Proprietary Index',
      icon: Target,
      color: 'text-amber-500',
      bg: 'bg-amber-500/5',
    },
    {
      label: 'Recommended Posture',
      value: metadata.opportunity_score > 75 ? 'Aggressive Expansion' : metadata.opportunity_score > 50 ? 'Strategic Growth' : 'Opportunistic',
      sub: 'Market Entry Strategy',
      icon: Zap,
      color: 'text-rose-500',
      bg: 'bg-rose-500/5',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-8 lg:px-12 -mt-8 relative z-20">
      {metrics.map((m) => (
        <Card key={m.label} className="bg-white border border-slate-200 shadow-xl p-6 rounded-2xl flex flex-col justify-between hover:border-blue-500/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-xl ${m.bg}`}>
              <m.icon className={`w-5 h-5 ${m.color}`} />
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{m.label}</div>
            <div className="text-3xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              {m.value}
            </div>
            <div className="text-slate-500 text-xs mt-1 font-medium">{m.sub}</div>
          </div>
        </Card>
      ))}
    </div>
  );
};
