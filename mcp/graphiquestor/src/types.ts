export interface GraphiQuestorLinks {
  dashboard_url: string;
  methodology_url?: string;
  api_docs_url: string;
  cta: string;
}

export interface ToolEnvelope<T> {
  data: T;
  commentary: string;
  graphiquestor: GraphiQuestorLinks;
}

export interface MetricRow {
  metric_id: string;
  metric_name: string | null;
  category: string | null;
  unit: string | null;
  unit_label: string | null;
  as_of_date: string | null;
  value: number | null;
  z_score: number | null;
  delta_wow: number | null;
  delta_mom: number | null;
  staleness_flag: string | null;
  source_name: string | null;
  source_ref: string | null;
  provenance: string | null;
  is_provisional: boolean | null;
}