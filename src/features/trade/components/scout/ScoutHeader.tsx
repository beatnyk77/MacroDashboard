import React from 'react';
import { Shield } from 'lucide-react';

interface ScoutHeaderProps {
  metadata: {
    hsn_code: string;
    hsn_description: string;
    generated_at: string;
    report_id: string;
    markets_analyzed?: number;
  };
}

export const ScoutHeader: React.FC<ScoutHeaderProps> = ({ metadata }) => {
  return (
    <div className="relative px-8 lg:px-16 py-16 overflow-hidden bg-[#020617]">
      {/* Gradient glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_-10%,rgba(59,130,246,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_110%,rgba(16,185,129,0.12),transparent_60%)]" />

      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        {/* Left: identity */}
        <div className="flex-1 min-w-0">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">Export Scout · Institutional Playbook</span>
            </div>
          </div>

          {/* HS Code + Description */}
          <div className="flex items-baseline gap-4 mb-3">
            <span className="text-5xl lg:text-7xl font-black tracking-tighter text-white leading-none font-mono">
              {metadata.hsn_code}
            </span>
            <span className="text-white/20 text-4xl font-thin">/</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white/80 tracking-tight mb-8 max-w-xl leading-tight">
            {metadata.hsn_description}
          </h1>

          {/* Meta strip */}
          <div className="flex flex-wrap gap-6 items-center">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Report ID</span>
              <span className="text-xs font-bold text-white/60 font-mono">{metadata.report_id}</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Generated</span>
              <span className="text-xs font-bold text-white/60 font-mono">{metadata.generated_at}</span>
            </div>
            {metadata.markets_analyzed && (
              <>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Markets Analyzed</span>
                  <span className="text-xs font-bold text-white/60 font-mono">{metadata.markets_analyzed}</span>
                </div>
              </>
            )}
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Data Source</span>
              <span className="text-xs font-bold text-white/60 font-mono">UN Comtrade · GraphiQuestor</span>
            </div>
          </div>
        </div>

        {/* Right: brand mark */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-lg font-black text-white shadow-[0_8px_32px_rgba(37,99,235,0.4)]">
            GQ
          </div>
          <div className="mt-2 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] text-right">MacroIntel</div>
        </div>
      </div>
    </div>
  );
};
