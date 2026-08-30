import { describe, expect, it } from 'vitest';
import { AUTHORITY_METRIC_STATUS_VALUES } from '@/lib/dataStatus';
import { serializeAuthorityMetric, toAuthorityMetricCsv } from './metricContract';
import { AUTHORITY_METRIC_STALENESS_VALUES } from './metricContract';

describe('authority metric contract', () => {
    it('exposes the allowed authority metric status values', () => {
        expect(AUTHORITY_METRIC_STATUS_VALUES).toEqual([
            'verified',
            'provisional',
            'revised',
            'corrected',
            'unavailable',
            'superseded',
        ]);
    });

    it('exposes the allowed staleness values', () => {
        expect(AUTHORITY_METRIC_STALENESS_VALUES).toEqual([
            'fresh',
            'lagged',
            'very_lagged',
        ]);
    });

    it('serializes missing values as explicit nulls', () => {
        const json = JSON.parse(serializeAuthorityMetric({
            metric_id: 'example',
            slug: 'example',
            label: 'Example',
            value: null,
            unit: 'index',
            observed_at: null,
            published_at: null,
            source_name: 'Example',
            source_ref: null,
            native_frequency: 'monthly',
            staleness_flag: 'very_lagged',
            data_status: 'unavailable',
            methodology_version: '1.0.0',
            revision_of: null,
        }));

        expect(json.value).toBeNull();
        expect(json.revision_of).toBeNull();
        expect(json.source_ref).toBeNull();
        expect(json.native_frequency).toBe('monthly');
        expect(json.staleness_flag).toBe('very_lagged');
    });

    it('emits the documented CSV contract header', () => {
        expect(toAuthorityMetricCsv([]).split('\n')[0]).toBe(
            'metric_id,slug,label,value,unit,observed_at,published_at,source_name,source_ref,native_frequency,staleness_flag,data_status,methodology_version,revision_of',
        );
    });

    it('sorts rows by timestamp before serialization', () => {
        const csv = toAuthorityMetricCsv([
            {
                metric_id: 'late',
                slug: 'late',
                label: 'Late',
                value: 2,
                unit: 'index',
                observed_at: '2026-08-03',
                published_at: '2026-08-04',
                source_name: 'B',
                source_ref: 'ref-b',
                native_frequency: 'monthly',
                staleness_flag: 'lagged',
                data_status: 'revised',
                methodology_version: '1.0.0',
                revision_of: null,
            },
            {
                metric_id: 'early',
                slug: 'early',
                label: 'Early',
                value: 1,
                unit: 'index',
                observed_at: '2026-08-01',
                published_at: '2026-08-02',
                source_name: 'A',
                source_ref: 'ref-a',
                native_frequency: 'monthly',
                staleness_flag: 'fresh',
                data_status: 'verified',
                methodology_version: '1.0.0',
                revision_of: null,
            },
        ]);

        const rows = csv.split('\n').slice(1);
        expect(rows[0].startsWith('early,')).toBe(true);
        expect(rows[1].startsWith('late,')).toBe(true);
    });
});
