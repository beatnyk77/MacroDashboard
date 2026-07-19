import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SEOManager } from '@/components/SEOManager';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { useMacroBrief } from '@/hooks/useMacroBrief';
import type { FocusArea } from '@/types/brief';
import { FOCUS_AREA_LABELS } from '@/types/brief';
import { FocusAreaSelector } from '@/components/brief/FocusAreaSelector';
import { ShareButton } from '@/components/ShareButton';
import { getRegimeColors } from '@/constants/semanticColors';
import { format, subDays, addDays, parseISO, isValid } from 'date-fns';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { marketDateISO } from '@/lib/marketDate';
import { withTrailingSlash } from '@/lib/urlPath';

const STORAGE_KEY = 'gq_focus_areas';
const DEFAULT_AREAS: FocusArea[] = ['india', 'us_macro', 'gold_dedollarization'];

const TEXTS = {
  briefUnavailable: "Brief Unavailable",
  couldNotRetrieve: "Could not retrieve a macro brief for this date. Check back after 05:30 AM ET.",
  todayGenerating: "Today's brief is being generated. Showing previous session's brief. Refresh after 5:30 AM ET.",
  morningMacroBrief: "MORNING MACRO BRIEF",
  score: "SCORE: ",
  basedOnSignals: "Based on 45 macro signals",
  yourFocusAreas: "YOUR FOCUS AREAS",
  briefTailors: "Brief tailors to your selection (max 3, sliding window)",
  whatChangedOvernight: "WHAT CHANGED OVERNIGHT",
  regimeStatus: "REGIME STATUS",
  watchToday: "WATCH TODAY",
  archiveArrow: "Archive →",
  latestBrief: "← Latest Brief",
};

// NYC Market countdown helper
interface MarketStatus {
  status: 'weekend' | 'closed' | 'open';
  label: string;
}

function getMarketStatus(): MarketStatus {
  const now = new Date();
  const etStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const etDate = new Date(etStr);
  
  const day = etDate.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = etDate.getHours();
  const minutes = etDate.getMinutes();
  const seconds = etDate.getSeconds();
  
  if (day === 0 || day === 6) {
    return { status: 'weekend', label: 'Next session: Monday' };
  }
  
  const nowInSeconds = hours * 3600 + minutes * 60 + seconds;
  const openTimeInSeconds = 9 * 3600 + 30 * 60; // 09:30:00
  const closeTimeInSeconds = 16 * 3600; // 16:00:00
  
  if (nowInSeconds < openTimeInSeconds) {
    const diff = openTimeInSeconds - nowInSeconds;
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    const countdown = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return { status: 'open', label: `Markets open in: ${countdown}` };
  } else if (nowInSeconds >= closeTimeInSeconds) {
    return { status: 'closed', label: 'Markets closed' };
  } else {
    return { status: 'open', label: 'Session Active' };
  }
}

function useMarketCountdown(): string {
  const [status, setStatus] = useState<string>('--:--:--');
  useEffect(() => {
    const tick = () => {
      const info = getMarketStatus();
      setStatus(info.label);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return status;
}

const BriefSkeleton: React.FC = () => (
  <div className="space-y-6">
    <Skeleton className="h-20 w-full bg-white/5 rounded-2xl" />
    <Skeleton className="h-6 w-32 bg-white/5" />
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-14 w-full bg-white/5 rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-24 w-full bg-white/5 rounded-xl" />
  </div>
);

const MacroBriefInner: React.FC = () => {
  const { date } = useParams<{ date?: string }>();
  const navigate = useNavigate();
  const shareRef = React.useRef<HTMLDivElement>(null);
  // Morning brief is an ET-session product — align with generate-morning-brief.
  const todayStr = marketDateISO();
  const targetDate = date || todayStr;

  useEffect(() => {
    if (!date) {
      navigate(withTrailingSlash(`/macro-brief/${todayStr}`), { replace: true });
    }
  }, [date, todayStr, navigate]);

  const [selectedAreas, setSelectedAreas] = useState<FocusArea[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validated = parsed.filter((a): a is FocusArea => 
            Object.prototype.hasOwnProperty.call(FOCUS_AREA_LABELS, a)
          );
          if (validated.length > 0) {
            return validated;
          }
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_AREAS;
  });

  const { data: brief, isLoading, error } = useMacroBrief(targetDate, selectedAreas);
  const countdown = useMarketCountdown();

  // Always emit self-canonical SEO — even while loading or unavailable.
  // Without this, crawlers that hit the SPA shell (or capture mid-load) inherit
  // the homepage canonical from index.html static tags.
  const pageCanonical = `https://graphiquestor.com/macro-brief/${targetDate}`;
  const pageSeo = (
    <SEOManager
      title={`Morning Macro Brief — ${targetDate}`}
      description={`GraphiQuestor daily institutional macro brief for ${targetDate}. Regime signals across India, US, and global macro.`}
      ogType="article"
      canonical={pageCanonical}
      robots="index, follow"
    />
  );

  if (isLoading) {
    return (
      <>
        {pageSeo}
        <BriefSkeleton />
      </>
    );
  }

  // Handle fallback / warning banner
  const isFallback = brief && brief.brief_date !== targetDate;
  const activeBrief = brief;

  if (error || !activeBrief) {
    return (
      <>
        {pageSeo}
        <div className="py-16 text-center space-y-4">
          <AlertTriangle size={36} className="text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-white uppercase tracking-tight">{TEXTS.briefUnavailable}</h2>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            {TEXTS.couldNotRetrieve}
          </p>
          <Link
            to={withTrailingSlash('/macro-brief')}
            className="inline-block text-xs font-mono font-black uppercase tracking-widest text-blue-400 hover:text-blue-300"
          >
            {TEXTS.latestBrief}
          </Link>
        </div>
      </>
    );
  }

  const parsedDate = isValid(parseISO(activeBrief.brief_date))
    ? parseISO(activeBrief.brief_date)
    : new Date();
  const formattedDayLabel = format(parsedDate, 'EEEE, MMMM d, yyyy');
  const prevDate = subDays(parsedDate, 1);
  const nextDate = addDays(parsedDate, 1);

  const prevDateStr = format(prevDate, 'yyyy-MM-dd');
  const nextDateStr = format(nextDate, 'yyyy-MM-dd');

  // Can display next link only if it doesn't exceed current real date
  const hasNextBrief = nextDateStr <= todayStr;

  const regimeColors = getRegimeColors(activeBrief.regime_label || 'unknown');
  const seoDescription = activeBrief.content.regime_status?.trim()
    ? (activeBrief.content.regime_status.length > 155 
        ? `${activeBrief.content.regime_status.slice(0, 152)}...` 
        : activeBrief.content.regime_status)
    : `GraphiQuestor's daily institutional macro brief for ${format(parsedDate, 'd MMMM yyyy')}. Regime: ${activeBrief.regime_label || 'Neutral'}. Key signals across India, US, and global macro.`;

  // Derived Section 3 Heading
  const focusAreaNames = selectedAreas
    .map((a) => {
      if (Object.prototype.hasOwnProperty.call(FOCUS_AREA_LABELS, a)) {
        return FOCUS_AREA_LABELS[a].replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]\s*/g, '');
      }
      return '';
    })
    .filter(Boolean)
    .join(' & ');
  const section3Heading = focusAreaNames ? `${focusAreaNames} SIGNALS` : 'FOCUS AREA SIGNALS';

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": `Morning Macro Brief — ${formattedDayLabel}`,
    "description": activeBrief.content.regime_status ?? "Daily institutional macro intelligence brief",
    "datePublished": activeBrief.generated_at,
    "dateModified": activeBrief.generated_at,
    "author": {
      "@type": "Organization",
      "name": "GraphiQuestor",
      "url": "https://graphiquestor.com"
    },
    "publisher": {
      "@type": "Organization", 
      "name": "GraphiQuestor",
      "logo": {
        "@type": "ImageObject",
        "url": "https://graphiquestor.com/hero-preview.jpg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://graphiquestor.com/macro-brief/${activeBrief.brief_date}`
    },
    "keywords": [
      "macro brief", "global macro", 
      "institutional macro intelligence",
      activeBrief.regime_label ?? "neutral regime",
      "India macro", "de-dollarization"
    ].join(', ')
  };

  return (
    <>
      <SEOManager
        title={`Morning Macro Brief — ${format(parsedDate, 'd MMMM yyyy')}`}
        description={seoDescription}
        ogType="article"
        ogImage={
          activeBrief.share_image_url ||
          `https://graphiquestor.com/og/brief-${activeBrief.brief_date}.png`
        }
        publishedTime={activeBrief.generated_at}
        canonical={`https://graphiquestor.com/macro-brief/${activeBrief.brief_date}`}
        robots="index, follow"
        jsonLd={structuredData}
      />

      <div ref={shareRef} className="space-y-8 relative group">
        <div className="absolute right-0 -top-2 z-10">
          <ShareButton
            targetRef={shareRef}
            title={`Morning Macro Brief — ${formattedDayLabel}`}
            dataSource="GraphiQuestor Daily Signal"
            href={`/macro-brief/${activeBrief.brief_date}`}
          />
        </div>
        {/* Fallback Banner */}
        {isFallback && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div className="text-xs font-mono uppercase tracking-wider leading-relaxed">
              {TEXTS.todayGenerating}
            </div>
          </div>
        )}

        {/* Masthead */}
        <header className="border-b border-white/10 pb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-emerald-500/90">
                {TEXTS.morningMacroBrief}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                {formattedDayLabel}
              </h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                Generated {activeBrief.generated_at
                  ? new Date(activeBrief.generated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' })
                  : '—'} ET
                {' · '}
                {activeBrief.model_used || 'synthesis engine'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-medium text-white/70">
              <Clock size={12} className="text-white/30" aria-hidden />
              <span className={cn(countdown.includes('open in') ? 'text-amber-400' : 'text-white/40')}>
                {countdown}
              </span>
            </div>
          </div>

          <div className={cn(
            "flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 rounded-xl border bg-[#020617]/80",
            regimeColors.border
          )}>
            <div className="flex items-center gap-3">
              <span className={cn("text-[10px] font-black font-mono uppercase tracking-wider px-2.5 py-1 rounded", regimeColors.bg, regimeColors.text)}>
                {activeBrief.regime_label || 'NEUTRAL'}
              </span>
              {activeBrief.regime_score !== null && (
                <span className="text-xs font-mono tabular-nums text-white/50">
                  {TEXTS.score}<span className="text-white/80">{activeBrief.regime_score}</span>
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
              {TEXTS.basedOnSignals}
            </span>
          </div>
        </header>

        {/* Focus chips — quiet desk chrome */}
        <div className="space-y-2.5 py-1">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">
            {TEXTS.yourFocusAreas}
          </div>
          <FocusAreaSelector
            selected={selectedAreas}
            onChange={setSelectedAreas}
          />
        </div>

        {/* Desk grid: Overnight | Regime | Watch */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-5">
          <section className="space-y-3 lg:col-span-1 rounded-xl border border-white/8 bg-white/[0.02] p-5">
            <h2 className="text-[10px] font-black font-mono uppercase tracking-[0.2em] text-emerald-500/80">
              {TEXTS.whatChangedOvernight}
            </h2>
            <ul className="space-y-3">
              {activeBrief.content.what_changed.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/85 leading-relaxed">
                  <span className="text-emerald-500 shrink-0 mt-1 text-[8px]" aria-hidden>●</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3 lg:col-span-1 rounded-xl border border-white/8 bg-white/[0.02] p-5">
            <h2 className="text-[10px] font-black font-mono uppercase tracking-[0.2em] text-blue-400/80">
              {TEXTS.regimeStatus}
            </h2>
            <p className="text-sm text-white/75 leading-relaxed">
              {activeBrief.content.regime_status}
            </p>
            <div className="pt-3 border-t border-white/5 space-y-2.5">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                {section3Heading}
              </h3>
              <ul className="space-y-2.5">
                {activeBrief.content.focus_observations.map((obs, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/80 leading-relaxed">
                    <span className="text-blue-400 shrink-0 mt-1 text-[8px]" aria-hidden>●</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-3 lg:col-span-1 rounded-xl border border-white/8 bg-white/[0.02] p-5">
            <h2 className="text-[10px] font-black font-mono uppercase tracking-[0.2em] text-amber-400/80">
              {TEXTS.watchToday}
            </h2>
            <ul className="space-y-3">
              {activeBrief.content.watch_today.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/75 leading-relaxed">
                  <span className="text-amber-400 shrink-0 mt-0.5 font-mono text-xs" aria-hidden>→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Provenance footer */}
        <footer className="pt-6 border-t border-white/10 space-y-4">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest leading-relaxed">
            Provenance · model {activeBrief.model_used || 'n/a'}
            {activeBrief.tokens_used != null ? ` · ${activeBrief.tokens_used} tokens` : ''}
            {' · '}not investment advice · observe structural reality
          </p>
          <div className="flex items-center justify-between text-xs font-mono">
            <Link
              to={`/macro-brief/${prevDateStr}`}
              className="flex items-center gap-1.5 text-white/45 hover:text-white/80 transition-colors cursor-pointer min-h-[44px]"
            >
              <ChevronLeft size={14} aria-hidden />
              <span>{prevDateStr}</span>
            </Link>

            <Link
              to="/macro-brief/archive"
              className="text-white/45 hover:text-white/80 transition-colors uppercase tracking-widest text-[10px] min-h-[44px] flex items-center cursor-pointer"
            >
              {TEXTS.archiveArrow}
            </Link>

            {hasNextBrief ? (
              <Link
                to={`/macro-brief/${nextDateStr}`}
                className="flex items-center gap-1.5 text-white/45 hover:text-white/80 transition-colors cursor-pointer min-h-[44px]"
              >
                <span>{nextDateStr}</span>
                <ChevronRight size={14} aria-hidden />
              </Link>
            ) : (
              <span className="text-white/10 select-none">—</span>
            )}
          </div>
        </footer>
      </div>
    </>
  );
};

export const MacroBriefPage: React.FC = () => (
  <div className="w-full max-w-6xl mx-auto py-10 px-4 sm:px-6 motion-reduce:transition-none">
    <SectionErrorBoundary name="Morning Macro Brief">
      <MacroBriefInner />
    </SectionErrorBoundary>
  </div>
);
