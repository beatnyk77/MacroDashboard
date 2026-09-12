import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type CorporateSignalRow = Database['public']['Views']['vw_latest_corporate_signals']['Row'];
export type CorporateTransmissionSummary = Database['public']['Views']['vw_corporate_transmission_summary']['Row'];
export type CorporateTransmissionFilters = { theme?: string; severity?: string; issuerId?: string };

export function useCorporateTransmission(filters: CorporateTransmissionFilters = {}) {
  return useQuery({
    queryKey: ['corporate-transmission', filters],
    queryFn: async (): Promise<CorporateSignalRow[]> => {
      let query = supabase.from('vw_latest_corporate_signals').select('*');
      if (filters.theme) query = query.eq('macro_theme', filters.theme);
      if (filters.severity) query = query.eq('severity', filters.severity);
      if (filters.issuerId) query = query.eq('issuer_id', filters.issuerId);
      const { data, error } = await query.order('observed_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCorporateTransmissionSummary() {
  return useQuery({
    queryKey: ['corporate-transmission-summary'],
    queryFn: async (): Promise<CorporateTransmissionSummary | null> => {
      const { data, error } = await supabase.from('vw_corporate_transmission_summary').select('*').maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export type CorporateZombieStressSummary = Database['public']['Views']['vw_corporate_zombie_stress_summary']['Row'];

export function useZombieStressSummary() {
  return useQuery({
    queryKey: ['corporate-zombie-stress-summary'],
    queryFn: async (): Promise<CorporateZombieStressSummary | null> => {
      const { data, error } = await supabase.from('vw_corporate_zombie_stress_summary').select('*').maybeSingle();
      if (error) {
        console.warn('vw_corporate_zombie_stress_summary query error (using fallback):', error.message);
        return null;
      }
      return data;
    },
  });
}

export type ZombieScreenerRow = {
  issuerId: string;
  ticker: string;
  cik: string;
  issuerName: string;
  sector: string;
  ebit: number | null;
  totalDebt: number | null;
  interestExpense: number | null;
  existingCouponPct: number | null;
  currentIcr: number | null;
  proFormaIcr: number | null;
  additionalInterestDrag: number | null;
  maturingDebt2Y: number | null;
  cashRunwayQuarters: number | null;
  tier: 'confirmed_zombie' | 'rollover_zombie' | 'vulnerable' | 'solvent';
  documentUrl: string | null;
  observedAt: string | null;
};

export function useCorporateZombieScreener(refiRate: number = 0.07, search: string = '', selectedTier: string = 'All') {
  const signalsQuery = useCorporateTransmission();

  const screenerData = useMemo(() => {
    const rows = signalsQuery.data ?? [];
    if (rows.length === 0) return { issuers: [], stats: { total: 0, confirmed: 0, rollover: 0, vulnerable: 0, solvent: 0, debtAtRisk: 0, incrementalDrag: 0, medianRunway: null } };

    // Group signals by issuer_id
    const issuerMap = new Map<string, {
      ticker: string;
      cik: string;
      issuerName: string;
      sector: string;
      ebit: number | null;
      totalDebt: number | null;
      interestExpense: number | null;
      cashRunwayQuarters: number | null;
      documentUrl: string | null;
      observedAt: string | null;
      rawCurrentIcr: number | null;
    }>();

    for (const row of rows) {
      if (!row.issuer_id) continue;
      let entry = issuerMap.get(row.issuer_id);
      if (!entry) {
        entry = {
          ticker: row.ticker ?? '',
          cik: row.cik ?? '',
          issuerName: row.issuer_name ?? 'Unknown Issuer',
          sector: row.sector ?? 'General Corporate',
          ebit: null,
          totalDebt: null,
          interestExpense: null,
          cashRunwayQuarters: null,
          documentUrl: row.document_url ?? null,
          observedAt: row.observed_at ?? null,
          rawCurrentIcr: null,
        };
        issuerMap.set(row.issuer_id, entry);
      }

      if (row.document_url && !entry.documentUrl) entry.documentUrl = row.document_url;
      if (row.observed_at && (!entry.observedAt || row.observed_at > entry.observedAt)) entry.observedAt = row.observed_at;

      const inputs = (row.calculation_inputs ?? {}) as Record<string, unknown>;

      if (row.signal_id === 'interest_coverage_ratio') {
        entry.rawCurrentIcr = row.numeric_value;
        if (typeof inputs.ebit === 'number') entry.ebit = inputs.ebit;
        if (typeof inputs.interestExpense === 'number') entry.interestExpense = inputs.interestExpense;
        if (typeof inputs.totalDebt === 'number' && inputs.totalDebt > 0) entry.totalDebt = inputs.totalDebt;
      } else if (row.signal_id === 'pro_forma_refi_icr') {
        if (typeof inputs.ebit === 'number') entry.ebit = inputs.ebit;
        if (typeof inputs.totalDebt === 'number') entry.totalDebt = inputs.totalDebt;
      } else if (row.signal_id === 'cash_runway_quarters') {
        entry.cashRunwayQuarters = row.numeric_value;
      }
    }

    const processedIssuers: ZombieScreenerRow[] = [];
    let confirmedCount = 0;
    let rolloverCount = 0;
    let vulnerableCount = 0;
    let solventCount = 0;
    let totalDebtAtRisk = 0;
    let totalIncrementalDrag = 0;
    const runways: number[] = [];

    for (const [issuerId, item] of issuerMap.entries()) {
      const ebit = item.ebit;
      const debt = item.totalDebt;
      const interest = item.interestExpense;
      const runway = item.cashRunwayQuarters;

      // Current ICR
      let currentIcr: number | null = item.rawCurrentIcr;
      if (currentIcr === null && ebit !== null && interest !== null && interest > 0) {
        currentIcr = ebit / interest;
      }

      // Pro-Forma Refi Shock calculation based on dynamic refiRate slider
      let proFormaIcr: number | null = null;
      let additionalInterestDrag: number | null = null;
      const maturingDebt2Y = debt ? debt * 0.35 : null;
      let existingCouponPct: number | null = null;

      if (debt && debt > 0 && interest !== null && interest > 0) {
        const annualInterest = interest;
        existingCouponPct = (annualInterest / debt) * 100;
        const couponDecimal = existingCouponPct / 100;
        const maturing = maturingDebt2Y ?? 0;
        const remaining = debt - maturing;
        const proFormaInterest = (remaining * couponDecimal) + (maturing * refiRate);
        additionalInterestDrag = Math.max(0, proFormaInterest - annualInterest);
        totalIncrementalDrag += additionalInterestDrag;

        if (ebit !== null) {
          proFormaIcr = proFormaInterest > 0 ? ebit / proFormaInterest : (ebit >= 0 ? 999 : -1);
        }
      }

      // Dynamic tier classification
      let tier: ZombieScreenerRow['tier'] = 'solvent';
      if (currentIcr !== null && currentIcr < 1.0) {
        tier = 'confirmed_zombie';
        confirmedCount++;
        if (debt) totalDebtAtRisk += debt;
        if (runway !== null) runways.push(runway);
      } else if (currentIcr !== null && currentIcr >= 1.0 && proFormaIcr !== null && proFormaIcr < 1.0) {
        tier = 'rollover_zombie';
        rolloverCount++;
        if (debt) totalDebtAtRisk += debt;
        if (runway !== null) runways.push(runway);
      } else if ((proFormaIcr !== null && proFormaIcr < 1.75) || (runway !== null && runway < 4)) {
        tier = 'vulnerable';
        vulnerableCount++;
      } else {
        tier = 'solvent';
        solventCount++;
      }

      processedIssuers.push({
        issuerId,
        ticker: item.ticker,
        cik: item.cik,
        issuerName: item.issuerName,
        sector: item.sector,
        ebit,
        totalDebt: debt,
        interestExpense: interest,
        existingCouponPct,
        currentIcr,
        proFormaIcr,
        additionalInterestDrag,
        maturingDebt2Y,
        cashRunwayQuarters: runway,
        tier,
        documentUrl: item.documentUrl,
        observedAt: item.observedAt,
      });
    }

    runways.sort((a, b) => a - b);
    const medianRunway = runways.length > 0 ? runways[Math.floor(runways.length / 2)] : null;

    // Filter by search query
    let filtered = processedIssuers;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter((i) =>
        i.ticker.toLowerCase().includes(q) ||
        i.issuerName.toLowerCase().includes(q) ||
        i.cik.includes(q) ||
        i.sector.toLowerCase().includes(q)
      );
    }

    // Filter by tier
    if (selectedTier !== 'All') {
      filtered = filtered.filter((i) => i.tier === selectedTier);
    }

    // Sort by stress severity: confirmed_zombie first, then rollover_zombie, then vulnerable, then solvent
    const tierPriority = { confirmed_zombie: 0, rollover_zombie: 1, vulnerable: 2, solvent: 3 };
    filtered.sort((a, b) => {
      const pA = tierPriority[a.tier];
      const pB = tierPriority[b.tier];
      if (pA !== pB) return pA - pB;
      return (a.proFormaIcr ?? 999) - (b.proFormaIcr ?? 999);
    });

    return {
      issuers: filtered,
      stats: {
        total: processedIssuers.length,
        confirmed: confirmedCount,
        rollover: rolloverCount,
        vulnerable: vulnerableCount,
        solvent: solventCount,
        debtAtRisk: totalDebtAtRisk,
        incrementalDrag: totalIncrementalDrag,
        medianRunway,
      },
    };
  }, [signalsQuery.data, refiRate, search, selectedTier]);

  return {
    ...signalsQuery,
    screener: screenerData,
  };
}
