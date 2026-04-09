import React from 'react';
import { Box, Container, Typography, Paper, Chip, Button, Divider } from '@mui/material';
import { ArrowLeft, Database, BookOpen, FlaskConical, Activity, Lightbulb, Link2, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SEOManager } from '@/components/SEOManager';

// Illustrative energy dependency data
const edrData = [
    { country: 'India', edr: 88, oilCADImpact: 15 },
    { country: 'Japan', edr: 92, oilCADImpact: 22 },
    { country: 'Germany', edr: 65, oilCADImpact: 9 },
    { country: 'China', edr: 18, oilCADImpact: 4 },
    { country: 'USA', edr: -3, oilCADImpact: -1 },
    { country: 'Russia', edr: -180, oilCADImpact: -40 },
    { country: 'Saudi', edr: -210, oilCADImpact: -55 },
];

const oilSensData = [
    { oil: '$60', cadIndia: '-1.8%', inrImpact: '-0.5%', rbiRoom: 'High' },
    { oil: '$75', cadIndia: '-2.3%', inrImpact: '-1.2%', rbiRoom: 'High' },
    { oil: '$90', cadIndia: '-2.8%', inrImpact: '-2.1%', rbiRoom: 'Medium' },
    { oil: '$100', cadIndia: '-3.2%', inrImpact: '-3.0%', rbiRoom: 'Low' },
    { oil: '$120', cadIndia: '-4.1%', inrImpact: '-5.5%', rbiRoom: 'Constrained' },
    { oil: '$140', cadIndia: '-5.3%', inrImpact: '-8.2%', rbiRoom: 'Critical' },
];

function EdrTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
    if (active && payload && payload.length) {
        return (
            <Box sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{label}</Typography>
                {payload.map(p => (
                    <Typography key={p.name} variant="caption" display="block" sx={{ color: p.value < 0 ? '#22c55e' : '#f87171' }}>
                        EDR: {p.value}%
                    </Typography>
                ))}
            </Box>
        );
    }
    return null;
}

export const EnergyDependencyRatioPage: React.FC = () => {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "@id": "https://graphiquestor.com/methods/energy-dependency-ratio",
        "headline": "Energy Dependency Ratio — Methodology, Formula & Sovereign Vulnerability Analysis",
        "description": "Full methodology for the Energy Dependency Ratio (EDR): measuring a country's net energy import reliance as a percentage of domestic consumption, with oil price sensitivity analysis for India.",
        "url": "https://graphiquestor.com/methods/energy-dependency-ratio",
        "datePublished": "2026-04-10",
        "dateModified": "2026-04-10",
        "author": { "@type": "Organization", "name": "GraphiQuestor Research" },
        "publisher": { "@type": "Organization", "name": "GraphiQuestor" },
        "keywords": ["Energy Dependency Ratio", "India Energy Import", "Oil Price Impact", "Current Account Deficit", "Sovereign Macro Risk"]
    };

    return (
        <Box sx={{ py: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
            <SEOManager
                title="Energy Dependency Ratio — Methodology & Oil Price Sensitivity"
                description="How the Energy Dependency Ratio measures sovereign vulnerability to energy price shocks, with oil/CAD sensitivity analysis for India. Formula, data, and use cases."
                keywords={["Energy Dependency Ratio", "India Oil Imports", "CAD Oil Sensitivity", "Energy Security Macro"]}
                canonicalUrl="https://graphiquestor.com/methods/energy-dependency-ratio"
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
                    <Typography variant="caption" color="text.secondary">Energy Dependency Ratio</Typography>
                </Box>

                {/* Hero */}
                <Box mb={8}>
                    <Chip label="Methods Article · Macro Indicators · Sovereign Risk" variant="outlined"
                        sx={{ mb: 3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.7rem', borderColor: '#10b981', color: '#10b981' }} />
                    <Typography variant="h2" component="h1" fontWeight={900} gutterBottom>
                        Energy Dependency Ratio
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 1.7, fontWeight: 400 }}>
                        Quantifying how exposed a sovereign is to global energy price shocks — and translating that into direct current account and currency risk.
                    </Typography>
                </Box>

                {/* Definition */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookOpen size={20} style={{ color: '#10b981' }} />
                        Definition &amp; Intuition
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85, mb: 3 }}>
                        The Energy Dependency Ratio (EDR) measures what percentage of a country's primary energy consumption is satisfied by <strong style={{ color: '#6ee7b7' }}>net imports</strong> — i.e., it cannot produce domestically. A country with EDR = 88% (India) means nearly all energy must be imported, creating direct transmission from global oil markets to the domestic current account, currency, and inflation.
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
                        Negative values indicate net energy exporters (Russia, Saudi Arabia, USA after the shale revolution). The ratio is sourced from IEA World Energy Balances and uses the standardised "ktoe" (kiloton of oil equivalent) unit to normalise across coal, oil, gas, and renewables.
                    </Typography>
                    <Box sx={{ mt: 3, p: 3, bgcolor: 'rgba(16,185,129,0.05)', borderRadius: 2, border: '1px solid rgba(16,185,129,0.15)' }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#10b981' }} mb={1}>India Context (2024)</Typography>
                        <Typography variant="body2" color="text.secondary">India imports ~88% of its petroleum, ~50% of its natural gas, and a declining but still significant share of its coal. The total energy import bill was approximately <strong style={{ color: '#6ee7b7' }}>$221 billion in FY2024</strong>, representing the single largest driver of the current account deficit.</Typography>
                    </Box>
                </Paper>

                {/* Formula */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlaskConical size={20} style={{ color: '#10b981' }} />
                        Formula
                    </Typography>
                    <Box sx={{ p: 3, mb: 3, bgcolor: 'rgba(30,41,59,0.8)', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.9rem', color: '#6ee7b7', lineHeight: 2, border: '1px solid rgba(16,185,129,0.15)' }}>
                        <Box component="span" sx={{ color: '#64748b' }}># Energy Dependency Ratio (IEA standard definition){'\n'}</Box>
                        EDR (%) = (Gross Imports − Gross Exports) / Gross Inland Consumption × 100{'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Where all quantities are in ktoe (kilotons of oil equivalent){'\n'}</Box>
                        <Box component="span" sx={{ color: '#64748b' }}># Positive = net importer; Negative = net exporter{'\n'}</Box>
                    </Box>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={2}>
                        {[
                            { label: 'IEA World Energy Balances', desc: 'Primary source for standardised energy flow data by country and fuel type' },
                            { label: 'PPAC (India)', desc: 'Petroleum Planning & Analysis Cell — monthly petroleum import/consumption data' },
                            { label: 'Comtrade (UN)', desc: 'Cross-validation via HS codes 2701–2716 (fossil fuels) for bilateral trade flows' },
                        ].map(d => (
                            <Box key={d.label} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="caption" sx={{ color: '#6ee7b7', fontWeight: 700 }}>{d.label}</Typography>
                                <Typography variant="body2" color="text.secondary" mt={1}>{d.desc}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Cross-country bar chart */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Activity size={20} style={{ color: '#10b981' }} />
                        Cross-Country Energy Dependency (2024, Illustrative)
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block" mb={3}>
                        Negative = net energy exporter (self-sufficient). Positive = net importer (vulnerable to price shocks).
                    </Typography>
                    <ResponsiveContainer width="100%" height={260}>
                        <ComposedChart data={edrData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} domain={[-250, 100]} unit="%" />
                            <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: '#94a3b8' }} width={55} />
                            <Tooltip content={<EdrTooltip />} />
                            <Bar dataKey="edr" fill="#10b981" radius={[0, 3, 3, 0]}
                                label={{ position: 'right', fontSize: 10, fill: '#94a3b8', formatter: (v: number) => `${v}%` }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </Paper>

                {/* Oil Price Sensitivity Table */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Zap size={20} style={{ color: '#f59e0b' }} />
                        India Oil Price Sensitivity Matrix
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block" mb={3}>
                        Every $10/bbl rise in Brent crude adds ~$15B to India's annual energy import bill
                    </Typography>
                    <Box sx={{ overflowX: 'auto' }}>
                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                            <Box component="thead">
                                <Box component="tr" sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                                    {['Brent Crude', 'India CAD/GDP', 'INR Impact', 'RBI Policy Space'].map(h => (
                                        <Box key={h} component="th" sx={{ p: 2, textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</Box>
                                    ))}
                                </Box>
                            </Box>
                            <Box component="tbody">
                                {oilSensData.map(r => (
                                    <Box key={r.oil} component="tr" sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <Box component="td" sx={{ p: 2, fontFamily: 'monospace', fontSize: '0.85rem', color: '#fcd34d', fontWeight: 700 }}>{r.oil}/bbl</Box>
                                        <Box component="td" sx={{ p: 2, fontSize: '0.85rem', color: r.cadIndia.includes('5') || r.cadIndia.includes('4') ? '#ef4444' : '#94a3b8' }}>{r.cadIndia} of GDP</Box>
                                        <Box component="td" sx={{ p: 2, fontSize: '0.85rem', color: r.inrImpact.includes('8') || r.inrImpact.includes('5') ? '#ef4444' : '#94a3b8' }}>{r.inrImpact} depreciation</Box>
                                        <Box component="td" sx={{ p: 2 }}>
                                            <Chip label={r.rbiRoom} size="small" sx={{
                                                bgcolor: r.rbiRoom === 'Critical' ? 'rgba(239,68,68,0.1)' : r.rbiRoom === 'Constrained' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                                                color: r.rbiRoom === 'Critical' ? '#ef4444' : r.rbiRoom === 'Constrained' ? '#f59e0b' : '#22c55e',
                                                fontWeight: 600, fontSize: '0.7rem'
                                            }} />
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                {/* Use Cases */}
                <Paper elevation={0} sx={{ p: 5, mb: 6, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Lightbulb size={20} style={{ color: '#10b981' }} />
                        Institutional Use Cases
                    </Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                        {[
                            { role: 'EM Bond Investors', use: 'Monitor EDR as primary input to India sovereign credit risk model. EDR > 85% + oil > $100 triggers CAD/GDP warning threshold of 3.5% — watch INR-denominated bond duration.' },
                            { role: 'FX Traders', use: 'Use EDR × oil price change as a directional signal for INR/USD. EDR-adjusted oil sensitivity explains ~65% of structural INR depreciation over 5-year windows.' },
                            { role: 'Energy Commodities Desks', use: 'India\'s demand profile — driven by ~88% EDR import dependence — makes it one of the most price-inelastic large buyers. Monitor import data for demand destruction signals.' },
                            { role: 'Policy Analysts', use: 'EDR is the quantitative anchor for India\'s National Energy Security Strategy modeling — cross-referenced with renewable energy transition milestones to estimate EDR trajectory to 2030.' },
                        ].map(u => (
                            <Box key={u.role} sx={{ p: 3, bgcolor: 'rgba(16,185,129,0.04)', borderRadius: 2, border: '1px solid rgba(16,185,129,0.12)' }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#10b981' }} mb={1}>{u.role}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{u.use}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <Divider sx={{ mb: 5, opacity: 0.1 }} />
                <Box display="flex" gap={2} flexWrap="wrap" mb={8}>
                    <Button component={Link} to="/glossary/energy-dependency-ratio" variant="outlined" startIcon={<BookOpen size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Glossary Definition</Button>
                    <Button component={Link} to="/methodology" variant="outlined" startIcon={<Database size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Methodology Hub</Button>
                    <Button component={Link} to="/data-sources" variant="outlined" startIcon={<Link2 size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Data Sources</Button>
                    <Button component={Link} to="/" variant="contained" color="primary">View Live Dashboard →</Button>
                </Box>
            </Container>
        </Box>
    );
};
