import React from 'react'
import { cn } from '@/lib/utils'
import { scoreToColor } from '../types/trade'

interface OpportunityScoreBadgeProps {
    score: number
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
    className?: string
}

export const OpportunityScoreBadge: React.FC<OpportunityScoreBadgeProps> = ({
    score,
    size = 'md',
    showLabel = false,
    className,
}) => {
    const color = scoreToColor(score)
    const ring = score >= 70 ? 'ring-emerald-500/30' : score >= 45 ? 'ring-amber-500/30' : 'ring-rose-500/30'
    const label = score >= 70 ? 'High' : score >= 45 ? 'Moderate' : 'Low'

    const sizeMap = {
        sm: { badge: 'w-9 h-9 text-xs', text: 'text-[9px]' },
        md: { badge: 'w-12 h-12 text-sm', text: 'text-[10px]' },
        lg: { badge: 'w-16 h-16 text-base', text: 'text-xs' },
    }
    const sz = sizeMap[size]

    return (
        <div className={cn('flex flex-col items-center gap-1', className)}>
            <div className={cn(
                'relative flex items-center justify-center rounded-full ring-2 shrink-0',
                'bg-black/40 backdrop-blur-sm',
                sz.badge,
                ring
            )}>
                {/* SVG arc progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                        cx="18" cy="18" r="15.9"
                        fill="none"
                        stroke="currentColor"
                        className={cn('opacity-10', color)}
                        strokeWidth="2"
                    />
                    <circle
                        cx="18" cy="18" r="15.9"
                        fill="none"
                        stroke="currentColor"
                        className={color}
                        strokeWidth="2"
                        strokeDasharray={`${score} ${100 - score}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    />
                </svg>
                <span className={cn('relative font-black font-mono', color, sz.badge.split(' ')[2])}>
                    {score}
                </span>
            </div>
            {showLabel && (
                <span className={cn('font-black uppercase tracking-[0.15em]', sz.text, color)}>
                    {label}
                </span>
            )}
        </div>
    )
}
