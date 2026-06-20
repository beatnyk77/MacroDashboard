import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { TradeView } from '../constants'

const VIEWS: { id: TradeView; label: string }[] = [
    { id: 'exports', label: 'Export Markets' },
    { id: 'imports', label: 'Import Flows' },
    { id: 'bilateral', label: 'Bilateral' },
]

export const TradeViewToggle: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const active = (searchParams.get('view') as TradeView) || 'exports'

    const setView = (view: TradeView) => {
        const next = new URLSearchParams(searchParams)
        next.set('view', view)
        setSearchParams(next, { replace: false })
    }

    return (
        <div className="flex flex-wrap gap-2">
            {VIEWS.map(v => (
                <button
                    key={v.id}
                    onClick={() => setView(v.id)}
                    className={cn(
                        'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border',
                        active === v.id
                            ? 'bg-amber-400/20 text-amber-400 border-amber-400/30'
                            : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/5'
                    )}
                >
                    {v.label}
                </button>
            ))}
        </div>
    )
}