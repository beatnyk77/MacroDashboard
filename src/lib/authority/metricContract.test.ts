import { describe, expect, it } from 'vitest';
import { serializeAuthorityMetric, toAuthorityMetricCsv } from './metricContract';

describe('authority metric contract', () => {
  it('serializes missing values as explicit nulls', () => {
    const json = JSON.parse(serializeAuthorityMetric({
      metric_id: 'example', slug: 'example', label: 'Example', value: null,
      unit: 'index', observed_at: null, published_at: null, source_name: 'Example',
      source_ref: null, native_frequency: 'monthly', staleness_flag: 'very_lagged',
      data_status: 'unavailable', methodology_version: '1.0.0', revision_of: null,
    }));
    expect(json.value).toBeNull();
    expect(json.revision_of).toBeNull();
  });

  it('emits the documented CSV contract header', () => {
    expect(toAuthorityMetricCsv([]).split('\n')[0]).toBe(
      'metric_id,slug,label,value,unit,observed_at,published_at,source_name,source_ref,native_frequency,staleness_flag,data_status,methodology_version,revision_of'
    );
  });
});
