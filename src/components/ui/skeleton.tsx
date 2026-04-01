import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
	variant?: 'text' | 'rectangular' | 'circular' | 'metric-card' | 'chart'
	width?: string | number
	height?: string | number
}

export function Skeleton({
	className,
	variant = 'rectangular',
	width,
	height,
	...props
}: SkeletonProps) {
	const base = "animate-pulse bg-muted/50"
	const variants = {
		text: "rounded h-4",
		rectangular: "rounded-md",
		circular: "rounded-full",
		'metric-card': "rounded-lg p-6 space-y-4",
		'chart': "rounded-md chart-skeleton"
	}

	return (
		<div
			className={cn(base, variants[variant], className)}
			style={{ width, height }}
			aria-hidden="true"
			{...props}
		/>
	)
}

// Specialized skeleton components for common UI patterns
export function MetricCardSkeleton() {
	return (
		<div className="rounded-lg border border-border/50 bg-card/40 p-6 space-y-4">
			<Skeleton variant="text" height={32} width="60%" />
			<Skeleton variant="text" height={48} width="80%" />
			<Skeleton variant="rectangular" height={120} className="mt-4" />
		</div>
	)
}

export function ChartSkeleton({ height = 300 }: { height?: number | string }) {
	return <Skeleton variant="chart" height={height} className="w-full" />
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
	const widths = ['90%', '85%', '95%', '80%', '88%']
	return (
		<div className="rounded-lg border border-border/50 bg-card/40 p-6 space-y-4">
			<Skeleton variant="text" height={24} width="40%" />
			{Array.from({ length: lines }).map((_, i) => (
				<Skeleton key={i} variant="text" height={16} width={widths[i % widths.length]} />
			))}
		</div>
	)
}
