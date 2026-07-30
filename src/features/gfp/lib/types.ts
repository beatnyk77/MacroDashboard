export interface GfpNarrativeInputs {
  latest_fy: number | null;
  top5_share?: number | null;
  top10_share?: number | null;
  hhi?: number | null;
  total_net_cost?: number | null;
  total_assets_bil?: number | null;
  total_liabilities_bil?: number | null;
  net_position_bil?: number | null;
  net_position_yoy_bil?: number | null;
}

export interface FrusgNetCostRow {
  stmt_fiscal_year: number;
  agency_nm: string;
  net_cost_bil: number | null;
  gross_cost_bil: number | null;
  is_total_row: boolean;
  record_date: string;
}

export interface FrusgBalanceSummary {
  stmt_fiscal_year: number;
  record_date: string;
  total_assets_bil: number | null;
  total_liabilities_bil: number | null;
  net_position_bil: number | null;
}

export interface MtsOutlayRankRow {
  record_date: string;
  classification_desc: string;
  current_month_net_outly: number | null;
  yoy_fytd: number | null;
  share: number | null;
  vol_12m: number | null;
  rnk: number;
}

export interface ReceiptsAgencyYear {
  fiscal_year_end_year: number;
  record_date: string;
  aid_cd: string;
  agency_name: string;
  receipt_amt: number | null;
}

export const GFP_BASIS = {
  accrual: 'Accrual / GAAP (Financial Report of the U.S. Government)',
  cash: 'Cash / budget (Monthly Treasury Statement / Combined Statement)',
} as const;
