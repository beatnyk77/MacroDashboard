import React, { useEffect } from 'react';
import { Container, Typography, Box, Button, Grid } from '@mui/material';
import { Zap, ShieldCheck, Database, ArrowRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEOManager } from '@/components/SEOManager';

declare global {
    interface Window {
        Paddle: any;
    }
}

export const APIAccessPage: React.FC = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (window.Paddle) {
                window.Paddle.Environment.set('sandbox');
                window.Paddle.Setup({
                    token: 'test_8928682b1356f91d84b80b0800d'
                });
            }
        };
    }, []);

    const handleCheckout = () => {
        if (window.Paddle) {
            window.Paddle.Checkout.open({
                items: [
                    {
                        priceId: 'pri_01j_mock_quantum_28',
                        quantity: 1
                    }
                ]
            });
        }
    };

    const pricingSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "GraphiQuestor Quantum Intelligence API Access",
        "description": "Institutional-grade macro telemetry via REST API. Real-time access to liquidity signals and treasury demand.",
        "offers": {
            "@type": "Offer",
            "url": "https://graphiquestor.com/api-access",
            "priceCurrency": "USD",
            "price": "28.00",
            "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "referenceQuantity": {
                    "@type": "QuantitativeValue",
                    "value": "1",
                    "unitCode": "MON"
                }
            },
            "availability": "https://schema.org/InStock"
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-32">
            <script type="application/ld+json">
                {JSON.stringify(pricingSchema)}
            </script>
            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 15 } }}>
                <SEOManager 
                    title="Institutional API Access — GraphiQuestor"
                    description="Connect your quantitative models to our proprietary macro data streams. Real-time access to 270+ institutional macro metrics."
                    keywords={['Macro API', 'Institutional Data', 'Quant Finance API', 'Market Intelligence']}
                />
                <Box sx={{ mb: 10, textAlign: 'center', position: 'relative' }}>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-uppercase mb-8">
                        <Lock size={14} /> Secure API Terminal
                    </div>
                    <Typography variant="h1" component="h1" sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: { xs: '2.5rem', md: '5rem' }, letterSpacing: '-0.04em', lineHeight: 0.9, mb: 4 }}>
                        Quantum <span className="text-blue-500">Access</span>
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: '700px', mx: 'auto', fontWeight: 500, lineHeight: 1.5, fontSize: '1.2rem', textTransform: 'uppercase' }}>
                        Professional-grade macro telemetry delivered via high-frequency REST API.
                    </Typography>
                </Box>

                <Grid container spacing={8} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <div className="space-y-8">
                            {[
                                { icon: Database, title: "Raw Telemetry Feed", desc: "Access the same REST endpoints that power our institutional terminal." },
                                { icon: ShieldCheck, title: "Sovereign Risk Matrix", desc: "Real-time updates on Treasury maturity walls and fiscal stress indices." },
                                { icon: Zap, title: "High-Frequency Signals", desc: "Sub-second updates on global net liquidity and shadow reserve shifts." }
                            ].map((feature, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={feature.title}
                                    className="flex gap-4"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                        <feature.icon size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-heading mb-1">{feature.title}</h4>
                                        <p className="text-xs text-muted-foreground/60 leading-relaxed font-medium uppercase">{feature.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-10 rounded-[3rem] border-2 border-blue-500/30 bg-blue-500/[0.03] shadow-[0_0_50px_rgba(59,130,246,0.1)] relative overflow-hidden"
                        >
                            <div className="relative z-10">
                                <h4 className="text-xs font-black uppercase tracking-uppercase text-blue-400 mb-8">Quantum Intelligence API</h4>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-6xl font-black text-white">$28</span>
                                    <span className="text-blue-500 text-sm font-black uppercase">/Mo</span>
                                </div>
                                <p className="text-xs font-black text-blue-400/60 uppercase tracking-uppercase mb-10">Standard Professional License</p>

                                <ul className="space-y-4 mb-12">
                                    {[
                                        '10,000 requests per day',
                                        'Full historical data access',
                                        'Institutional Research Archive',
                                        'Priority support desk'
                                    ].map(f => (
                                        <li key={f} className="flex items-center gap-3 text-xs font-black text-white uppercase">
                                            <Zap size={14} className="text-blue-500" /> {f}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={handleCheckout}
                                    sx={{
                                        bgcolor: '#3b82f6',
                                        fontWeight: 900,
                                        py: 2.5,
                                        borderRadius: '1.5rem',
                                        fontSize: '1rem',
                                        boxShadow: '0 20px 40px -10px rgba(59,130,246,0.3)',
                                        '&:hover': { bgcolor: '#2563eb' }
                                    }}
                                >
                                    Get Quantum Access <ArrowRight size={18} className="ml-2" />
                                </Button>

                                <p className="mt-6 text-xs text-center text-muted-foreground/40 font-black uppercase tracking-uppercase">
                                    30-Day Money Back Guarantee • Secure Checkout by Paddle
                                </p>
                            </div>
                        </motion.div>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 16, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Need higher throughput? <Button sx={{ fontWeight: 900, color: 'white', textDecoration: 'underline' }}>Request Enterprise keys</Button>
                    </Typography>
                </Box>
            </Container>
        </div>
    );
};

export default APIAccessPage;
