import React from 'react';
import { Box, Container, Typography, Avatar, Stack, Divider, Button } from '@mui/material';
import { SEOManager } from '@/components/SEOManager';
import { Linkedin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export const About: React.FC = () => {
    return (
        <Box sx={{ py: { xs: 6, md: 10 } }}>
            <SEOManager
                title="About the Analytics Team"
                description="Learn about the institutional background behind GraphiQuestor. Founded by Kartikay Sharma, CA, dedicated to tracking structural macro reality."
                canonicalUrl="https://graphiquestor.com/about"
            />
            {/* Person Schema for E-E-A-T */}
            <script type="application/ld+json">
                {JSON.stringify({
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
                })}
            </script>

            <Container maxWidth="md">
                <Box sx={{ mb: 6, textAlign: 'center' }}>
                    <Typography variant="h1" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: '2.5rem', md: '3.5rem' }, tracking: '-0.02em' }}>
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
                            src="/avatar.png"
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
