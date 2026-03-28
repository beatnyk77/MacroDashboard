import React from 'react';
import { Container, Typography, Box, Breadcrumbs, Link } from '@mui/material';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { SEOManager } from '@/components/SEOManager';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { CorporateTreasuryHedgingSection } from '@/features/dashboard/components/sections/CorporateTreasuryHedgingSection';

export const CorporateTreasuryHedging: React.FC = () => {
    return (
        <Container maxWidth={false} sx={{ py: 6 }}>
            <SEOManager
                title="Corporate Treasury Hedging Monitor | GraphiQuestor"
                description="Live institutional telemetry for macro-driven exposure & mitigation intelligence."
                isApp={true}
            />

            <Box sx={{ mb: 4 }}>
                <Breadcrumbs
                    separator={<ChevronRight size={14} className="text-muted-foreground/50" />}
                    aria-label="breadcrumb"
                >
                    <Link underline="hover" color="inherit" href="/" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', tracking: '0.1em' }}>
                        Home
                    </Link>
                    <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', tracking: '0.1em' }}>
                        Treasury Hedging
                    </Typography>
                </Breadcrumbs>
            </Box>

            <Box sx={{ mb: 8 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[0.65rem] font-black uppercase tracking-widest mb-4">
                    <ShieldCheck size={12} /> Institutional Intelligence
                </div>
                <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', mb: 2 }}>
                    Treasury Hedging <span className="text-emerald-500">Monitor</span>
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: '800px', fontSize: '1.1rem', fontWeight: 500 }}>
                    Real-time macro-driven exposure tracking for corporate treasury operations, linking structural rate regimes to explicit risk mitigation frameworks.
                </Typography>
            </Box>

            <div className="space-y-12 w-full">
                <SectionErrorBoundary name="Corporate Treasury Hedging">
                    <CorporateTreasuryHedgingSection />
                </SectionErrorBoundary>
            </div>
        </Container>
    );
};

export default CorporateTreasuryHedging;
