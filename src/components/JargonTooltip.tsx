import React from 'react';
import { cn } from '@/lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { BookOpen } from 'lucide-react';

export interface JargonTooltipProps {
	/** Term to display, e.g. "Repo", "Basis Trade", "C&I Loans" */
	term: string;
	/** Plain-English definition or mental model */
	definition: string;
	/** Optional link to deeper methodology page */
	methodologyUrl?: string;
	className?: string;
	children?: React.ReactNode;
}

export const JargonTooltip: React.FC<JargonTooltipProps> = ({
	term,
	definition,
	methodologyUrl,
	className,
	children,
}) => {
	return (
		<HoverCard openDelay={150} closeDelay={150}>
			<HoverCardTrigger asChild>
				<span
					className={cn(
						'cursor-help border-b border-dotted border-sky-400/40 hover:border-sky-400 hover:text-sky-300 transition-colors',
						className
					)}
				>
					{children || term}
				</span>
			</HoverCardTrigger>
			<HoverCardContent
				side="top"
				align="center"
				className="w-72 p-3 bg-slate-950/95 border border-sky-500/30 text-slate-200 text-xs shadow-xl backdrop-blur-xl rounded z-50"
			>
				<div className="space-y-1.5">
					<div className="flex items-center justify-between border-b border-slate-800 pb-1">
						<span className="font-semibold text-sky-400 font-mono text-[11px] tracking-wide uppercase">
							{term}
						</span>
						<span className="text-[10px] text-slate-400 flex items-center gap-1">
							<BookOpen size={10} /> Macro Concept
						</span>
					</div>
					<p className="text-[11px] leading-relaxed text-slate-300 font-normal">
						{definition}
					</p>
					{methodologyUrl && (
						<a
							href={methodologyUrl}
							className="inline-block pt-1 text-[10px] text-sky-400 hover:text-sky-300 underline font-medium"
						>
							Read full methodology →
						</a>
					)}
				</div>
			</HoverCardContent>
		</HoverCard>
	);
};
