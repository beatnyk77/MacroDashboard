import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SPAAccordionProps {
    id?: string;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    /** Default expanded state - set true per user feedback */
    defaultOpen?: boolean;
    className?: string;
    /** Accent color for the header */
    accentColor?: 'blue' | 'gold' | 'rose' | 'emerald' | 'purple';
    /** Institutional interpretations/bullets */
    interpretations?: string[];
}

const accentColors = {
    blue: {
        bg: 'bg-blue-500/5',
        border: 'border-blue-500/20',
        text: 'text-blue-400',
        hover: 'hover:border-blue-500/40',
    },
    gold: {
        bg: 'bg-yellow-500/5',
        border: 'border-yellow-500/20',
        text: 'text-yellow-400',
        hover: 'hover:border-yellow-500/40',
    },
    rose: {
        bg: 'bg-rose-500/5',
        border: 'border-rose-500/20',
        text: 'text-rose-400',
        hover: 'hover:border-rose-500/40',
    },
    emerald: {
        bg: 'bg-emerald-500/5',
        border: 'border-emerald-500/20',
        text: 'text-emerald-400',
        hover: 'hover:border-emerald-500/40',
    },
    purple: {
        bg: 'bg-purple-500/5',
        border: 'border-purple-500/20',
        text: 'text-purple-400',
        hover: 'hover:border-purple-500/40',
    },
};

/**
 * SPAAccordion - Collapsible section for thematic rows.
 * Starts expanded by default per user feedback.
 */
export const SPAAccordion: React.FC<SPAAccordionProps> = ({
    id,
    title,
    subtitle,
    icon,
    children,
    defaultOpen = true, // User requested expanded by default
    className,
    accentColor = 'blue',
    interpretations,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const colors = accentColors[accentColor];

    return (
        <div
            id={id}
            className={cn(
                'rounded-3xl border overflow-hidden transition-all duration-300',
                colors.bg,
                colors.border,
                colors.hover,
                className
            )}
        >
            {/* Accordion Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'w-full flex items-center justify-between p-6 lg:p-8 text-left',
                    'transition-all duration-200',
                    'hover:bg-white/[0.04]',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-inset'
                )}
                aria-expanded={isOpen}
            >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12">
                    <div className="flex items-center gap-4">
                        {icon && (
                            <div className={cn('text-2xl', colors.text)}>
                                {icon}
                            </div>
                        )}
                        <div>
                            <h3 className="text-xl lg:text-3xl font-black tracking-tighter text-foreground">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-sm font-medium text-muted-foreground mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Interpretation Bullets - Stitch MCP Style */}
                    {interpretations && interpretations.length > 0 && (
                        <div className="flex flex-wrap gap-x-6 gap-y-2 lg:border-l lg:border-white/12 lg:pl-8">
                            {interpretations.map((text, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap">
                                        {text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <ChevronDown
                    className={cn(
                        'w-6 h-6 text-muted-foreground transition-transform duration-300',
                        isOpen && 'rotate-180'
                    )}
                />
            </button>

            {/* Accordion Content */}
            <div
                className={cn(
                    'overflow-hidden transition-all duration-500 ease-out',
                    isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                )}
            >
                <div className="p-6 pt-0 space-y-8">
                    {children}
                </div>
            </div>
        </div>
    );
};
