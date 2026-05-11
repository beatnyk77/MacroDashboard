import React from 'react';

interface ScoutHeaderProps {
  metadata: {
    hsn_code: string;
    hsn_description: string;
    generated_at: string;
    report_id: string;
  };
}

export const ScoutHeader: React.FC<ScoutHeaderProps> = ({ metadata }) => {
  return (
    <div className="relative px-8 lg:px-20 py-20 overflow-hidden bg-[#020617]">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_-20%,rgba(59,130,246,0.2),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.15),transparent)]" />
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-16">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-10">
            <div className="px-4 py-1.5 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-lg shadow-blue-600/30">
              Export Scout v2.5
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              Institutional Intelligence Briefing
            </div>
          </div>
          
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-white mb-8 font-syne leading-[0.9]">
            {metadata.hsn_code} <span className="text-white/10">/</span> <br />
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{metadata.hsn_description}</span>
          </h1>
          
          <div className="flex flex-wrap gap-10 items-center mt-12">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Internal Report ID</span>
              <span className="text-sm font-bold text-white/90 font-mono tracking-[0.2em] uppercase">{metadata.report_id}</span>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Effective Date</span>
              <span className="text-sm font-bold text-white/90 font-mono tracking-[0.2em] uppercase">{metadata.generated_at}</span>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Intelligence Source</span>
              <span className="text-sm font-bold text-white/90 font-mono tracking-[0.2em] uppercase">UN Comtrade / GQ-Proprietary</span>
            </div>
          </div>
        </div>

        <div className="lg:w-56 h-56 border border-white/5 bg-white/[0.02] rounded-[3rem] backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center group transition-all hover:bg-white/[0.05] hover:scale-105 duration-500">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-3xl font-black text-white mb-6 shadow-[0_20px_50px_rgba(37,99,235,0.3)] group-hover:rotate-6 transition-all duration-500">
            GQ
          </div>
          <div className="text-sm font-black tracking-[0.2em] text-white uppercase leading-tight">
            GraphiQuestor <br />
            <span className="text-blue-400 opacity-60 text-[10px]">Macro-Intel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
