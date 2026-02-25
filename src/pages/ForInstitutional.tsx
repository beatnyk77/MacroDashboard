import React from 'react';
import { Container, Typography, Box, Button, Grid, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import {
    Mail,
    Globe,
    Database,
    ChevronDown,
    Lock,
    Crown
} from 'lucide-react';

const PremiumCard = ({ icon: Icon, title, description, features }: any) => (
    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 hover:border-blue-500/30 transition-all duration-500 group">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Icon size={24} className="text-blue-500" />
        </div>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 4, lineHeight: 1.6 }}>
            {description}
        </Typography>
        <ul className="space-y-3">
            {features.map((f: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-[0.8rem] text-white/70 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {f}
                </li>
            ))}
        </ul>
    </div>
);

export const ForInstitutional: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ py: 12 }}>
            <Box sx={{ textAlign: 'center', mb: 12 }}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[0.7rem] font-black uppercase tracking-[0.2em] mb-6">
                    <Crown size={14} /> Institutional Intelligence Tier
                </div>
                <Typography variant="h1" sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: { xs: '2.5rem', md: '4.5rem' }, letterSpacing: '-0.03em', lineHeight: 1, mb: 3 }}>
                    Institutional <span className="text-blue-500">Solutions</span>
                </Typography>
                <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: '800px', mx: 'auto', fontWeight: 500, lineHeight: 1.5 }}>
                    Providing the missing telemetry for funds, family offices, and central banks navigating the fragmentation of the global financial system.
                </Typography>
            </Box>

            <Grid container spacing={4} sx={{ mb: 16 }}>
                <Grid item xs={12} md={4}>
                    <PremiumCard
                        icon={Database}
                        title="Quantum API"
                        description="Direct high-frequency access to our proprietary data pipeline."
                        features={[
                            "25-year historical G20 data",
                            "Real-time PBoC credit impulse",
                            "Shadow trade misinvoicing indices",
                            "99.9% uptime SLA"
                        ]}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <PremiumCard
                        icon={Globe}
                        title="Bespoke Alpha"
                        description="Custom telemetry modules built for your specific trade mandates."
                        features={[
                            "Private Lab environments",
                            "Custom Sankey flow modeling",
                            "State-level India fiscal deep-dives",
                            "Geopolitical risk mapping"
                        ]}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <PremiumCard
                        icon={Lock}
                        title="Advisory"
                        description="Direct access to our senior macro research desk and analysts."
                        features={[
                            "Quarterly strategy sessions",
                            "Private research notes",
                            "Regime change alerts",
                            "Hard-money allocation strategy"
                        ]}
                    />
                </Grid>
            </Grid>

            {/* CTA Section */}
            <Box sx={{
                p: { xs: 6, md: 10 },
                borderRadius: '4rem',
                background: 'radial-gradient(circle at top right, rgba(59,130,246,0.1), transparent)',
                border: '1px solid white/5',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div className="relative z-10">
                    <Typography variant="h3" sx={{ fontWeight: 900, textTransform: 'uppercase', mb: 3 }}>
                        Ready to <span className="text-blue-500">Secure</span> Your Edge?
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)', mb: 6, maxWidth: '600px', mx: 'auto' }}>
                        Join a select group of institutional partners who utilize GraphiQuestor telemetry to navigate sovereign stress and reserve shifts.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<Mail />}
                        sx={{
                            borderRadius: '1.5rem',
                            px: 8,
                            py: 2.5,
                            bgcolor: '#3b82f6',
                            '&:hover': { bgcolor: '#2563eb', transform: 'translateY(-2px)' },
                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            fontSize: '1rem',
                            boxShadow: '0 20px 40px -10px rgba(59,130,246,0.3)'
                        }}
                    >
                        Contact Institutional Desk
                    </Button>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full" />
            </Box>

            {/* FAQ / Details */}
            <Box sx={{ mt: 16 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, textTransform: 'uppercase', mb: 6, textAlign: 'center' }}>
                    Institutional <span className="text-blue-500">FAQ</span>
                </Typography>
                <div className="max-w-3xl mx-auto space-y-4">
                    {[
                        { q: "Is individual data available via API?", a: "Yes, our Quantum API provides REST endpoints for all technical modules including the India Market Pulse and US Debt Maturity Wall." },
                        { q: "Do you offer white-labeling for family offices?", a: "We provide bespoke private dashboard instances for family offices with custom UI branding and integrated internal mandates." },
                        { q: "How often is the proprietary data refreshed?", a: "Telemetric data is refreshed in real-time or at the source resolution (daily/weekly for MoSPI/PBoC, real-time for market pulses)." }
                    ].map((item, i) => (
                        <Accordion key={i} sx={{ bgcolor: 'white/[0.02]', color: 'white', border: '1px solid white/5', borderRadius: '1rem !important', '&:before': { display: 'none' } }}>
                            <AccordionSummary expandIcon={<ChevronDown className="text-blue-500" />}>
                                <Typography sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>{item.q}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{item.a}</Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </div>
            </Box>
        </Container>
    );
};

export default ForInstitutional;
