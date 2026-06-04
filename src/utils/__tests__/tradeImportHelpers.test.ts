import { describe, it, expect } from 'vitest'

// ── Pure helpers (copy of what lives in the edge function) ──────────────────
// These are extracted here solely for unit-testability in vitest/jsdom.
// The actual implementations in the edge function must stay identical.

const REPORTER_MAP: Record<string, string> = {
  AUS: '36',  BRA: '76',  CAN: '124', CHN: '156',
  DEU: '276', ESP: '724', FRA: '251', GBR: '826',
  IND: '699', ITA: '381', JPN: '392', KOR: '410',
  MEX: '484', NLD: '528', SAU: '682', TUR: '792',
  USA: '842',
}

function parseComtradeRecord(record: { cmdCode?: unknown; primaryValue?: unknown }) {
  return {
    hsCode: String(record.cmdCode ?? '').padStart(2, '0'),
    importValue: Number(record.primaryValue ?? 0),
  }
}

function buildReporterList(
  reporterISO: string | null,
  force: boolean,
  alreadyPopulated: Set<string>
): string[] {
  const all = Object.keys(REPORTER_MAP)
  const list = reporterISO ? [reporterISO.toUpperCase()] : all
  return force ? list : list.filter((iso3) => !alreadyPopulated.has(iso3))
}
// ───────────────────────────────────────────────────────────────────────────

describe('parseComtradeRecord', () => {
  it('returns zero-padded hsCode and numeric importValue for a valid record', () => {
    const result = parseComtradeRecord({ cmdCode: '1', primaryValue: 5_000_000 })
    expect(result.hsCode).toBe('01')
    expect(result.importValue).toBe(5_000_000)
  })

  it('keeps two-digit codes intact (no extra padding)', () => {
    const result = parseComtradeRecord({ cmdCode: '27', primaryValue: 1_234 })
    expect(result.hsCode).toBe('27')
  })

  it('returns importValue 0 when primaryValue is null', () => {
    const result = parseComtradeRecord({ cmdCode: '05', primaryValue: null })
    expect(result.importValue).toBe(0)
  })

  it('handles numeric cmdCode (Comtrade sometimes returns integers)', () => {
    const result = parseComtradeRecord({ cmdCode: 3, primaryValue: 999 })
    expect(result.hsCode).toBe('03')
  })

  it('returns hsCode "00" when cmdCode is absent', () => {
    const result = parseComtradeRecord({})
    expect(result.hsCode).toBe('00')
  })
})

describe('buildReporterList', () => {
  it('returns single reporter when reporterISO is set', () => {
    const list = buildReporterList('chn', false, new Set())
    expect(list).toEqual(['CHN'])
  })

  it('returns all 17 reporters when reporterISO is null', () => {
    const list = buildReporterList(null, false, new Set())
    expect(list).toHaveLength(17)
  })

  it('excludes already-populated reporters when force=false', () => {
    const populated = new Set(['CHN', 'DEU', 'JPN'])
    const list = buildReporterList(null, false, populated)
    expect(list).not.toContain('CHN')
    expect(list).not.toContain('DEU')
    expect(list.length).toBe(14)
  })

  it('includes already-populated reporters when force=true', () => {
    const populated = new Set(['CHN', 'DEU'])
    const list = buildReporterList(null, true, populated)
    expect(list).toContain('CHN')
    expect(list).toContain('DEU')
    expect(list).toHaveLength(17)
  })

  it('includes target reporter even if populated, when force=true', () => {
    const list = buildReporterList('IND', true, new Set(['IND']))
    expect(list).toEqual(['IND'])
  })

  it('excludes target reporter if already populated and force=false', () => {
    const list = buildReporterList('IND', false, new Set(['IND']))
    expect(list).toEqual([])
  })
})
