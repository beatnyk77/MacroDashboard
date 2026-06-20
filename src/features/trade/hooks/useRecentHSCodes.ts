import { useState, useCallback, useEffect } from 'react'
import {
    loadRecentHSCodes,
    pushRecentHSCode,
    clearRecentHSCodes,
    subscribeRecentHSCodes,
    type RecentHSCode,
} from '../lib/recentHSCodes'

export type { RecentHSCode }

export function useRecentHSCodes() {
    const [recents, setRecents] = useState<RecentHSCode[]>(loadRecentHSCodes)

    useEffect(() => subscribeRecentHSCodes(setRecents), [])

    useEffect(() => {
        const onStorage = (e: globalThis.StorageEvent) => {
            if (e.key === 'gq_recent_hs_codes') setRecents(loadRecentHSCodes())
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    const push = useCallback((code: string, description: string) => {
        pushRecentHSCode(code, description)
    }, [])

    const clear = useCallback(() => {
        clearRecentHSCodes()
    }, [])

    return { recents, push, clear }
}
