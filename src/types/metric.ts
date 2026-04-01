export interface MetricData {
	/** Unique identifier for the metric */
	id: string
	/** Display name */
	name: string
	/** Current numeric value */
	value: number | string
	/** Change from previous period */
	delta?: {
		value: string
		period: string
		trend: 'up' | 'down' | 'neutral'
		tooltip?: {
			currentValue: number | string
			previousValue: number | string
			absoluteChange: number | string
			percentChange: number | string
		}
		riskInterpretation?: 'risk-on' | 'risk-off' | 'neutral'
	}
	/** Status indicating signal strength or risk */
	status?: 'safe' | 'warning' | 'danger' | 'neutral'
	/** Trend direction (redundant with delta.trend but kept for quick access) */
	trend?: 'up' | 'down' | 'neutral'
	/** When the metric was last updated */
	asOfDate: string
	lastUpdated: string
	/** Data frequency */
	frequency: string
	/** Z-score for statistical significance */
	zScore?: number
	/** Percentile rank among peers */
	percentile?: number
	/** Historical data for sparkline */
	history: Array<{ date: string; value: number }>
	/** Metadata about source and methodology */
	metadata: {
		description: string
		methodology: string
		source: string
		unit: string
	}
	/** Whether data is stale/offline */
	isStale?: boolean
}

export type MetricCardProps = {
	metric?: MetricData
	// Backward compatible props for direct usage
	label?: string
	metricId?: string
	sublabel?: string
	value?: string | number
	delta?: MetricData['delta']
	status?: MetricData['status']
	history?: MetricData['history']
	precision?: number
	suffix?: string
	prefix?: string
	lastUpdated?: string | Date
	isLoading?: boolean
	className?: string
	source?: string
	frequency?: string
	zScoreWindow?: string
	description?: string | React.ReactNode
	methodology?: string | React.ReactNode
	stats?: { label: string; value: string | number; color?: string }[]
	chartType?: 'line' | 'bar'
	zScore?: number
	percentile?: number
	isStale?: boolean
}
