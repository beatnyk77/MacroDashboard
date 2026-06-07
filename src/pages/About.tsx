import React from 'react';
import { Box, Container, Typography, Avatar, Stack, Divider, Button } from '@mui/material';
import { SEOManager } from '@/components/SEOManager';
import { Linkedin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GQSignalBadge } from '@/components/GQSignalBadge';

export const About: React.FC = () => {
    return (
        <Box sx={{ py: { xs: 6, md: 10 } }}>
            <SEOManager
                title="About the Analytics Team"
                description="Learn about the institutional background behind GraphiQuestor. Founded by Kartikay Sharma, CA, dedicated to tracking structural macro reality."
                canonicalUrl="https://graphiquestor.com/about"
                jsonLd={[
                    {
                        "@context": "https://schema.org",
                        "@type": "Person",
                        "name": "Kartikay Sharma",
                        "jobTitle": "Chartered Accountant & Macro Analyst",
                        "url": "https://graphiquestor.com/about",
                        "sameAs": [
                            "https://www.linkedin.com/in/kartikay-sharma-b9190214/"
                        ],
                        "description": "Chartered Accountant focusing on institutional macro surveillance, systemic liquidity, and sovereign risk.",
                        "worksFor": {
                            "@type": "Organization",
                            "name": "GraphiQuestor"
                        }
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "GraphiQuestor",
                        "url": "https://graphiquestor.com",
                        "logo": "https://graphiquestor.com/logo.png"
                    }
                ]}
            />

            <Container maxWidth="md">
                <Box sx={{ mb: 6, textAlign: 'center' }}>
                    <Typography variant="h1" component="h1" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: '2.5rem', md: '3.5rem' }, tracking: '-0.02em' }}>
                        The Surveillance Mandate
                    </Typography>
                    <Typography variant="h2" sx={{ fontSize: '1.25rem', color: 'text.secondary', fontWeight: 400, maxWidth: '600px', mx: 'auto' }}>
                        GraphiQuestor is a structural macroeconomic surveillance terminal designed for the multipolar transition.
                    </Typography>
                </Box>

                <Divider sx={{ mb: 8, opacity: 0.1 }} />

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} alignItems="flex-start">
                    <Box sx={{ flexShrink: 0, textAlign: 'center', width: { xs: '100%', md: 'auto' } }}>
                        <Avatar
                            src="/avatar.jpg"
                            alt="Kartikay Sharma"
                            imgProps={{ loading: 'lazy' }}
                            sx={{ width: 140, height: 140, mx: 'auto', mb: 3, border: '4px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                        >
                            KS
                        </Avatar>
                        <Box sx={{ px: 2 }}>
                            <Typography variant="h3" sx={{ fontWeight: 800, fontSize: '1.4rem', mb: 0.5 }}>
                                Kartikay Sharma
                            </Typography>
                            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Principal Analyst, CA
                            </Typography>
                            <Button
                                component="a"
                                href="https://www.linkedin.com/in/kartikay-sharma-b9190214/"
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="outlined"
                                size="small"
                                startIcon={<Linkedin size={14} />}
                                sx={{ 
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    color: 'text.secondary',
                                    '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(59, 130, 246, 0.05)' }
                                }}
                            >
                                Institutional Profile
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ flexGrow: 1 }} className="prose prose-invert max-w-none">
                        <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8, color: 'text.secondary', fontSize: '1.05rem' }}>
                            GraphiQuestor operates as a structural intelligence authority, bypassing financial narratives to focus on the unvarnished telemetry of the global monetary regime. We provide institutional-grade capital allocators with the tools required to navigate the fracturing of the post-1971 fiat architecture.
                        </Typography>
                        
                        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '1.2rem', mt: 4, mb: 2 }}>
                            Methodology & Data Integrity
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8, color: 'text.secondary' }}>
                            Our surveillance framework is rooted in 25-year structural Z-scores and debt-to-hard-asset thresholds. We reject consensus indicators in favor of raw data provenance—ingesting directly from the <strong>Ministry of Statistics (MoSPI)</strong>, <strong>FRED</strong>, <strong>BIS</strong>, and <strong>Central Bank</strong> repositories.
                        </Typography>

                        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '1.2rem', mt: 4, mb: 2 }}>
                            The Multipolar Thesis
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8, color: 'text.secondary' }}>
                            We synthesize the converging forces of fiscal dominance, geopolitical fragmentation (BRICS+ architecture), and the reassertion of the physical economy. By tracking state-level granularity in India and provincial shifts in China, GraphiQuestor reveals leading indicators of regime shifts before they manifest in national aggregates.
                        </Typography>

                        <Box sx={{ p: 3, mt: 5, bgcolor: 'rgba(59, 130, 246, 0.03)', borderLeft: '3px solid #3b82f6', borderRadius: '4px' }}>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary', opacity: 0.9 }}>
                                "The objective of GraphiQuestor is not prediction, but the precise measurement of structural reality. Capital follows the plumbing, not the press conferences."
                            </Typography>
                        </Box>
                    </Box>
                </Stack>

                {/* ── Proprietary Intelligence Table ────────────────────────── */}
                <Box sx={{ mt: 10 }}>
                    <Typography
                        variant="h2"
                        component="h2"
                        sx={{ fontWeight: 900, fontSize: { xs: '1.6rem', md: '2rem' }, mb: 1 }}
                    >
                        Industry-First Signals
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, maxWidth: 680 }}>
                        GraphiQuestor surfaces macro variables that institutional terminals don&apos;t natively track.
                        Each signal below is computed from primary official sources — no vendor resale, no stale aggregates.
                    </Typography>

                    {/* Table */}
                    <Box
                        component="div"
                        sx={{
                            overflowX: 'auto',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.02)',
                        }}
                    >
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Signal', 'What It Measures', 'Commercial Equivalent'].map(h => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: '10px 16px',
                                                textAlign: 'left',
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.10em',
                                                fontSize: '0.68rem',
                                                color: 'rgba(255,255,255,0.35)',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    {
                                        signal: 'Fed Debt Monetization Tracker',
                                        measures: 'Fed balance sheet as % of total US debt — the yield control early warning system',
                                        commercial: 'Bloomberg: manual WALCL/GFDEBTN calculation',
                                        href: '/#liquidity-hero',
                                    },
                                    {
                                        signal: 'India Credit Cycle Clock',
                                        measures: 'CD ratio vs credit growth quadrant — RBI intervention signal',
                                        commercial: 'CEIC India ($800/month)',
                                        href: '/#india-pulse',
                                    },
                                    {
                                        signal: 'De-Dollarization Composite',
                                        measures: 'Central bank gold buying + BRICS settlement + petrodollar stress in one score',
                                        commercial: 'Haver Analytics ($200/month)',
                                        href: '/#policy-geopolitics',
                                    },
                                    {
                                        signal: 'G20 Sovereign Stress Matrix',
                                        measures: 'Debt/GDP vs real growth scatter for all G20 simultaneously',
                                        commercial: 'S&P Sovereign Risk ($400/month)',
                                        href: '/#sovereign-debt-stress',
                                    },
                                    {
                                        signal: 'Net Liquidity Z-Score',
                                        measures: 'G5 CB assets + M2 + TGA normalized — structural regime signal',
                                        commercial: 'Bloomberg custom feed',
                                        href: '/#liquidity-hero',
                                    },
                                ].map((row, i) => (
                                    <tr
                                        key={row.signal}
                                        style={{
                                            borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <a
                                                    href={row.href}
                                                    style={{ color: '#e2e8f0', fontWeight: 700, textDecoration: 'none' }}
                                                    onMouseEnter={e => ((e.target as HTMLElement).style.color = '#60a5fa')}
                                                    onMouseLeave={e => ((e.target as HTMLElement).style.color = '#e2e8f0')}
                                                >
                                                    {row.signal}
                                                </a>
                                                <GQSignalBadge />
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.55)', verticalAlign: 'top', lineHeight: 1.6 }}>
                                            {row.measures}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.30)', verticalAlign: 'top', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                            {row.commercial}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>

                    {/* Cost callout */}
                    <Box
                        sx={{
                            mt: 3,
                            px: 4,
                            py: 2.5,
                            borderRadius: '10px',
                            background: 'rgba(245, 158, 11, 0.05)',
                            border: '1px solid rgba(245, 158, 11, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            flexWrap: 'wrap',
                        }}
                    >
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, color: 'rgba(245,158,11,0.7)' }}>
                            ◆ Estimated commercial data cost to replicate GraphiQuestor&apos;s proprietary signal layer:
                        </span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#f59e0b', fontFamily: 'monospace' }}>
                            $4,400/month
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.30)', fontWeight: 600 }}>
                            — available here, free.
                        </span>
                    </Box>
                </Box>

                {/* ── CTA ──────────────────────────────────────────────────────── */}
                <Box sx={{ mt: 10, textAlign: 'center' }}>
                    <Button
                        component={Link}
                        to="/"
                        variant="contained"
                        size="large"
                        startIcon={<Search size={18} />}
                        sx={{ px: 4, py: 1.5, fontWeight: 700 }}
                    >
                        Explore the Terminal
                    </Button>
                </Box>
            </Container>
        </Box>
    );
};
