import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, ShieldCheck, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DeskConceptPillProps {
	/** Concise title for the pill, e.g. "How the Treasury Basis Trade Works" */
	title: string;
	/** Estimated reading time, e.g. "30-sec brief" */
	readingTime?: string;
	/** Core mental model / analogy */
	analogy: string;
	/** Why it matters to markets, portfolios, and main street */
	mainStreetImpact: string;
	/** Critical thresholds or signals to watch */
	whatToWatch: {
		label: string;
		status: 'normal' | 'caution' | 'critical';
		detail: string;
	}[];
	className?: string;
}

export const DeskConceptPill: React.FC<DeskConceptPillProps> = ({
	title,
	readingTime = '30-sec brief',
	analogy,
	mainStreetImpact,
	whatToWatch,
	className,
}) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className={cn('my-2 transition-all duration-200', className)}>
			{/* Collapsed Pill Button */}
			<button
				type="button"
				onClick={() => setIsOpen((prev) => !prev)}
				className={cn(
					'inline-flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded border transition-all duration-150',
					isOpen
						? 'bg-sky-950/40 border-sky-500/40 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
						: 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-700/60 hover:border-sky-500/30 text-slate-300 hover:text-sky-200'
				)}
				aria-expanded={isOpen}
			>
				<Lightbulb size={13} className={cn('transition-colors', isOpen ? 'text-sky-400' : 'text-amber-400/80')} />
				<span>{title}</span>
				<span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
					{readingTime}
				</span>
				{isOpen ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
			</button>

			{/* Expandable 3-Column Micro-Guide */}
			{isOpen && (
				<div className="mt-2.5 p-3.5 rounded bg-slate-950/80 border border-sky-500/25 backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
						{/* Column 1: The Core Mechanism */}
						<div className="space-y-1.5 p-2.5 rounded bg-slate-900/50 border border-slate-800/60">
							<div className="flex items-center gap-1.5 font-semibold text-sky-400 tracking-wide uppercase text-[10px]">
								<ArrowRightLeft size={12} />
								<span>Core Mechanism</span>
							</div>
							<p className="text-slate-300 leading-relaxed text-[11px] font-normal">
								{analogy}
							</p>
						</div>

						{/* Column 2: Economic / Portfolio Impact */}
						<div className="space-y-1.5 p-2.5 rounded bg-slate-900/50 border border-slate-800/60">
							<div className="flex items-center gap-1.5 font-semibold text-emerald-400 tracking-wide uppercase text-[10px]">
								<ShieldCheck size={12} />
								<span>Main Street Impact</span>
							</div>
							<p className="text-slate-300 leading-relaxed text-[11px] font-normal">
								{mainStreetImpact}
							</p>
						</div>

						{/* Column 3: Signals to Watch */}
						<div className="space-y-1.5 p-2.5 rounded bg-slate-900/50 border border-slate-800/60">
							<div className="flex items-center gap-1.5 font-semibold text-amber-400 tracking-wide uppercase text-[10px]">
								<AlertTriangle size={12} />
								<span>Signals & Thresholds</span>
							</div>
							<div className="space-y-1">
								{whatToWatch.map((item, idx) => {
									const statusColors = {
										normal: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
										caution: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
										critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
									}[item.status];

									return (
										<div key={idx} className="flex items-start gap-1.5 text-[10px]">
											<span className={cn('px-1 py-0.2 rounded border font-mono uppercase text-[9px] shrink-0', statusColors)}>
												{item.status}
											</span>
											<span className="text-slate-300">
												<strong className="text-slate-200">{item.label}:</strong> {item.detail}
											</span>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
