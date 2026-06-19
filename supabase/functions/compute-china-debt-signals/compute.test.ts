import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';

function clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max);
}

Deno.test('iceberg ratio = consolidated_high / central_official', () => {
    const ratio = Math.round((140 / 25.5) * 100) / 100;
    assertEquals(ratio, 5.49);
});

Deno.test('monetization pressure clamps to 0-100', () => {
    const m2Growth = 9.5;
    const gdpGrowth = 4.8;
    const m2GdpGap = m2Growth - gdpGrowth;
    const monetization = clamp(m2GdpGap * 8, 0, 100);
    assertEquals(monetization, 37.6);
});

Deno.test('lgfv stress index weights components', () => {
    const lgfvLevel = 66;
    const lgfvDelta = 3;
    const fiscalStress = clamp(-(-7.4) * 5, 0, 30);
    const lgfvStress = clamp(lgfvLevel * 0.6 + lgfvDelta * 3 + fiscalStress, 0, 100);
    assertEquals(lgfvStress > 45, true);
});