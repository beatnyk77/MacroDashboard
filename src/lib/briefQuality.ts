/**
 * Morning Macro Brief quality bar (weekday deep notes).
 * Used by UI badges and SEO description helpers.
 */

export const BRIEF_QUALITY = {
    /** Minimum words for a "deep" weekday brief */
    minWordsDeep: 350,
    /** Below this, treat as thin (archive/SERP risk) */
    minWordsAcceptable: 180,
} as const;

export type BriefDepth = 'deep' | 'standard' | 'thin' | 'unknown';

export function countWords(text: string | null | undefined): number {
    if (!text) return 0;
    return text
        .replace(/<[^>]+>/g, ' ')
        .split(/\s+/)
        .filter(Boolean).length;
}

/** Extract plain text from brief content object (flexible shape). */
export function briefContentToText(content: unknown): string {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (typeof content !== 'object') return String(content);
    const c = content as Record<string, unknown>;
    const parts: string[] = [];
    for (const key of [
        'thesis',
        'regime_status',
        'executive_summary',
        'summary',
        'headline',
        'body',
        'narrative',
        'key_signals',
        'implications',
        'what_changed',
        'focus_observations',
        'watch_today',
        'risks',
    ]) {
        const v = c[key];
        if (typeof v === 'string') parts.push(v);
        if (Array.isArray(v)) {
            parts.push(
                ...v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).filter(Boolean)
            );
        }
    }
    if (parts.length === 0) {
        try {
            return JSON.stringify(content);
        } catch {
            return '';
        }
    }
    return parts.join(' ');
}

export function classifyBriefDepth(wordCount: number): BriefDepth {
    if (wordCount <= 0) return 'unknown';
    if (wordCount >= BRIEF_QUALITY.minWordsDeep) return 'deep';
    if (wordCount >= BRIEF_QUALITY.minWordsAcceptable) return 'standard';
    return 'thin';
}

/** ET weekday 1=Mon … 5=Fri; 0/6 weekend */
export function isEtWeekend(date = new Date()): boolean {
    const dow = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
    }).format(date);
    return dow === 'Sat' || dow === 'Sun';
}

export function briefDepthLabel(depth: BriefDepth): string {
    switch (depth) {
        case 'deep':
            return 'Deep note';
        case 'standard':
            return 'Standard';
        case 'thin':
            return 'Thin';
        default:
            return 'Unscored';
    }
}
