/**
 * Map FiscalData security_term / original_security_term → canonical UI terms.
 * UI chips use market labels (3-Month, 6-Month, 5-Year); FiscalData often uses
 * 13-Week, 26-Week, etc.
 */
export function normalizeAuctionTerm(
    securityTerm: string | null | undefined,
    originalTerm: string | null | undefined,
    securityType: string | null | undefined,
): string | null {
    const raw = [securityTerm, originalTerm]
        .filter(Boolean)
        .map((s) => String(s).trim())
        .filter(Boolean);

    if (raw.length === 0) return null;

    const candidates = [...raw, ...raw.map((t) => t.replace(/\s+/g, '-'))];

    const aliases: Array<{ match: RegExp; term: string }> = [
        { match: /^(4[\s-]?week|1[\s-]?month)$/i, term: '4-Week' },
        { match: /^(8[\s-]?week|2[\s-]?month)$/i, term: '8-Week' },
        { match: /^(13[\s-]?week|3[\s-]?month)$/i, term: '3-Month' },
        { match: /^(17[\s-]?week)$/i, term: '17-Week' },
        { match: /^(26[\s-]?week|6[\s-]?month)$/i, term: '6-Month' },
        { match: /^(52[\s-]?week|1[\s-]?year)$/i, term: '52-Week' },
        { match: /^(2[\s-]?year)$/i, term: '2-Year' },
        { match: /^(3[\s-]?year)$/i, term: '3-Year' },
        { match: /^(5[\s-]?year)$/i, term: '5-Year' },
        { match: /^(7[\s-]?year)$/i, term: '7-Year' },
        { match: /^(10[\s-]?year)$/i, term: '10-Year' },
        { match: /^(20[\s-]?year)$/i, term: '20-Year' },
        { match: /^(30[\s-]?year)$/i, term: '30-Year' },
    ];

    for (const c of candidates) {
        for (const a of aliases) {
            if (a.match.test(c)) return a.term;
        }
    }

    const exact = new Set([
        '4-Week', '8-Week', '3-Month', '17-Week', '6-Month', '52-Week',
        '2-Year', '3-Year', '5-Year', '7-Year', '10-Year', '20-Year', '30-Year',
    ]);
    for (const c of candidates) {
        if (exact.has(c)) return c;
    }

    void securityType;
    return null;
}

export const TARGET_CANONICAL_TERMS = new Set([
    '4-Week',
    '8-Week',
    '3-Month',
    '17-Week',
    '6-Month',
    '52-Week',
    '2-Year',
    '3-Year',
    '5-Year',
    '7-Year',
    '10-Year',
    '20-Year',
    '30-Year',
]);
