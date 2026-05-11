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
    <div className="min-h-screen bg-white text-slate-900 pb-20 selection:bg-blue-100">
      {/* Action Bar (Hidden on Print) */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex justify-between items-center print:hidden">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="text-slate-500 hover:text-slate-900 font-bold"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="font-bold border-slate-200" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print to PDF
          </Button>
          <Button variant="outline" size="sm" className="font-bold border-slate-200">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button variant="default" size="sm" className="font-bold bg-blue-600 hover:bg-blue-700">
            <Share2 className="w-4 h-4 mr-2" />
            Share Playbook
          </Button>
        </div>
      </div>

      {/* Document Content */}
      <article className="max-w-[1200px] mx-auto shadow-2xl my-8 lg:my-12 print:my-0 print:shadow-none print:max-w-none">
        {/* Page 1: Executive Summary */}
        <section className="bg-white min-h-[1000px] print:min-h-0">
          <ScoutHeader metadata={playbook.metadata} />
          <ScoutMetricCards metadata={playbook.metadata} />
          
          <div className="px-8 lg:px-12 py-16">
            <div className="max-w-3xl">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-blue-600 mb-4">Executive Summary</h2>
              <h3 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 mb-6 font-syne">
                {playbook.executive_summary.headline}
              </h3>
              <p className="text-xl text-slate-600 leading-relaxed font-medium mb-8">
                {playbook.executive_summary.summary}
              </p>
              <div className="p-6 bg-slate-900 rounded-3xl text-white">
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Core Insight</div>
                <p className="text-lg font-bold italic leading-snug">
                  "{playbook.executive_summary.key_insight}"
                </p>
              </div>
            </div>
          </div>
          
          <ScoutBeachheadsTable beachheads={playbook.priority_beachheads} />
        </section>

        {/* Page 2: Market Intel */}
        <section className="print:break-before-page">
          <ScoutMarketIntel intel={playbook.market_intelligence} recommendations={playbook.strategic_recommendations} />
        </section>

        {/* Page 3: Execution */}
        <section className="print:break-before-page">
          <ScoutExecutionPlaybook playbook={playbook.execution_playbook} />
          
          {/* Footer */}
          <div className="px-8 lg:px-12 py-12 border-t border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <div className="text-slate-900 font-black tracking-tighter">{playbook.footer.generated_by}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Trade Intelligence Unit</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Generated On</div>
              <div className="text-slate-900 font-bold text-sm">{playbook.footer.date}</div>
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
          }
        }
      `}</style>
    </div>
  );
};

export default ExportScoutPlaybookPage;

