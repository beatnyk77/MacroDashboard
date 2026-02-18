import React, { useState } from 'react';
import { X, Info, Clock, Layers } from 'lucide-react';
import { Sparkline } from '@/components/Sparkline';
import { BarChart as ReBarChart, Bar, XAxis, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface HoverDetailProps {
    title: string;
    subtitle?: string;
    children: React.ReactElement; // The card/row to wrap
    detailContent: {
        description?: string | React.ReactNode;
        stats?: { label: string; value: string | number; color?: string }[];
        history?: { date: string; value: number }[];
        methodology?: string | React.ReactNode;
        source?: string;
        chartType?: 'line' | 'bar';
    };
}

export const HoverDetail: React.FC<HoverDetailProps> = ({
    title,
    subtitle,
    children,
    detailContent
}) => {
    const [open, setOpen] = useState(false);

    const handleOpen = () => setOpen(true);
    const handleClose = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setOpen(false);
    };

    // clone children to attach click handler without adding a wrapper div
    // this keeps the DOM structure valid (e.g. valid tr inside tbody)
    const trigger = React.cloneElement(children, {
        onClick: (e: React.MouseEvent) => {
            // Call original onClick if it exists
            if (children.props.onClick) {
                children.props.onClick(e);
            }
            handleOpen();
        },
        className: cn(children.props.className, "cursor-pointer transition-transform hover:scale-[1.005]")
    });

    if (!open) return trigger;

    return (
        <>
            {trigger}
            {/* Modal Overlay */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={handleClose}>
                {/* Modal Content */}
                <div
                    className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-white/10 rounded-xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-extrabold text-primary mb-1">
                                {title}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {subtitle || 'Institutional Data Analysis & Methodology'}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Stats & Description */}
                        <div>
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info size={16} className="text-primary" />
                                    <span className="text-[0.65rem] font-black tracking-widest text-muted-foreground uppercase">EXECUTIVE SUMMARY</span>
                                </div>
                                <p className="text-sm leading-relaxed text-foreground/90">
                                    {detailContent.description || 'No detailed description available for this metric.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {detailContent.stats?.map((stat, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 border rounded bg-white/[0.02] border-white/5"
                                        style={{ borderColor: stat.color ? `${stat.color}40` : undefined }}
                                    >
                                        <span className="text-[0.65rem] font-bold text-muted-foreground block mb-1 uppercase">
                                            {stat.label}
                                        </span>
                                        <span
                                            className="text-lg font-black"
                                            style={{ color: stat.color || 'inherit' }}
                                        >
                                            {stat.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Mini Chart & Context */}
                        <div>
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={16} className="text-primary" />
                                    <span className="text-[0.65rem] font-black tracking-widest text-muted-foreground uppercase">RECENT TREND (90D)</span>
                                </div>
                                <div className="h-[200px] w-full mt-2 p-3 bg-white/[0.01] rounded border border-white/5">
                                    {detailContent.history && detailContent.history.length > 0 ? (
                                        detailContent.chartType === 'bar' ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ReBarChart data={detailContent.history}>
                                                    <XAxis dataKey="date" hide />
                                                    <ReTooltip
                                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', fontSize: '12px' }}
                                                        itemStyle={{ color: '#3b82f6', fontWeight: 700 }}
                                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    />
                                                    <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                                                </ReBarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <Sparkline data={detailContent.history} height={160} />
                                        )
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <span className="text-xs text-muted-foreground">Historical data loading...</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Layers size={16} className="text-primary" />
                                    <span className="text-[0.65rem] font-black tracking-widest text-muted-foreground uppercase">METHODOLOGY</span>
                                </div>
                                <div className="text-xs text-muted-foreground bg-white/[0.02] p-3 rounded border border-white/5">
                                    {detailContent.methodology || 'Calculated using standardized Z-Score normalization against institutional source data.'}
                                    <div className="mt-2 font-bold text-primary text-[0.6rem] uppercase">
                                        DATA SOURCE: {detailContent.source || 'Standard Financial Feeds'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="my-6 h-px bg-white/10" />

                    <div className="flex justify-center">
                        <span className="text-xs text-muted-foreground italic">
                            Tap outside or click X to return to dashboard
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
};
