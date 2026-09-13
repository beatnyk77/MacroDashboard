import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  FileText, 
  ShieldCheck
} from 'lucide-react';

interface FOMCMinutesRecord {
  id: string;
  meeting_date: string;
  release_date: string;
  overall_tone: string;
  key_themes: string[];
  notable_shifts: string | null;
  capital_implications: string | null;
  actionable_insight: string | null;
  raw_analysis: string | null;
  pdf_url: string | null;
  created_at: string;
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export const FOMCMinutesAnalysisCard: React.FC = () => {
  const [analysis, setAnalysis] = useState<FOMCMinutesRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    const fetchLatestAnalysis = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('fomc_minutes_analysis')
          .select('*')
          .order('meeting_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching FOMC Minutes analysis:', error);
        } else if (data) {
          setAnalysis(data as unknown as FOMCMinutesRecord); // TODO(types): key_themes is Json in DB; interface expects string[]
        }
      } catch (err) {
        console.error('Unexpected error fetching FOMC analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 md:p-8 animate-pulse space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-1/3 bg-slate-800 rounded-md"></div>
          <div className="h-8 w-24 bg-slate-800 rounded-full"></div>
        </div>
        <div className="h-4 w-1/4 bg-slate-800 rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="h-32 bg-slate-800 rounded-xl"></div>
          <div className="h-32 bg-slate-800 rounded-xl"></div>
        </div>
        <div className="h-24 bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="w-full bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800/60 rounded-2xl p-8 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/30">
          <FileText className="w-6 h-6 text-slate-500" />
        </div>
        <h3 className="text-lg font-bold text-white uppercase tracking-wider">No FOMC Ingestion Data Available</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          No Federal Open Market Committee minutes analysis has been processed yet. Trigger ingestion securely using the check-fomc-minutes Edge Function.
        </p>
      </div>
    );
  }

  // Format dates for premium aesthetic display
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Setup tone indicators based on Claude synthesis bias
  const getToneConfig = (tone: string) => {
    const lowerTone = tone.toLowerCase();
    if (lowerTone.includes('hawkish')) {
      return {
        badgeStyle: 'from-red-500/15 to-red-600/5 border-red-500/30 text-red-400',
        icon: <TrendingUp className="w-5 h-5 text-red-400" />,
        shadowGlow: 'shadow-red-500/5',
        label: tone
      };
    } else if (lowerTone.includes('dovish')) {
      return {
        badgeStyle: 'from-emerald-500/15 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
        icon: <TrendingDown className="w-5 h-5 text-emerald-400" />,
        shadowGlow: 'shadow-emerald-500/5',
        label: tone
      };
    } else {
      return {
        badgeStyle: 'from-blue-500/15 to-blue-600/5 border-blue-500/30 text-blue-400',
        icon: <Activity className="w-5 h-5 text-blue-400" />,
        shadowGlow: 'shadow-blue-500/5',
        label: tone
      };
    }
  };

  const toneConfig = getToneConfig(analysis.overall_tone);

  // Simple markdown renderer for extended minutes analysis
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((para, i) => {
      const trimmed = para.trim();
      if (!trimmed) return <div key={i} className="h-3" />;
      
      // Render headers
      if (trimmed.startsWith('###')) {
        return <h4 key={i} className="text-md font-bold text-white mt-4 mb-2 uppercase tracking-wide border-l-2 border-slate-500 pl-2">{trimmed.replace('###', '').trim()}</h4>;
      }
      if (trimmed.startsWith('##')) {
        return <h3 key={i} className="text-lg font-black text-foreground mt-5 mb-3 uppercase tracking-wider border-l-3 border-blue-500 pl-3">{trimmed.replace('##', '').trim()}</h3>;
      }
      if (trimmed.startsWith('#')) {
        return <h2 key={i} className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-6 mb-4 uppercase tracking-heading">{trimmed.replace('#', '').trim()}</h2>;
      }
      
      // Render bullet items
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        return (
          <li key={i} className="text-muted-foreground text-sm list-none flex items-start gap-2 py-0.5 ml-2">
            <span className="text-blue-500 mt-1 text-[10px]">■</span>
            <span>{trimmed.substring(1).trim()}</span>
          </li>
        );
      }

      // Render standard paragraph text
      return <p key={i} className="text-foreground/90 text-sm leading-relaxed mb-3 text-justify">{trimmed}</p>;
    });
  };

  return (
    <div className={`w-full bg-card border border-border rounded-2xl shadow-sm dark:shadow-xl overflow-hidden ${toneConfig.shadowGlow}`}>
      
      {/* Premium Header Panel */}
      <header className="border-b border-border p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-muted/30">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
            <h2 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-heading">
              FOMC Minutes Intelligence
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Meeting Date: <strong className="text-foreground">{formatDate(analysis.meeting_date)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              Observed Release: <strong className="text-foreground">{formatDate(analysis.release_date)}</strong>
            </span>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground pt-1">
            Interpretive summary of published FOMC minutes · not a forecast or investment advice
          </p>
        </div>

        {/* Dynamic Glass Tone Badge */}
        <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border bg-gradient-to-r font-mono font-bold tracking-wider text-sm shadow-md ${toneConfig.badgeStyle}`}>
          {toneConfig.icon}
          {toneConfig.label.toUpperCase()}
        </div>
      </header>

      <div className="p-6 md:p-8 space-y-8">
        
        {/* Pills: Key Themes */}
        <div className="space-y-3">
          <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Core Macroeconomic Discussion Focus Areas
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {analysis.key_themes.map((theme, idx) => (
              <span 
                key={idx} 
                className="px-3.5 py-1.5 rounded-full bg-card border border-border text-xs font-semibold text-foreground hover:bg-muted hover:border-blue-500/40 transition-all duration-300 cursor-default shadow-sm"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>

        {/* Dual Column: stance shifts + structural regime implications */}
        {(hasText(analysis.notable_shifts) || hasText(analysis.capital_implications)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {hasText(analysis.notable_shifts) && (
          <div className="bg-card border border-border rounded-xl p-5 md:p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Notable Stance Shifts</h4>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed text-justify">
              {analysis.notable_shifts}
            </p>
          </div>
          )}

          {hasText(analysis.capital_implications) && (
          <div className="bg-card border border-border rounded-xl p-5 md:p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Regime / Structural Implications</h4>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed text-justify">
              {analysis.capital_implications}
            </p>
          </div>
          )}
        </div>
        )}

        {/* Structural takeaway — neutral chrome, not trade advisory */}
        {hasText(analysis.actionable_insight) && (
        <div className="bg-muted/40 border border-border rounded-xl p-5 md:p-6 space-y-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest font-mono">
              Structural takeaway
            </h4>
          </div>
          <p className="text-foreground/90 text-sm font-medium leading-relaxed text-justify">
            {analysis.actionable_insight}
          </p>
        </div>
        )}

        {/* Folding Accordion: full minutes analysis */}
        {hasText(analysis.raw_analysis) && (
        <div className="border-t border-border pt-6">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full py-2 group text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Full minutes analysis
            </span>
            <div className="bg-muted border border-border rounded-lg p-1 text-muted-foreground group-hover:text-foreground transition-all">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {expanded && (
            <div className="mt-6 bg-card border border-border rounded-xl p-6 overflow-hidden animate-slide-down shadow-sm">
              <div className="max-w-none space-y-4 select-text">
                {renderMarkdown(analysis.raw_analysis)}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Source References */}
        {analysis.pdf_url && (
          <div className="flex justify-end pt-2 border-t border-slate-800/20">
            <a 
              href={analysis.pdf_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200 group"
            >
              Access Federal Reserve Source Document
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </a>
          </div>
        )}

      </div>
    </div>
  );
};
