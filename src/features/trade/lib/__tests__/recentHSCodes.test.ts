import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    loadRecentHSCodes,
    pushRecentHSCode,
    clearRecentHSCodes,
    subscribeRecentHSCodes,
    RECENT_HS_STORAGE_KEY,
    MAX_RECENT_HS,
} from '../recentHSCodes'

describe('recentHSCodes storage', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('returns empty array when storage is empty', () => {
        expect(loadRecentHSCodes()).toEqual([])
    })

    it('prepends new entry and deduplicates by code', () => {
        pushRecentHSCode('854231', 'Processors')
        pushRecentHSCode('620342', 'Trousers')
        pushRecentHSCode('854231', 'Processors updated')

        const recents = loadRecentHSCodes()
        expect(recents).toHaveLength(2)
        expect(recents[0].code).toBe('854231')
        expect(recents[0].description).toBe('Processors updated')
        expect(recents[1].code).toBe('620342')
    })

    it('caps entries at MAX_RECENT_HS', () => {
        for (let i = 0; i < MAX_RECENT_HS + 3; i++) {
            pushRecentHSCode(String(100000 + i), `Item ${i}`)
        }
        expect(loadRecentHSCodes()).toHaveLength(MAX_RECENT_HS)
    })

    it('persists to localStorage', () => {
        pushRecentHSCode('3004', 'Medicaments')
        const raw = localStorage.getItem(RECENT_HS_STORAGE_KEY)
        expect(raw).toBeTruthy()
        expect(JSON.parse(raw!)[0].code).toBe('3004')
    })

    it('clearRecentHSCodes removes all entries', () => {
        pushRecentHSCode('8542', 'Semiconductors')
        clearRecentHSCodes()
        expect(loadRecentHSCodes()).toEqual([])
    })

    it('notifies subscribers on push and clear', () => {
        const listener = vi.fn()
        const unsub = subscribeRecentHSCodes(listener)

        pushRecentHSCode('6203', 'Suits')
        expect(listener).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ code: '6203' }),
        ]))

        clearRecentHSCodes()
        expect(listener).toHaveBeenLastCalledWith([])

        unsub()
    })
})