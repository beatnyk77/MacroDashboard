/**
 * dossierNarrative — formatting and the templated "what the chart says now" read.
 * Every sentence is filled from DossierSummary; the copy states levels and history,
 * never a forecast.
 */

import type { DossierUnit } from './dossierRegistry';
import type { Change, DossierSummary, SeriesPoint } from './dossierStats';

export function formatValue(value: number, unit: DossierUnit, decimals: number): string {
    if (!Number.isFinite(value)) return '—';
    const fixed = (v: number, d = decimals) =>
        v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    switch (unit) {
        case 'usd-bn':
            return Math.abs(value) >= 1000 ? `$${fixed(value / 1000, 2)}T` : `$${fixed(value)}B`;
        case 'usd-oz':
            return `$${fixed(value)}/oz`;
        case 'pct':
            return `${fixed(value)}%`;
        case 'bp':
            return `${fixed(value)} bp`;
        case 'sigma':
            return `${value > 0 ? '+' : ''}${fixed(value)}σ`;
        case 'ratio':
            return fixed(value);
    }
}

/** Units read as levels (%, bp, σ) report changes in their own units; the rest in percent. */
const ADDITIVE_UNITS: ReadonlySet<DossierUnit> = new Set(['pct', 'bp', 'sigma']);

export function formatChange(change: Change | undefined, unit: DossierUnit, decimals: number): string {
    if (!change) return '—';
    const sign = change.abs > 0 ? '+' : change.abs < 0 ? '−' : '';
    if (ADDITIVE_UNITS.has(unit) || change.pct === undefined) {
        const mag = Math.abs(change.abs);
        const d = Math.max(decimals, 1);
        if (unit === 'pct') return `${sign}${mag.toFixed(d)} pp`;
        if (unit === 'bp') return `${sign}${mag.toFixed(0)} bp`;
        if (unit === 'sigma') return `${sign}${mag.toFixed(2)}σ`;
        return `${sign}${mag.toFixed(d)}`;
    }
    return `${sign}${Math.abs(change.pct).toFixed(1)}%`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "14 Oct 2026", or "Oct 2026" for monthly-or-slower series. */
export function formatDate(date: string, monthly: boolean): string {
    const [y, m, d] = date.split('-').map(Number);
    if (!y || !m) return date;
    return monthly ? `${MONTHS[m - 1]} ${y}` : `${d} ${MONTHS[m - 1]} ${y}`;
}

/** True when the median spacing between observations is about a month or longer. */
export function isMonthlyOrSlower(points: SeriesPoint[]): boolean {
    if (points.length < 3) return true;
    const gaps: number[] = [];
    for (let i = Math.max(1, points.length - 60); i < points.length; i++) {
        gaps.push(Date.parse(points[i].date) - Date.parse(points[i - 1].date));
    }
    gaps.sort((a, b) => a - b);
    return gaps[Math.floor(gaps.length / 2)] >= 25 * 86_400_000;
}

export function ordinal(n: number): string {
    const r = Math.round(n);
    const mod100 = r % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${r}th`;
    return `${r}${['th', 'st', 'nd', 'rd'][r % 10] ?? 'th'}`;
}

function placement(percentile: number): string {
    if (percentile >= 95) return 'at the top of its recorded range';
    if (percentile >= 80) return 'in the upper part of its range';
    if (percentile <= 5) return 'at the bottom of its recorded range';
    if (percentile <= 20) return 'in the lower part of its range';
    return 'in the middle of its historical range';
}

function movePhrase(span: string, c: Change, unit: DossierUnit, decimals: number): string {
    if (c.abs === 0) return `${span} it was unchanged`;
    return `${span} it ${c.abs > 0 ? 'rose' : 'fell'} ${formatChange(c, unit, decimals).replace(/^[+−]/, '')}`;
}

export interface NarrativeInput {
    name: string;
    unit: DossierUnit;
    decimals: number;
    unitNote?: string;
    summary: DossierSummary;
    monthly: boolean;
}

/** Short history = under three years stored; percentile claims are qualified accordingly. */
export const SHORT_HISTORY_YEARS = 3;

export function buildNowReading({ name, unit, decimals, unitNote, summary, monthly }: NarrativeInput): string[] {
    const v = (p: SeriesPoint) => formatValue(p.value, unit, decimals);
    const d = (p: SeriesPoint) => formatDate(p.date, monthly);
    const note = unitNote ? ` ${unitNote}` : '';
    const sinceYear = summary.first.date.slice(0, 4);
    const short = summary.yearsCovered < SHORT_HISTORY_YEARS;
    const out: string[] = [];

    out.push(`The latest ${name} reading is ${v(summary.latest)}${note} (${d(summary.latest)}).`);

    if (short) {
        out.push(
            `GraphiQuestor’s stored history for this series begins ${d(summary.first)}, so the reading sits at the ${ordinal(summary.percentile)} percentile of ${summary.count.toLocaleString('en-US')} observations — a short window, not a long-run comparison.`,
        );
    } else if (summary.latest.value <= summary.min.value) {
        out.push(`That is the lowest reading among ${summary.count.toLocaleString('en-US')} observations since ${sinceYear}.`);
    } else if (summary.latest.value >= summary.max.value) {
        out.push(`That is the highest reading among ${summary.count.toLocaleString('en-US')} observations since ${sinceYear}.`);
    } else {
        out.push(
            `That is higher than ${Math.round(summary.percentile)}% of ${summary.count.toLocaleString('en-US')} observations since ${sinceYear}, placing it ${placement(summary.percentile)}.`,
        );
    }

    const moves: string[] = [];
    if (summary.change1y) moves.push(movePhrase('over the past year', summary.change1y, unit, decimals));
    if (summary.change5y) moves.push(movePhrase('over five years', summary.change5y, unit, decimals));
    if (moves.length) {
        const sentence = moves.join(', and ');
        out.push(`${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`);
    }

    if (summary.lastTimeAtLevel) {
        out.push(`The last time it stood at a comparable level (before the past 12 months) was ${d(summary.lastTimeAtLevel)}.`);
    }

    if (!short) {
        out.push(
            `Its recorded high is ${v(summary.max)} (${d(summary.max)}) and its low is ${v(summary.min)} (${d(summary.min)}).`,
        );
    }
    return out;
}
