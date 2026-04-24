import React, { useState, useRef, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHSCodeSearch } from '../hooks/useHSCodeSearch'
import type { HSCodeMaster } from '../types/trade'

interface HSCodeSearchProps {
    onSelect: (code: HSCodeMaster) => void
    placeholder?: string
    className?: string
    autoFocus?: boolean
}

export const HSCodeSearch: React.FC<HSCodeSearchProps> = ({
    onSelect,
    placeholder = 'Search by HS code or product description…',
    className,
    autoFocus = false,
}) => {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const { results, loading } = useHSCodeSearch(query)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleSelect = (code: HSCodeMaster) => {
        setQuery('')
        setOpen(false)
        onSelect(code)
    }

    const levelBadge = (level: number) => {
        const map: Record<number, { label: string; cls: string }> = {
            2: { label: 'Chapter', cls: 'bg-violet-500/15 text-violet-400' },
            4: { label: 'Heading', cls: 'bg-blue-500/15 text-blue-400' },
            6: { label: '6-digit', cls: 'bg-emerald-500/15 text-emerald-400' },
        }
        const b = map[level] || { label: 'HS', cls: 'bg-white/10 text-white/40' }
        return (
            <span className={cn('text-[9px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-md', b.cls)}>
                {b.label}
            </span>
        )
    }

    return (
        <div ref={containerRef} className={cn('relative w-full', className)}>
            {/* Input */}
            <div className="relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                    ref={inputRef}
                    id="trade-hs-search"
                    type="text"
                    autoFocus={autoFocus}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    placeholder={placeholder}
                    className={cn(
                        'w-full bg-white/[0.04] border border-white/10 rounded-2xl',
                        'pl-11 pr-10 py-3.5 text-sm font-semibold text-white placeholder:text-white/25',
                        'focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.06]',
                        'transition-all duration-200'
                    )}
                />
                <div className="absolute right-4">
                    {loading ? (
                        <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
                    ) : query ? (
                        <button onClick={() => { setQuery(''); setOpen(false) }} className="text-white/20 hover:text-white/50 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Dropdown */}
            {open && results.length > 0 && (
                <div className={cn(
                    'absolute top-full mt-2 w-full z-50 overflow-hidden',
                    'bg-[#0f1117]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50',
                    'animate-in fade-in slide-in-from-top-2 duration-150'
                )}>
                    <div className="p-1.5 max-h-[360px] overflow-y-auto scrollbar-none">
                        {results.map((item) => (
                            <button
                                key={item.code}
                                onClick={() => handleSelect(item)}
                                className={cn(
                                    'w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left',
                                    'hover:bg-emerald-500/10 hover:border-emerald-500/10 border border-transparent',
                                    'transition-all duration-150 group'
                                )}
                            >
                                <span className="text-sm font-black text-white/80 font-mono w-14 shrink-0 pt-0.5 group-hover:text-emerald-400 transition-colors">
                                    {item.code}
                                </span>
                                <div className="flex flex-col gap-1 min-w-0">
                                    <span className="text-xs font-semibold text-white/70 leading-snug line-clamp-2">
                                        {item.description}
                                    </span>
                                    {levelBadge(item.level)}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
