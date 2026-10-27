import { cn } from '@/lib/utils';

export type StatusTone = 'stress' | 'warn' | 'caution' | 'ok' | 'neutral';

// Full class names so Tailwind's scanner emits them.
const TONES: Record<StatusTone, string> = {
  stress: 'bg-red-500',
  warn: 'bg-orange-500',
  caution: 'bg-yellow-500',
  ok: 'bg-emerald-500',
  neutral: 'bg-slate-500',
};

export const StatusDot = ({ tone, className }: { tone: StatusTone; className?: string }) => (
  <span
    aria-hidden="true"
    className={cn('inline-block h-2 w-2 shrink-0 rounded-full align-middle', TONES[tone], className)}
  />
);
