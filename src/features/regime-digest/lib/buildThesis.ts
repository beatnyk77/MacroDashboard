// src/features/regime-digest/lib/buildThesis.ts
import type { MetricRow, NotebookRegime } from './types';

function dirWord(deltaPct: number | null): 'rose' | 'fell' | 'was unchanged' {
  if (deltaPct == null || Math.abs(deltaPct) < 0.05) return 'was unchanged';
  return deltaPct > 0 ? 'rose' : 'fell';
}

export function buildThesisLines(regime: NotebookRegime, board: MetricRow[]): string[] {
  const lines: string[] = [];
  const parenParts: string[] = [];
  if (regime.confidence != null) {
    parenParts.push(`confidence ${Math.round(regime.confidence)}%`);
  }
  if (regime.daysInRegime != null) {
    parenParts.push(`${regime.daysInRegime} days in regime`);
  }
  const paren = parenParts.length ? ` (${parenParts.join('; ')})` : '';
  lines.push(`Month-end regime: ${regime.label.replace('_', ' ')}${paren}.`);

  const byId = (id: string) => board.find((r) => r.id === id && r.status === 'ok');

  const liq = byId('BIS_GLOBAL_LIQUIDITY_USD_BN');
  if (liq?.deltaPct != null && liq.level != null) {
    const verb = liq.deltaPct >= 0 ? 'expanded' : 'contracted';
    lines.push(
      `Global net liquidity ${verb} MoM (${liq.deltaPct >= 0 ? '+' : ''}${liq.deltaPct.toFixed(2)}%) to ${liq.level.toFixed(0)} USD bn.`,
    );
  }

  const dxy = byId('DXY_INDEX');
  if (dxy?.level != null) {
    lines.push(
      `DXY ${dirWord(dxy.deltaPct)} MoM to ${dxy.level.toFixed(2)}, a ${
        (dxy.deltaPct ?? 0) > 0 ? 'tightening' : (dxy.deltaPct ?? 0) < 0 ? 'easing' : 'stable'
      } USD impulse.`,
    );
  }

  const gold = byId('GOLD_PRICE_USD');
  if (gold?.level != null && gold.deltaPct != null) {
    lines.push(
      `Gold ${dirWord(gold.deltaPct)} MoM to $${Math.round(gold.level).toLocaleString()} (${gold.deltaPct >= 0 ? '+' : ''}${gold.deltaPct.toFixed(2)}%).`,
    );
  }

  const indiaCpi = byId('IN_CPI_YOY');
  const indiaGdp = byId('IN_GDP_GROWTH_YOY');
  if (indiaCpi?.level != null || indiaGdp?.level != null) {
    const parts = [];
    if (indiaGdp?.level != null) parts.push(`GDP ${indiaGdp.level.toFixed(2)}%`);
    if (indiaCpi?.level != null) parts.push(`CPI ${indiaCpi.level.toFixed(2)}%`);
    lines.push(`India pulse: ${parts.join(' · ')}.`);
  }

  return lines.slice(0, 5);
}
