import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FreshnessChip } from '@/components/FreshnessChip';

describe('FreshnessChip provenance tooltip', () => {
    it('renders pipeline provenance from source_ref', () => {
        render(
            <FreshnessChip
                status="fresh"
                lastUpdated="2026-06-01T12:00:00Z"
                sourceRef="live_api:ingest-fred"
            />
        );
        expect(screen.getByText('FRESH')).toBeInTheDocument();
    });

    it('renders PROVISIONAL label when isProvisional is true', () => {
        render(
            <FreshnessChip
                status="fresh"
                isProvisional
                sourceRef="fallback:china-macro-lpr-hardcoded"
            />
        );
        expect(screen.getByText('PROVISIONAL')).toBeInTheDocument();
    });
});