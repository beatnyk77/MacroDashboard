import React, { ReactNode } from 'react';
import { TrailLink as Link } from '@/components/TrailLink';
import { cn } from '@/lib/utils';
import { MotionCard } from '@/components/MotionCard';

// Full class names are spelled out so Tailwind's scanner emits them; interpolated
// `text-${color}` / `bg-${color}/30` strings never reach the generated CSS.
const MODULE_TONES = {
  amber: { text: 'text-amber-400', bar: 'bg-amber-400/30' },
  blue: { text: 'text-blue-400', bar: 'bg-blue-400/30' },
  cyan: { text: 'text-cyan-400', bar: 'bg-cyan-400/30' },
  orange: { text: 'text-orange-400', bar: 'bg-orange-400/30' },
  red: { text: 'text-red-400', bar: 'bg-red-400/30' },
  rose: { text: 'text-rose-400', bar: 'bg-rose-400/30' },
} as const;

type ModuleTone = keyof typeof MODULE_TONES;

interface ModuleRowProps {
  label: string;
  labelColor?: `text-${ModuleTone}-400`;
  children: ReactNode;
  href?: string;
  badge?: ReactNode;
  alternateBg?: boolean;
  id?: string;
}

const getTone = (color?: string) => {
  const name = color?.match(/^text-([a-z]+)-400$/)?.[1] as ModuleTone | undefined;
  return MODULE_TONES[name && name in MODULE_TONES ? name : 'amber'];
};

export const ModuleRow: React.FC<ModuleRowProps> = ({
  label,
  labelColor,
  children,
  href,
  badge,
  alternateBg,
  id,
}) => {
  const { text: textColorClass, bar: barColorClass } = getTone(labelColor);

  return (
    <div
      id={id}
      className={cn(
        "w-full flex flex-col md:flex-row rounded-xl border border-border overflow-hidden",
        "mb-4",
        alternateBg ? "bg-white/[0.02]" : "bg-card/20"
      )}
    >
      {/* Left edge: vertical label bar (desktop only) */}
      <div className="hidden md:flex items-center justify-center w-12 shrink-0 relative select-none">
        {/* The 2px wide vertical line at the right edge of this bar container */}
        <div className={cn("absolute right-0 top-0 bottom-0 w-[2px]", barColorClass)} />
        
        {/* Rotated text label: reading bottom-to-top */}
        <div className="transform -rotate-90 whitespace-nowrap label-mono">
          <span className={textColorClass}>{label}</span>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top: thin horizontal rule (which is the parent border-t) with module label and links */}
        <div className="flex items-center justify-between gap-4 py-3 px-4 sm:px-5 border-b border-border bg-background/10">
          <div className="flex items-center gap-3">
            <span className="label-mono">
              <span className={textColorClass}>{label}</span>
            </span>
            {badge}
          </div>
          {href && (
            <Link
              to={href}
              className="label-mono hover:text-foreground transition-colors duration-200"
            >
              Full Analysis &rarr;
            </Link>
          )}
        </div>

        {/* Children content area */}
        <div className="px-4 sm:px-5 py-5 flex flex-col gap-[var(--card-gap)]">
          <MotionCard delay={0}>{children}</MotionCard>
        </div>
      </div>
    </div>
  );
};
