import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import { Gauge, Activity, Coins, Code } from 'lucide-react';
import { SEOManager } from '@/components/SEOManager';

interface ToolEntry {
    path: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    accent: string;
}

const TOOLS: ToolEntry[] = [
    {
        path: '/tools/net-liquidity-gauge',
        title: 'US Net Liquidity Gauge',
        description: 'Fed net liquidity z-score with regime classification — the single most-watched liquidity dial.',
        icon: <Gauge size={22} />,
        accent: '#3b82f6',
    },
    {
        path: '/tools/daily-regime-signal',
        title: 'Daily Macro Regime Signal',
        description: 'Risk On / Neutral / Risk Off composite (0–100) across liquidity, rates, dollar, vol, and metals. Refreshed daily.',
        icon: <Activity size={22} />,
        accent: '#10b981',
    },
    {
        path: '/tools/gold-ratios',
        title: 'Gold Ratios Monitor',
        description: 'M2/Gold, Debt/Gold, SPX/Gold, and Gold/Silver with z-scores — monetary debasement at a glance.',
        icon: <Coins size={22} />,
        accent: '#f59e0b',
    },
];

/**
 * /tools — index of free embeddable widgets. Every tool renders chromeless
 * inside an iframe via ?embed=true and carries a "Powered by GraphiQuestor"
 * backlink.
 */
export const ToolsIndexPage: React.FC = () => (
    <Box sx={{ minHeight: '100vh', bgcolor: '#050810', color: 'white', pt: 12, pb: 8 }}>
        <SEOManager
            title="Free Embeddable Macro Widgets & Tools"
            description="Free embeddable macro widgets for blogs and newsletters: net liquidity gauge, daily risk-on/risk-off regime signal, and gold ratio monitors. Live institutional data, one iframe tag."
            keywords={['embeddable macro widgets', 'net liquidity widget', 'macro regime indicator embed', 'gold ratio widget', 'free financial widgets']}
            canonical="https://graphiquestor.com/tools"
        />

        <Container maxWidth="md">
            <Box sx={{ textAlign: 'center', mb: 8 }}>
                <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 3, color: '#3b82f6' }}>
                    Embeddable Intelligence
                </Typography>
                <Typography variant="h3" component="h1" sx={{ fontWeight: 900, letterSpacing: '-0.02em', mb: 2 }}>
                    Macro Widgets & Tools
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', maxWidth: 560, mx: 'auto', lineHeight: 1.7 }}>
                    Live, institutional-grade macro gauges you can embed in any blog, newsletter, or
                    research note with a single iframe tag. Free, no key required — data refreshes
                    automatically from the GraphiQuestor pipeline.
                </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
                {TOOLS.map(tool => (
                    <Link key={tool.path} to={tool.path} style={{ textDecoration: 'none' }}>
                        <Paper elevation={0} sx={{
                            p: 4,
                            height: '100%',
                            bgcolor: 'rgba(15, 23, 42, 0.5)',
                            borderRadius: 4,
                            border: '1px solid rgba(255,255,255,0.05)',
                            transition: 'all 0.2s ease',
                            '&:hover': { borderColor: `${tool.accent}50`, transform: 'translateY(-2px)' },
                        }}>
                            <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: 3, bgcolor: `${tool.accent}15`, color: tool.accent, mb: 2.5 }}>
                                {tool.icon}
                            </Box>
                            <Typography sx={{ fontWeight: 900, color: 'white', mb: 1, fontSize: '1rem' }}>
                                {tool.title}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', lineHeight: 1.6, mb: 2.5 }}>
                                {tool.description}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: tool.accent }}>
                                <Code size={13} />
                                <Typography sx={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Open & Embed
                                </Typography>
                            </Box>
                        </Paper>
                    </Link>
                ))}
            </Box>

            <Box sx={{ mt: 8, textAlign: 'center' }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', lineHeight: 1.8, maxWidth: 620, mx: 'auto' }}>
                    Each widget page includes a copy-paste iframe snippet. Embedded views render
                    without site chrome and link back to GraphiQuestor — attribution stays intact.
                    Need a custom widget or higher-frequency data? {' '}
                    <Link to="/institutional" style={{ color: '#3b82f6', fontWeight: 700 }}>
                        Institutional inquiries
                    </Link>.
                </Typography>
            </Box>
        </Container>
    </Box>
);
