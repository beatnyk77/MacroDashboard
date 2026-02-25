import React from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    Coins,
    Globe,
    ShieldAlert,
    Fuel,
    Building2,
    EyeOff
} from 'lucide-react';

const labs = [
    { title: 'US Macro & Fiscal', path: '/labs/us-macro-fiscal', icon: <ShieldAlert className="text-blue-500" />, desc: 'Maturity walls & auction stress' },
    { title: 'India Lab', path: '/labs/india', icon: <Activity className="text-emerald-500" />, desc: 'Credit cycles & fiscal telemetry' },
    { title: 'China Lab', path: '/labs/china', icon: <Globe className="text-rose-500" />, desc: 'PBoC impulse & Yuan dynamics' },
    { title: 'De-Dollarization & Gold', path: '/labs/de-dollarization-gold', icon: <Coins className="text-gold-500" />, desc: 'Hard money & reserve shifts' },
    { title: 'Energy & Commodities', path: '/labs/energy-commodities', icon: <Fuel className="text-orange-500" />, desc: 'Refining & strategic supply' },
    { title: 'Sovereign Stress', path: '/labs/sovereign-stress', icon: <Building2 className="text-purple-500" />, desc: 'Credit matrix & refinance risk' },
    { title: 'Shadow System', path: '/labs/shadow-system', icon: <EyeOff className="text-zinc-500" />, desc: 'Illicit flows & wealth flight' },
];

export const MacroObservatory: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <Box sx={{ mb: 8, textAlign: 'center' }}>
                <Typography variant="h1" sx={{ fontWeight: 900, textTransform: 'uppercase', mb: 2, fontSize: { xs: '2.5rem', md: '4rem' } }}>
                    Macro <span className="text-blue-500">Observatory</span>
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '700px', mx: 'auto' }}>
                    Access our specialized research labs. Institutional-grade telemetry across global credit, currency, and commodity regimes.
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {labs.map((lab) => (
                    <Grid item xs={12} sm={6} md={4} key={lab.path}>
                        <Card sx={{ bgcolor: 'white/[0.02]', border: '1px solid white/10', borderRadius: '24px', transition: 'all 0.3s ease', '&:hover': { bgcolor: 'white/[0.05]', borderColor: 'white/20', transform: 'translateY(-4px)' } }}>
                            <CardActionArea onClick={() => navigate(lab.path)} sx={{ p: 1 }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box sx={{ mb: 2 }}>{lab.icon}</Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{lab.title}</Typography>
                                    <Typography variant="body2" color="text.secondary">{lab.desc}</Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default MacroObservatory;
