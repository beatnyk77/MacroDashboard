import { supabase } from '@/lib/supabase';

export interface ClientErrorPayload {
    message: string;
    stack?: string;
    componentStack?: string;
    route?: string;
    boundary?: string;
}

const MAX_FIELD_LEN = 2000;
const DEDUPE_MS = 60_000;
const recentHashes = new Map<string, number>();

function truncate(value: string | undefined, max = MAX_FIELD_LEN): string | undefined {
    if (!value) return undefined;
    return value.length > max ? `${value.slice(0, max)}…` : value;
}

function hashPayload(payload: ClientErrorPayload): string {
    const key = [payload.message, payload.boundary, payload.route].join('|');
    let h = 0;
    for (let i = 0; i < key.length; i++) {
        h = (h << 5) - h + key.charCodeAt(i);
        h |= 0;
    }
    return String(h);
}

/** Build-time + runtime gate. Default off unless VITE_ENABLE_ERROR_REPORTING=true. */
export function isErrorReportingEnabled(): boolean {
    if (import.meta.env.VITE_ENABLE_ERROR_REPORTING !== 'true') return false;
    try {
        return localStorage.getItem('gq_error_reporting') !== 'off';
    } catch {
        return true;
    }
}

/** Allow user to disable reporting for this browser session (non-destructive). */
export function disableErrorReportingForSession(): void {
    try {
        localStorage.setItem('gq_error_reporting', 'off');
    } catch {
        // ignore
    }
}

/**
 * Report an anonymous client error. No-op when reporting is disabled.
 * Always logs to console for local diagnostics.
 */
export async function reportClientError(payload: ClientErrorPayload): Promise<void> {
    const message = payload.message || 'Unknown error';
    console.error('[GraphiQuestor]', message, payload);

    if (!isErrorReportingEnabled()) return;

    const hash = hashPayload(payload);
    const now = Date.now();
    const last = recentHashes.get(hash);
    if (last && now - last < DEDUPE_MS) return;
    recentHashes.set(hash, now);

    const body = {
        message: truncate(message, 500),
        stack: truncate(payload.stack),
        component_stack: truncate(payload.componentStack),
        route: truncate(payload.route ?? window.location.pathname, 256),
        boundary: truncate(payload.boundary, 128),
        user_agent: truncate(navigator.userAgent, 256),
    };

    try {
        const { error } = await supabase.functions.invoke('report-client-error', { body });
        if (error) {
            console.warn('[GraphiQuestor] Error report not delivered:', error.message);
        }
    } catch (err) {
        console.warn('[GraphiQuestor] Error report transport failed:', err);
    }
}

/** Global window error hooks — call once at app bootstrap. */
export function initErrorReporting(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
        void reportClientError({
            message: event.message,
            stack: event.error?.stack,
            route: window.location.pathname,
            boundary: 'window.onerror',
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        const message = reason instanceof Error ? reason.message : String(reason);
        const stack = reason instanceof Error ? reason.stack : undefined;
        void reportClientError({
            message,
            stack,
            route: window.location.pathname,
            boundary: 'unhandledrejection',
        });
    });
}