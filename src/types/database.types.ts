export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      africa_macro_snapshots: {
        Row: {
          continent_summary: string
          created_at: string | null
          id: string
          insights_negative: Json
          insights_neutral: Json
          insights_positive: Json
          metrics_summary: Json
          snapshot_date: string
          updated_at: string | null
        }
        Insert: {
          continent_summary: string
          created_at?: string | null
          id?: string
          insights_negative?: Json
          insights_neutral?: Json
          insights_positive?: Json
          metrics_summary?: Json
          snapshot_date: string
          updated_at?: string | null
        }
        Update: {
          continent_summary?: string
          created_at?: string | null
          id?: string
          insights_negative?: Json
          insights_neutral?: Json
          insights_positive?: Json
          metrics_summary?: Json
          snapshot_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_compute_energy: {
        Row: {
          as_of_date: string
          category: string | null
          id: number
          label: string | null
          metadata: Json | null
          metric_id: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          as_of_date: string
          category?: string | null
          id?: number
          label?: string | null
          metadata?: Json | null
          metric_id: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          as_of_date?: string
          category?: string | null
          id?: number
          label?: string | null
          metadata?: Json | null
          metric_id?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          api_key: string
          calls_used: number
          created_at: string | null
          daily_quota: number
          id: string
          tier: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_key: string
          calls_used?: number
          created_at?: string | null
          daily_quota?: number
          id?: string
          tier?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_key?: string
          calls_used?: number
          created_at?: string | null
          daily_quota?: number
          id?: string
          tier?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cb_gold_net: {
        Row: {
          buyers_tonnes: number | null
          net_pct_global_stock: number | null
          net_tonnes: number | null
          period_label: string
          period_start_year: number
          sellers_tonnes: number | null
          top_buyers_json: Json | null
          top_sellers_json: Json | null
          updated_at: string | null
        }
        Insert: {
          buyers_tonnes?: number | null
          net_pct_global_stock?: number | null
          net_tonnes?: number | null
          period_label: string
          period_start_year: number
          sellers_tonnes?: number | null
          top_buyers_json?: Json | null
          top_sellers_json?: Json | null
          updated_at?: string | null
        }
        Update: {
          buyers_tonnes?: number | null
          net_pct_global_stock?: number | null
          net_tonnes?: number | null
          period_label?: string
          period_start_year?: number
          sellers_tonnes?: number | null
          top_buyers_json?: Json | null
          top_sellers_json?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      china_15th_fyp: {
        Row: {
          category: string
          created_at: string | null
          id: string
          impact_score: number | null
          label: string
          metadata: Json | null
          section: Database["public"]["Enums"]["fyp_section"]
          value_baseline: string | null
          value_target: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          impact_score?: number | null
          label: string
          metadata?: Json | null
          section: Database["public"]["Enums"]["fyp_section"]
          value_baseline?: string | null
          value_target?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          impact_score?: number | null
          label?: string
          metadata?: Json | null
          section?: Database["public"]["Enums"]["fyp_section"]
          value_baseline?: string | null
          value_target?: string | null
        }
        Relationships: []
      }
      china_bri_exposure: {
        Row: {
          as_of_date: string
          country_or_region: string
          distress_flag: boolean | null
          iso3: string | null
          lending_high_bn: number | null
          lending_low_bn: number | null
          lending_outstanding_bn: number | null
          restructuring_status: string | null
          sector: string | null
          source: string
          source_ref: string | null
          updated_at: string | null
        }
        Insert: {
          as_of_date: string
          country_or_region: string
          distress_flag?: boolean | null
          iso3?: string | null
          lending_high_bn?: number | null
          lending_low_bn?: number | null
          lending_outstanding_bn?: number | null
          restructuring_status?: string | null
          sector?: string | null
          source: string
          source_ref?: string | null
          updated_at?: string | null
        }
        Update: {
          as_of_date?: string
          country_or_region?: string
          distress_flag?: boolean | null
          iso3?: string | null
          lending_high_bn?: number | null
          lending_low_bn?: number | null
          lending_outstanding_bn?: number | null
          restructuring_status?: string | null
          sector?: string | null
          source?: string
          source_ref?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      china_debt_composites: {
        Row: {
          as_of_date: string
          components: Json | null
          composite_id: string
          formula: string | null
          updated_at: string | null
          value: number
        }
        Insert: {
          as_of_date: string
          components?: Json | null
          composite_id: string
          formula?: string | null
          updated_at?: string | null
          value: number
        }
        Update: {
          as_of_date?: string
          components?: Json | null
          composite_id?: string
          formula?: string | null
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      china_debt_layers: {
        Row: {
          as_of_date: string
          is_provisional: boolean | null
          layer_code: string
          provenance: Json | null
          source: string
          source_ref: string | null
          updated_at: string | null
          value_high_pct_gdp: number | null
          value_low_pct_gdp: number | null
          value_pct_gdp: number | null
        }
        Insert: {
          as_of_date: string
          is_provisional?: boolean | null
          layer_code: string
          provenance?: Json | null
          source: string
          source_ref?: string | null
          updated_at?: string | null
          value_high_pct_gdp?: number | null
          value_low_pct_gdp?: number | null
          value_pct_gdp?: number | null
        }
        Update: {
          as_of_date?: string
          is_provisional?: boolean | null
          layer_code?: string
          provenance?: Json | null
          source?: string
          source_ref?: string | null
          updated_at?: string | null
          value_high_pct_gdp?: number | null
          value_low_pct_gdp?: number | null
          value_pct_gdp?: number | null
        }
        Relationships: []
      }
      china_energy_grid: {
        Row: {
          carbon_intensity_gco2kwh: number | null
          coal_share_pct: number | null
          hydro_share_pct: number | null
          id: string
          last_updated_at: string | null
          nuclear_share_pct: number | null
          renewables_share_pct: number | null
          solar_share_pct: number | null
          source: string | null
          total_generation_twh: number | null
          wind_share_pct: number | null
          year: number
        }
        Insert: {
          carbon_intensity_gco2kwh?: number | null
          coal_share_pct?: number | null
          hydro_share_pct?: number | null
          id?: string
          last_updated_at?: string | null
          nuclear_share_pct?: number | null
          renewables_share_pct?: number | null
          solar_share_pct?: number | null
          source?: string | null
          total_generation_twh?: number | null
          wind_share_pct?: number | null
          year: number
        }
        Update: {
          carbon_intensity_gco2kwh?: number | null
          coal_share_pct?: number | null
          hydro_share_pct?: number | null
          id?: string
          last_updated_at?: string | null
          nuclear_share_pct?: number | null
          renewables_share_pct?: number | null
          solar_share_pct?: number | null
          source?: string | null
          total_generation_twh?: number | null
          wind_share_pct?: number | null
          year?: number
        }
        Relationships: []
      }
      china_fiscal_signals: {
        Row: {
          as_of_date: string
          is_provisional: boolean | null
          signal_key: string
          source: string
          source_ref: string | null
          unit: string | null
          updated_at: string | null
          value: number
          value_high: number | null
          value_low: number | null
        }
        Insert: {
          as_of_date: string
          is_provisional?: boolean | null
          signal_key: string
          source: string
          source_ref?: string | null
          unit?: string | null
          updated_at?: string | null
          value: number
          value_high?: number | null
          value_low?: number | null
        }
        Update: {
          as_of_date?: string
          is_provisional?: boolean | null
          signal_key?: string
          source?: string
          source_ref?: string | null
          unit?: string | null
          updated_at?: string | null
          value?: number
          value_high?: number | null
          value_low?: number | null
        }
        Relationships: []
      }
      china_macro_pulse: {
        Row: {
          date: string
          id: string
          is_provisional: boolean
          label: string | null
          last_updated_at: string | null
          metric_id: string
          source: string | null
          source_ref: string | null
          unit: string | null
          value: number | null
        }
        Insert: {
          date: string
          id?: string
          is_provisional?: boolean
          label?: string | null
          last_updated_at?: string | null
          metric_id: string
          source?: string | null
          source_ref?: string | null
          unit?: string | null
          value?: number | null
        }
        Update: {
          date?: string
          id?: string
          is_provisional?: boolean
          label?: string | null
          last_updated_at?: string | null
          metric_id?: string
          source?: string | null
          source_ref?: string | null
          unit?: string | null
          value?: number | null
        }
        Relationships: []
      }
      china_pboc_ops: {
        Row: {
          date: string
          id: string
          last_updated_at: string | null
          m2_growth_yoy: number | null
          mlf_rate: number | null
          net_liquidity_signal: number | null
          pboc_vs_fed_gap: number | null
          regime_label: string | null
          reverse_repo_7d: number | null
          rrr_rate_large: number | null
          source: string | null
          tss_growth_yoy: number | null
        }
        Insert: {
          date: string
          id?: string
          last_updated_at?: string | null
          m2_growth_yoy?: number | null
          mlf_rate?: number | null
          net_liquidity_signal?: number | null
          pboc_vs_fed_gap?: number | null
          regime_label?: string | null
          reverse_repo_7d?: number | null
          rrr_rate_large?: number | null
          source?: string | null
          tss_growth_yoy?: number | null
        }
        Update: {
          date?: string
          id?: string
          last_updated_at?: string | null
          m2_growth_yoy?: number | null
          mlf_rate?: number | null
          net_liquidity_signal?: number | null
          pboc_vs_fed_gap?: number | null
          regime_label?: string | null
          reverse_repo_7d?: number | null
          rrr_rate_large?: number | null
          source?: string | null
          tss_growth_yoy?: number | null
        }
        Relationships: []
      }
      china_policy_banks: {
        Row: {
          as_of_date: string
          bonds_high_cny_tn: number | null
          bonds_low_cny_tn: number | null
          bonds_outstanding_cny_tn: number | null
          institution_code: string
          institution_name: string
          is_provisional: boolean | null
          pct_total_bond_market: number | null
          source: string
          source_ref: string | null
          spread_vs_cgb_bps: number | null
          updated_at: string | null
          yoy_growth_pct: number | null
        }
        Insert: {
          as_of_date: string
          bonds_high_cny_tn?: number | null
          bonds_low_cny_tn?: number | null
          bonds_outstanding_cny_tn?: number | null
          institution_code: string
          institution_name: string
          is_provisional?: boolean | null
          pct_total_bond_market?: number | null
          source: string
          source_ref?: string | null
          spread_vs_cgb_bps?: number | null
          updated_at?: string | null
          yoy_growth_pct?: number | null
        }
        Update: {
          as_of_date?: string
          bonds_high_cny_tn?: number | null
          bonds_low_cny_tn?: number | null
          bonds_outstanding_cny_tn?: number | null
          institution_code?: string
          institution_name?: string
          is_provisional?: boolean | null
          pct_total_bond_market?: number | null
          source?: string
          source_ref?: string | null
          spread_vs_cgb_bps?: number | null
          updated_at?: string | null
          yoy_growth_pct?: number | null
        }
        Relationships: []
      }
      china_provincial_fiscal_stress: {
        Row: {
          as_of_date: string
          composite_stress_score: number | null
          debt_to_fiscal_revenue_pct: number | null
          gdp_growth_deviation_pp: number | null
          land_revenue_decline_pct: number | null
          lgfv_concentration_score: number | null
          province_code: string
          province_name: string
          risk_profile: string | null
          source: string
          source_ref: string | null
          special_bond_accel_score: number | null
          updated_at: string | null
          watchlist_flag: boolean | null
        }
        Insert: {
          as_of_date: string
          composite_stress_score?: number | null
          debt_to_fiscal_revenue_pct?: number | null
          gdp_growth_deviation_pp?: number | null
          land_revenue_decline_pct?: number | null
          lgfv_concentration_score?: number | null
          province_code: string
          province_name: string
          risk_profile?: string | null
          source: string
          source_ref?: string | null
          special_bond_accel_score?: number | null
          updated_at?: string | null
          watchlist_flag?: boolean | null
        }
        Update: {
          as_of_date?: string
          composite_stress_score?: number | null
          debt_to_fiscal_revenue_pct?: number | null
          gdp_growth_deviation_pp?: number | null
          land_revenue_decline_pct?: number | null
          lgfv_concentration_score?: number | null
          province_code?: string
          province_name?: string
          risk_profile?: string | null
          source?: string
          source_ref?: string | null
          special_bond_accel_score?: number | null
          updated_at?: string | null
          watchlist_flag?: boolean | null
        }
        Relationships: []
      }
      china_soe_scenarios: {
        Row: {
          as_of_date: string
          assumptions: string | null
          consolidated_debt_outcome_pct: number | null
          contingent_liability_pct_gdp: number | null
          crystallization_rate_pct: number | null
          probability_weight_pct: number | null
          scenario_code: string
          scenario_label: string
          soe_debt_pct_gdp: number | null
          source: string
          source_ref: string | null
          updated_at: string | null
        }
        Insert: {
          as_of_date: string
          assumptions?: string | null
          consolidated_debt_outcome_pct?: number | null
          contingent_liability_pct_gdp?: number | null
          crystallization_rate_pct?: number | null
          probability_weight_pct?: number | null
          scenario_code: string
          scenario_label: string
          soe_debt_pct_gdp?: number | null
          source: string
          source_ref?: string | null
          updated_at?: string | null
        }
        Update: {
          as_of_date?: string
          assumptions?: string | null
          consolidated_debt_outcome_pct?: number | null
          contingent_liability_pct_gdp?: number | null
          crystallization_rate_pct?: number | null
          probability_weight_pct?: number | null
          scenario_code?: string
          scenario_label?: string
          soe_debt_pct_gdp?: number | null
          source?: string
          source_ref?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cie_alerts: {
        Row: {
          alert_type: string
          company_id: string | null
          created_at: string | null
          fired_at: string | null
          id: string
          is_active: boolean | null
          threshold: number | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          company_id?: string | null
          created_at?: string | null
          fired_at?: string | null
          id?: string
          is_active?: boolean | null
          threshold?: number | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          company_id?: string | null
          created_at?: string | null
          fired_at?: string | null
          id?: string
          is_active?: boolean | null
          threshold?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cie_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cie_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cie_bulk_block_deals: {
        Row: {
          client_name: string
          company_id: string | null
          created_at: string | null
          date: string
          deal_type: string
          equity_pct: number | null
          id: string
          price: number
          quantity: number
          symbol: string
          type: string
        }
        Insert: {
          client_name: string
          company_id?: string | null
          created_at?: string | null
          date: string
          deal_type: string
          equity_pct?: number | null
          id?: string
          price: number
          quantity: number
          symbol: string
          type: string
        }
        Update: {
          client_name?: string
          company_id?: string | null
          created_at?: string | null
          date?: string
          deal_type?: string
          equity_pct?: number | null
          id?: string
          price?: number
          quantity?: number
          symbol?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cie_bulk_block_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cie_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cie_companies: {
        Row: {
          created_at: string | null
          exchange: string | null
          governance_risk_score: number | null
          id: string
          industry: string | null
          insider_buy_sell_net: number | null
          last_sebi_action: string | null
          momentum_30d_pct: number | null
          name: string
          pledge_delta: number | null
          promoter_pledge_pct: number | null
          recent_deal_pct: number | null
          sector: string | null
          short_interest_delta_30d: number | null
          short_interest_pct: number | null
          state_hq: string | null
          ticker: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          exchange?: string | null
          governance_risk_score?: number | null
          id?: string
          industry?: string | null
          insider_buy_sell_net?: number | null
          last_sebi_action?: string | null
          momentum_30d_pct?: number | null
          name: string
          pledge_delta?: number | null
          promoter_pledge_pct?: number | null
          recent_deal_pct?: number | null
          sector?: string | null
          short_interest_delta_30d?: number | null
          short_interest_pct?: number | null
          state_hq?: string | null
          ticker: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          exchange?: string | null
          governance_risk_score?: number | null
          id?: string
          industry?: string | null
          insider_buy_sell_net?: number | null
          last_sebi_action?: string | null
          momentum_30d_pct?: number | null
          name?: string
          pledge_delta?: number | null
          promoter_pledge_pct?: number | null
          recent_deal_pct?: number | null
          sector?: string | null
          short_interest_delta_30d?: number | null
          short_interest_pct?: number | null
          state_hq?: string | null
          ticker?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cie_fundamentals: {
        Row: {
          capex: number | null
          company_id: string | null
          created_at: string | null
          debt_equity_ratio: number | null
          ebitda: number | null
          eps: number | null
          id: string
          metadata: Json | null
          net_profit: number | null
          operating_margin: number | null
          quarter_date: string
          return_on_equity: number | null
          revenue: number | null
          total_assets: number | null
          total_liabilities: number | null
          updated_at: string | null
        }
        Insert: {
          capex?: number | null
          company_id?: string | null
          created_at?: string | null
          debt_equity_ratio?: number | null
          ebitda?: number | null
          eps?: number | null
          id?: string
          metadata?: Json | null
          net_profit?: number | null
          operating_margin?: number | null
          quarter_date: string
          return_on_equity?: number | null
          revenue?: number | null
          total_assets?: number | null
          total_liabilities?: number | null
          updated_at?: string | null
        }
        Update: {
          capex?: number | null
          company_id?: string | null
          created_at?: string | null
          debt_equity_ratio?: number | null
          ebitda?: number | null
          eps?: number | null
          id?: string
          metadata?: Json | null
          net_profit?: number | null
          operating_margin?: number | null
          quarter_date?: string
          return_on_equity?: number | null
          revenue?: number | null
          total_assets?: number | null
          total_liabilities?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cie_fundamentals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cie_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cie_macro_signals: {
        Row: {
          as_of_date: string
          cds_monthly_change: number | null
          cds_spread_bps: number | null
          company_id: string | null
          created_at: string | null
          digitization_premium: number | null
          fiscal_exposure: number | null
          formalization_premium: number | null
          id: string
          liquidity_transmission_lag: number | null
          macro_impact_score: number | null
          oil_sensitivity: number | null
          state_exposure_json: Json | null
          state_resilience: number | null
          updated_at: string | null
        }
        Insert: {
          as_of_date: string
          cds_monthly_change?: number | null
          cds_spread_bps?: number | null
          company_id?: string | null
          created_at?: string | null
          digitization_premium?: number | null
          fiscal_exposure?: number | null
          formalization_premium?: number | null
          id?: string
          liquidity_transmission_lag?: number | null
          macro_impact_score?: number | null
          oil_sensitivity?: number | null
          state_exposure_json?: Json | null
          state_resilience?: number | null
          updated_at?: string | null
        }
        Update: {
          as_of_date?: string
          cds_monthly_change?: number | null
          cds_spread_bps?: number | null
          company_id?: string | null
          created_at?: string | null
          digitization_premium?: number | null
          fiscal_exposure?: number | null
          formalization_premium?: number | null
          id?: string
          liquidity_transmission_lag?: number | null
          macro_impact_score?: number | null
          oil_sensitivity?: number | null
          state_exposure_json?: Json | null
          state_resilience?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cie_macro_signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cie_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cie_price_history: {
        Row: {
          company_id: string | null
          date: string
          id: string
          price: number
        }
        Insert: {
          company_id?: string | null
          date: string
          id?: string
          price: number
        }
        Update: {
          company_id?: string | null
          date?: string
          id?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "cie_price_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cie_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cie_promoter_history: {
        Row: {
          company_id: string | null
          date: string
          id: string
          insider_net_buying: number | null
          pledge_pct: number | null
        }
        Insert: {
          company_id?: string | null
          date: string
          id?: string
          insider_net_buying?: number | null
          pledge_pct?: number | null
        }
        Update: {
          company_id?: string | null
          date?: string
          id?: string
          insider_net_buying?: number | null
          pledge_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cie_promoter_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cie_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cie_saved_views: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          name: string
          sort_config: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          name: string
          sort_config?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          name?: string
          sort_config?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cie_short_selling_history: {
        Row: {
          company_id: string | null
          created_at: string | null
          date: string
          id: string
          pct_of_delivery: number | null
          short_quantity: number | null
          short_value: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          pct_of_delivery?: number | null
          short_quantity?: number | null
          short_value?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          pct_of_delivery?: number | null
          short_quantity?: number | null
          short_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cie_short_selling_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cie_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cie_upcoming_ipos: {
        Row: {
          close_date: string | null
          company_name: string
          created_at: string | null
          draft_prospectus_url: string | null
          exchange: string | null
          id: string
          issue_size_cr: number | null
          listing_date: string | null
          macro_risk_score: number | null
          open_date: string | null
          price_band_max: number | null
          price_band_min: number | null
          sector: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          close_date?: string | null
          company_name: string
          created_at?: string | null
          draft_prospectus_url?: string | null
          exchange?: string | null
          id?: string
          issue_size_cr?: number | null
          listing_date?: string | null
          macro_risk_score?: number | null
          open_date?: string | null
          price_band_max?: number | null
          price_band_min?: number | null
          sector?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          close_date?: string | null
          company_name?: string
          created_at?: string | null
          draft_prospectus_url?: string | null
          exchange?: string | null
          id?: string
          issue_size_cr?: number | null
          listing_date?: string | null
          macro_risk_score?: number | null
          open_date?: string | null
          price_band_max?: number | null
          price_band_min?: number | null
          sector?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cie_watchlists: {
        Row: {
          company_ids: string[] | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_ids?: string[] | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_ids?: string[] | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      client_error_reports: {
        Row: {
          boundary: string | null
          component_stack: string | null
          error_hash: string
          id: number
          message: string
          reported_at: string
          route: string | null
          stack: string | null
          user_agent: string | null
        }
        Insert: {
          boundary?: string | null
          component_stack?: string | null
          error_hash: string
          id?: number
          message: string
          reported_at?: string
          route?: string | null
          stack?: string | null
          user_agent?: string | null
        }
        Update: {
          boundary?: string | null
          component_stack?: string | null
          error_hash?: string
          id?: number
          message?: string
          reported_at?: string
          route?: string | null
          stack?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      climate_risk_metrics: {
        Row: {
          country_code: string
          created_at: string | null
          date: string
          grid_co2_intensity: number | null
          id: string
          is_climate_emergency: boolean | null
          metadata: Json | null
          region_code: string | null
          renewable_share_pct: number | null
          temperature_alignment_c: number | null
          total_ghg_emissions_mt: number | null
          transition_risk_score: number | null
        }
        Insert: {
          country_code: string
          created_at?: string | null
          date: string
          grid_co2_intensity?: number | null
          id?: string
          is_climate_emergency?: boolean | null
          metadata?: Json | null
          region_code?: string | null
          renewable_share_pct?: number | null
          temperature_alignment_c?: number | null
          total_ghg_emissions_mt?: number | null
          transition_risk_score?: number | null
        }
        Update: {
          country_code?: string
          created_at?: string | null
          date?: string
          grid_co2_intensity?: number | null
          id?: string
          is_climate_emergency?: boolean | null
          metadata?: Json | null
          region_code?: string | null
          renewable_share_pct?: number | null
          temperature_alignment_c?: number | null
          total_ghg_emissions_mt?: number | null
          transition_risk_score?: number | null
        }
        Relationships: []
      }
      commodity_events: {
        Row: {
          as_of_date: string
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          lat: number
          lng: number
          severity: string | null
          source_url: string | null
        }
        Insert: {
          as_of_date: string
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          lat: number
          lng: number
          severity?: string | null
          source_url?: string | null
        }
        Update: {
          as_of_date?: string
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          lat?: number
          lng?: number
          severity?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      commodity_flows: {
        Row: {
          as_of_date: string
          commodity: string
          created_at: string | null
          id: string
          meta: Json | null
          source: string
          target: string
          volume: number
        }
        Insert: {
          as_of_date: string
          commodity: string
          created_at?: string | null
          id?: string
          meta?: Json | null
          source: string
          target: string
          volume: number
        }
        Update: {
          as_of_date?: string
          commodity?: string
          created_at?: string | null
          id?: string
          meta?: Json | null
          source?: string
          target?: string
          volume?: number
        }
        Relationships: []
      }
      commodity_imports: {
        Row: {
          country: string
          created_at: string | null
          id: string
          metal: string
          top_partners_json: Json | null
          updated_at: string | null
          value_usd: number
          volume: number | null
          volume_unit: string | null
          year: number
        }
        Insert: {
          country: string
          created_at?: string | null
          id?: string
          metal: string
          top_partners_json?: Json | null
          updated_at?: string | null
          value_usd?: number
          volume?: number | null
          volume_unit?: string | null
          year: number
        }
        Update: {
          country?: string
          created_at?: string | null
          id?: string
          metal?: string
          top_partners_json?: Json | null
          updated_at?: string | null
          value_usd?: number
          volume?: number | null
          volume_unit?: string | null
          year?: number
        }
        Relationships: []
      }
      commodity_prices: {
        Row: {
          as_of_date: string
          created_at: string | null
          curve_type: string | null
          id: string
          price: number
          symbol: string
          z_score: number | null
        }
        Insert: {
          as_of_date: string
          created_at?: string | null
          curve_type?: string | null
          id?: string
          price: number
          symbol: string
          z_score?: number | null
        }
        Update: {
          as_of_date?: string
          created_at?: string | null
          curve_type?: string | null
          id?: string
          price?: number
          symbol?: string
          z_score?: number | null
        }
        Relationships: []
      }
      commodity_reserves: {
        Row: {
          as_of_date: string
          commodity: string
          country: string
          coverage_days: number | null
          created_at: string | null
          id: string
          reserve_type: string
          volume: number
        }
        Insert: {
          as_of_date: string
          commodity: string
          country: string
          coverage_days?: number | null
          created_at?: string | null
          id?: string
          reserve_type: string
          volume: number
        }
        Update: {
          as_of_date?: string
          commodity?: string
          country?: string
          coverage_days?: number | null
          created_at?: string | null
          id?: string
          reserve_type?: string
          volume?: number
        }
        Relationships: []
      }
      comtrade_cache: {
        Row: {
          cached_at: string | null
          cmd_code: string
          flow_code: string
          hs_code: string
          id: number
          partner_code: string
          period: number
          primary_value: number
          reporter_code: string
          reporter_iso3: string
        }
        Insert: {
          cached_at?: string | null
          cmd_code: string
          flow_code: string
          hs_code: string
          id?: number
          partner_code: string
          period: number
          primary_value: number
          reporter_code: string
          reporter_iso3: string
        }
        Update: {
          cached_at?: string | null
          cmd_code?: string
          flow_code?: string
          hs_code?: string
          id?: number
          partner_code?: string
          period?: number
          primary_value?: number
          reporter_code?: string
          reporter_iso3?: string
        }
        Relationships: []
      }
      corporate_debt_maturities: {
        Row: {
          as_of_date: string
          bucket: string
          id: string
          implied_refinancing_cost_delta: number | null
          maturing_amount: number
          percent_of_total_debt: number | null
          updated_at: string | null
          weighted_avg_coupon: number | null
        }
        Insert: {
          as_of_date: string
          bucket: string
          id?: string
          implied_refinancing_cost_delta?: number | null
          maturing_amount: number
          percent_of_total_debt?: number | null
          updated_at?: string | null
          weighted_avg_coupon?: number | null
        }
        Update: {
          as_of_date?: string
          bucket?: string
          id?: string
          implied_refinancing_cost_delta?: number | null
          maturing_amount?: number
          percent_of_total_debt?: number | null
          updated_at?: string | null
          weighted_avg_coupon?: number | null
        }
        Relationships: []
      }
      corporate_profit_share: {
        Row: {
          country: string
          created_at: string | null
          id: string
          profit_share_pct: number
          quarter: string
          source: string
          squeeze_ratio: number | null
          wage_share_pct: number
          year: number
        }
        Insert: {
          country: string
          created_at?: string | null
          id?: string
          profit_share_pct: number
          quarter?: string
          source: string
          squeeze_ratio?: number | null
          wage_share_pct: number
          year: number
        }
        Update: {
          country?: string
          created_at?: string | null
          id?: string
          profit_share_pct?: number
          quarter?: string
          source?: string
          squeeze_ratio?: number | null
          wage_share_pct?: number
          year?: number
        }
        Relationships: []
      }
      country_metrics: {
        Row: {
          as_of: string | null
          confidence: number | null
          iso: string
          last_cron: string | null
          metadata: Json | null
          metric_key: string
          source: string
          value: number | null
        }
        Insert: {
          as_of?: string | null
          confidence?: number | null
          iso: string
          last_cron?: string | null
          metadata?: Json | null
          metric_key: string
          source: string
          value?: number | null
        }
        Update: {
          as_of?: string | null
          confidence?: number | null
          iso?: string
          last_cron?: string | null
          metadata?: Json | null
          metric_key?: string
          source?: string
          value?: number | null
        }
        Relationships: []
      }
      country_reserves: {
        Row: {
          as_of_date: string
          country_code: string
          fx_reserves_usd: number | null
          gold_tonnes: number | null
          gold_usd: number | null
          last_updated_at: string | null
          metadata: Json | null
          usd_share_pct: number | null
        }
        Insert: {
          as_of_date: string
          country_code: string
          fx_reserves_usd?: number | null
          gold_tonnes?: number | null
          gold_usd?: number | null
          last_updated_at?: string | null
          metadata?: Json | null
          usd_share_pct?: number | null
        }
        Update: {
          as_of_date?: string
          country_code?: string
          fx_reserves_usd?: number | null
          gold_tonnes?: number | null
          gold_usd?: number | null
          last_updated_at?: string | null
          metadata?: Json | null
          usd_share_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "country_reserves_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "g20_countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "country_reserves_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "vw_country_terminal"
            referencedColumns: ["iso"]
          },
          {
            foreignKeyName: "country_reserves_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "vw_g20_reserves_gold"
            referencedColumns: ["country_code"]
          },
        ]
      }
      cusip_ticker_cache: {
        Row: {
          company_name: string | null
          cusip: string
          fetched_at: string | null
          last_used_at: string | null
          sector: string | null
          ticker: string | null
        }
        Insert: {
          company_name?: string | null
          cusip: string
          fetched_at?: string | null
          last_used_at?: string | null
          sector?: string | null
          ticker?: string | null
        }
        Update: {
          company_name?: string | null
          cusip?: string
          fetched_at?: string | null
          last_used_at?: string | null
          sector?: string | null
          ticker?: string | null
        }
        Relationships: []
      }
      daily_changes: {
        Row: {
          abs_delta: number | null
          created_at: string | null
          curr_value: number | null
          direction: string
          id: string
          interpretation: string | null
          metric_id: string
          metric_label: string
          pct_delta: number | null
          prev_value: number | null
          signal_date: string
          significance: string
        }
        Insert: {
          abs_delta?: number | null
          created_at?: string | null
          curr_value?: number | null
          direction: string
          id?: string
          interpretation?: string | null
          metric_id: string
          metric_label: string
          pct_delta?: number | null
          prev_value?: number | null
          signal_date: string
          significance: string
        }
        Update: {
          abs_delta?: number | null
          created_at?: string | null
          curr_value?: number | null
          direction?: string
          id?: string
          interpretation?: string | null
          metric_id?: string
          metric_label?: string
          pct_delta?: number | null
          prev_value?: number | null
          signal_date?: string
          significance?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_changes_signal_date_fkey"
            columns: ["signal_date"]
            isOneToOne: false
            referencedRelation: "daily_signal"
            referencedColumns: ["signal_date"]
          },
          {
            foreignKeyName: "daily_changes_signal_date_fkey"
            columns: ["signal_date"]
            isOneToOne: false
            referencedRelation: "vw_latest_daily_signal"
            referencedColumns: ["signal_date"]
          },
        ]
      }
      daily_macro_briefs: {
        Row: {
          brief_date: string
          content: Json
          focus_areas: string[]
          generated_at: string | null
          id: string
          model_used: string | null
          regime_label: string | null
          regime_score: number | null
          tokens_used: number | null
        }
        Insert: {
          brief_date: string
          content?: Json
          focus_areas?: string[]
          generated_at?: string | null
          id?: string
          model_used?: string | null
          regime_label?: string | null
          regime_score?: number | null
          tokens_used?: number | null
        }
        Update: {
          brief_date?: string
          content?: Json
          focus_areas?: string[]
          generated_at?: string | null
          id?: string
          model_used?: string | null
          regime_label?: string | null
          regime_score?: number | null
          tokens_used?: number | null
        }
        Relationships: []
      }
      daily_signal: {
        Row: {
          component_scores: Json | null
          computed_at: string | null
          confidence_pct: number
          id: string
          key_driver: string | null
          regime: string
          regime_changed: boolean | null
          score: number
          score_delta: number | null
          signal_date: string
          watch_item: string | null
        }
        Insert: {
          component_scores?: Json | null
          computed_at?: string | null
          confidence_pct: number
          id?: string
          key_driver?: string | null
          regime: string
          regime_changed?: boolean | null
          score: number
          score_delta?: number | null
          signal_date: string
          watch_item?: string | null
        }
        Update: {
          component_scores?: Json | null
          computed_at?: string | null
          confidence_pct?: number
          id?: string
          key_driver?: string | null
          regime?: string
          regime_changed?: boolean | null
          score?: number
          score_delta?: number | null
          signal_date?: string
          watch_item?: string | null
        }
        Relationships: []
      }
      data_sources: {
        Row: {
          api_endpoint: string
          auth_type: string
          created_at: string | null
          id: number
          is_active: boolean | null
          last_checked: string | null
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          api_endpoint: string
          auth_type: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_checked?: string | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string
          auth_type?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_checked?: string | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      digest_sends: {
        Row: {
          recipient_count: number
          sent_at: string
          week_ending_date: string
        }
        Insert: {
          recipient_count?: number
          sent_at?: string
          week_ending_date: string
        }
        Update: {
          recipient_count?: number
          sent_at?: string
          week_ending_date?: string
        }
        Relationships: []
      }
      elite_wealth_flight: {
        Row: {
          amount_usd_bn: number
          created_at: string | null
          flight_velocity_pct: number | null
          haven_country: string
          id: string
          origin_country: string
          source: string
          year: number
        }
        Insert: {
          amount_usd_bn: number
          created_at?: string | null
          flight_velocity_pct?: number | null
          haven_country: string
          id?: string
          origin_country: string
          source: string
          year: number
        }
        Update: {
          amount_usd_bn?: number
          created_at?: string | null
          flight_velocity_pct?: number | null
          haven_country?: string
          id?: string
          origin_country?: string
          source?: string
          year?: number
        }
        Relationships: []
      }
      events_markers: {
        Row: {
          count: number | null
          created_at: string
          event_date: string
          id: string
          latitude: number
          location_name: string | null
          longitude: number
          raw_metadata: Json | null
          source: string
          type: string
        }
        Insert: {
          count?: number | null
          created_at?: string
          event_date: string
          id?: string
          latitude: number
          location_name?: string | null
          longitude: number
          raw_metadata?: Json | null
          source: string
          type: string
        }
        Update: {
          count?: number | null
          created_at?: string
          event_date?: string
          id?: string
          latitude?: number
          location_name?: string | null
          longitude?: number
          raw_metadata?: Json | null
          source?: string
          type?: string
        }
        Relationships: []
      }
      financial_hubs_metrics: {
        Row: {
          created_at: string | null
          hub: string
          id: string
          last_updated: string | null
          metric_date: string
          percentile: number | null
          primary_metric_label: string
          primary_metric_value: number
          secondary_metrics: Json | null
          source: string | null
          sparkline_data: Json | null
          z_score: number | null
        }
        Insert: {
          created_at?: string | null
          hub: string
          id?: string
          last_updated?: string | null
          metric_date: string
          percentile?: number | null
          primary_metric_label: string
          primary_metric_value: number
          secondary_metrics?: Json | null
          source?: string | null
          sparkline_data?: Json | null
          z_score?: number | null
        }
        Update: {
          created_at?: string | null
          hub?: string
          id?: string
          last_updated?: string | null
          metric_date?: string
          percentile?: number | null
          primary_metric_label?: string
          primary_metric_value?: number
          secondary_metrics?: Json | null
          source?: string | null
          sparkline_data?: Json | null
          z_score?: number | null
        }
        Relationships: []
      }
      fomc_minutes_analysis: {
        Row: {
          actionable_insight: string
          capital_implications: string
          created_at: string
          id: string
          key_themes: Json
          meeting_date: string
          notable_shifts: string
          overall_tone: string
          pdf_url: string | null
          raw_analysis: string
          release_date: string
        }
        Insert: {
          actionable_insight: string
          capital_implications: string
          created_at?: string
          id?: string
          key_themes: Json
          meeting_date: string
          notable_shifts: string
          overall_tone: string
          pdf_url?: string | null
          raw_analysis: string
          release_date: string
        }
        Update: {
          actionable_insight?: string
          capital_implications?: string
          created_at?: string
          id?: string
          key_themes?: Json
          meeting_date?: string
          notable_shifts?: string
          overall_tone?: string
          pdf_url?: string | null
          raw_analysis?: string
          release_date?: string
        }
        Relationships: []
      }
      fpi_sector_flows: {
        Row: {
          created_at: string | null
          date_code: string
          debt_auc_inr: number | null
          debt_net_inr: number | null
          equity_auc_inr: number | null
          equity_net_inr: number | null
          fortnight_end_date: string | null
          hybrid_auc_inr: number | null
          id: string
          period: string
          sector: string
          total_auc_inr: number | null
          total_net_inr: number | null
        }
        Insert: {
          created_at?: string | null
          date_code: string
          debt_auc_inr?: number | null
          debt_net_inr?: number | null
          equity_auc_inr?: number | null
          equity_net_inr?: number | null
          fortnight_end_date?: string | null
          hybrid_auc_inr?: number | null
          id?: string
          period: string
          sector: string
          total_auc_inr?: number | null
          total_net_inr?: number | null
        }
        Update: {
          created_at?: string | null
          date_code?: string
          debt_auc_inr?: number | null
          debt_net_inr?: number | null
          equity_auc_inr?: number | null
          equity_net_inr?: number | null
          fortnight_end_date?: string | null
          hybrid_auc_inr?: number | null
          id?: string
          period?: string
          sector?: string
          total_auc_inr?: number | null
          total_net_inr?: number | null
        }
        Relationships: []
      }
      fuel_security_clock_india: {
        Row: {
          active_tankers_count: number | null
          as_of_date: string
          brent_price_usd: number
          daily_consumption_mbpd: number
          deviation_pct: number | null
          geopolitical_risk_score: number | null
          id: string
          inr_per_barrel: number
          last_updated_at: string | null
          metadata: Json | null
          reserves_days_actual: number | null
          reserves_days_coverage: number
          reserves_days_official: number
          scenario_baseline_days: number
          scenario_disruption_days: number
          scenario_rationing_days: number
          tanker_pipeline_json: Json | null
        }
        Insert: {
          active_tankers_count?: number | null
          as_of_date: string
          brent_price_usd: number
          daily_consumption_mbpd: number
          deviation_pct?: number | null
          geopolitical_risk_score?: number | null
          id?: string
          inr_per_barrel: number
          last_updated_at?: string | null
          metadata?: Json | null
          reserves_days_actual?: number | null
          reserves_days_coverage: number
          reserves_days_official: number
          scenario_baseline_days: number
          scenario_disruption_days: number
          scenario_rationing_days: number
          tanker_pipeline_json?: Json | null
        }
        Update: {
          active_tankers_count?: number | null
          as_of_date?: string
          brent_price_usd?: number
          daily_consumption_mbpd?: number
          deviation_pct?: number | null
          geopolitical_risk_score?: number | null
          id?: string
          inr_per_barrel?: number
          last_updated_at?: string | null
          metadata?: Json | null
          reserves_days_actual?: number | null
          reserves_days_coverage?: number
          reserves_days_official?: number
          scenario_baseline_days?: number
          scenario_disruption_days?: number
          scenario_rationing_days?: number
          tanker_pipeline_json?: Json | null
        }
        Relationships: []
      }
      g20_countries: {
        Row: {
          code: string
          created_at: string | null
          is_major: boolean | null
          name: string
          region: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          is_major?: boolean | null
          name: string
          region?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          is_major?: boolean | null
          name?: string
          region?: string | null
        }
        Relationships: []
      }
      geojson_india: {
        Row: {
          created_at: string | null
          geojson: Json
          state_code: string
          state_name: string
        }
        Insert: {
          created_at?: string | null
          geojson: Json
          state_code: string
          state_name: string
        }
        Update: {
          created_at?: string | null
          geojson?: Json
          state_code?: string
          state_name?: string
        }
        Relationships: []
      }
      geopolitical_osint: {
        Row: {
          callsign: string | null
          id: string
          lat: number
          lng: number
          macro_correlation: string | null
          metadata: Json | null
          mmsi: string | null
          owner_flag: string | null
          route: string | null
          timestamp: string | null
          type: string
        }
        Insert: {
          callsign?: string | null
          id?: string
          lat: number
          lng: number
          macro_correlation?: string | null
          metadata?: Json | null
          mmsi?: string | null
          owner_flag?: string | null
          route?: string | null
          timestamp?: string | null
          type: string
        }
        Update: {
          callsign?: string | null
          id?: string
          lat?: number
          lng?: number
          macro_correlation?: string | null
          metadata?: Json | null
          mmsi?: string | null
          owner_flag?: string | null
          route?: string | null
          timestamp?: string | null
          type?: string
        }
        Relationships: []
      }
      geopolitical_risk_events: {
        Row: {
          as_of_date: string
          chokepoint: string
          created_at: string | null
          event_description: string | null
          event_title: string
          event_type: string
          id: string
          resolved_at: string | null
          severity: number
          source_type: string
          source_url: string | null
          updated_at: string | null
        }
        Insert: {
          as_of_date: string
          chokepoint: string
          created_at?: string | null
          event_description?: string | null
          event_title: string
          event_type: string
          id?: string
          resolved_at?: string | null
          severity: number
          source_type: string
          source_url?: string | null
          updated_at?: string | null
        }
        Update: {
          as_of_date?: string
          chokepoint?: string
          created_at?: string | null
          event_description?: string | null
          event_title?: string
          event_type?: string
          id?: string
          resolved_at?: string | null
          severity?: number
          source_type?: string
          source_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      global_liquidity_direction: {
        Row: {
          as_of_date: string
          cb_aggregate: number | null
          cb_aggregate_wow_pct: number | null
          composite_score: number | null
          composite_wow_pct: number | null
          created_at: string | null
          cross_border_flow: number | null
          cross_border_wow_pct: number | null
          global_m2_growth: number | null
          global_m2_wow_pct: number | null
          id: string
          interpretation: string | null
          regime_label: string | null
          risk_on_off_proxy: number | null
          risk_on_off_wow_pct: number | null
          trailing_history: Json | null
          updated_at: string | null
          velocity_label: string | null
        }
        Insert: {
          as_of_date: string
          cb_aggregate?: number | null
          cb_aggregate_wow_pct?: number | null
          composite_score?: number | null
          composite_wow_pct?: number | null
          created_at?: string | null
          cross_border_flow?: number | null
          cross_border_wow_pct?: number | null
          global_m2_growth?: number | null
          global_m2_wow_pct?: number | null
          id?: string
          interpretation?: string | null
          regime_label?: string | null
          risk_on_off_proxy?: number | null
          risk_on_off_wow_pct?: number | null
          trailing_history?: Json | null
          updated_at?: string | null
          velocity_label?: string | null
        }
        Update: {
          as_of_date?: string
          cb_aggregate?: number | null
          cb_aggregate_wow_pct?: number | null
          composite_score?: number | null
          composite_wow_pct?: number | null
          created_at?: string | null
          cross_border_flow?: number | null
          cross_border_wow_pct?: number | null
          global_m2_growth?: number | null
          global_m2_wow_pct?: number | null
          id?: string
          interpretation?: string | null
          regime_label?: string | null
          risk_on_off_proxy?: number | null
          risk_on_off_wow_pct?: number | null
          trailing_history?: Json | null
          updated_at?: string | null
          velocity_label?: string | null
        }
        Relationships: []
      }
      global_refining_capacity: {
        Row: {
          as_of_date: string
          capacity_mbpd: number
          country: string
          created_at: string | null
          facility_name: string
          historical_median_pct: number | null
          id: string
          import_dependency_correlation: number | null
          is_top_10: boolean | null
          latitude: number | null
          longitude: number | null
          region: string
          status: string
          updated_at: string | null
          utilization_pct: number | null
        }
        Insert: {
          as_of_date: string
          capacity_mbpd: number
          country: string
          created_at?: string | null
          facility_name: string
          historical_median_pct?: number | null
          id?: string
          import_dependency_correlation?: number | null
          is_top_10?: boolean | null
          latitude?: number | null
          longitude?: number | null
          region: string
          status: string
          updated_at?: string | null
          utilization_pct?: number | null
        }
        Update: {
          as_of_date?: string
          capacity_mbpd?: number
          country?: string
          created_at?: string | null
          facility_name?: string
          historical_median_pct?: number | null
          id?: string
          import_dependency_correlation?: number | null
          is_top_10?: boolean | null
          latitude?: number | null
          longitude?: number | null
          region?: string
          status?: string
          updated_at?: string | null
          utilization_pct?: number | null
        }
        Relationships: []
      }
      gold_debt_coverage_g20: {
        Row: {
          country_code: string
          coverage_ratio: number | null
          date: string
          debt_local: number | null
          debt_per_oz_local: number | null
          fx_rate_local_per_usd: number | null
          gold_price_local: number | null
          gold_price_usd: number
          gold_reserves_oz: number | null
          implied_gold_price_usd: number | null
          inverse_coverage_ratio: number | null
          last_updated_at: string | null
        }
        Insert: {
          country_code: string
          coverage_ratio?: number | null
          date: string
          debt_local?: number | null
          debt_per_oz_local?: number | null
          fx_rate_local_per_usd?: number | null
          gold_price_local?: number | null
          gold_price_usd: number
          gold_reserves_oz?: number | null
          implied_gold_price_usd?: number | null
          inverse_coverage_ratio?: number | null
          last_updated_at?: string | null
        }
        Update: {
          country_code?: string
          coverage_ratio?: number | null
          date?: string
          debt_local?: number | null
          debt_per_oz_local?: number | null
          fx_rate_local_per_usd?: number | null
          gold_price_local?: number | null
          gold_price_usd?: number
          gold_reserves_oz?: number | null
          implied_gold_price_usd?: number | null
          inverse_coverage_ratio?: number | null
          last_updated_at?: string | null
        }
        Relationships: []
      }
      gold_historical_shocks: {
        Row: {
          created_at: string | null
          description: string | null
          event_impact_score: number | null
          event_month: string
          event_name: string
          id: string
          macro_regime: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_impact_score?: number | null
          event_month: string
          event_name: string
          id?: string
          macro_regime?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_impact_score?: number | null
          event_month?: string
          event_name?: string
          id?: string
          macro_regime?: string | null
        }
        Relationships: []
      }
      gold_positioning: {
        Row: {
          as_of_date: string
          comex_daily_volume: number | null
          comex_open_interest: number | null
          cot_managed_money_net: number | null
          cot_producer_net: number | null
          cot_swap_dealer_net: number | null
          created_at: string | null
          interpretation: string | null
          iv_1w: number | null
          iv_2w: number | null
          iv_4w: number | null
          metadata: Json | null
          paper_vs_physical_ratio: number | null
          prediction_gauge_score: number | null
          price_band_high: number | null
          price_band_low: number | null
          sankey_data: Json | null
          updated_at: string | null
          whale_hedging_pressure: number | null
        }
        Insert: {
          as_of_date: string
          comex_daily_volume?: number | null
          comex_open_interest?: number | null
          cot_managed_money_net?: number | null
          cot_producer_net?: number | null
          cot_swap_dealer_net?: number | null
          created_at?: string | null
          interpretation?: string | null
          iv_1w?: number | null
          iv_2w?: number | null
          iv_4w?: number | null
          metadata?: Json | null
          paper_vs_physical_ratio?: number | null
          prediction_gauge_score?: number | null
          price_band_high?: number | null
          price_band_low?: number | null
          sankey_data?: Json | null
          updated_at?: string | null
          whale_hedging_pressure?: number | null
        }
        Update: {
          as_of_date?: string
          comex_daily_volume?: number | null
          comex_open_interest?: number | null
          cot_managed_money_net?: number | null
          cot_producer_net?: number | null
          cot_swap_dealer_net?: number | null
          created_at?: string | null
          interpretation?: string | null
          iv_1w?: number | null
          iv_2w?: number | null
          iv_4w?: number | null
          metadata?: Json | null
          paper_vs_physical_ratio?: number | null
          prediction_gauge_score?: number | null
          price_band_high?: number | null
          price_band_low?: number | null
          sankey_data?: Json | null
          updated_at?: string | null
          whale_hedging_pressure?: number | null
        }
        Relationships: []
      }
      gsc_performance: {
        Row: {
          clicks: number
          country: string | null
          ctr: number
          date: string
          device: string | null
          id: string
          impressions: number
          inserted_at: string | null
          page: string
          position: number
          query: string
        }
        Insert: {
          clicks: number
          country?: string | null
          ctr: number
          date: string
          device?: string | null
          id?: string
          impressions: number
          inserted_at?: string | null
          page: string
          position: number
          query: string
        }
        Update: {
          clicks?: number
          country?: string | null
          ctr?: number
          date?: string
          device?: string | null
          id?: string
          impressions?: number
          inserted_at?: string | null
          page?: string
          position?: number
          query?: string
        }
        Relationships: []
      }
      hs_code_master: {
        Row: {
          chapter: string | null
          code: string
          created_at: string | null
          description: string
          heading: string | null
          level: number | null
        }
        Insert: {
          chapter?: string | null
          code: string
          created_at?: string | null
          description: string
          heading?: string | null
          level?: number | null
        }
        Update: {
          chapter?: string | null
          code?: string
          created_at?: string | null
          description?: string
          heading?: string | null
          level?: number | null
        }
        Relationships: []
      }
      hs_opportunity_scores: {
        Row: {
          cagr_5yr_pct: number | null
          competition_score: number | null
          computed_at: string | null
          data_year: number | null
          growth_score: number | null
          hhi: number | null
          hs_code: string
          latest_export_usd: number | null
          macro_score: number | null
          market_size_score: number | null
          overall_score: number | null
          reporter_iso2: string | null
          reporter_iso3: string
          reporter_name: string | null
          top_supplier_iso3: string | null
          top_supplier_share: number | null
          volatility_score: number | null
        }
        Insert: {
          cagr_5yr_pct?: number | null
          competition_score?: number | null
          computed_at?: string | null
          data_year?: number | null
          growth_score?: number | null
          hhi?: number | null
          hs_code: string
          latest_export_usd?: number | null
          macro_score?: number | null
          market_size_score?: number | null
          overall_score?: number | null
          reporter_iso2?: string | null
          reporter_iso3: string
          reporter_name?: string | null
          top_supplier_iso3?: string | null
          top_supplier_share?: number | null
          volatility_score?: number | null
        }
        Update: {
          cagr_5yr_pct?: number | null
          competition_score?: number | null
          computed_at?: string | null
          data_year?: number | null
          growth_score?: number | null
          hhi?: number | null
          hs_code?: string
          latest_export_usd?: number | null
          macro_score?: number | null
          market_size_score?: number | null
          overall_score?: number | null
          reporter_iso2?: string | null
          reporter_iso3?: string
          reporter_name?: string | null
          top_supplier_iso3?: string | null
          top_supplier_share?: number | null
          volatility_score?: number | null
        }
        Relationships: []
      }
      illicit_flows: {
        Row: {
          amount_usd_bn: number
          created_at: string | null
          direction: string
          id: string
          partner_country: string
          percent_gdp: number
          source: string
          vulnerability_score: number
          year: number
        }
        Insert: {
          amount_usd_bn: number
          created_at?: string | null
          direction: string
          id?: string
          partner_country: string
          percent_gdp: number
          source: string
          vulnerability_score: number
          year: number
        }
        Update: {
          amount_usd_bn?: number
          created_at?: string | null
          direction?: string
          id?: string
          partner_country?: string
          percent_gdp?: number
          source?: string
          vulnerability_score?: number
          year?: number
        }
        Relationships: []
      }
      imf_gdp_per_capita: {
        Row: {
          country_code: string
          country_name: string
          id: string
          last_updated_at: string | null
          value_constant_usd: number
          year: number
        }
        Insert: {
          country_code: string
          country_name: string
          id?: string
          last_updated_at?: string | null
          value_constant_usd: number
          year: number
        }
        Update: {
          country_code?: string
          country_name?: string
          id?: string
          last_updated_at?: string | null
          value_constant_usd?: number
          year?: number
        }
        Relationships: []
      }
      india_asi: {
        Row: {
          as_of_date: string
          capacity_utilization_rate: number | null
          employment_thousands: number | null
          fixed_capital_crores: number | null
          gva_crores: number | null
          id: number
          last_updated_at: string | null
          output_crores: number | null
          sector: string
          state_code: string
          state_name: string
          unit: string | null
          year: number
        }
        Insert: {
          as_of_date: string
          capacity_utilization_rate?: number | null
          employment_thousands?: number | null
          fixed_capital_crores?: number | null
          gva_crores?: number | null
          id?: number
          last_updated_at?: string | null
          output_crores?: number | null
          sector: string
          state_code: string
          state_name: string
          unit?: string | null
          year: number
        }
        Update: {
          as_of_date?: string
          capacity_utilization_rate?: number | null
          employment_thousands?: number | null
          fixed_capital_crores?: number | null
          gva_crores?: number | null
          id?: number
          last_updated_at?: string | null
          output_crores?: number | null
          sector?: string
          state_code?: string
          state_name?: string
          unit?: string | null
          year?: number
        }
        Relationships: []
      }
      india_corporate_aggregate: {
        Row: {
          category: string
          ebitda: number | null
          net_profit: number | null
          net_profit_margin: number | null
          num_companies: number | null
          positive_profit_growth_pct: number | null
          profit_growth_yoy: number | null
          quarter_end_date: string
          sales_growth_yoy: number | null
          top_20_profit_share_pct: number | null
          total_sales: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string
          ebitda?: number | null
          net_profit?: number | null
          net_profit_margin?: number | null
          num_companies?: number | null
          positive_profit_growth_pct?: number | null
          profit_growth_yoy?: number | null
          quarter_end_date: string
          sales_growth_yoy?: number | null
          top_20_profit_share_pct?: number | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          ebitda?: number | null
          net_profit?: number | null
          net_profit_margin?: number | null
          num_companies?: number | null
          positive_profit_growth_pct?: number | null
          profit_growth_yoy?: number | null
          quarter_end_date?: string
          sales_growth_yoy?: number | null
          top_20_profit_share_pct?: number | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      india_credit_cycle: {
        Row: {
          cd_ratio: number
          credit_growth_yoy: number
          credit_to_gdp_gap: number | null
          date: string
          deposit_growth_yoy: number
          id: number
          npa_ratio: number | null
          phase: string
          provenance: string | null
          updated_at: string
        }
        Insert: {
          cd_ratio: number
          credit_growth_yoy: number
          credit_to_gdp_gap?: number | null
          date: string
          deposit_growth_yoy: number
          id?: number
          npa_ratio?: number | null
          phase: string
          provenance?: string | null
          updated_at?: string
        }
        Update: {
          cd_ratio?: number
          credit_growth_yoy?: number
          credit_to_gdp_gap?: number | null
          date?: string
          deposit_growth_yoy?: number
          id?: number
          npa_ratio?: number | null
          phase?: string
          provenance?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      india_debt_maturities: {
        Row: {
          amount_crore: number
          bucket: string
          date: string
          id: number
          percent_total: number
          type: string
          updated_at: string
        }
        Insert: {
          amount_crore: number
          bucket: string
          date: string
          id?: number
          percent_total: number
          type: string
          updated_at?: string
        }
        Update: {
          amount_crore?: number
          bucket?: string
          date?: string
          id?: number
          percent_total?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      india_digitization_premium: {
        Row: {
          date: string
          fi_index: number | null
          g20_digital_baseline: number | null
          id: number
          rbi_dpi_index: number | null
          updated_at: string
          upi_value_inr_trillion: number | null
          upi_volume_bn: number | null
        }
        Insert: {
          date: string
          fi_index?: number | null
          g20_digital_baseline?: number | null
          id?: number
          rbi_dpi_index?: number | null
          updated_at?: string
          upi_value_inr_trillion?: number | null
          upi_volume_bn?: number | null
        }
        Update: {
          date?: string
          fi_index?: number | null
          g20_digital_baseline?: number | null
          id?: number
          rbi_dpi_index?: number | null
          updated_at?: string
          upi_value_inr_trillion?: number | null
          upi_volume_bn?: number | null
        }
        Relationships: []
      }
      india_energy: {
        Row: {
          as_of_date: string
          id: number
          last_updated_at: string | null
          metric_type: string
          source_type: string
          state_code: string
          state_name: string
          unit: string
          value: number
          year: number
        }
        Insert: {
          as_of_date: string
          id?: number
          last_updated_at?: string | null
          metric_type: string
          source_type: string
          state_code: string
          state_name: string
          unit: string
          value: number
          year: number
        }
        Update: {
          as_of_date?: string
          id?: number
          last_updated_at?: string | null
          metric_type?: string
          source_type?: string
          state_code?: string
          state_name?: string
          unit?: string
          value?: number
          year?: number
        }
        Relationships: []
      }
      india_fiscal_allocation: {
        Row: {
          capex_lakh_cr: number | null
          capex_pct_gdp: number | null
          capex_pct_total: number | null
          committed_lakh_cr: number | null
          date: string
          entity_type: string
          freebies_pct_receipts: number | null
          fy: string
          gdp_lakh_cr: number | null
          id: string
          revenue_exp_lakh_cr: number | null
          revenue_pct_gdp: number | null
          state_code: string | null
          state_name: string | null
          subsidies_lakh_cr: number | null
          total_exp_lakh_cr: number | null
          updated_at: string | null
        }
        Insert: {
          capex_lakh_cr?: number | null
          capex_pct_gdp?: number | null
          capex_pct_total?: number | null
          committed_lakh_cr?: number | null
          date: string
          entity_type: string
          freebies_pct_receipts?: number | null
          fy: string
          gdp_lakh_cr?: number | null
          id?: string
          revenue_exp_lakh_cr?: number | null
          revenue_pct_gdp?: number | null
          state_code?: string | null
          state_name?: string | null
          subsidies_lakh_cr?: number | null
          total_exp_lakh_cr?: number | null
          updated_at?: string | null
        }
        Update: {
          capex_lakh_cr?: number | null
          capex_pct_gdp?: number | null
          capex_pct_total?: number | null
          committed_lakh_cr?: number | null
          date?: string
          entity_type?: string
          freebies_pct_receipts?: number | null
          fy?: string
          gdp_lakh_cr?: number | null
          id?: string
          revenue_exp_lakh_cr?: number | null
          revenue_pct_gdp?: number | null
          state_code?: string | null
          state_name?: string | null
          subsidies_lakh_cr?: number | null
          total_exp_lakh_cr?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      india_fiscal_stress: {
        Row: {
          date: string
          debt_gdp_pct: number | null
          fiscal_deficit: number | null
          fiscal_deficit_gdp_pct: number | null
          gdp: number | null
          general_govt_debt: number | null
          gross_tax_revenue: number | null
          interest_expenditure_pct: number | null
          interest_gdp_pct: number | null
          interest_gtr_pct: number | null
          interest_payments: number | null
          interest_revenue_pct: number | null
          revenue_deficit: number | null
          revenue_deficit_gdp_pct: number | null
          revenue_receipts: number | null
          total_expenditure: number | null
          updated_at: string | null
        }
        Insert: {
          date: string
          debt_gdp_pct?: number | null
          fiscal_deficit?: number | null
          fiscal_deficit_gdp_pct?: number | null
          gdp?: number | null
          general_govt_debt?: number | null
          gross_tax_revenue?: number | null
          interest_expenditure_pct?: number | null
          interest_gdp_pct?: number | null
          interest_gtr_pct?: number | null
          interest_payments?: number | null
          interest_revenue_pct?: number | null
          revenue_deficit?: number | null
          revenue_deficit_gdp_pct?: number | null
          revenue_receipts?: number | null
          total_expenditure?: number | null
          updated_at?: string | null
        }
        Update: {
          date?: string
          debt_gdp_pct?: number | null
          fiscal_deficit?: number | null
          fiscal_deficit_gdp_pct?: number | null
          gdp?: number | null
          general_govt_debt?: number | null
          gross_tax_revenue?: number | null
          interest_expenditure_pct?: number | null
          interest_gdp_pct?: number | null
          interest_gtr_pct?: number | null
          interest_payments?: number | null
          interest_revenue_pct?: number | null
          revenue_deficit?: number | null
          revenue_deficit_gdp_pct?: number | null
          revenue_receipts?: number | null
          total_expenditure?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      india_inflation_pulse: {
        Row: {
          cpi_flexible_yoy: number | null
          cpi_headline_yoy: number | null
          cpi_sticky_yoy: number | null
          date: string
          id: number
          updated_at: string
          wpi_core_yoy: number | null
        }
        Insert: {
          cpi_flexible_yoy?: number | null
          cpi_headline_yoy?: number | null
          cpi_sticky_yoy?: number | null
          date: string
          id?: number
          updated_at?: string
          wpi_core_yoy?: number | null
        }
        Update: {
          cpi_flexible_yoy?: number | null
          cpi_headline_yoy?: number | null
          cpi_sticky_yoy?: number | null
          date?: string
          id?: number
          updated_at?: string
          wpi_core_yoy?: number | null
        }
        Relationships: []
      }
      india_liquidity_stress: {
        Row: {
          call_rate: number | null
          date: string
          id: number
          laf_net_injection_cr: number | null
          msf_rate: number | null
          repo_rate: number | null
          treps_rate: number | null
          updated_at: string
        }
        Insert: {
          call_rate?: number | null
          date: string
          id?: number
          laf_net_injection_cr?: number | null
          msf_rate?: number | null
          repo_rate?: number | null
          treps_rate?: number | null
          updated_at?: string
        }
        Update: {
          call_rate?: number | null
          date?: string
          id?: number
          laf_net_injection_cr?: number | null
          msf_rate?: number | null
          repo_rate?: number | null
          treps_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      india_macro_snapshots: {
        Row: {
          created_at: string | null
          geopolitical_summary: string
          id: string
          insights_negative: Json
          insights_neutral: Json
          insights_positive: Json
          metrics_data: Json
          snapshot_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          geopolitical_summary: string
          id?: string
          insights_negative?: Json
          insights_neutral?: Json
          insights_positive?: Json
          metrics_data?: Json
          snapshot_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          geopolitical_summary?: string
          id?: string
          insights_negative?: Json
          insights_neutral?: Json
          insights_positive?: Json
          metrics_data?: Json
          snapshot_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      india_state_fiscal_health: {
        Row: {
          date: string
          debt_to_gsdp: number | null
          gfd_to_gsdp: number | null
          id: number
          state_code: string | null
          state_name: string
          updated_at: string
        }
        Insert: {
          date: string
          debt_to_gsdp?: number | null
          gfd_to_gsdp?: number | null
          id?: number
          state_code?: string | null
          state_name: string
          updated_at?: string
        }
        Update: {
          date?: string
          debt_to_gsdp?: number | null
          gfd_to_gsdp?: number | null
          id?: number
          state_code?: string | null
          state_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ingestion_logs: {
        Row: {
          api_latency_ms: number | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          function_name: string
          id: number
          metadata: Json | null
          rows_inserted: number | null
          rows_updated: number | null
          start_time: string
          status: string
          status_code: number | null
        }
        Insert: {
          api_latency_ms?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          function_name: string
          id?: number
          metadata?: Json | null
          rows_inserted?: number | null
          rows_updated?: number | null
          start_time?: string
          status: string
          status_code?: number | null
        }
        Update: {
          api_latency_ms?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          function_name?: string
          id?: number
          metadata?: Json | null
          rows_inserted?: number | null
          rows_updated?: number | null
          start_time?: string
          status?: string
          status_code?: number | null
        }
        Relationships: []
      }
      ingestion_payload_hashes: {
        Row: {
          api_latency_ms: number | null
          captured_at: string | null
          id: string
          metadata: Json | null
          metric_id: string
          observation_id: string | null
          payload_hash: string
          status_code: number | null
        }
        Insert: {
          api_latency_ms?: number | null
          captured_at?: string | null
          id?: string
          metadata?: Json | null
          metric_id: string
          observation_id?: string | null
          payload_hash: string
          status_code?: number | null
        }
        Update: {
          api_latency_ms?: number | null
          captured_at?: string | null
          id?: string
          metadata?: Json | null
          metric_id?: string
          observation_id?: string | null
          payload_hash?: string
          status_code?: number | null
        }
        Relationships: []
      }
      ingestion_runs: {
        Row: {
          attempts: number
          duration_ms: number | null
          error_message: string | null
          finished_at: string
          id: string
          job_name: string
          metadata: Json | null
          started_at: string
          status: string
        }
        Insert: {
          attempts?: number
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string
          id?: string
          job_name: string
          metadata?: Json | null
          started_at?: string
          status: string
        }
        Update: {
          attempts?: number
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string
          id?: string
          job_name?: string
          metadata?: Json | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      institutional_13f_holdings: {
        Row: {
          as_of_date: string
          asset_class_allocation: Json | null
          cik: string
          concentration_score: number | null
          fund_name: string
          fund_type: string | null
          gld_comparison: number | null
          historical_allocation: Json | null
          id: string
          last_updated: string | null
          qoq_delta: number | null
          regime_z_score: number | null
          sector_rotation_signal: string | null
          shares_value: number | null
          spy_comparison: number | null
          tlt_comparison: number | null
          top_holdings: Json | null
          top_sectors: Json | null
          total_aum: number | null
          value_usd: number | null
        }
        Insert: {
          as_of_date: string
          asset_class_allocation?: Json | null
          cik: string
          concentration_score?: number | null
          fund_name: string
          fund_type?: string | null
          gld_comparison?: number | null
          historical_allocation?: Json | null
          id?: string
          last_updated?: string | null
          qoq_delta?: number | null
          regime_z_score?: number | null
          sector_rotation_signal?: string | null
          shares_value?: number | null
          spy_comparison?: number | null
          tlt_comparison?: number | null
          top_holdings?: Json | null
          top_sectors?: Json | null
          total_aum?: number | null
          value_usd?: number | null
        }
        Update: {
          as_of_date?: string
          asset_class_allocation?: Json | null
          cik?: string
          concentration_score?: number | null
          fund_name?: string
          fund_type?: string | null
          gld_comparison?: number | null
          historical_allocation?: Json | null
          id?: string
          last_updated?: string | null
          qoq_delta?: number | null
          regime_z_score?: number | null
          sector_rotation_signal?: string | null
          shares_value?: number | null
          spy_comparison?: number | null
          tlt_comparison?: number | null
          top_holdings?: Json | null
          top_sectors?: Json | null
          total_aum?: number | null
          value_usd?: number | null
        }
        Relationships: []
      }
      institutional_loans: {
        Row: {
          amount_usd: number
          as_of_date: string
          created_at: string | null
          id: string
          lender_bloc: string
          lender_id: string
          loan_type: string
          metadata: Json | null
          recipient_income_bracket: string
          recipient_region: string
          updated_at: string | null
        }
        Insert: {
          amount_usd: number
          as_of_date: string
          created_at?: string | null
          id?: string
          lender_bloc: string
          lender_id: string
          loan_type: string
          metadata?: Json | null
          recipient_income_bracket: string
          recipient_region: string
          updated_at?: string | null
        }
        Update: {
          amount_usd?: number
          as_of_date?: string
          created_at?: string | null
          id?: string
          lender_bloc?: string
          lender_id?: string
          loan_type?: string
          metadata?: Json | null
          recipient_income_bracket?: string
          recipient_region?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      institutional_trades_inferred: {
        Row: {
          as_of_date: string
          cik: string
          conviction_score: number | null
          created_at: string | null
          current_qty_usd: number | null
          cusip: string | null
          delta_pct: number | null
          delta_usd: number | null
          direction: string | null
          fund_name: string
          id: string
          inferred_at: string | null
          price_change_pct: number | null
          prior_qty_usd: number | null
          sector: string | null
          ticker: string | null
          trade_type: string | null
        }
        Insert: {
          as_of_date: string
          cik: string
          conviction_score?: number | null
          created_at?: string | null
          current_qty_usd?: number | null
          cusip?: string | null
          delta_pct?: number | null
          delta_usd?: number | null
          direction?: string | null
          fund_name: string
          id?: string
          inferred_at?: string | null
          price_change_pct?: number | null
          prior_qty_usd?: number | null
          sector?: string | null
          ticker?: string | null
          trade_type?: string | null
        }
        Update: {
          as_of_date?: string
          cik?: string
          conviction_score?: number | null
          created_at?: string | null
          current_qty_usd?: number | null
          cusip?: string | null
          delta_pct?: number | null
          delta_usd?: number | null
          direction?: string | null
          fund_name?: string
          id?: string
          inferred_at?: string | null
          price_change_pct?: number | null
          prior_qty_usd?: number | null
          sector?: string | null
          ticker?: string | null
          trade_type?: string | null
        }
        Relationships: []
      }
      latest_metrics: {
        Row: {
          as_of_date: string
          last_updated_at: string | null
          metadata: Json | null
          metric_id: string
          provenance: string | null
          value: number | null
          z_score: number | null
        }
        Insert: {
          as_of_date: string
          last_updated_at?: string | null
          metadata?: Json | null
          metric_id: string
          provenance?: string | null
          value?: number | null
          z_score?: number | null
        }
        Update: {
          as_of_date?: string
          last_updated_at?: string | null
          metadata?: Json | null
          metric_id?: string
          provenance?: string | null
          value?: number | null
          z_score?: number | null
        }
        Relationships: []
      }
      macro_brief: {
        Row: {
          context_line: string | null
          driver_line: string | null
          generated_at: string | null
          id: string
          regime_line: string
          signal_date: string
          watch_line: string | null
        }
        Insert: {
          context_line?: string | null
          driver_line?: string | null
          generated_at?: string | null
          id?: string
          regime_line: string
          signal_date: string
          watch_line?: string | null
        }
        Update: {
          context_line?: string | null
          driver_line?: string | null
          generated_at?: string | null
          id?: string
          regime_line?: string
          signal_date?: string
          watch_line?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "macro_brief_signal_date_fkey"
            columns: ["signal_date"]
            isOneToOne: true
            referencedRelation: "daily_signal"
            referencedColumns: ["signal_date"]
          },
          {
            foreignKeyName: "macro_brief_signal_date_fkey"
            columns: ["signal_date"]
            isOneToOne: true
            referencedRelation: "vw_latest_daily_signal"
            referencedColumns: ["signal_date"]
          },
        ]
      }
      macro_contradictions: {
        Row: {
          contradiction_key: string
          created_at: string | null
          id: string
          interpretation: string
          metric_a: string | null
          metric_b: string | null
          severity: string
          signal_date: string
          title: string
        }
        Insert: {
          contradiction_key: string
          created_at?: string | null
          id?: string
          interpretation: string
          metric_a?: string | null
          metric_b?: string | null
          severity: string
          signal_date: string
          title: string
        }
        Update: {
          contradiction_key?: string
          created_at?: string | null
          id?: string
          interpretation?: string
          metric_a?: string | null
          metric_b?: string | null
          severity?: string
          signal_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "macro_contradictions_signal_date_fkey"
            columns: ["signal_date"]
            isOneToOne: false
            referencedRelation: "daily_signal"
            referencedColumns: ["signal_date"]
          },
          {
            foreignKeyName: "macro_contradictions_signal_date_fkey"
            columns: ["signal_date"]
            isOneToOne: false
            referencedRelation: "vw_latest_daily_signal"
            referencedColumns: ["signal_date"]
          },
        ]
      }
      macro_events: {
        Row: {
          actual_value: string | null
          consensus_value: string | null
          created_at: string | null
          event_date: string
          event_name: string
          expected_value: string | null
          id: string
          impact_level: string | null
          previous_value: string | null
          status: string | null
          surprise_score: number | null
          updated_at: string | null
        }
        Insert: {
          actual_value?: string | null
          consensus_value?: string | null
          created_at?: string | null
          event_date: string
          event_name: string
          expected_value?: string | null
          id?: string
          impact_level?: string | null
          previous_value?: string | null
          status?: string | null
          surprise_score?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_value?: string | null
          consensus_value?: string | null
          created_at?: string | null
          event_date?: string
          event_name?: string
          expected_value?: string | null
          id?: string
          impact_level?: string | null
          previous_value?: string | null
          status?: string | null
          surprise_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      macro_news_headlines: {
        Row: {
          category: string | null
          id: number
          ingested_at: string | null
          keywords: string[] | null
          link: string
          published_at: string | null
          source: string
          title: string
        }
        Insert: {
          category?: string | null
          id?: number
          ingested_at?: string | null
          keywords?: string[] | null
          link: string
          published_at?: string | null
          source: string
          title: string
        }
        Update: {
          category?: string | null
          id?: number
          ingested_at?: string | null
          keywords?: string[] | null
          link?: string
          published_at?: string | null
          source?: string
          title?: string
        }
        Relationships: []
      }
      market_pulse_daily: {
        Row: {
          advances: number | null
          circuits_pct: number | null
          created_at: string | null
          date: string
          declines: number | null
          delivery_pct: number | null
          dii_buy: number | null
          dii_cash_net: number | null
          dii_idx_fut_long: number | null
          dii_idx_fut_net: number | null
          dii_idx_fut_short: number | null
          dii_net: number | null
          dii_sell: number | null
          dii_stk_fut_long: number | null
          dii_stk_fut_net: number | null
          dii_stk_fut_short: number | null
          fii_buy: number | null
          fii_cash_net: number | null
          fii_idx_call_long: number | null
          fii_idx_call_net: number | null
          fii_idx_call_short: number | null
          fii_idx_fut_long: number | null
          fii_idx_fut_net: number | null
          fii_idx_fut_short: number | null
          fii_idx_put_long: number | null
          fii_idx_put_net: number | null
          fii_idx_put_short: number | null
          fii_net: number | null
          fii_sell: number | null
          fii_stk_fut_long: number | null
          fii_stk_fut_net: number | null
          fii_stk_fut_short: number | null
          id: string
          india_vix: number | null
          india_vix_zscore: number | null
          midcap_perf: number | null
          new_highs_52w: number | null
          new_lows_52w: number | null
          nifty_perf: number | null
          pcr: number | null
          sector_returns: Json | null
          sentiment_score: number | null
          smallcap_perf: number | null
          updated_at: string | null
        }
        Insert: {
          advances?: number | null
          circuits_pct?: number | null
          created_at?: string | null
          date: string
          declines?: number | null
          delivery_pct?: number | null
          dii_buy?: number | null
          dii_cash_net?: number | null
          dii_idx_fut_long?: number | null
          dii_idx_fut_net?: number | null
          dii_idx_fut_short?: number | null
          dii_net?: number | null
          dii_sell?: number | null
          dii_stk_fut_long?: number | null
          dii_stk_fut_net?: number | null
          dii_stk_fut_short?: number | null
          fii_buy?: number | null
          fii_cash_net?: number | null
          fii_idx_call_long?: number | null
          fii_idx_call_net?: number | null
          fii_idx_call_short?: number | null
          fii_idx_fut_long?: number | null
          fii_idx_fut_net?: number | null
          fii_idx_fut_short?: number | null
          fii_idx_put_long?: number | null
          fii_idx_put_net?: number | null
          fii_idx_put_short?: number | null
          fii_net?: number | null
          fii_sell?: number | null
          fii_stk_fut_long?: number | null
          fii_stk_fut_net?: number | null
          fii_stk_fut_short?: number | null
          id?: string
          india_vix?: number | null
          india_vix_zscore?: number | null
          midcap_perf?: number | null
          new_highs_52w?: number | null
          new_lows_52w?: number | null
          nifty_perf?: number | null
          pcr?: number | null
          sector_returns?: Json | null
          sentiment_score?: number | null
          smallcap_perf?: number | null
          updated_at?: string | null
        }
        Update: {
          advances?: number | null
          circuits_pct?: number | null
          created_at?: string | null
          date?: string
          declines?: number | null
          delivery_pct?: number | null
          dii_buy?: number | null
          dii_cash_net?: number | null
          dii_idx_fut_long?: number | null
          dii_idx_fut_net?: number | null
          dii_idx_fut_short?: number | null
          dii_net?: number | null
          dii_sell?: number | null
          dii_stk_fut_long?: number | null
          dii_stk_fut_net?: number | null
          dii_stk_fut_short?: number | null
          fii_buy?: number | null
          fii_cash_net?: number | null
          fii_idx_call_long?: number | null
          fii_idx_call_net?: number | null
          fii_idx_call_short?: number | null
          fii_idx_fut_long?: number | null
          fii_idx_fut_net?: number | null
          fii_idx_fut_short?: number | null
          fii_idx_put_long?: number | null
          fii_idx_put_net?: number | null
          fii_idx_put_short?: number | null
          fii_net?: number | null
          fii_sell?: number | null
          fii_stk_fut_long?: number | null
          fii_stk_fut_net?: number | null
          fii_stk_fut_short?: number | null
          id?: string
          india_vix?: number | null
          india_vix_zscore?: number | null
          midcap_perf?: number | null
          new_highs_52w?: number | null
          new_lows_52w?: number | null
          nifty_perf?: number | null
          pcr?: number | null
          sector_returns?: Json | null
          sentiment_score?: number | null
          smallcap_perf?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      metric_observations: {
        Row: {
          as_of_date: string
          composite_version: number | null
          delta_mom: number | null
          delta_wow: number | null
          is_provisional: boolean
          last_updated_at: string | null
          metadata: Json | null
          metric_id: string
          percentile: number | null
          provenance: string | null
          source_ref: string | null
          staleness_flag: string | null
          value: number
          z_score: number | null
        }
        Insert: {
          as_of_date: string
          composite_version?: number | null
          delta_mom?: number | null
          delta_wow?: number | null
          is_provisional?: boolean
          last_updated_at?: string | null
          metadata?: Json | null
          metric_id: string
          percentile?: number | null
          provenance?: string | null
          source_ref?: string | null
          staleness_flag?: string | null
          value: number
          z_score?: number | null
        }
        Update: {
          as_of_date?: string
          composite_version?: number | null
          delta_mom?: number | null
          delta_wow?: number | null
          is_provisional?: boolean
          last_updated_at?: string | null
          metadata?: Json | null
          metric_id?: string
          percentile?: number | null
          provenance?: string | null
          source_ref?: string | null
          staleness_flag?: string | null
          value?: number
          z_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "vw_brics_tracker"
            referencedColumns: ["metric_id"]
          },
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "vw_data_staleness_monitor"
            referencedColumns: ["metric_id"]
          },
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "vw_data_staleness_monitor_v2"
            referencedColumns: ["metric_id"]
          },
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "vw_india_macro"
            referencedColumns: ["metric_id"]
          },
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "vw_latest_metrics"
            referencedColumns: ["metric_id"]
          },
        ]
      }
      metrics: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_frequency: string
          expected_interval_days: number
          frequency: string | null
          frequency_type: string | null
          id: string
          is_active: boolean | null
          last_attempt_at: string | null
          metadata: Json | null
          methodology_note: string | null
          name: string
          native_frequency: string
          source: string | null
          source_id: number | null
          tier: string
          unit: string | null
          unit_label: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          display_frequency: string
          expected_interval_days: number
          frequency?: string | null
          frequency_type?: string | null
          id: string
          is_active?: boolean | null
          last_attempt_at?: string | null
          metadata?: Json | null
          methodology_note?: string | null
          name: string
          native_frequency: string
          source?: string | null
          source_id?: number | null
          tier?: string
          unit?: string | null
          unit_label?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_frequency?: string
          expected_interval_days?: number
          frequency?: string | null
          frequency_type?: string | null
          id?: string
          is_active?: boolean | null
          last_attempt_at?: string | null
          metadata?: Json | null
          methodology_note?: string | null
          name?: string
          native_frequency?: string
          source?: string | null
          source_id?: number | null
          tier?: string
          unit?: string | null
          unit_label?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metrics_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_regime_digests: {
        Row: {
          generated_at: string | null
          html_content: string
          id: string
          metrics_snapshot: Json | null
          plain_text: string
          subject_line: string
          year_month: string
        }
        Insert: {
          generated_at?: string | null
          html_content: string
          id?: string
          metrics_snapshot?: Json | null
          plain_text: string
          subject_line: string
          year_month: string
        }
        Update: {
          generated_at?: string | null
          html_content?: string
          id?: string
          metrics_snapshot?: Json | null
          plain_text?: string
          subject_line?: string
          year_month?: string
        }
        Relationships: []
      }
      mutual_fund_assets: {
        Row: {
          category: string | null
          created_at: string | null
          fund_house: string | null
          id: string
          isin: string | null
          name: string
          scheme_code: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          fund_house?: string | null
          id?: string
          isin?: string | null
          name: string
          scheme_code: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          fund_house?: string | null
          id?: string
          isin?: string | null
          name?: string
          scheme_code?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      mutual_fund_observations: {
        Row: {
          asset_id: string | null
          created_at: string | null
          daily_return: number | null
          date: string
          id: string
          nav: number
        }
        Insert: {
          asset_id?: string | null
          created_at?: string | null
          daily_return?: number | null
          date: string
          id?: string
          nav: number
        }
        Update: {
          asset_id?: string | null
          created_at?: string | null
          daily_return?: number | null
          date?: string
          id?: string
          nav?: number
        }
        Relationships: [
          {
            foreignKeyName: "mutual_fund_observations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "mutual_fund_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutual_fund_observations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "vw_mutual_fund_universe"
            referencedColumns: ["id"]
          },
        ]
      }
      oil_imports_by_origin: {
        Row: {
          as_of_date: string
          brent_price_usd: number | null
          exchange_rate: number | null
          exporter_country_code: string
          exporter_country_name: string | null
          frequency: string
          id: string
          import_cost_local_currency: number | null
          import_cost_usd: number | null
          import_volume_mbbl: number
          importer_country_code: string
          last_updated_at: string | null
          source_id: number | null
        }
        Insert: {
          as_of_date: string
          brent_price_usd?: number | null
          exchange_rate?: number | null
          exporter_country_code: string
          exporter_country_name?: string | null
          frequency: string
          id?: string
          import_cost_local_currency?: number | null
          import_cost_usd?: number | null
          import_volume_mbbl: number
          importer_country_code: string
          last_updated_at?: string | null
          source_id?: number | null
        }
        Update: {
          as_of_date?: string
          brent_price_usd?: number | null
          exchange_rate?: number | null
          exporter_country_code?: string
          exporter_country_name?: string | null
          frequency?: string
          id?: string
          import_cost_local_currency?: number | null
          import_cost_usd?: number | null
          import_volume_mbbl?: number
          importer_country_code?: string
          last_updated_at?: string | null
          source_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oil_imports_by_origin_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      oil_market_spread: {
        Row: {
          change_1d: number | null
          change_3d: number | null
          computed_at: string | null
          created_at: string | null
          date: string
          front_price: number
          id: string
          metadata: Json | null
          next_price: number
          regime: string
          spread: number
        }
        Insert: {
          change_1d?: number | null
          change_3d?: number | null
          computed_at?: string | null
          created_at?: string | null
          date: string
          front_price: number
          id?: string
          metadata?: Json | null
          next_price: number
          regime: string
          spread: number
        }
        Update: {
          change_1d?: number | null
          change_3d?: number | null
          computed_at?: string | null
          created_at?: string | null
          date?: string
          front_price?: number
          id?: string
          metadata?: Json | null
          next_price?: number
          regime?: string
          spread?: number
        }
        Relationships: []
      }
      oil_refining_capacity: {
        Row: {
          as_of_year: number
          capacity_mbpd: number
          capacity_share_pct: number | null
          country_code: string
          country_name: string
          id: string
          last_updated_at: string | null
          source_id: number | null
        }
        Insert: {
          as_of_year: number
          capacity_mbpd: number
          capacity_share_pct?: number | null
          country_code: string
          country_name: string
          id?: string
          last_updated_at?: string | null
          source_id?: number | null
        }
        Update: {
          as_of_year?: number
          capacity_mbpd?: number
          capacity_share_pct?: number | null
          country_code?: string
          country_name?: string
          id?: string
          last_updated_at?: string | null
          source_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oil_refining_capacity_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      presidential_policies: {
        Row: {
          category: string | null
          created_at: string | null
          event_date: string
          event_name: string
          id: string
          impact_notes: string | null
          metadata: Json | null
          policy_score: number | null
          president_name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          event_date: string
          event_name: string
          id?: string
          impact_notes?: string | null
          metadata?: Json | null
          policy_score?: number | null
          president_name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          event_date?: string
          event_name?: string
          id?: string
          impact_notes?: string | null
          metadata?: Json | null
          policy_score?: number | null
          president_name?: string
        }
        Relationships: []
      }
      rbi_fx_defense: {
        Row: {
          date: string
          forward_book_net_bn: number | null
          fx_reserves_bn: number | null
          id: number
          neer_40: number | null
          reer_40: number | null
          updated_at: string
        }
        Insert: {
          date: string
          forward_book_net_bn?: number | null
          fx_reserves_bn?: number | null
          id?: number
          neer_40?: number | null
          reer_40?: number | null
          updated_at?: string
        }
        Update: {
          date?: string
          forward_book_net_bn?: number | null
          fx_reserves_bn?: number | null
          id?: number
          neer_40?: number | null
          reer_40?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      rbi_liquidity_ops: {
        Row: {
          created_at: string | null
          date: string
          id: string
          msf_amount: number | null
          net_liquidity_outstanding: number | null
          net_liquidity_today: number | null
          net_liquidity_total: number | null
          sdf_amount: number | null
          slf_amount: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          msf_amount?: number | null
          net_liquidity_outstanding?: number | null
          net_liquidity_today?: number | null
          net_liquidity_total?: number | null
          sdf_amount?: number | null
          slf_amount?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          msf_amount?: number | null
          net_liquidity_outstanding?: number | null
          net_liquidity_today?: number | null
          net_liquidity_total?: number | null
          sdf_amount?: number | null
          slf_amount?: number | null
        }
        Relationships: []
      }
      rbi_money_market_ops: {
        Row: {
          call_money_rate: number | null
          call_money_vol: number | null
          created_at: string | null
          date: string
          id: string
          market_repo_rate: number | null
          market_repo_vol: number | null
          notice_money_rate: number | null
          notice_money_vol: number | null
          term_money_rate: number | null
          term_money_vol: number | null
          triparty_repo_rate: number | null
          triparty_repo_vol: number | null
        }
        Insert: {
          call_money_rate?: number | null
          call_money_vol?: number | null
          created_at?: string | null
          date: string
          id?: string
          market_repo_rate?: number | null
          market_repo_vol?: number | null
          notice_money_rate?: number | null
          notice_money_vol?: number | null
          term_money_rate?: number | null
          term_money_vol?: number | null
          triparty_repo_rate?: number | null
          triparty_repo_vol?: number | null
        }
        Update: {
          call_money_rate?: number | null
          call_money_vol?: number | null
          created_at?: string | null
          date?: string
          id?: string
          market_repo_rate?: number | null
          market_repo_vol?: number | null
          notice_money_rate?: number | null
          notice_money_vol?: number | null
          term_money_rate?: number | null
          term_money_vol?: number | null
          triparty_repo_rate?: number | null
          triparty_repo_vol?: number | null
        }
        Relationships: []
      }
      regime_snapshots: {
        Row: {
          created_at: string | null
          id: string
          pulse_score: number
          regime_label: string
          signal_breadth: number
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          pulse_score: number
          regime_label: string
          signal_breadth: number
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pulse_score?: number
          regime_label?: string
          signal_breadth?: number
          timestamp?: string | null
        }
        Relationships: []
      }
      shadow_trade_anomalies: {
        Row: {
          as_of_date: string | null
          baseline_period: string
          baseline_usd: number
          category: string
          current_period: string
          current_usd: number
          destination_code: string
          destination_name: string | null
          hs_code: string
          id: string
          metadata: Json | null
          origin_code: string
          origin_name: string | null
          spike_ratio: number
        }
        Insert: {
          as_of_date?: string | null
          baseline_period: string
          baseline_usd: number
          category: string
          current_period: string
          current_usd: number
          destination_code: string
          destination_name?: string | null
          hs_code: string
          id?: string
          metadata?: Json | null
          origin_code: string
          origin_name?: string | null
          spike_ratio: number
        }
        Update: {
          as_of_date?: string | null
          baseline_period?: string
          baseline_usd?: number
          category?: string
          current_period?: string
          current_usd?: number
          destination_code?: string
          destination_name?: string | null
          hs_code?: string
          id?: string
          metadata?: Json | null
          origin_code?: string
          origin_name?: string | null
          spike_ratio?: number
        }
        Relationships: []
      }
      site_analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json
          page_path: string | null
          session_id: string
          value_numeric: number | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json
          page_path?: string | null
          session_id: string
          value_numeric?: number | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json
          page_path?: string | null
          session_id?: string
          value_numeric?: number | null
        }
        Relationships: []
      }
      smart_money_flow: {
        Row: {
          as_of_date: string
          cot_equities_net_position: number | null
          cot_gold_net_position: number | null
          created_at: string | null
          etf_flow_proxy: number | null
          interpretation: string | null
          regime_score: number | null
          sankey_data: Json | null
          tic_net_foreign_buying: number | null
        }
        Insert: {
          as_of_date: string
          cot_equities_net_position?: number | null
          cot_gold_net_position?: number | null
          created_at?: string | null
          etf_flow_proxy?: number | null
          interpretation?: string | null
          regime_score?: number | null
          sankey_data?: Json | null
          tic_net_foreign_buying?: number | null
        }
        Update: {
          as_of_date?: string
          cot_equities_net_position?: number | null
          cot_gold_net_position?: number | null
          created_at?: string | null
          etf_flow_proxy?: number | null
          interpretation?: string | null
          regime_score?: number | null
          sankey_data?: Json | null
          tic_net_foreign_buying?: number | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          confirm_token: string
          confirmed_at: string | null
          contact_name: string | null
          created_at: string
          currency_pair: string | null
          email: string
          id: string
          interest_type: string | null
          lead_type: string | null
          notional_range: string | null
          partner_preference: string | null
          source: string | null
          status: string
          trade_role: string | null
        }
        Insert: {
          confirm_token: string
          confirmed_at?: string | null
          contact_name?: string | null
          created_at?: string
          currency_pair?: string | null
          email: string
          id?: string
          interest_type?: string | null
          lead_type?: string | null
          notional_range?: string | null
          partner_preference?: string | null
          source?: string | null
          status?: string
          trade_role?: string | null
        }
        Update: {
          confirm_token?: string
          confirmed_at?: string | null
          contact_name?: string | null
          created_at?: string
          currency_pair?: string | null
          email?: string
          id?: string
          interest_type?: string | null
          lead_type?: string | null
          notional_range?: string | null
          partner_preference?: string | null
          source?: string | null
          status?: string
          trade_role?: string | null
        }
        Relationships: []
      }
      tic_foreign_holders: {
        Row: {
          as_of_date: string
          country_name: string
          created_at: string | null
          holdings_usd_bn: number
          id: string
        }
        Insert: {
          as_of_date: string
          country_name: string
          created_at?: string | null
          holdings_usd_bn: number
          id?: string
        }
        Update: {
          as_of_date?: string
          country_name?: string
          created_at?: string | null
          holdings_usd_bn?: number
          id?: string
        }
        Relationships: []
      }
      trade_chokepoints: {
        Row: {
          category: string
          created_at: string | null
          hs_code: string
          id: string
          metadata: Json | null
          net_weight_kg: number | null
          partner_code: string
          partner_name: string
          period: string
          reporter_code: string
          reporter_is_exporter: boolean | null
          reporter_name: string
          trade_value_usd: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          hs_code: string
          id?: string
          metadata?: Json | null
          net_weight_kg?: number | null
          partner_code: string
          partner_name: string
          period: string
          reporter_code: string
          reporter_is_exporter?: boolean | null
          reporter_name: string
          trade_value_usd: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          hs_code?: string
          id?: string
          metadata?: Json | null
          net_weight_kg?: number | null
          partner_code?: string
          partner_name?: string
          period?: string
          reporter_code?: string
          reporter_is_exporter?: boolean | null
          reporter_name?: string
          trade_value_usd?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      trade_demand_cache: {
        Row: {
          export_value_usd: number | null
          fetched_at: string | null
          hs_code: string
          id: number
          qty_unit: string | null
          qty_value: number | null
          reporter_iso2: string | null
          reporter_iso3: string
          reporter_name: string | null
          year: number
        }
        Insert: {
          export_value_usd?: number | null
          fetched_at?: string | null
          hs_code: string
          id?: number
          qty_unit?: string | null
          qty_value?: number | null
          reporter_iso2?: string | null
          reporter_iso3: string
          reporter_name?: string | null
          year: number
        }
        Update: {
          export_value_usd?: number | null
          fetched_at?: string | null
          hs_code?: string
          id?: number
          qty_unit?: string | null
          qty_value?: number | null
          reporter_iso2?: string | null
          reporter_iso3?: string
          reporter_name?: string | null
          year?: number
        }
        Relationships: []
      }
      trade_global_aggregates: {
        Row: {
          export_value_usd: number | null
          fetched_at: string | null
          hs_code: string
          id: number
          import_value_usd: number | null
          reporter_iso3: string
          share_of_total_pct: number | null
          untapped_score: number | null
          year: number
          yoy_growth_pct: number | null
        }
        Insert: {
          export_value_usd?: number | null
          fetched_at?: string | null
          hs_code: string
          id?: number
          import_value_usd?: number | null
          reporter_iso3: string
          share_of_total_pct?: number | null
          untapped_score?: number | null
          year: number
          yoy_growth_pct?: number | null
        }
        Update: {
          export_value_usd?: number | null
          fetched_at?: string | null
          hs_code?: string
          id?: number
          import_value_usd?: number | null
          reporter_iso3?: string
          share_of_total_pct?: number | null
          untapped_score?: number | null
          year?: number
          yoy_growth_pct?: number | null
        }
        Relationships: []
      }
      trade_gravity: {
        Row: {
          bloc: string
          created_at: string | null
          is_provisional: boolean
          period: string
          source_ref: string | null
          swing_state_code: string
          swing_state_name: string
          trade_share_pct: number
          trade_value_usd: number
          updated_at: string | null
        }
        Insert: {
          bloc: string
          created_at?: string | null
          is_provisional?: boolean
          period: string
          source_ref?: string | null
          swing_state_code: string
          swing_state_name: string
          trade_share_pct: number
          trade_value_usd: number
          updated_at?: string | null
        }
        Update: {
          bloc?: string
          created_at?: string | null
          is_provisional?: boolean
          period?: string
          source_ref?: string | null
          swing_state_code?: string
          swing_state_name?: string
          trade_share_pct?: number
          trade_value_usd?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      trade_stats: {
        Row: {
          as_of_date: string
          country_code: string
          created_at: string | null
          exports_usd_bn: number | null
          exports_yoy_pct: number | null
          ftas_json: Json | null
          id: string
          imports_usd_bn: number | null
          metadata: Json | null
          partners_json: Json | null
          tariffs_avg_pct: number | null
          trade_balance_usd_bn: number | null
          updated_at: string | null
        }
        Insert: {
          as_of_date: string
          country_code: string
          created_at?: string | null
          exports_usd_bn?: number | null
          exports_yoy_pct?: number | null
          ftas_json?: Json | null
          id?: string
          imports_usd_bn?: number | null
          metadata?: Json | null
          partners_json?: Json | null
          tariffs_avg_pct?: number | null
          trade_balance_usd_bn?: number | null
          updated_at?: string | null
        }
        Update: {
          as_of_date?: string
          country_code?: string
          created_at?: string | null
          exports_usd_bn?: number | null
          exports_yoy_pct?: number | null
          ftas_json?: Json | null
          id?: string
          imports_usd_bn?: number | null
          metadata?: Json | null
          partners_json?: Json | null
          tariffs_avg_pct?: number | null
          trade_balance_usd_bn?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_stats_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "g20_countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "trade_stats_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "vw_country_terminal"
            referencedColumns: ["iso"]
          },
          {
            foreignKeyName: "trade_stats_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "vw_g20_reserves_gold"
            referencedColumns: ["country_code"]
          },
        ]
      }
      trade_supplier_breakdown: {
        Row: {
          fetched_at: string | null
          hs_code: string
          id: number
          import_value_usd: number | null
          market_share_pct: number | null
          partner_iso3: string
          partner_name: string | null
          reporter_iso3: string
          year: number
        }
        Insert: {
          fetched_at?: string | null
          hs_code: string
          id?: number
          import_value_usd?: number | null
          market_share_pct?: number | null
          partner_iso3: string
          partner_name?: string | null
          reporter_iso3: string
          year: number
        }
        Update: {
          fetched_at?: string | null
          hs_code?: string
          id?: number
          import_value_usd?: number | null
          market_share_pct?: number | null
          partner_iso3?: string
          partner_name?: string | null
          reporter_iso3?: string
          year?: number
        }
        Relationships: []
      }
      treasury_hedging_metrics: {
        Row: {
          created_at: string | null
          date: string
          id: string
          metadata: Json | null
          metric_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          metadata?: Json | null
          metric_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          metadata?: Json | null
          metric_id?: string
          value?: number
        }
        Relationships: []
      }
      uk_ots_flows: {
        Row: {
          flow_type: string
          hs_code: string
          id: string
          last_updated: string | null
          month_id: number
          net_mass_kg: number | null
          partner_country_iso: string | null
          port_id: string | null
          region_id: string | null
          value_gbp: number | null
        }
        Insert: {
          flow_type: string
          hs_code: string
          id?: string
          last_updated?: string | null
          month_id: number
          net_mass_kg?: number | null
          partner_country_iso?: string | null
          port_id?: string | null
          region_id?: string | null
          value_gbp?: number | null
        }
        Update: {
          flow_type?: string
          hs_code?: string
          id?: string
          last_updated?: string | null
          month_id?: number
          net_mass_kg?: number | null
          partner_country_iso?: string | null
          port_id?: string | null
          region_id?: string | null
          value_gbp?: number | null
        }
        Relationships: []
      }
      uk_trader_intelligence: {
        Row: {
          company_name: string
          flow_type: string
          hs_code: string
          id: string
          last_updated: string | null
          month_id: number
          postcode: string | null
          trader_id: number | null
          value_gbp: number | null
        }
        Insert: {
          company_name: string
          flow_type: string
          hs_code: string
          id?: string
          last_updated?: string | null
          month_id: number
          postcode?: string | null
          trader_id?: number | null
          value_gbp?: number | null
        }
        Update: {
          company_name?: string
          flow_type?: string
          hs_code?: string
          id?: string
          last_updated?: string | null
          month_id?: number
          postcode?: string | null
          trader_id?: number | null
          value_gbp?: number | null
        }
        Relationships: []
      }
      upcoming_events: {
        Row: {
          actual: string | null
          country: string
          created_at: string | null
          event_date: string
          event_name: string
          forecast: string | null
          id: string
          impact_level: string | null
          previous: string | null
          source_url: string | null
          surprise: string | null
          updated_at: string | null
        }
        Insert: {
          actual?: string | null
          country: string
          created_at?: string | null
          event_date: string
          event_name: string
          forecast?: string | null
          id?: string
          impact_level?: string | null
          previous?: string | null
          source_url?: string | null
          surprise?: string | null
          updated_at?: string | null
        }
        Update: {
          actual?: string | null
          country?: string
          created_at?: string | null
          event_date?: string
          event_name?: string
          forecast?: string | null
          id?: string
          impact_level?: string | null
          previous?: string | null
          source_url?: string | null
          surprise?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      upi_autopay_metrics: {
        Row: {
          as_of_date: string
          created_at: string | null
          failed_count: number | null
          failure_rate_pct: number
          last_updated_at: string | null
          source_url: string | null
          total_attempts: number | null
        }
        Insert: {
          as_of_date: string
          created_at?: string | null
          failed_count?: number | null
          failure_rate_pct: number
          last_updated_at?: string | null
          source_url?: string | null
          total_attempts?: number | null
        }
        Update: {
          as_of_date?: string
          created_at?: string | null
          failed_count?: number | null
          failure_rate_pct?: number
          last_updated_at?: string | null
          source_url?: string | null
          total_attempts?: number | null
        }
        Relationships: []
      }
      us_13f_holdings: {
        Row: {
          company_cik: string | null
          cusip: string | null
          filer_cik: string
          filer_name: string | null
          filing_url: string | null
          holding_change: string | null
          id: string
          ingested_at: string | null
          period_of_report: string
          shares: number | null
          ticker: string | null
          value_usd: number | null
        }
        Insert: {
          company_cik?: string | null
          cusip?: string | null
          filer_cik: string
          filer_name?: string | null
          filing_url?: string | null
          holding_change?: string | null
          id?: string
          ingested_at?: string | null
          period_of_report: string
          shares?: number | null
          ticker?: string | null
          value_usd?: number | null
        }
        Update: {
          company_cik?: string | null
          cusip?: string | null
          filer_cik?: string
          filer_name?: string | null
          filing_url?: string | null
          holding_change?: string | null
          id?: string
          ingested_at?: string | null
          period_of_report?: string
          shares?: number | null
          ticker?: string | null
          value_usd?: number | null
        }
        Relationships: []
      }
      us_companies: {
        Row: {
          cik: string
          country: string | null
          created_at: string | null
          employees: number | null
          exchange: string | null
          fiscal_year_end: string | null
          id: string
          industry: string | null
          market_cap: number | null
          name: string
          sector: string | null
          sic: string | null
          sic_desc: string | null
          ticker: string
          updated_at: string | null
        }
        Insert: {
          cik: string
          country?: string | null
          created_at?: string | null
          employees?: number | null
          exchange?: string | null
          fiscal_year_end?: string | null
          id?: string
          industry?: string | null
          market_cap?: number | null
          name: string
          sector?: string | null
          sic?: string | null
          sic_desc?: string | null
          ticker: string
          updated_at?: string | null
        }
        Update: {
          cik?: string
          country?: string | null
          created_at?: string | null
          employees?: number | null
          exchange?: string | null
          fiscal_year_end?: string | null
          id?: string
          industry?: string | null
          market_cap?: number | null
          name?: string
          sector?: string | null
          sic?: string | null
          sic_desc?: string | null
          ticker?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      us_debt_maturities: {
        Row: {
          amount: number
          bucket: string
          created_at: string
          date: string
          high_cost_amount: number | null
          id: string
          low_cost_amount: number | null
          medium_cost_amount: number | null
          tbill_amount: number | null
          tbill_avg_yield: number | null
          total_debt: number
        }
        Insert: {
          amount: number
          bucket: string
          created_at?: string
          date: string
          high_cost_amount?: number | null
          id?: string
          low_cost_amount?: number | null
          medium_cost_amount?: number | null
          tbill_amount?: number | null
          tbill_avg_yield?: number | null
          total_debt: number
        }
        Update: {
          amount?: number
          bucket?: string
          created_at?: string
          date?: string
          high_cost_amount?: number | null
          id?: string
          low_cost_amount?: number | null
          medium_cost_amount?: number | null
          tbill_amount?: number | null
          tbill_avg_yield?: number | null
          total_debt?: number
        }
        Relationships: []
      }
      us_filings: {
        Row: {
          accession_no: string | null
          cik: string
          company_id: string | null
          description: string | null
          filing_date: string
          form_type: string
          id: string
          period_date: string | null
          url: string | null
        }
        Insert: {
          accession_no?: string | null
          cik: string
          company_id?: string | null
          description?: string | null
          filing_date: string
          form_type: string
          id?: string
          period_date?: string | null
          url?: string | null
        }
        Update: {
          accession_no?: string | null
          cik?: string
          company_id?: string | null
          description?: string | null
          filing_date?: string
          form_type?: string
          id?: string
          period_date?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "us_filings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "us_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      us_fiscal_stress: {
        Row: {
          date: string
          employment_tax_share: number | null
          entitlements: number | null
          fiscal_dominance_ratio: number | null
          gdp: number | null
          insolvency_ratio: number | null
          interest_expense: number | null
          payroll_taxes: number | null
          personal_taxes: number | null
          receipts_gdp: number | null
          total_receipts: number | null
          updated_at: string | null
        }
        Insert: {
          date: string
          employment_tax_share?: number | null
          entitlements?: number | null
          fiscal_dominance_ratio?: number | null
          gdp?: number | null
          insolvency_ratio?: number | null
          interest_expense?: number | null
          payroll_taxes?: number | null
          personal_taxes?: number | null
          receipts_gdp?: number | null
          total_receipts?: number | null
          updated_at?: string | null
        }
        Update: {
          date?: string
          employment_tax_share?: number | null
          entitlements?: number | null
          fiscal_dominance_ratio?: number | null
          gdp?: number | null
          insolvency_ratio?: number | null
          interest_expense?: number | null
          payroll_taxes?: number | null
          personal_taxes?: number | null
          receipts_gdp?: number | null
          total_receipts?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      us_fundamentals: {
        Row: {
          accession_no: string | null
          capex: number | null
          cash_equivalents: number | null
          cik: string
          company_id: string | null
          debt_equity: number | null
          ebitda: number | null
          eps_diluted: number | null
          ev_ebitda: number | null
          fcf_yield: number | null
          form_type: string
          free_cash_flow: number | null
          gross_profit: number | null
          id: string
          ingested_at: string | null
          market_cap: number | null
          market_price: number | null
          net_income: number | null
          operating_cash_flow: number | null
          operating_income: number | null
          operating_margin: number | null
          pb_ratio: number | null
          pe_ratio: number | null
          period_end: string
          revenue: number | null
          roe: number | null
          shares_outstanding: number | null
          stockholders_equity: number | null
          total_assets: number | null
          total_debt: number | null
        }
        Insert: {
          accession_no?: string | null
          capex?: number | null
          cash_equivalents?: number | null
          cik: string
          company_id?: string | null
          debt_equity?: number | null
          ebitda?: number | null
          eps_diluted?: number | null
          ev_ebitda?: number | null
          fcf_yield?: number | null
          form_type: string
          free_cash_flow?: number | null
          gross_profit?: number | null
          id?: string
          ingested_at?: string | null
          market_cap?: number | null
          market_price?: number | null
          net_income?: number | null
          operating_cash_flow?: number | null
          operating_income?: number | null
          operating_margin?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          period_end: string
          revenue?: number | null
          roe?: number | null
          shares_outstanding?: number | null
          stockholders_equity?: number | null
          total_assets?: number | null
          total_debt?: number | null
        }
        Update: {
          accession_no?: string | null
          capex?: number | null
          cash_equivalents?: number | null
          cik?: string
          company_id?: string | null
          debt_equity?: number | null
          ebitda?: number | null
          eps_diluted?: number | null
          ev_ebitda?: number | null
          fcf_yield?: number | null
          form_type?: string
          free_cash_flow?: number | null
          gross_profit?: number | null
          id?: string
          ingested_at?: string | null
          market_cap?: number | null
          market_price?: number | null
          net_income?: number | null
          operating_cash_flow?: number | null
          operating_income?: number | null
          operating_margin?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          period_end?: string
          revenue?: number | null
          roe?: number | null
          shares_outstanding?: number | null
          stockholders_equity?: number | null
          total_assets?: number | null
          total_debt?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "us_fundamentals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "us_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      us_insider_trades: {
        Row: {
          cik: string
          company_id: string | null
          filing_date: string
          filing_url: string | null
          id: string
          insider_name: string | null
          insider_title: string | null
          price_per_share: number | null
          shares: number | null
          shares_owned_after: number | null
          total_value: number | null
          transaction_date: string | null
          transaction_type: string | null
        }
        Insert: {
          cik: string
          company_id?: string | null
          filing_date: string
          filing_url?: string | null
          id?: string
          insider_name?: string | null
          insider_title?: string | null
          price_per_share?: number | null
          shares?: number | null
          shares_owned_after?: number | null
          total_value?: number | null
          transaction_date?: string | null
          transaction_type?: string | null
        }
        Update: {
          cik?: string
          company_id?: string | null
          filing_date?: string
          filing_url?: string | null
          id?: string
          insider_name?: string | null
          insider_title?: string | null
          price_per_share?: number | null
          shares?: number | null
          shares_owned_after?: number | null
          total_value?: number | null
          transaction_date?: string | null
          transaction_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "us_insider_trades_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "us_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      us_treasury_auctions: {
        Row: {
          auction_date: string
          bid_to_cover: number | null
          created_at: string | null
          demand_strength_score: number | null
          direct_bidder_pct: number | null
          high_yield: number | null
          id: string
          indirect_bidder_pct: number | null
          primary_dealer_pct: number | null
          security_type: string
          term: string | null
          total_accepted: number | null
          total_tendered: number | null
          updated_at: string | null
        }
        Insert: {
          auction_date: string
          bid_to_cover?: number | null
          created_at?: string | null
          demand_strength_score?: number | null
          direct_bidder_pct?: number | null
          high_yield?: number | null
          id?: string
          indirect_bidder_pct?: number | null
          primary_dealer_pct?: number | null
          security_type: string
          term?: string | null
          total_accepted?: number | null
          total_tendered?: number | null
          updated_at?: string | null
        }
        Update: {
          auction_date?: string
          bid_to_cover?: number | null
          created_at?: string | null
          demand_strength_score?: number | null
          direct_bidder_pct?: number | null
          high_yield?: number | null
          id?: string
          indirect_bidder_pct?: number | null
          primary_dealer_pct?: number | null
          security_type?: string
          term?: string | null
          total_accepted?: number | null
          total_tendered?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      water_risk_metrics: {
        Row: {
          as_of_date: string
          capex_usd_bn: number | null
          corporate_water_risk: number | null
          country: string
          created_at: string | null
          energy_water_nexus_score: number | null
          fiscal_stress_correlation: number | null
          id: string
          region: string | null
          water_stress_index: number | null
        }
        Insert: {
          as_of_date: string
          capex_usd_bn?: number | null
          corporate_water_risk?: number | null
          country: string
          created_at?: string | null
          energy_water_nexus_score?: number | null
          fiscal_stress_correlation?: number | null
          id?: string
          region?: string | null
          water_stress_index?: number | null
        }
        Update: {
          as_of_date?: string
          capex_usd_bn?: number | null
          corporate_water_risk?: number | null
          country?: string
          created_at?: string | null
          energy_water_nexus_score?: number | null
          fiscal_stress_correlation?: number | null
          id?: string
          region?: string | null
          water_stress_index?: number | null
        }
        Relationships: []
      }
      weekly_macro_snapshot: {
        Row: {
          created_at: string | null
          id: string
          key_metric: string | null
          metadata: Json | null
          narrative_snippet: string | null
          section_name: string
          value: number | null
          week_ending_date: string
          wow_change_pct: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_metric?: string | null
          metadata?: Json | null
          narrative_snippet?: string | null
          section_name: string
          value?: number | null
          week_ending_date: string
          wow_change_pct?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key_metric?: string | null
          metadata?: Json | null
          narrative_snippet?: string | null
          section_name?: string
          value?: number | null
          week_ending_date?: string
          wow_change_pct?: number | null
        }
        Relationships: []
      }
      weekly_regime_digests: {
        Row: {
          china_debt_section: Json
          created_at: string | null
          executive_summary: string
          holistic_narrative: string
          id: string
          regime_shifts: Json
          updated_at: string | null
          week_ending_date: string
          what_changed: Json
          what_to_watch: Json
        }
        Insert: {
          china_debt_section?: Json
          created_at?: string | null
          executive_summary: string
          holistic_narrative: string
          id?: string
          regime_shifts?: Json
          updated_at?: string | null
          week_ending_date: string
          what_changed?: Json
          what_to_watch?: Json
        }
        Update: {
          china_debt_section?: Json
          created_at?: string | null
          executive_summary?: string
          holistic_narrative?: string
          id?: string
          regime_shifts?: Json
          updated_at?: string | null
          week_ending_date?: string
          what_changed?: Json
          what_to_watch?: Json
        }
        Relationships: []
      }
      yield_curves: {
        Row: {
          as_of_date: string
          country: string
          id: string
          prev_yield: number | null
          source: string | null
          tenor: string
          updated_at: string | null
          yield_pct: number
        }
        Insert: {
          as_of_date: string
          country: string
          id?: string
          prev_yield?: number | null
          source?: string | null
          tenor: string
          updated_at?: string | null
          yield_pct: number
        }
        Update: {
          as_of_date?: string
          country?: string
          id?: string
          prev_yield?: number | null
          source?: string | null
          tenor?: string
          updated_at?: string | null
          yield_pct?: number
        }
        Relationships: []
      }
    }
    Views: {
      fuel_geopolitical_aggregated_score: {
        Row: {
          chokepoint_scores: Json | null
          geopolitical_risk_score: number | null
          peak_severity: number | null
          score_date: string | null
          total_events_today: number | null
        }
        Relationships: []
      }
      fuel_geopolitical_daily_score: {
        Row: {
          chokepoint: string | null
          event_count: number | null
          max_severity: number | null
          raw_score: number | null
          score_date: string | null
          total_severity: number | null
        }
        Relationships: []
      }
      market_pulse_stats: {
        Row: {
          advances: number | null
          circuits_pct: number | null
          created_at: string | null
          date: string | null
          declines: number | null
          delivery_pct: number | null
          dii_cash_net: number | null
          fii_avg_win: number | null
          fii_cash_net: number | null
          fii_idx_fut_net: number | null
          fii_percentile: number | null
          fii_std_win: number | null
          fii_zscore: number | null
          id: string | null
          india_vix: number | null
          india_vix_zscore: number | null
          midcap_perf: number | null
          new_highs_52w: number | null
          new_lows_52w: number | null
          nifty_perf: number | null
          pcr: number | null
          sector_returns: Json | null
          smallcap_perf: number | null
          updated_at: string | null
          vix_avg_win: number | null
          vix_percentile: number | null
          vix_std_win: number | null
          vix_zscore: number | null
        }
        Relationships: []
      }
      us_sector_summary: {
        Row: {
          avg_debt_equity: number | null
          avg_ev_ebitda: number | null
          avg_fcf_yield: number | null
          avg_operating_margin: number | null
          avg_pb: number | null
          avg_pe: number | null
          avg_roe: number | null
          company_count: number | null
          latest_period: string | null
          sector: string | null
        }
        Relationships: []
      }
      view_india_china_comparison: {
        Row: {
          china_export_usd: number | null
          china_qty: number | null
          fetched_at: string | null
          hs_code: string | null
          hs_description: string | null
          india_export_usd: number | null
          india_qty: number | null
          year: number | null
        }
        Relationships: []
      }
      vw_authenticity_percentage: {
        Row: {
          authenticity_score: number | null
          live_metrics: number | null
          total_metrics: number | null
        }
        Relationships: []
      }
      vw_authenticity_percentage_v2: {
        Row: {
          authenticity_score: number | null
          live_metrics: number | null
          provisional_metrics: number | null
          total_metrics: number | null
        }
        Relationships: []
      }
      vw_brics_tracker: {
        Row: {
          as_of_date: string | null
          delta_qoq: number | null
          delta_yoy_pct: number | null
          last_updated_at: string | null
          metric_id: string | null
          metric_name: string | null
          percentile: number | null
          staleness_flag: string | null
          unit: string | null
          unit_label: string | null
          value: number | null
          z_score: number | null
        }
        Relationships: []
      }
      vw_country_terminal: {
        Row: {
          budget_deficit_gdp_pct: number | null
          ca_gdp_pct: number | null
          central_bank_rate_date: string | null
          central_bank_rate_pct: number | null
          country_name: string | null
          cpi_yoy_pct: number | null
          exports_gdp_pct: number | null
          fx_reserves_bn: number | null
          fx_reserves_date: string | null
          gdp_per_capita_usd: number | null
          gdp_usd_bn: number | null
          gdp_yoy_pct: number | null
          gold_date: string | null
          gold_tonnes: number | null
          gov_debt_gdp_pct: number | null
          imports_gdp_pct: number | null
          iso: string | null
          population_mn: number | null
          region: string | null
          unemployment_pct: number | null
          updated_at: string | null
          yield_10y_date: string | null
          yield_10y_pct: number | null
          yield_2y_date: string | null
          yield_2y_pct: number | null
          yield_slope_2s10s: number | null
        }
        Relationships: []
      }
      vw_country_trade_imports: {
        Row: {
          fetched_at: string | null
          hs_code: string | null
          import_value_usd: number | null
          reporter_iso3: string | null
          share_of_total_pct: number | null
          untapped_score: number | null
          year: number | null
          yoy_growth_pct: number | null
        }
        Relationships: []
      }
      vw_credit_creation_pulse: {
        Row: {
          as_of_date: string | null
          change_12m: number | null
          country_code: string | null
          current_stock: number | null
          impulse_z_score: number | null
        }
        Relationships: []
      }
      vw_cron_job_status: {
        Row: {
          active: boolean | null
          jobid: number | null
          jobname: string | null
          last_run_at: string | null
          last_run_message: string | null
          last_run_status: string | null
          last_success_at: string | null
          schedule: string | null
        }
        Relationships: []
      }
      vw_data_integrity_ledger: {
        Row: {
          captured_at: string | null
          id: string | null
          metric_id: string | null
          payload_hash: string | null
          status_code: number | null
        }
        Relationships: []
      }
      vw_data_integrity_validation: {
        Row: {
          as_of_date: string | null
          discrepancy_abs: number | null
          fred_metric: string | null
          fred_val: number | null
          imf_val: number | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["fred_metric"]
            isOneToOne: false
            referencedRelation: "metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["fred_metric"]
            isOneToOne: false
            referencedRelation: "vw_brics_tracker"
            referencedColumns: ["metric_id"]
          },
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["fred_metric"]
            isOneToOne: false
            referencedRelation: "vw_data_staleness_monitor"
            referencedColumns: ["metric_id"]
          },
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["fred_metric"]
            isOneToOne: false
            referencedRelation: "vw_data_staleness_monitor_v2"
            referencedColumns: ["metric_id"]
          },
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["fred_metric"]
            isOneToOne: false
            referencedRelation: "vw_india_macro"
            referencedColumns: ["metric_id"]
          },
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["fred_metric"]
            isOneToOne: false
            referencedRelation: "vw_latest_metrics"
            referencedColumns: ["metric_id"]
          },
        ]
      }
      vw_data_staleness_monitor: {
        Row: {
          days_since_update: number | null
          expected_interval_days: number | null
          frequency_type: string | null
          metric_id: string | null
          metric_name: string | null
          provenance: string | null
          status: string | null
        }
        Relationships: []
      }
      vw_data_staleness_monitor_v2: {
        Row: {
          days_since_update: number | null
          expected_interval_days: number | null
          frequency_type: string | null
          is_provisional: boolean | null
          metric_id: string | null
          metric_name: string | null
          provenance: string | null
          source_ref: string | null
          status: string | null
        }
        Relationships: []
      }
      vw_dedollarization: {
        Row: {
          as_of_date: string | null
          delta_qoq: number | null
          delta_yoy_pct: number | null
          metric_id: string | null
          staleness_flag: string | null
          value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "vw_brics_tracker"
            referencedColumns: ["metric_id"]
          },
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "vw_data_staleness_monitor"
            referencedColumns: ["metric_id"]
          },
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "vw_data_staleness_monitor_v2"
            referencedColumns: ["metric_id"]
          },
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "vw_india_macro"
            referencedColumns: ["metric_id"]
          },
          {
            foreignKeyName: "metric_observations_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "vw_latest_metrics"
            referencedColumns: ["metric_id"]
          },
        ]
      }
      vw_fx_monthly_cross_rates: {
        Row: {
          cny_inr: number | null
          month: string | null
          observation_count: number | null
          usd_cny: number | null
          usd_inr: number | null
        }
        Relationships: []
      }
      vw_g20_reserves_gold: {
        Row: {
          as_of_date: string | null
          country_code: string | null
          country_name: string | null
          fx_reserves_usd: number | null
          gold_tonnes: number | null
          gold_usd: number | null
          gold_yoy_pct_change: number | null
          is_accumulating_gold: boolean | null
          is_dedollarizing: boolean | null
          is_major: boolean | null
          region: string | null
          usd_share_change_yoy: number | null
          usd_share_pct: number | null
        }
        Relationships: []
      }
      vw_g20_sovereign: {
        Row: {
          debt_gdp_current: number | null
          debt_gdp_delta: number | null
          inflation_current: number | null
          inflation_delta: number | null
          interest_burden_current: number | null
          interest_burden_delta: number | null
          last_computed_at: string | null
          real_rate_current: number | null
          real_rate_delta: number | null
        }
        Relationships: []
      }
      vw_geopolitical_risk_index: {
        Row: {
          as_of_date: string | null
          composite_z_score: number | null
          gold_z: number | null
          move_z: number | null
          vix_z: number | null
        }
        Relationships: []
      }
      vw_gold_ratios: {
        Row: {
          current_value: number | null
          last_updated: string | null
          percentile: number | null
          ratio_name: string | null
          z_score: number | null
        }
        Relationships: []
      }
      vw_gold_ratios_historical: {
        Row: {
          as_of_date: string | null
          ratio_name: string | null
          ratio_value: number | null
        }
        Relationships: []
      }
      vw_gold_ratios_percentiles: {
        Row: {
          as_of_date: string | null
          percentile: number | null
          ratio_name: string | null
          ratio_value: number | null
        }
        Relationships: []
      }
      vw_gold_ratios_stats: {
        Row: {
          as_of_date: string | null
          current_value: number | null
          ratio_name: string | null
          rolling_mean: number | null
          rolling_std: number | null
          window_size: number | null
          z_score: number | null
        }
        Relationships: []
      }
      vw_gold_ratios_tall: {
        Row: {
          current_value: number | null
          last_updated: string | null
          percentile: number | null
          ratio_name: string | null
          z_score: number | null
        }
        Relationships: []
      }
      vw_gold_returns_events: {
        Row: {
          event_description: string | null
          event_name: string | null
          gold_price: number | null
          macro_regime: string | null
          month_date: string | null
          return_pct: number | null
        }
        Relationships: []
      }
      vw_india_macro: {
        Row: {
          as_of_date: string | null
          category: string | null
          composite_version: number | null
          days_since_update: number | null
          delta_mom: number | null
          delta_wow: number | null
          display_frequency: string | null
          expected_interval_days: number | null
          frequency_type: string | null
          is_provisional: boolean | null
          last_updated_at: string | null
          metric_id: string | null
          metric_name: string | null
          native_frequency: string | null
          percentile: number | null
          provenance: string | null
          source_name: string | null
          source_ref: string | null
          staleness_flag: string | null
          tier: string | null
          unit: string | null
          unit_label: string | null
          value: number | null
          z_score: number | null
        }
        Relationships: []
      }
      vw_institutional_dominance: {
        Row: {
          as_of_date: string | null
          dominance_status: string | null
          east_dominance_pct: number | null
          east_total: number | null
          japan_dominance_pct: number | null
          japan_total: number | null
          loan_type: string | null
          recipient_income_bracket: string | null
          recipient_region: string | null
          total_volume: number | null
          west_total: number | null
        }
        Relationships: []
      }
      vw_latest_daily_signal: {
        Row: {
          component_scores: Json | null
          computed_at: string | null
          confidence_pct: number | null
          context_line: string | null
          driver_line: string | null
          key_driver: string | null
          regime: string | null
          regime_changed: boolean | null
          regime_line: string | null
          score: number | null
          score_delta: number | null
          signal_date: string | null
          watch_item: string | null
          watch_line: string | null
        }
        Relationships: []
      }
      vw_latest_ingestion: {
        Row: {
          last_ingestion_at: string | null
        }
        Relationships: []
      }
      vw_latest_ingestions: {
        Row: {
          api_latency_ms: number | null
          created_at: string | null
          duration_seconds: number | null
          end_time: string | null
          error_message: string | null
          function_name: string | null
          rows_inserted: number | null
          rows_updated: number | null
          start_time: string | null
          status: string | null
          status_code: number | null
        }
        Relationships: []
      }
      vw_latest_metrics: {
        Row: {
          as_of_date: string | null
          category: string | null
          composite_version: number | null
          days_since_update: number | null
          delta_mom: number | null
          delta_wow: number | null
          display_frequency: string | null
          expected_interval_days: number | null
          frequency_type: string | null
          is_provisional: boolean | null
          last_updated_at: string | null
          metric_id: string | null
          metric_name: string | null
          native_frequency: string | null
          percentile: number | null
          provenance: string | null
          source_name: string | null
          source_ref: string | null
          staleness_flag: string | null
          tier: string | null
          unit: string | null
          unit_label: string | null
          value: number | null
          z_score: number | null
        }
        Relationships: []
      }
      vw_latest_uk_traders: {
        Row: {
          company_name: string | null
          flow_type: string | null
          hs_code: string | null
          id: string | null
          last_updated: string | null
          month_id: number | null
          postcode: string | null
          staleness_flag: string | null
          trader_id: number | null
          value_gbp: number | null
        }
        Relationships: []
      }
      vw_mutual_fund_universe: {
        Row: {
          category: string | null
          current_nav: number | null
          fund_house: string | null
          id: string | null
          isin: string | null
          macro_impact_score: number | null
          name: string | null
          return_1y: number | null
          return_3y: number | null
          return_5y: number | null
          scheme_code: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      vw_net_liquidity: {
        Row: {
          alarm_status: string | null
          as_of_date: string | null
          delta: number | null
          delta_pct: number | null
          percentile: number | null
          value: number | null
          z_score: number | null
        }
        Relationships: []
      }
      vw_offshore_dollar_stress: {
        Row: {
          as_of_date: string | null
          slope_bps: number | null
          sofr_ois_spread: number | null
          status: string | null
        }
        Insert: {
          as_of_date?: string | null
          slope_bps?: never
          sofr_ois_spread?: number | null
          status?: never
        }
        Update: {
          as_of_date?: string | null
          slope_bps?: never
          sofr_ois_spread?: number | null
          status?: never
        }
        Relationships: []
      }
      vw_regional_refining_imbalance: {
        Row: {
          as_of_date: string | null
          avg_utilization_pct: number | null
          closed_count: number | null
          converted_count: number | null
          expanded_count: number | null
          region: string | null
          total_capacity_mbpd: number | null
          total_facilities: number | null
        }
        Relationships: []
      }
      vw_smart_money_collective: {
        Row: {
          as_of_date: string | null
          avg_bond: number | null
          avg_concentration: number | null
          avg_equity: number | null
          avg_gold: number | null
          avg_other: number | null
          avg_regime_z: number | null
          institution_count: number | null
          regime_label: string | null
          risk_signal: string | null
          total_aum: number | null
        }
        Relationships: []
      }
      vw_sovereign_solvency: {
        Row: {
          calculated_at: string | null
          debt_gold_ratio: number | null
          monetary_optionality_index: number | null
          real_gva_gold: number | null
        }
        Relationships: []
      }
      vw_tic_foreign_holders: {
        Row: {
          as_of_date: string | null
          country_name: string | null
          holdings_usd_bn: number | null
          mom_pct_change: number | null
          pct_of_total_foreign: number | null
          yoy_pct_change: number | null
        }
        Relationships: []
      }
      vw_upcoming_events: {
        Row: {
          actual: string | null
          country: string | null
          event_date: string | null
          event_name: string | null
          forecast: string | null
          id: string | null
          impact_level: string | null
          previous: string | null
          source_url: string | null
          surprise: string | null
          surprise_direction: string | null
        }
        Insert: {
          actual?: string | null
          country?: string | null
          event_date?: string | null
          event_name?: string | null
          forecast?: string | null
          id?: string | null
          impact_level?: string | null
          previous?: string | null
          source_url?: string | null
          surprise?: string | null
          surprise_direction?: never
        }
        Update: {
          actual?: string | null
          country?: string | null
          event_date?: string | null
          event_name?: string | null
          forecast?: string | null
          id?: string | null
          impact_level?: string | null
          previous?: string | null
          source_url?: string | null
          surprise?: string | null
          surprise_direction?: never
        }
        Relationships: []
      }
      vw_upi_autopay_latest: {
        Row: {
          as_of_date: string | null
          failure_rate_delta_mom: number | null
          failure_rate_pct: number | null
          source_url: string | null
          staleness_flag: string | null
          total_attempts_fmt: string | null
        }
        Relationships: []
      }
      vw_us_debt_gold_backing: {
        Row: {
          as_of_date: string | null
          debt_gold_ratio: number | null
          debt_to_gold_coverage_ratio: number | null
          gold_ounces: number | null
          gold_price_usd: number | null
          gold_tonnes: number | null
          gold_value_usd: number | null
          implied_gold_price: number | null
          total_debt: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_metric_deltas: { Args: never; Returns: undefined }
      calculate_metric_stats: {
        Args: { p_metric_id: string }
        Returns: undefined
      }
      calculate_percentile: {
        Args: { metric_name: string; target_val: number; window_days?: number }
        Returns: number
      }
      calculate_zscore: {
        Args: { metric_name: string; target_val: number; window_days?: number }
        Returns: number
      }
      compute_rolling_z_scores: { Args: never; Returns: undefined }
      confirm_subscription: { Args: { p_token: string }; Returns: string }
      get_latest_gold_ratios: {
        Args: never
        Returns: {
          current_value: number | null
          last_updated: string | null
          percentile: number | null
          ratio_name: string | null
          z_score: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "vw_gold_ratios_tall"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_subscriber_stats: { Args: never; Returns: Json }
      get_traffic_intelligence_summary: {
        Args: { p_days?: number }
        Returns: Json
      }
      increment_api_usage: { Args: { key_id: string }; Returns: undefined }
      populate_gold_ratios: { Args: never; Returns: undefined }
      refresh_market_pulse_stats: { Args: never; Returns: undefined }
      refresh_us_sector_summary: { Args: never; Returns: undefined }
      schedule_standard_cron: {
        Args: {
          p_function_name: string
          p_job_name: string
          p_schedule: string
          p_timeout_seconds?: number
        }
        Returns: undefined
      }
    }
    Enums: {
      fyp_section: "pillar" | "target" | "milestone" | "correlation"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      fyp_section: ["pillar", "target", "milestone", "correlation"],
    },
  },
} as const
