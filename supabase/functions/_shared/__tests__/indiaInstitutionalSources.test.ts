import { describe, expect, it } from 'vitest';
import {
  parseNseCashPayload,
  parseParticipantOiCsv,
  parseNsdlSectorHtml,
  validateCashFlow,
  validateSectorRows,
} from '../indiaInstitutionalSources';

describe('India institutional source parsers', () => {
  it('parses and validates FII and DII NSE cash rows', () => {
    const rows = parseNseCashPayload([
      { category: 'FII/FPI', date: '29-Aug-2026', buyValue: '10,000', sellValue: '12,000', netValue: '-2,000' },
      { category: 'DII', date: '29-Aug-2026', buyValue: '8,000', sellValue: '7,500', netValue: '500' },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].participant).toBe('FII');
    expect(validateCashFlow(rows[0]).valid).toBe(true);
    expect(rows[1].netValue).toBe(500);
  });

  it('rejects a cash row whose net does not reconcile', () => {
    const [row] = parseNseCashPayload([{ category: 'FII', date: '29-Aug-2026', buyValue: 100, sellValue: 40, netValue: 20 }]);
    expect(validateCashFlow(row).valid).toBe(false);
  });

  it('parses participant OI by header names and exposes unavailable coverage', () => {
    const headers = 'Client Type,Future Index Long,Future Index Short,Option Index Call Short,Option Index Put Short';
    const parsed = parseParticipantOiCsv(`${headers}\nFII,120,80,1000,900\nDII,50,40,0,0`, '2026-08-29');
    expect(parsed.coverage).toBe('observed');
    expect(parsed.fii?.indexFutureNet).toBe(40);
    expect(parsed.fii?.putCallPositioning).toBe(0.9);
    expect(parseParticipantOiCsv(headers, '2026-08-29').coverage).toBe('unavailable');
  });

  it('parses NSDL sectors and rejects duplicate sector keys', () => {
    const html = `<table><tr><th>Sector</th><th>Equity AUC</th><th>Equity Net</th><th>Total AUC</th><th>Total Net</th></tr><tr><td>Financial Services</td><td>1000</td><td>25</td><td>1100</td><td>30</td></tr><tr><td>Power</td><td>500</td><td>-10</td><td>550</td><td>-12</td></tr></table>`;
    const rows = parseNsdlSectorHtml(html, 'https://nsdl.example/report', '2026-08-15');
    expect(rows).toHaveLength(2);
    expect(rows[0].sectorKey).toBe('financial_services');
    expect(validateSectorRows(rows).valid).toBe(true);
    expect(validateSectorRows([...rows, { ...rows[0] }]).valid).toBe(false);
  });
});
