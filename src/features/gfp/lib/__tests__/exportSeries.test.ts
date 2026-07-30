import { describe, it, expect } from 'vitest';
import { toCsv } from '../exportSeries';

describe('toCsv', () => {
  it('serializes rows', () => {
    const csv = toCsv([{ a: 1, b: 'x,y' }]);
    expect(csv).toContain('a,b');
    expect(csv).toContain('"x,y"');
  });
});
