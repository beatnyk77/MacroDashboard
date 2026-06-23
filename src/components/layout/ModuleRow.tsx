import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MotionCard } from '@/components/MotionCard';

interface ModuleRowProps {
  label: string;
  labelColor?: string;
  children: ReactNode;
  href?: string;
  badge?: ReactNode;
  alternateBg?: boolean;
}

const getTextColorClass = (color?: string) => {
  if (!color) return 'text-amber-400/60';
  if (color.startsWith('text-')) return color;
  return `text-${color}`;
};

const getBarColorClass = (color?: string) => {
  if (!color) return 'bg-amber-400/30';
  const match = color.match(/(?:text-)?([a-z]+-\d+(?:\/\d+)?)/);
  if (match) {
    const baseColor = match[1].split('/')[0];
    return `bg-${baseColor}/30`;
  }
  return 'bg-amber-400/30';
};

export const ModuleRow: React.FC<ModuleRowProps> = ({
  label,
  labelColor,
  children,
  href,
  badge,
  alternateBg,
}) => {
  const textColorClass = getTextColorClass(labelColor);
  const barColorClass = getBarColorClass(labelColor);

  return (
    <div
      className={cn(
        "w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)]",
        "-mx-4 sm:-mx-6 lg:-mx-8",
        "flex flex-col md:flex-row border-t border-b border-white/5",
        alternateBg ? "bg-white/[0.01]" : "bg-transparent"
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
        <div className="flex items-center justify-between py-3 px-4 sm:px-6 lg:px-8 border-b border-white/5 bg-black/10">
          <div className="flex items-center gap-3">
            <span className={cn('label-mono', textColorClass)}>
              {label}
            </span>
            {badge}
          </div>
          {href && (
            <Link
              to={href}
              className="label-mono hover:text-white transition-colors duration-200"
            >
              Full Analysis &rarr;
            </Link>
          )}
        </div>

        {/* Children content area */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-[var(--card-gap)]">
          <MotionCard delay={0}>{children}</MotionCard>
        </div>
      </div>
    </div>
  );
};
