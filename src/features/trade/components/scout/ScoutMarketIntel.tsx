import React from 'react';
import { Card } from '@/components/ui/card';
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
    <div className="px-8 lg:px-12 py-16 bg-slate-50 border-y border-slate-200">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-black tracking-tight font-syne text-slate-900 mb-12 text-center">Strategic Market Intelligence</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trends */}
          <Card className="p-8 bg-white border-slate-200 rounded-3xl shadow-sm h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xl text-slate-900">Key Trends</h3>
            </div>
            <ul className="space-y-4">
              {intel.top_trends.map((t, idx) => (
                <li key={idx} className="flex gap-3 text-slate-600 text-sm leading-relaxed">
                  <span className="text-blue-500 font-bold">•</span>
                  {t}
                </li>
              ))}
            </ul>
          </Card>

          {/* Competitive Context */}
          <Card className="p-8 bg-white border-slate-200 rounded-3xl shadow-sm h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xl text-slate-900">Competitive Edge</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {intel.india_vs_competitors}
            </p>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Certification Status</div>
              <p className="text-xs text-emerald-800 font-medium">{recommendations.certification_notes}</p>
            </div>
          </Card>

          {/* Logic */}
          <Card className="p-8 bg-slate-900 border-slate-800 rounded-3xl shadow-2xl h-full text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xl text-white">Logic of Success</h3>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-8 italic">
              "{intel.path_of_least_resistance}"
            </p>
            <div className="space-y-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-500">Target Rollout</div>
              <div className="flex flex-wrap gap-2">
                {recommendations.phase_1_markets.map(m => (
                  <Badge key={m} className="bg-white/10 text-white hover:bg-white/20 border-white/10 font-bold">{m}</Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
