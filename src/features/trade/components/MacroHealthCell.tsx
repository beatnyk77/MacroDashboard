import React from 'react'
import { cn } from '@/lib/utils'

interface MacroHealthCellProps {
    score: number | null | undefined
}

function macroLabel(score: number): string {
    if (score >= 70) return 'Stable'
    if (score >= 45) return 'Mixed'
    return 'Stressed'
}

export const MacroHealthCell: React.FC<MacroHealthCellProps> = ({ score }) => {
    if (score == null) {
        return <span className="text-[10px] font-bold text-white/20">—</span>
    }

    const label = macroLabel(score)
    const colorClass =
        score >= 70
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : score >= 45
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'

    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-black font-mono', colorClass)}>
            {score}
            <span className="text-[9px] uppercase tracking-wider opacity-70">{label}</span>
        </span>
    )
}