export type DocScope =
  | 'global'
  | 'liquidity'
  | 'energy'
  | 'china'
  | 'india'
  | 'sovereign'
  | 'corporate'
  | 'api';

export interface FAQItem {
  id: string;
  question: string;
  answer: string; // Markdown formatted answer
  category?: string; // e.g. "Methodology", "Ingestion Cadence", "Data Health"
  citationUrl?: string; // Internal route link e.g. "/methods/net-liquidity"
  citationLabel?: string; // e.g. "Doc: Net Liquidity Z-Score"
  tags?: string[];
}

export interface FAQCatalogEntry {
  pageId: string;
  deskTitle?: string;
  subtitle?: string;
  docScope: DocScope;
  items: FAQItem[];
  suggestedPrompts?: string[];
}

export interface Citation {
  title: string;
  url: string;
  snippet?: string;
}

export interface SessionQuery {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  citations: Citation[];
  status: 'reading-docs' | 'streaming' | 'completed' | 'error';
  error?: string;
}

export interface RAGStreamPayload {
  question: string;
  pageId?: string;
  docScope?: DocScope | string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface RAGChunk {
  type: 'status' | 'delta' | 'citation' | 'done' | 'error';
  content?: string;
  citation?: Citation;
  error?: string;
}
