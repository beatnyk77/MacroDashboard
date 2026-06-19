import { supabase } from '@/lib/supabase';
import { withoutTrailingSlash } from '@/lib/urlPath';
import type { Json } from '@/types/database.types';

const SESSION_KEY = 'gq_analytics_session';

function getSessionId(): string {
    if (typeof window === 'undefined') return 'ssr';
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
        id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
}

function shouldRecord(path: string): boolean {
    if (import.meta.env.DEV) return false;
    if (path.startsWith('/admin')) return false;
    return true;
}

/** Fire-and-forget first-party event for admin traffic intelligence. */
export function recordSiteEvent(
    eventName: string,
    pagePath: string,
    valueNumeric?: number,
    metadata: Json = {}
): void {
    if (typeof window === 'undefined') return;
    const path = withoutTrailingSlash(pagePath);
    if (!shouldRecord(path)) return;

    void supabase.from('site_analytics_events').insert({
        session_id: getSessionId(),
        event_name: eventName,
        page_path: path,
        value_numeric: valueNumeric ?? null,
        metadata,
    });
}

export function recordPageView(pagePath: string): void {
    recordSiteEvent('page_view', pagePath);
}