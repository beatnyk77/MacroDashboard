export interface RecentHSCode {
    code: string
    description: string
    viewedAt: number
}

export const RECENT_HS_STORAGE_KEY = 'gq_recent_hs_codes'
export const MAX_RECENT_HS = 8

type Listener = (recents: RecentHSCode[]) => void
const listeners = new Set<Listener>()

function notify(recents: RecentHSCode[]) {
    listeners.forEach(fn => fn(recents))
}

export function loadRecentHSCodes(): RecentHSCode[] {
    try {
        return JSON.parse(localStorage.getItem(RECENT_HS_STORAGE_KEY) || '[]')
    } catch {
        return []
    }
}

export function pushRecentHSCode(code: string, description: string): RecentHSCode[] {
    const prev = loadRecentHSCodes()
    const filtered = prev.filter(r => r.code !== code)
    const next = [{ code, description, viewedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT_HS)
    try {
        localStorage.setItem(RECENT_HS_STORAGE_KEY, JSON.stringify(next))
    } catch { /* quota exceeded */ }
    notify(next)
    return next
}

export function clearRecentHSCodes(): void {
    try {
        localStorage.removeItem(RECENT_HS_STORAGE_KEY)
    } catch { /* ignore */ }
    notify([])
}

export function subscribeRecentHSCodes(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
}