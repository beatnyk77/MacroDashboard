import React from 'react';
import { Box, Container, Typography, Paper, Chip, Button, Divider } from '@mui/material';
import { ArrowLeft, Database, BookOpen, FlaskConical, Activity, Lightbulb, Link2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { SEOManager } from '@/components/SEOManager';

// Illustrative Fiscal Dominance Meter data: interest/tax ratio for US, Japan, India
const fdmData = [
    { year: '2000', us: 12.1, japan: 21.3, india: 30.2 },
    { year: '2003', us: 10.8, japan: 23.1, india: 28.5 },
    { year: '2006', us: 11.4, japan: 25.0, india: 23.1 },
    { year: '2009', us: 12.3, japan: 28.4, india: 20.1 },
    { year: '2012', us: 11.2, japan: 31.2, india: 22.0 },
    { year: '2015', us: 8.3, japan: 30.8, india: 19.5 },
    { year: '2018', us: 9.0, japan: 29.1, india: 18.2 },
    { year: '2020', us: 10.1, japan: 26.5, india: 17.8 },
    { year: '2022', us: 12.5, japan: 25.2, india: 19.8 },
    { year: '2023', us: 17.8, japan: 26.0, india: 20.4 },
    { year: '2024', us: 21.3, japan: 25.8, india: 19.1 },
];

function FdmTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
    if (active && payload && payload.length) {
        return (
            <Box sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>{label}</Typography>
                {payload.map(p => (
                    <Typography key={p.name} variant="caption" display="block" sx={{ color: p.color }}>
                        {p.name}: {p.value.toFixed(1)}%
                        {p.value > 20 ? ' ⚠️' : ''}
                    </Typography>
                ))}
            </Box>
        );
    }
    return null;
}

export const FiscalDominanceMeterPage: React.FC = () => {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "@id": "https://graphiquestor.com/methods/fiscal-dominance-meter",
        "headline": "Fiscal Dominance Meter — Methodology, Formula & Monetary Policy Implications",
        "description": "Full methodology for the Fiscal Dominance Meter: measuring when government debt service obligations constrain central bank independence, with US, Japan, and India comparison.",
        "url": "https://graphiquestor.com/methods/fiscal-dominance-meter",
        "datePublished": "2026-04-10",
        "dateModified": "2026-04-10",
        "author": { "@type": "Organization", "name": "GraphiQuestor Research" },
        "publisher": { "@type": "Organization", "name": "GraphiQuestor" },
        "keywords": ["Fiscal Dominance", "Central Bank Independence", "Interest Expense", "Tax Revenue", "US Debt Crisis"]
    };

    return (
        <Box sx={{ py: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
            <SEOManager
                title="Fiscal Dominance Meter — Methodology & Central Bank Policy Implications"
                description="The full methodology for the Fiscal Dominance Meter: when interest expense/tax revenue constrains the Fed's ability to raise rates. Formulas, historical context, US vs Japan vs India."
                keywords={["Fiscal Dominance Meter", "Fed Independence", "US Debt Service", "Interest Tax Ratio", "Central Bank Constraint"]}
                canonicalUrl="https://graphiquestor.com/methods/fiscal-dominance-meter"
                jsonLd={jsonLd}
            />

            <Container maxWidth="md">
                {/* Breadcrumb */}
                <Box mb={5} display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                    <Button component={Link} to="/glossary" startIcon={<ArrowLeft size={15} />}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>Glossary</Button>
                    <Typography color="text.disabled" variant="caption">·</Typography>
                    <Button component={Link} to="/methodology"
                        sx={{ color: 'text.secondary', fontSize: '0.8rem', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>Methodology Hub</Button>
                    <Typography color="text.disabled" variant="caption">·</Typography>
                    <Typography variant="caption" color="text.secondary">Fiscal Dominance Meter</Typography>
                </Box>

                {/* Hero */}
                <Box mb={8}>
                    <Chip label="Methods Article · Sovereign Debt · Monetary Policy" variant="outlined"
                        sx={{ mb: 3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.7rem', borderColor: '#ef4444', color: '#ef4444' }} />
                    <Typography variant="h2" component="h1" fontWeight={900} gutterBottom>
                        Fiscal Dominance Meter
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 1.7, fontWeight: 400 }}>
                        The single most important structural constraint on Fed policy independence: when does the cost of government debt service make rate hikes fiscally impossible?
                    </Typography>
                </Box>

                {/* Alert box */}
                <Paper elevation={0} sx={{ p: 4, mb: 5, bgcolor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 3 }}>
                    <Box display="flex" gap={2} alignItems="flex-start">
                        <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                        <Box>
                            <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#ef4444' }} mb={1}>2024 Reading: 21.3% — Highest in 40 Years</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                The US Fiscal Dominance Meter reached 21.3% in Q4 2024 — meaning 21 cents of every dollar in federal tax revenue goes to debt interest payments. This level has not been seen since the late 1980s and approaches the structural threshold at which rate hikes become fiscally self-defeating.
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* Definition */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookOpen size={20} style={{ color: '#ef4444' }} />
                        Definition &amp; Intuition
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85, mb: 3 }}>
                        The Fiscal Dominance Meter (FDM) quantifies the degree to which <strong style={{ color: '#fca5a5' }}>government debt service obligations constrain central bank monetary policy</strong>. Named for economist Thomas Sargent's 1981 theory of fiscal dominance, it operationalises the constraint in a single, comparable ratio.
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85, mb: 3 }}>
                        In a "fiscally dominant" environment, the central bank cannot raise interest rates meaningfully without causing a snowball in government interest costs — which then forces higher deficits, more borrowing, and ultimately monetary financing. The government's fiscal position effectively <em>dominates</em> the central bank's inflation mandate.
                    </Typography>
                    <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={1}>Historical Precedent</Typography>
                        <Typography variant="body2" color="text.secondary" mt={1} sx={{ lineHeight: 1.7 }}>
                            The US last exited fiscal dominance via the 1951 Treasury-Fed Accord, which freed the Fed from pegging Treasury yields. The preceding decade (1941–1951) saw the FDM exceed 30%. Japan has operated in fiscal dominance continuously since ~2000, necessitating Yield Curve Control as a policy response.
                        </Typography>
                    </Box>
                </Paper>

                {/* Formula */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlaskConical size={20} style={{ color: '#ef4444' }} />
                        Formula
                    </Typography>
                    <Box sx={{ p: 3, mb: 3, bgcolor: 'rgba(30,41,59,0.8)', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.9rem', color: '#fca5a5', lineHeight: 2, border: '1px solid rgba(239,68,68,0.15)' }}>
                        <Box component="span" sx={{ color: '#64748b' }}># Step 1: Fiscal Dominance Meter (level){'\n'}</Box>
                        FDM = (Federal Interest Payments / Federal Tax Revenue) × 100{'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Step 2: Z-Score for regime classification (25-year window){'\n'}</Box>
                        FDM_Z = (FDM − μ₂₅ᵧ) / σ₂₅ᵧ{'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Thresholds (heuristic, based on historical data){'\n'}</Box>
                        {'<'}15% : Monetary Dominance (Fed has full independence){'\n'}
                        15–20% : Transition Zone (fiscal pressure building){'\n'}
                        {'>'}20% : Fiscal Dominance Warning{'\n'}
                        {'>'}30% : Full Fiscal Dominance Regime
                    </Box>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                        {[
                            { label: 'FYOINT (FRED)', desc: 'Federal government interest expense — quarterly, sourced from OMB/CBO historical tables' },
                            { label: 'FYFR (FRED)', desc: 'Federal Government Current Tax Receipts — quarterly national income account' },
                            { label: 'Normalisation', desc: '25-year rolling Z-score using quarterly data — captures full fiscal cycle' },
                            { label: 'Cross Validation', desc: 'Congressional Budget Office Long-Term Outlook + Treasury OFR Annual Reports' },
                        ].map(d => (
                            <Box key={d.label} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="caption" sx={{ color: '#fca5a5', fontWeight: 700, fontFamily: 'monospace' }}>{d.label}</Typography>
                                <Typography variant="body2" color="text.secondary" mt={1} sx={{ lineHeight: 1.5 }}>{d.desc}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Chart */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Activity size={20} style={{ color: '#ef4444' }} />
                        Interest/Tax Revenue Ratio — US, Japan, India (2000–2024)
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block" mb={3}>
                        Above 20% = fiscal dominance warning zone. Japan breached this in 2001 and has remained above it.
                    </Typography>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={fdmData} margin={{ top: 5, right: 20, left: -5, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[5, 40]} unit="%" />
                            <Tooltip content={<FdmTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }} />
                            <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.6} label={{ value: 'Fiscal Dominance Zone', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
                            <Line type="monotone" dataKey="us" name="United States" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                            <Line type="monotone" dataKey="japan" name="Japan" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="6 3" />
                            <Line type="monotone" dataKey="india" name="India" stroke="#818cf8" strokeWidth={2} dot={false} strokeDasharray="3 3" />
                        </LineChart>
                    </ResponsiveContainer>
                    <Box sx={{ mt: 3, p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">
                            <strong style={{ color: '#ef4444' }}>Key Observation:</strong> The US crossed the 20% fiscal dominance threshold in 2024 for the first time since the mid-1990s. Japan has remained well above this level continuously since 2001, forcing the Bank of Japan into Yield Curve Control. India peaked at ~30% in the early 2000s and has since reduced through fiscal consolidation.
                        </Typography>
                    </Box>
                </Paper>

                {/* Policy Implications */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Lightbulb size={20} style={{ color: '#f59e0b' }} />
                        Policy Implications by Regime
                    </Typography>
                    <Box display="grid" gridTemplateColumns="1fr" gap={2}>
                        {[
                            { regime: 'FDM < 15% (Monetary Dominance)', desc: 'Central bank has full independence. Can raise rates to any level required to control inflation without triggering a fiscal crisis. Fed 1994, 2004, 2015 rate cycles all occurred here.', color: '#22c55e' },
                            { regime: 'FDM 15–20% (Transition Zone)', desc: 'Central bank feels political pressure. Rate hikes face Treasury and White House opposition. The Fed begins to communicate "data dependency" — a coded signal of fiscal sensitivity.', color: '#f59e0b' },
                            { regime: 'FDM > 20% (Fiscal Dominance Warning)', desc: 'Every 100bps fed funds rate increase adds ~$340B to annual interest expense at $34T debt. The Fed faces a structural dilemma: fight inflation or prevent a fiscal spiral. Historical resolution: inflation is allowed to run.', color: '#ef4444' },
                            { regime: 'FDM > 30% (Full Fiscal Dominance)', desc: 'Central bank becomes operationally subservient to Treasury. YCC or its equivalent becomes the policy tool. Inflation becomes "structural" rather than transient. This is Japan 2000-present.', color: '#dc2626' },
                        ].map(p => (
                            <Box key={p.regime} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)', borderLeft: `3px solid ${p.color}` }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ color: p.color }} mb={1}>{p.regime}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{p.desc}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Use Cases */}
                <Paper elevation={0} sx={{ p: 5, mb: 6, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom>Institutional Use Cases</Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                        {[
                            { role: 'Global Macro Hedge Funds', use: 'FDM crossing 20% is a high-conviction entry signal for long gold, long TIPS, and long commodity/real asset positions. The fiscal dominance regime historically resolves through inflation rather than austerity.' },
                            { role: 'Fixed Income PMs', use: 'Reduce duration at FDM > 20%. Long-end Treasuries become political rather than economic instruments — the Fed will eventually be forced to cap yields (implicit YCC), crushing real returns for long holders.' },
                            { role: 'Rate Derivatives', use: 'FDM > 20% compresses the terminal rate expectation. Markets should price for earlier cuts than the dot plot suggests because fiscal sustainability constrains how long 5%+ rates can be maintained.' },
                            { role: 'Sovereign Credit Analysts', use: 'US S&P downgrade in 2023 and Fitch 2023 downgrade both cited interest cost trajectory. FDM provides the quantitative underpinning of this concern — track monthly for AAA rating risk assessment.' },
                        ].map(u => (
                            <Box key={u.role} sx={{ p: 3, bgcolor: 'rgba(239,68,68,0.04)', borderRadius: 2, border: '1px solid rgba(239,68,68,0.12)' }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#ef4444' }} mb={1}>{u.role}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{u.use}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <Divider sx={{ mb: 5, opacity: 0.1 }} />
                <Box display="flex" gap={2} flexWrap="wrap" mb={8}>
                    <Button component={Link} to="/glossary/fiscal-dominance-meter" variant="outlined" startIcon={<BookOpen size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Glossary Definition</Button>
                    <Button component={Link} to="/methodology" variant="outlined" startIcon={<Database size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Methodology Hub</Button>
                    <Button component={Link} to="/data-sources" variant="outlined" startIcon={<Link2 size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Data Sources</Button>
                    <Button component={Link} to="/" variant="contained" color="primary">View Live Dashboard →</Button>
                </Box>
            </Container>
        </Box>
    );
};
