import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ScoutHeader } from '@/features/trade/components/scout/ScoutHeader';
import { ScoutMetricCards } from '@/features/trade/components/scout/ScoutMetricCards';
import { ScoutBeachheadsTable } from '@/features/trade/components/scout/ScoutBeachheadsTable';
import { ScoutMarketIntel } from '@/features/trade/components/scout/ScoutMarketIntel';
import { ScoutExecutionPlaybook } from '@/features/trade/components/scout/ScoutExecutionPlaybook';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Printer, Download, Share2, Loader2 } from 'lucide-react';

export const ExportScoutPlaybookPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const description = searchParams.get('description') || '';
  const navigate = useNavigate();

  console.log('[ExportScoutPlaybook] Rendering for code:', code);

  const { data: playbook, isLoading, error } = useQuery({
    queryKey: ['export-scout', code, description],
    queryFn: async () => {
      console.log('[ExportScoutPlaybook] Fetching playbook for:', code, description);
      const { data, error } = await supabase.functions.invoke('generate-export-scout', {
        body: { hsn: code, hsn_description: description }
      });
      if (error) {
        console.error('[ExportScoutPlaybook] Edge Function Error:', error);
        throw error;
      }
      console.log('[ExportScoutPlaybook] Received data:', data);
      return data;
    },
    enabled: !!code,
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
        <h2 className="text-2xl font-black tracking-tight font-syne mb-2">Synthesizing Strategic Intelligence</h2>
        <p className="text-white/40 text-sm font-medium animate-pulse">Consulting UN Comtrade & Global Market Indices...</p>
      </div>
    );
  }

  if (error || !playbook) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-3xl max-w-md text-center">
          <h2 className="text-2xl font-black text-rose-500 mb-4">Intelligence Synthesis Failed</h2>
          <p className="text-white/60 mb-8">
            {error instanceof Error ? error.message : (typeof error === 'object' && error !== null && 'message' in error) ? (error as any).message : 'An unexpected error occurred during generation.'}
          </p>
          <Button onClick={() => navigate(-1)} variant="outline" className="border-white/10 hover:bg-white/5">
            Return to Overview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-20 selection:bg-emerald-500/30">
      {/* Action Bar (Hidden on Print) */}
      <div className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center print:hidden">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="text-white/40 hover:text-white font-black uppercase tracking-widest text-[10px] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Analysis
        </Button>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="font-black uppercase tracking-widest text-[10px] border-white/10 hover:bg-white/5 bg-transparent text-white/70" 
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5 mr-2 text-blue-400" />
            Print Intelligence
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="font-black uppercase tracking-widest text-[10px] border-white/10 hover:bg-white/5 bg-transparent text-white/70"
          >
            <Download className="w-3.5 h-3.5 mr-2 text-emerald-400" />
            Raw Data
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="font-black uppercase tracking-widest text-[10px] bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
          >
            <Share2 className="w-3.5 h-3.5 mr-2" />
            Distribute
          </Button>
        </div>
      </div>

      {/* Document Content */}
      <article className="max-w-[1300px] mx-auto my-8 lg:my-16 print:my-0 shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5 rounded-[2rem] overflow-hidden bg-slate-950/50 backdrop-blur-sm print:shadow-none print:border-none print:rounded-none">
        {/* Page 1: Executive Summary */}
        <section className="min-h-[1000px] print:min-h-0 border-b border-white/5">
          <ScoutHeader metadata={playbook.metadata} />
          <ScoutMetricCards metadata={playbook.metadata} />
          
          <div className="px-8 lg:px-20 py-24 relative">
            {/* Decorative element */}
            <div className="absolute top-24 left-8 w-1 h-24 bg-gradient-to-b from-blue-500 to-transparent opacity-50" />
            
            <div className="max-w-4xl">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-6">Strategic Executive Brief</h2>
              <h3 className="text-4xl lg:text-5xl font-black tracking-tighter text-white mb-8 font-syne leading-[1.1]">
                {playbook.executive_summary?.headline || 'Intelligence Synthesis Complete'}
              </h3>
              <p className="text-xl text-white/70 leading-relaxed font-medium mb-12 max-w-3xl">
                {playbook.executive_summary?.summary || 'Executive briefing for the analyzed trade corridor is now available for strategic review.'}
              </p>
              
              <div className="relative group p-[1px] rounded-3xl overflow-hidden bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-blue-500/20 max-w-2xl">
                <div className="bg-slate-950 p-8 rounded-[calc(1.5rem-1px)]">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-3">Principal Insight</div>
                  <p className="text-xl font-bold italic leading-snug text-white/90">
                    "{playbook.executive_summary?.key_insight || 'Market demand velocity suggests significant untapped potential for quality-certified suppliers.'}"
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <ScoutBeachheadsTable beachheads={playbook.priority_beachheads || []} />
        </section>

        {/* Page 2: Market Intel */}
        <section className="print:break-before-page border-b border-white/5">
          <ScoutMarketIntel 
            intel={playbook.market_intelligence || { top_trends: [], india_vs_competitors: '', path_of_least_resistance: '' }} 
            recommendations={playbook.strategic_recommendations || { phase_1_markets: [], phase_2_markets: [], certification_notes: '', key_risks: [] }} 
          />
        </section>

        {/* Page 3: Execution */}
        <section className="print:break-before-page">
          <ScoutExecutionPlaybook playbook={playbook.execution_playbook || { timeline: [], outreach_templates: { cold_email: '', linkedin: '', whatsapp: '' } }} />
          
          {/* Footer */}
          <div className="px-8 lg:px-20 py-16 flex justify-between items-end bg-[#020617]/50 border-t border-white/5">
            <div>
              <div className="text-xl font-black tracking-tighter text-white flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-[10px]">GQ</div>
                {playbook.footer?.generated_by || 'GraphiQuestor Intelligence'}
              </div>
              <div className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mt-2">Macro Intelligence Division · Confidential</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">Authorization Date</div>
              <div className="text-white font-black text-sm font-mono tracking-wider">{playbook.footer?.date || new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </section>
      </article>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:break-before-page {
            break-before: page;
          }
          article {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          section {
            border-bottom: 1px solid #eee !important;
          }
          h1, h2, h3, h4, p, div {
            color: black !important;
          }
          .bg-slate-950 { background: #f8fafc !important; color: black !important; border: 1px solid #e2e8f0 !important; }
        }
      `}</style>
    </div>
  );
};

export default ExportScoutPlaybookPage;

