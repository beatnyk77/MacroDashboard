import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from 'lucide-react';

interface SubsystemCardProps {
    title: string;
    icon: LucideIcon;
    color: string;
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export const SubsystemCard: React.FC<SubsystemCardProps> = ({
    title,
    icon: Icon,
    color,
    children,
    className,
    delay = 0
}) => {
    return (
        <Card
            className={cn(
                "relative overflow-hidden border-white/5 bg-slate-950/40 backdrop-blur-2xl transition-all duration-500",
                "hover:bg-slate-900/60 hover:border-white/10 group shadow-2xl",
                "animate-in fade-in slide-in-from-bottom-4",
                className
            )}
            style={{
                animationDelay: `${delay}ms`,
                animationFillMode: 'both'
            }}
        >
            {/* Accent Background Glow */}
            <div
                className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: color }}
            />

            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="p-2.5 rounded-xl bg-opacity-10 border border-white/5 shadow-inner"
                        style={{ backgroundColor: `${color}15`, color: color }}
                    >
                        <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-xs tracking-[0.15em] uppercase text-white/90">
                        {title}
                    </h3>
                </div>

                {/* Animated pulse indicator */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/5">
                    <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                    <span className="text-[0.6rem] font-bold text-muted-foreground tracking-tighter uppercase">Live</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-2">
                <div className="flex flex-col gap-1">
                    {children}
                </div>
            </div>

            {/* Footer / Stats bar (Subtle) */}
            <div className="px-6 py-3 bg-white/[0.01] border-t border-white/5 flex justify-between items-center mt-2">
                <span className="text-[0.55rem] font-bold text-muted-foreground/40 uppercase tracking-widest">System Dynamics</span>
                <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-1 h-2 rounded-full bg-white/5" style={{ height: `${4 + Math.random() * 8}px` }} />
                    ))}
                </div>
            </div>
        </Card>
    );
};
