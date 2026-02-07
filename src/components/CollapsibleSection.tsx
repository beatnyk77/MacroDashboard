import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    subtitle,
    children,
    defaultOpen = false,
    className
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={cn("border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden transition-all duration-300", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group text-left"
            >
                <div>
                    <h3 className="text-sm font-black tracking-widest uppercase text-foreground group-hover:text-blue-400 transition-colors">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-[0.65rem] font-bold text-muted-foreground/50 mt-1 uppercase tracking-tighter">
                            {subtitle}
                        </p>
                    )}
                </div>
                <div className="shrink-0 ml-4">
                    {isOpen ? (
                        <ChevronDown size={18} className="text-muted-foreground" />
                    ) : (
                        <ChevronRight size={18} className="text-muted-foreground" />
                    )}
                </div>
            </button>
            <div className={cn(
                "transition-all duration-500 ease-in-out",
                isOpen ? "max-h-[2000px] opacity-100 pb-8" : "max-h-0 opacity-0 invisible"
            )}>
                <div className="px-6 border-t border-white/5 pt-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
