import { toAbsoluteUrl } from '@/lib/urlPath';

export type ResearchPageType = 'glossary' | 'methodology' | 'hub';

export interface ResearchCitationInput {
    title: string;
    path: string;
    pageType: ResearchPageType;
    summary: string;
    keyPoints: string[];
    formula?: string;
    category?: string;
    source?: string;
}

const BRAND = 'GraphiQuestor';

export function buildShortCitation(input: ResearchCitationInput): string {
    const url = toAbsoluteUrl(input.path);
    return `${input.title}. ${BRAND} Macro Intelligence. ${url} (accessed ${new Date().toISOString().split('T')[0]}).`;
}

export function buildApaCitation(input: ResearchCitationInput): string {
    const url = toAbsoluteUrl(input.path);
    const year = new Date().getFullYear();
    const typeLabel =
        input.pageType === 'glossary'
            ? 'Glossary entry'
            : input.pageType === 'methodology'
              ? 'Methodology article'
              : 'Reference hub';
    return `${BRAND}. (${year}). ${input.title} [${typeLabel}]. ${url}`;
}

export function buildMarkdownCitation(input: ResearchCitationInput): string {
    const url = toAbsoluteUrl(input.path);
    return `[${input.title} — ${BRAND}](${url})`;
}

export function buildLlmSummaryBlock(input: ResearchCitationInput): string {
    const lines = [
        `# ${input.title}`,
        `Source: ${BRAND} (${toAbsoluteUrl(input.path)})`,
        `Type: ${input.pageType}`,
        ...(input.category ? [`Category: ${input.category}`] : []),
        '',
        '## Summary',
        input.summary,
        '',
        '## Key Points',
        ...input.keyPoints.map((p) => `- ${p}`),
    ];
    if (input.formula) {
        lines.push('', '## Formula', input.formula);
    }
    if (input.source) {
        lines.push('', `## Data Provenance`, input.source);
    }
    return lines.join('\n');
}