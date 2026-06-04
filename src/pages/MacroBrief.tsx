import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SEOManager } from '@/components/SEOManager';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { useMacroBrief, DEFAULT_FOCUS_AREAS } from '@/hooks/useMacroBrief';
import type { FocusAreaCode, BriefContent } from '@/hooks/useMacroBrief';
import { FocusAreaSelector } from '@/components/brief/FocusAreaSelector';
import { Settings2, ChevronLeft, ChevronRight, AlertCircle, Clock, Zap } from 'lucide-react';
import { format, subDays, addDays, parseISO, isValid } from 'date-fns';

const LS_KEY = 'gq_focus_areas';

function loadFocusAreas(): FocusAreaCode[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as FocusAreaCode[];
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_FOCUS_AREAS;
}

function saveFocusAreas(areas: FocusAreaCode[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(areas));
}

/** Returns ms until next 9:30 AM ET. Uses Intl API to handle EDT/EST correctly on any machine. */
function msUntilNYOpen(): number {
  const now = new Date();
  // Get current ET wall-clock time using Intl (handles DST automatically)
  const etParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parseInt(etParts.find((p) => p.type === type)?.value ?? '0', 10);
  const etH = get('hour');
  const etM = get('minute');
  const etS = get('second');
  // Seconds from now until 9:30:00 ET
  const nowSec = etH * 3600 + etM * 60 + etS;
  const openSec = 9 * 3600 + 30 * 60;
  const diffSec = nowSec < openSec ? openSec - nowSec : 86400 - (nowSec - openSec);
  return diffSec * 1000;
}

function useCountdown(): string {
  const [label, setLabel] = useState('--:--:--');
  useEffect(() => {
    const tick = () => {
      const ms = msUntilNYOpen();
      if (ms <= 0) { setLabel('Open'); return; }
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1_000);
      setLabel(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return label;
}

// ── Redirect: /macro-brief → /macro-brief/YYYY/MM/DD ──────────────────────────
const MacroBriefRedirect: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const iso = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" in UTC
    const [y, mo, dy] = iso.split('-');
    navigate(`/macro-brief/${y}/${mo}/${dy}`, { replace: true });
  }, [navigate]);
  return null;
};

// ── Skeleton loader ───────────────────────────────────────────────────────────
const BriefSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <Skeleton className="h-24 w-full bg-white/5 rounded-2xl" />
    <Skeleton className="h-4 w-48 bg-white/5" />
    <div className="space-y-2">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full bg-white/5 rounded-xl" />)}
    </div>
    <Skeleton className="h-20 w-full bg-white/5 rounded-xl" />
  </div>
);

// ── Section label ─────────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ children: React.ReactNode; tag?: string }> = ({ children, tag }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">{children}</span>
    {tag && (
      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black text-white/30 uppercase tracking-wider">
        {tag}
      </span>
    )}
    <div className="h-px flex-1 bg-white/5" />
  </div>
);

// ── Bullet row ────────────────────────────────────────────────────────────────
const BulletRow: React.FC<{ text: string; accent?: boolean }> = ({ text, accent }) => (
  <div className={[
    'flex items-start gap-3 rounded-lg px-4 py-3 border',
    accent ? 'bg-blue-500/5 border-blue-500/20' : 'bg-white/[0.02] border-white/5',
  ].join(' ')}>
    <span className="text-blue-400/70 font-black text-sm mt-0.5 flex-shrink-0">◆</span>
    <p className="text-sm leading-relaxed text-white/80 font-medium">{text}</p>
  </div>
);

// ── Brief content view ────────────────────────────────────────────────────────
interface BriefViewProps {
  content: BriefContent;
  regimeLabel: string | null;
  regimeScore: number | null;
  briefDate: string;
  isNotToday: boolean;
  focusAreas: FocusAreaCode[];
  onFocusAreasChange: (areas: FocusAreaCode[]) => void;
}

const BriefView: React.FC<BriefViewProps> = ({
  content,
  regimeLabel,
  regimeScore,
  briefDate,
  isNotToday,
  focusAreas,
  onFocusAreasChange,
}) => {
  const countdown = useCountdown();
  const [selectorOpen, setSelectorOpen] = useState(false);

  const parsedDate = isValid(parseISO(briefDate)) ? parseISO(briefDate) : new Date();
  const dayLabel = format(parsedDate, 'EEEE, MMMM d, yyyy');
  const prevDate = subDays(parsedDate, 1);
  const nextDate = addDays(parsedDate, 1);
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = briefDate === todayStr;

  const regimeColor =
    regimeLabel?.toLowerCase().includes('expansion') ? 'text-emerald-400'
    : regimeLabel?.toLowerCase().includes('tight') || regimeLabel?.toLowerCase().includes('slow') ? 'text-rose-400'
    : 'text-blue-400';

  return (
    <div className="space-y-8">
      {/* Generating banner */}
      {isNotToday && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Zap size={14} className="text-amber-400 flex-shrink-0" />
          <span className="text-xs font-bold text-amber-400/90">
            Today&apos;s brief is generating — showing most recent available.
          </span>
        </div>
      )}

      {/* Header bar */}
      <div
        className="rounded-2xl px-5 py-4 border border-white/8 flex flex-wrap items-center justify-between gap-4"
        style={{ background: 'rgba(8,12,24,0.7)', backdropFilter: 'blur(12px)' }}
      >
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35 font-mono block">
            Morning Macro Brief
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-none">
            {dayLabel}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Countdown */}
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest text-white/25 font-mono mb-0.5">
              Markets Open In
            </div>
            <div className="text-sm font-black text-white/70 font-mono tabular-nums flex items-center gap-1.5">
              <Clock size={12} className="text-white/30" />
              {countdown}
            </div>
          </div>

          {/* Regime badge */}
          {regimeLabel && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5">
              <span className={`text-xs font-black uppercase ${regimeColor}`}>{regimeLabel}</span>
              {regimeScore !== null && (
                <span className="text-[10px] font-mono text-white/30">{regimeScore}</span>
              )}
            </div>
          )}

          {/* Focus area gear */}
          <div className="relative">
            <button
              onClick={() => setSelectorOpen((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title="Customize focus areas"
            >
              <Settings2 size={13} className="text-white/50" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40 hidden sm:block">
                Focus
              </span>
            </button>
            <FocusAreaSelector
              selected={focusAreas}
              onChange={(areas) => {
                onFocusAreasChange(areas);
                saveFocusAreas(areas);
              }}
              open={selectorOpen}
              onClose={() => setSelectorOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* Section 1 — What Changed Overnight */}
      <section>
        <SectionLabel tag="3–5 signals">What Changed Overnight</SectionLabel>
        <div className="space-y-2">
          {content.what_changed.map((bullet, i) => (
            <BulletRow key={i} text={bullet} accent={i === 0} />
          ))}
        </div>
      </section>

      {/* Section 2 — Regime Status */}
      <section>
        <SectionLabel>Regime Status</SectionLabel>
        <div
          className="rounded-xl px-5 py-4 border border-white/8 text-sm leading-relaxed text-white/75 font-medium"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          {content.regime_status}
        </div>
      </section>

      {/* Section 3 — Focus Areas */}
      <section>
        <SectionLabel tag={focusAreas.join(' · ')}>Focus Areas</SectionLabel>
        <div className="space-y-2">
          {content.focus_observations.map((obs, i) => (
            <BulletRow key={i} text={obs} />
          ))}
        </div>
      </section>

      {/* Section 4 — Watch Today */}
      {content.watch_today.length > 0 && (
        <section>
          <SectionLabel>Watch Today</SectionLabel>
          <div className="space-y-2">
            {content.watch_today.map((item, i) => (
              <BulletRow key={i} text={item} />
            ))}
          </div>
        </section>
      )}

      {/* Footer nav */}
      <div className="flex items-center justify-between pt-6 border-t border-white/8">
        <Link
          to={`/macro-brief/${format(prevDate, 'yyyy/MM/dd')}`}
          className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white/70 transition-colors"
        >
          <ChevronLeft size={14} />
          {format(prevDate, 'MMM d')} Brief
        </Link>

        <Link
          to="/macro-brief/archive"
          className="text-[10px] font-black uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors"
        >
          Archive →
        </Link>

        {!isToday && (
          <Link
            to={`/macro-brief/${format(nextDate, 'yyyy/MM/dd')}`}
            className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white/70 transition-colors"
          >
            {format(nextDate, 'MMM d')} Brief
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {/* Methodology link */}
      <p className="text-center text-[10px] text-white/20 font-medium">
        <Link
          to="/methodology"
          className="hover:text-white/40 transition-colors underline-offset-2 underline decoration-white/10"
        >
          How is this brief generated? →
        </Link>
      </p>
    </div>
  );
};

// ── MacroBriefInner ───────────────────────────────────────────────────────────
const MacroBriefInner: React.FC = () => {
  const { year, month, day } = useParams<{ year: string; month: string; day: string }>();
  const briefDate = year && month && day ? `${year}-${month}-${day}` : undefined;

  const [focusAreas, setFocusAreas] = useState<FocusAreaCode[]>(loadFocusAreas);
  const { data, isLoading, error } = useMacroBrief(focusAreas, briefDate);

  if (isLoading) return <BriefSkeleton />;

  if (error || !data) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle size={32} className="text-rose-500 mx-auto" />
        <h2 className="text-lg font-black text-white uppercase tracking-tight">Brief Unavailable</h2>
        <p className="text-sm text-white/40 max-w-md mx-auto">
          No brief has been generated for this date yet. Check back after 05:30 UTC.
        </p>
        <Link
          to="/macro-brief"
          className="inline-block text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300"
        >
          ← Latest Brief
        </Link>
      </div>
    );
  }

  const { brief, isNotToday } = data;
  const parsedDate = isValid(parseISO(brief.brief_date)) ? parseISO(brief.brief_date) : new Date();
  const displayDate = format(parsedDate, 'EEEE, MMMM d, yyyy');
  const description = (brief.content.what_changed[0] ?? 'Daily institutional macro intelligence brief.').slice(0, 155);

  return (
    <>
      <SEOManager
        title={`Global Macro Brief — ${displayDate}`}
        description={description}
        ogType="article"
        publishedTime={brief.generated_at}
        canonicalUrl={`https://graphiquestor.com/macro-brief/${format(parsedDate, 'yyyy/MM/dd')}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: `Global Macro Brief — ${displayDate}`,
          description,
          datePublished: brief.generated_at,
          author: { '@type': 'Organization', name: 'GraphiQuestor' },
          publisher: {
            '@type': 'Organization',
            name: 'GraphiQuestor',
            logo: { '@type': 'ImageObject', url: 'https://graphiquestor.com/favicon.svg' },
          },
        }}
      />
      <BriefView
        content={brief.content}
        regimeLabel={brief.regime_label}
        regimeScore={brief.regime_score}
        briefDate={brief.brief_date}
        isNotToday={isNotToday}
        focusAreas={focusAreas}
        onFocusAreasChange={setFocusAreas}
      />
    </>
  );
};

// ── Public exports ─────────────────────────────────────────────────────────────

/** Handles /macro-brief — redirects to today's dated URL */
export const MacroBriefToday: React.FC = () => <MacroBriefRedirect />;

/** Handles /macro-brief/:year/:month/:day */
export const MacroBrief: React.FC = () => (
  <div className="w-full max-w-3xl mx-auto py-10 px-4 sm:px-6">
    <SectionErrorBoundary name="Morning Macro Brief">
      <MacroBriefInner />
    </SectionErrorBoundary>
  </div>
);
