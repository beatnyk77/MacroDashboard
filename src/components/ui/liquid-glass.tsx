import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlassEffectProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export interface GlassDockItem {
    label: string;
    detail?: string;
    href?: string;
    onClick?: () => void;
}

/**
 * Web approximation of a Liquid Glass surface.
 * Apple documents Liquid Glass for Apple platforms. This component uses
 * standard web backdrop-filter effects with an opaque fallback.
 */
export const GlassEffect: React.FC<GlassEffectProps> = ({ children, className, style }) => (
    <div className={cn('liquid-glass-web-approx relative isolate overflow-hidden', className)} style={style}>
        <div className="relative z-10">{children}</div>
    </div>
);

export const GlassDock: React.FC<{ items: GlassDockItem[]; className?: string }> = ({ items, className }) => (
    <GlassEffect className={cn('rounded-lg p-1.5', className)}>
        <nav aria-label="Quick terminal views" className="flex flex-wrap items-center gap-1">
            {items.map((item) => {
                const content = (
                    <>
                        <span className="flex min-w-0 flex-col text-left">
                            <span className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-foreground dark:text-white/80">
                                {item.label}
                            </span>
                            {item.detail && <span className="truncate text-[10px] text-muted-foreground dark:text-white/45">{item.detail}</span>}
                        </span>
                        <ArrowUpRight size={14} aria-hidden="true" className="shrink-0 text-muted-foreground dark:text-white/35" />
                    </>
                );

                if (item.href) {
                    return (
                        <a
                            key={item.label}
                            href={item.href}
                            aria-label={item.detail ? `${item.label}, ${item.detail}` : item.label}
                            className="group flex min-h-11 min-w-[9rem] flex-1 items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-muted focus-visible:bg-muted dark:hover:bg-white/10 dark:focus-visible:bg-white/10"
                        >
                            {content}
                        </a>
                    );
                }

                return (
                    <button
                        key={item.label}
                        type="button"
                        onClick={item.onClick}
                        aria-label={item.detail ? `${item.label}, ${item.detail}` : item.label}
                        className="group flex min-h-11 min-w-[9rem] flex-1 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-200 hover:bg-muted focus-visible:bg-muted dark:hover:bg-white/10 dark:focus-visible:bg-white/10"
                    >
                        {content}
                    </button>
                );
            })}
        </nav>
    </GlassEffect>
);

export const GlassButton: React.FC<GlassEffectProps & { href?: string }> = ({ children, href, className, style }) => {
    const content = <GlassEffect className={cn('rounded-lg px-4 py-2.5 text-sm text-foreground dark:text-white', className)} style={style}>{children}</GlassEffect>;

    return href ? <a href={href} className="inline-block">{content}</a> : content;
};
