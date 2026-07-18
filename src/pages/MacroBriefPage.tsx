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
        ogImage={`https://graphiquestor.com/og/brief-${activeBrief.brief_date}.png`}
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

        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/50">
              {TEXTS.morningMacroBrief}
            </div>
            <h1 className="text-base font-semibold text-white">
              {formattedDayLabel}
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-medium text-white/70">
            <Clock size={12} className="text-white/30" />
            <span className={cn(countdown.includes('open in') ? 'text-amber-400' : 'text-white/30')}>
              {countdown}
            </span>
          </div>
        </div>

        {/* Regime Strip */}
        <div className={cn(
          "flex items-center justify-between px-6 py-4 rounded-2xl border bg-white/[0.01]",
          regimeColors.border
        )}>
          <div className="flex items-center gap-3">
            <span className={cn("text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded", regimeColors.bg, regimeColors.text)}>
              {activeBrief.regime_label || 'NEUTRAL'}
            </span>
            {activeBrief.regime_score !== null && (
              <span className="text-xs font-mono text-white/40">
                {TEXTS.score}{activeBrief.regime_score}
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-white/30">
            {TEXTS.basedOnSignals}
          </span>
        </div>

        {/* Focus Selector */}
        <div className="space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">
            {TEXTS.yourFocusAreas}
          </div>
          <FocusAreaSelector
            selected={selectedAreas}
            onChange={setSelectedAreas}
          />
          <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
            {TEXTS.briefTailors}
          </div>
        </div>

        {/* Section 1 — What Changed Overnight */}
        <section className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-widest text-white/40">
            {TEXTS.whatChangedOvernight}
          </h2>
          <ul className="space-y-3.5">
            {activeBrief.content.what_changed.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                <span className="text-amber-400 shrink-0 mt-0.5">◆</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 2 — Regime Status */}
        <section className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-widest text-white/40">
            {TEXTS.regimeStatus}
          </h2>
          <p className="text-sm text-white/70 leading-relaxed font-medium">
            {activeBrief.content.regime_status}
          </p>
        </section>

        {/* Section 3 — Focus Area Signals */}
        <section className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-widest text-white/40">
            {section3Heading}
          </h2>
          <ul className="space-y-3.5">
            {activeBrief.content.focus_observations.map((obs, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                <span className="text-amber-400 shrink-0 mt-0.5">◆</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 4 — Watch Today */}
        <section className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-widest text-white/40">
            {TEXTS.watchToday}
          </h2>
          <ul className="space-y-3.5">
            {activeBrief.content.watch_today.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                <span className="text-blue-400 shrink-0 mt-0.5">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-8 border-t border-white/10 mt-12 text-xs font-mono">
          <Link
            to={`/macro-brief/${prevDateStr}`}
            className="flex items-center gap-1.5 text-white/45 hover:text-white/80 transition-colors"
          >
            <ChevronLeft size={14} />
            <span>{prevDateStr}</span>
          </Link>

          <Link
            to="/macro-brief/archive"
            className="text-white/45 hover:text-white/80 transition-colors uppercase tracking-widest text-[10px]"
          >
            {TEXTS.archiveArrow}
          </Link>

          {hasNextBrief ? (
            <Link
              to={`/macro-brief/${nextDateStr}`}
              className="flex items-center gap-1.5 text-white/45 hover:text-white/80 transition-colors"
            >
              <span>{nextDateStr}</span>
              <ChevronRight size={14} />
            </Link>
          ) : (
            <span className="text-white/10 select-none cursor-not-allowed">
              --
            </span>
          )}
        </div>
      </div>
    </>
  );
};

export const MacroBriefPage: React.FC = () => (
  <div className="w-full max-w-3xl mx-auto py-10 px-4 sm:px-6">
    <SectionErrorBoundary name="Morning Macro Brief">
      <MacroBriefInner />
    </SectionErrorBoundary>
  </div>
);
