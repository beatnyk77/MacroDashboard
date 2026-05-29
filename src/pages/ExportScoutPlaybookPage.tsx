import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SEOManager } from '@/components/SEOManager';
import { ScoutHeader } from '@/features/trade/components/scout/ScoutHeader';
import { ScoutMetricCards } from '@/features/trade/components/scout/ScoutMetricCards';
import { ScoutBeachheadsTable } from '@/features/trade/components/scout/ScoutBeachheadsTable';
import { ScoutMarketIntel } from '@/features/trade/components/scout/ScoutMarketIntel';
import { ScoutExecutionPlaybook } from '@/features/trade/components/scout/ScoutExecutionPlaybook';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Download, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

interface PlaybookData {
  metadata: {
    hsn_code: string;
    hsn_description: string;
    generated_at: string;
    report_id: string;
    total_market: string;
    india_share: string;
    opportunity_score: number;
    markets_analyzed?: number;
    data_source?: string;
  };
  executive_summary: {
    headline: string;
    summary: string;
    key_insight: string;
  };
  priority_beachheads: {
    country: string;
    total_market: string;
    india_share: number;
    yoy_growth: number;
    opportunity_score: number;
    priority: string;
    recommended_action: string;
  }[];
  market_intelligence: {
    top_trends: string[];
    india_vs_competitors: string;
    path_of_least_resistance: string;
  };
  strategic_recommendations: {
    phase_1_markets: string[];
    phase_2_markets: string[];
    certification_notes: string;
    key_risks: string[];
  };
  execution_playbook: {
    timeline: {
      week: string;
      focus: string;
      key_actions: string[];
    }[];
    outreach_templates: {
      cold_email: string;
      linkedin: string;
      whatsapp: string;
    };
  };
  footer: {
    generated_by: string;
    date: string;
    data_sources: string;
  };
}

export const ExportScoutPlaybookPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const description = searchParams.get('description') || '';
  const navigate = useNavigate();

  const { data: dataPlaybook, isLoading: isDataLoading, error: dataError, refetch: refetchData } = useQuery<PlaybookData>({
    queryKey: ['export-scout', code, description, 'data'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-export-scout', {
        body: { hsn: code, hsn_description: description, mode: 'data' },
      });
      if (error) throw error;
      if (!data) throw new Error('No data returned from intelligence engine');
      if ((data as any).error) throw new Error((data as any).error);
      return data as PlaybookData;
    },
    enabled: !!code,
    staleTime: Infinity,
    retry: 1,
  });

  const { data: fullPlaybook, isLoading: isAiLoading } = useQuery<PlaybookData>({
    queryKey: ['export-scout', code, description, 'full'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-export-scout', {
        body: { hsn: code, hsn_description: description, mode: 'full' },
      });
      if (error) throw error;
      if (!data) throw new Error('No AI data returned');
      if ((data as any).error) throw new Error((data as any).error);
      return data as PlaybookData;
    },
    enabled: !!code && !!dataPlaybook,
    staleTime: Infinity,
    retry: 1,
  });

  const playbook = fullPlaybook || dataPlaybook;
  const isLoading = isDataLoading;
  const error = dataError;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6 p-8">
        <div className="relative">
          <div className="absolute -inset-6 bg-blue-500/10 blur-2xl rounded-full" />
          <Loader2 className="relative w-10 h-10 text-blue-500 animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-black text-white mb-1">Synthesizing Intelligence</h2>
          <p className="text-sm text-white/30">Loading market data for {code}…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !playbook || (playbook as any).error) {
    const errorMsg = (playbook as any)?.error
      || (error instanceof Error ? error.message : 'Intelligence synthesis encountered an error.');
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-8">
        <div className="max-w-sm w-full bg-slate-900/50 border border-rose-500/15 p-8 rounded-2xl text-center">
          <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-rose-500/15">
            <AlertTriangle className="w-7 h-7 text-rose-400" />
          </div>
          <h2 className="text-lg font-black text-white mb-2">Synthesis Failed</h2>
          <p className="text-rose-400/60 text-xs font-medium mb-6 leading-relaxed">{errorMsg}</p>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full bg-white text-black font-black uppercase tracking-widest text-xs py-5 rounded-xl hover:bg-slate-100"
              onClick={() => refetchData()}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Retry
            </Button>
            <Button
              variant="ghost"
              className="w-full text-white/30 hover:text-white text-xs font-bold"
              onClick={() => navigate(-1)}
            >
              ← Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isSynthesizing = isAiLoading && !fullPlaybook;
  const summary = playbook.executive_summary;
  const hasHeadline = !!summary?.headline?.trim();
  const hasInsight = !!summary?.key_insight?.trim();
  const hasSummary = !!summary?.summary?.trim();
  const hasBeachheads = playbook.priority_beachheads?.length > 0;
  const hasIntel = !!(
    playbook.market_intelligence?.top_trends?.length ||
    playbook.market_intelligence?.india_vs_competitors ||
    playbook.market_intelligence?.path_of_least_resistance
  );
  const hasPlaybook = !!(
    playbook.execution_playbook?.timeline?.length ||
    playbook.execution_playbook?.outreach_templates?.cold_email
  );

  const displayTitle = `Confidential Export Playbook for HS ${code} | GraphiQuestor`
  const displayDesc = `Confidential institutional export scout intelligence playbook for HS code ${code}. Fusing bilateral trade flows, seller HHI concentration indices, 90-day execution sequences, and outreach templates.`

  return (
    <div className="min-h-screen bg-[#020617] pb-24">
      <SEOManager
        title={displayTitle}
        description={displayDesc}
        keywords={[`HS ${code} Playbook`, `Export Playbook HS ${code}`, `GraphiQuestor Trade Playbook`, 'GraphiQuestor']}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "name": `Confidential Export Playbook for HS ${code}`,
          "description": `Confidential market execution strategy and bilateral trade opportunity mapping for HSN code ${code}.`,
          "url": `https://graphiquestor.com/trade/playbook/${code}`,
          "author": {
            "@id": "https://graphiquestor.com/#organization"
          }
        }}
      />

      {/* ── Sticky Nav ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-white/[0.06] px-6 lg:px-10 py-3 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/30 hover:text-white text-xs px-2"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Back
          </Button>
          <div className="h-3.5 w-px bg-white/10 hidden sm:block" />
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em] hidden sm:inline">
            Export Scout · {playbook.metadata.hsn_code}
          </span>
        </div>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] px-4"
          onClick={() => window.print()}
        >
          <Download className="w-3 h-3 mr-1.5" />
          Export PDF
        </Button>
      </nav>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <article className="max-w-[1280px] mx-auto my-8 lg:my-12 print:my-0 border border-white/[0.06] rounded-2xl overflow-hidden bg-slate-950/40 backdrop-blur-sm print:shadow-none print:border-none print:rounded-none">

        {/* 1. Header */}
        <ScoutHeader metadata={playbook.metadata} />

        {/* 2. KPI Metrics */}
        <div className="py-4">
          <ScoutMetricCards metadata={playbook.metadata} />
        </div>

        {/* AI Synthesis Loading Banner */}
        {isSynthesizing && (
          <div className="mx-8 lg:mx-16 my-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <div>
                <div className="text-sm font-bold text-white">Synthesizing AI Playbook...</div>
                <div className="text-xs text-white/50">Analyzing market context and building execution strategy</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.05] rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Nemotron 120B</span>
            </div>
          </div>
        )}

        {/* 3. Executive Summary */}
        {(hasHeadline || hasSummary || hasInsight) && (
          <div className="border-t border-white/[0.05] px-8 lg:px-16 py-12">
            <div className="max-w-3xl">
              {hasHeadline && (
                <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white mb-5 leading-tight">
                  {summary.headline}
                </h2>
              )}
              {hasSummary && (
                <p className="text-base text-white/50 leading-relaxed mb-6 max-w-2xl">
                  {summary.summary}
                </p>
              )}
              {hasInsight && (
                <div className="flex gap-4 p-5 bg-blue-500/5 border border-blue-500/15 rounded-xl max-w-2xl">
                  <div className="shrink-0 mt-0.5">
                    <div className="w-1 h-full min-h-[2rem] bg-blue-500 rounded-full" />
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1.5">Principal Insight</div>
                    <p className="text-sm font-semibold text-white/75 leading-snug italic">
                      "{summary.key_insight}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Priority Beachheads Table */}
        {hasBeachheads && (
          <div className="border-t border-white/[0.05]">
            <ScoutBeachheadsTable beachheads={playbook.priority_beachheads} />
          </div>
        )}

        {/* 5. Market Intelligence */}
        {hasIntel && (
          <div className="border-t border-white/[0.05]">
            <ScoutMarketIntel
              intel={playbook.market_intelligence}
              recommendations={playbook.strategic_recommendations}
              hsnCode={playbook.metadata.hsn_code}
            />
          </div>
        )}

        {/* 6. 90-Day Execution Playbook */}
        {hasPlaybook && (
          <div className="border-t border-white/[0.05]">
            <ScoutExecutionPlaybook playbook={playbook.execution_playbook} />
          </div>
        )}

        {/* 7. Footer */}
        <div className="border-t border-white/[0.05] px-8 lg:px-16 py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-[9px] font-black text-white">GQ</div>
            <div>
              <div className="text-xs font-bold text-white/40">{playbook.footer?.generated_by || 'GraphiQuestor Export Scout'}</div>
              <div className="text-[9px] text-white/15 uppercase tracking-[0.2em]">Macro Intelligence Division · Confidential</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-white/15 uppercase tracking-widest mb-0.5">Data Sources</div>
            <div className="text-[10px] text-white/25 font-mono">{playbook.footer?.data_sources || 'UN Comtrade Intelligence'}</div>
          </div>
        </div>

      </article>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          nav { display: none !important; }
          article { margin: 0 !important; padding: 0 !important; box-shadow: none !important; background: white !important; border: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ExportScoutPlaybookPage;
