import { useState, useCallback } from 'react'

export interface RecentHSCode {
    code: string
    description: string
    viewedAt: number
}

const STORAGE_KEY = 'gq_recent_hs_codes'
const MAX_ENTRIES = 8

function load(): RecentHSCode[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch (_e) {
        return []
    }
}

export function useRecentHSCodes() {
    const [recents, setRecents] = useState<RecentHSCode[]>(load)

    const push = useCallback((code: string, description: string) => {
        setRecents(prev => {
            const filtered = prev.filter(r => r.code !== code)
            const next = [{ code, description, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ENTRIES)
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
            } catch (_e) { /* storage quota exceeded — silently skip */ }
            return next
        })
    }, [])

    const clear = useCallback(() => {
        try { localStorage.removeItem(STORAGE_KEY) } catch (_e) { /* ignore */ }
        setRecents([])
    }, [])

    return { recents, push, clear }
}
