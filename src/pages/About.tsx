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
                        About GraphiQuestor
                    </Typography>
                    <Typography variant="h2" sx={{ fontSize: '1.25rem', color: 'text.secondary', fontWeight: 400, maxWidth: '600px', mx: 'auto' }}>
                        Providing institutional-grade surveillance for capital allocators navigating a fracturing fiat regime.
                    </Typography>
                </Box>

                <Divider sx={{ mb: 8, opacity: 0.1 }} />

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} alignItems="flex-start">
                    <Box sx={{ flexShrink: 0, textAlign: 'center', width: { xs: '100%', md: 'auto' } }}>
                        <Avatar
                            src="/avatar.png" // Placeholder, falls back to initials if missing
                            alt="Kartikay Sharma"
                            sx={{ width: 150, height: 150, mx: 'auto', mb: 3, border: '4px solid rgba(255,255,255,0.05)' }}
                        >
                            KS
                        </Avatar>
                        <Typography variant="h3" sx={{ fontWeight: 800, fontSize: '1.5rem', mb: 0.5 }}>
                            Kartikay Sharma
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600, mb: 2 }}>
                            Chartered Accountant (CA)
                        </Typography>
                        <Stack direction="row" spacing={2} justifyContent="center">
                            <Button
                                component="a"
                                href="https://www.linkedin.com/in/kartikay-sharma-b9190214/"
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="outlined"
                                size="small"
                                startIcon={<Linkedin size={16} />}
                                sx={{ borderColor: 'rgba(255,255,255,0.1)' }}
                            >
                                Connect
                            </Button>
                        </Stack>
                    </Box>

                    <Box sx={{ flexGrow: 1 }} className="prose prose-invert max-w-none">
                        <Typography variant="body1" sx={{ mb: 3, leading: 1.8, color: 'text.secondary', fontSize: '1.1rem' }}>
                            GraphiQuestor was born out of a simple, practical necessity: the need to clearly see the structural realities underlying our global economy, unfiltered by daily financial noise.
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3, leading: 1.8, color: 'text.secondary' }}>
                            As a Chartered Accountant analyzing institutional capital flows, I realized that understanding today's markets requires looking beyond traditional metrics. We are witnessing a fundamental shift—a fracturing of the post-1971 fiat regime, characterized by unprecedented fiscal dominance, central bank divergence, and the re-emerging importance of hard assets.
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3, leading: 1.8, color: 'text.secondary' }}>
                            I built this intelligence console to track exactly these dynamics. By aggregating high-frequency telemetry from authoritative sources like MoSPI, FRED, and the BIS, the goal is to provide a grounded, evidence-based perspective on global liquidity, sovereign risk, and the physical economy.
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 4, leading: 1.8, color: 'text.secondary' }}>
                            My approach is rooted in humility before the data. The markets are complex, and no single indicator tells the whole story. But by structuring the right data—be it India's real-time macro pulse or global central bank balance sheets—we can make more informed, resilient capital allocation decisions.
                        </Typography>

                        <Box sx={{ p: 3, bgcolor: 'rgba(59, 130, 246, 0.05)', borderLeft: '4px solid #3b82f6', borderRadius: '0 8px 8px 0' }}>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
                                "Our mission is not to predict the exact path of the storm, but to build a radar sophisticated enough to navigate it safely."
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
