import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'text-[11px] px-1 py-px',
  md: 'text-xs px-1.5 py-0.5',
  lg: 'text-sm px-2 py-1',
} as const;

interface CountryCodeProps {
  /** ISO 3166-1 alpha-2 code (or a region code such as "EU"). */
  code?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

/**
 * Terminal-style country identifier. Flag emoji render as bare letters on
 * Windows and vary by platform, so the terminal uses a fixed monospace code.
 */
export const CountryCode = ({ code, size = 'sm', className }: CountryCodeProps) => (
  <span
    className={cn(
      'inline-flex items-center justify-center rounded-sm border border-border bg-secondary/60',
      'font-mono font-semibold uppercase tracking-wider tabular-nums leading-none text-terminal-dim',
      SIZES[size],
      className,
    )}
  >
    {code ? code.toUpperCase() : '—'}
  </span>
);
