import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ScoutHeaderProps {
  metadata: {
    hs_code: string;
    product_description: string;
    generated_at: string;
    data_source: string;
  };
}

export const ScoutHeader: React.FC<ScoutHeaderProps> = ({ metadata }) => {
  return (
    <div className="bg-[#0A0E1A] text-white p-8 lg:p-12 border-b border-white/10 relative overflow-hidden">
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-blue-500 font-black tracking-tighter text-xl">GRAPHIQUESTOR</span>
            <div className="h-4 w-px bg-white/20" />
            <span className="text-white/60 font-bold tracking-widest text-xs uppercase">Export Scout Playbook</span>
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-black tracking-tight font-syne mb-2 leading-tight">
            HS {metadata.hs_code}
          </h1>
          <p className="text-xl lg:text-2xl text-white/80 font-medium max-w-3xl leading-snug">
            {metadata.product_description}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 text-right">
          <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-400 font-bold px-3 py-1">
            CONFIDENTIAL STRATEGIC INTELLIGENCE
          </Badge>
          <div className="text-white/40 text-sm font-mono uppercase tracking-wider">
            Generated: {new Date(metadata.generated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-white/30 text-xs font-mono uppercase tracking-widest">
            Source: {metadata.data_source}
          </div>
        </div>
      </div>
    </div>
  );
};
