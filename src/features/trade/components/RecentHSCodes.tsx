import React from 'react'
import { useNavigate } from 'react-router-dom'
import { History, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRecentHSCodes } from '../hooks/useRecentHSCodes'

export const RecentHSCodes: React.FC = () => {
    const navigate = useNavigate()
    const { recents, clear } = useRecentHSCodes()

    if (recents.length === 0) return null

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                    <History className="w-3 h-3" />
                    Recently Viewed
                </span>
                <button
                    onClick={clear}
                    className="text-[9px] font-bold uppercase tracking-widest text-white/15 hover:text-white/40 transition-colors flex items-center gap-1"
                >
                    <X className="w-2.5 h-2.5" />
                    Clear
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {recents.map(r => (
                    <button
                        key={r.code}
                        onClick={() => navigate(`/trade/hs/${r.code}`)}
                        className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/8',
                            'bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/25',
                            'transition-all duration-150 group text-left'
                        )}
                    >
                        <span className="text-xs font-black text-white/60 font-mono group-hover:text-emerald-400 transition-colors">
                            {r.code}
                        </span>
                        <span className="text-[10px] font-semibold text-white/25 group-hover:text-white/50 transition-colors max-w-[180px] truncate">
                            {r.description}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
}
