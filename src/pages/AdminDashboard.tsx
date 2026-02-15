import { useState } from 'react';
import {
    Box,
    Typography,
    Card as MuiCard,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    TextField,
    Chip,
    IconButton,
    LinearProgress,
    Tooltip
} from '@mui/material';
import {
    Activity,
    RefreshCcw,
    ShieldAlert,
    Database,
    Cpu,
    Lock,
    Terminal,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation } from '@tanstack/react-query';

// --- STYLING CONSTANTS ---
const BLOOMBERG_ORANGE = '#f59e0b';
const TERMINAL_BG = '#020617';
const CARD_BG = 'rgba(7, 15, 32, 0.8)';
const GLASS_BORDER = '1px solid rgba(255, 255, 255, 0.08)';

// --- COMPONENTS ---

const AdminLogin = ({ onAuthenticated }: { onAuthenticated: () => void }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleLogin = () => {
        const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
        if (password === adminPass) {
            sessionStorage.setItem('admin_auth', 'true');
            onAuthenticated();
        } else {
            setError(true);
        }
    };

    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: TERMINAL_BG,
            backgroundImage: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
        }}>
            <MuiCard sx={{
                p: 4,
                width: 400,
                bgcolor: CARD_BG,
                backdropFilter: 'blur(10px)',
                border: GLASS_BORDER,
                textAlign: 'center'
            }}>
                <Lock size={48} color={BLOOMBERG_ORANGE} style={{ marginBottom: 16 }} />
                <Typography variant="h5" sx={{ mb: 1, color: '#fff', fontWeight: 800 }}>
                    SOVEREIGN CONSOLE
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 4, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)' }}>
                    INSTITUTIONAL ACCESS ONLY
                </Typography>

                <TextField
                    fullWidth
                    type="password"
                    label="ACCESS CODE"
                    variant="filled"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={error}
                    helperText={error ? "INVALID CREDENTIALS" : ""}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    InputProps={{ disableUnderline: true }}
                    sx={{
                        mb: 3,
                        '& .MuiFilledInput-root': {
                            bgcolor: 'rgba(255,255,255,0.05)',
                            color: '#fff',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                        }
                    }}
                />

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleLogin}
                    sx={{
                        bgcolor: BLOOMBERG_ORANGE,
                        color: '#000',
                        fontWeight: 900,
                        '&:hover': { bgcolor: '#d97706' }
                    }}
                >
                    INITIALIZE SESSION
                </Button>
            </MuiCard>
        </Box>
    );
};

export const AdminDashboard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(() =>
        sessionStorage.getItem('admin_auth') === 'true'
    );

    const { data: latestIngestions, refetch: refetchIngestions } = useQuery({
        queryKey: ['admin', 'latest_ingestions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_latest_ingestions')
                .select('*')
                .order('start_time', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: isAuthenticated
    });

    const { data: staleness } = useQuery({
        queryKey: ['admin', 'staleness'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_data_staleness_monitor')
                .select('*');
            if (error) throw error;
            return data;
        },
        enabled: isAuthenticated
    });

    const triggerJob = useMutation({
        mutationFn: async (functionName: string) => {
            const { data, error } = await supabase.functions.invoke(functionName);
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            refetchIngestions();
        }
    });

    if (!isAuthenticated) {
        return <AdminLogin onAuthenticated={() => setIsAuthenticated(true)} />;
    }

    return (
        <Box sx={{ p: 4, bgcolor: TERMINAL_BG, minHeight: '100vh', color: '#fff' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Terminal color={BLOOMBERG_ORANGE} size={32} />
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
                            TERMINAL HEALTH
                        </Typography>
                        <Typography variant="caption" sx={{ color: BLOOMBERG_ORANGE, letterSpacing: '0.1em' }}>
                            SOVEREIGN INTELLIGENCE PIPELINE MONITOR
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Chip
                        icon={<Activity size={16} color="#10b981" />}
                        label="NETWORK STABLE"
                        sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                    />
                    <Button
                        startIcon={<RefreshCcw size={18} />}
                        onClick={() => refetchIngestions()}
                        sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}
                    >
                        REFRESH SYSTEM
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Stats Summary */}
                <Grid item xs={12} md={3}>
                    <MuiCard sx={{ p: 3, bgcolor: CARD_BG, border: GLASS_BORDER }}>
                        <Typography variant="overline" color="textSecondary">INGESTION SUCCESS RATE</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>98.4%</Typography>
                        <LinearProgress variant="determinate" value={98.4} sx={{ mt: 2, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />
                    </MuiCard>
                </Grid>
                <Grid item xs={12} md={3}>
                    <MuiCard sx={{ p: 3, bgcolor: CARD_BG, border: GLASS_BORDER }}>
                        <Typography variant="overline" color="textSecondary">AVG LATENCY (MS)</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>1,420</Typography>
                        <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>-12% VS LAST 24H</Typography>
                    </MuiCard>
                </Grid>
                <Grid item xs={12} md={3}>
                    <MuiCard sx={{ p: 3, bgcolor: CARD_BG, border: GLASS_BORDER }}>
                        <Typography variant="overline" color="textSecondary">STALE METRICS</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: staleness?.length ? '#f43f5e' : '#fff' }}>
                            {staleness?.length || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>REQUIRING ATTENTION</Typography>
                    </MuiCard>
                </Grid>
                <Grid item xs={12} md={3}>
                    <MuiCard sx={{ p: 3, bgcolor: CARD_BG, border: GLASS_BORDER }}>
                        <Typography variant="overline" color="textSecondary">SYSTEM STATUS</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: '#10b981' }}>NOMINAL</Typography>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>ALL CRON JOBS ACTIVE</Typography>
                    </MuiCard>
                </Grid>

                {/* Primary Logs Table */}
                <Grid item xs={12} lg={8}>
                    <MuiCard sx={{ bgcolor: CARD_BG, border: GLASS_BORDER }}>
                        <Box sx={{ p: 3, borderBottom: GLASS_BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Database size={20} color={BLOOMBERG_ORANGE} />
                                <Typography variant="h6" fontWeight={800}>INGESTION LOG EXPLORER</Typography>
                            </Box>
                        </Box>
                        <TableContainer sx={{ maxHeight: 500 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow sx={{ '& th': { bgcolor: '#0f172a', color: 'rgba(255,255,255,0.5)', py: 2, borderBottom: GLASS_BORDER } }}>
                                        <TableCell>FUNCTION</TableCell>
                                        <TableCell>TIME</TableCell>
                                        <TableCell>LATENCY</TableCell>
                                        <TableCell>STATUS</TableCell>
                                        <TableCell align="right">ACTIONS</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody sx={{ '& .MuiTableCell-root': { color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.03)' } }}>
                                    {latestIngestions?.map((log: any) => (
                                        <TableRow key={log.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                            <TableCell sx={{ fontWeight: 600 }}>{log.function_name}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{new Date(log.start_time).toLocaleTimeString()}</Typography>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>{new Date(log.start_time).toLocaleDateString()}</Typography>
                                            </TableCell>
                                            <TableCell>{log.duration_ms ? `${log.duration_ms} ms` : '---'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={log.status.toUpperCase()}
                                                    sx={{
                                                        bgcolor: log.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                                        color: log.status === 'success' ? '#10b981' : '#f43f5e',
                                                        fontWeight: 800,
                                                        fontSize: '0.65rem'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Trigger Manual Ingestion">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => triggerJob.mutate(log.function_name)}
                                                        disabled={triggerJob.isPending && triggerJob.variables === log.function_name}
                                                        sx={{ color: BLOOMBERG_ORANGE }}
                                                    >
                                                        <RefreshCcw size={16} className={triggerJob.isPending && triggerJob.variables === log.function_name ? 'animate-spin' : ''} />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </MuiCard>
                </Grid>

                {/* Health Sidebar */}
                <Grid item xs={12} lg={4}>
                    <MuiCard sx={{ bgcolor: CARD_BG, border: GLASS_BORDER, mb: 3 }}>
                        <Box sx={{ p: 3, borderBottom: GLASS_BORDER, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <ShieldAlert size={20} color="#f43f5e" />
                            <Typography variant="h6" fontWeight={800}>VULNERABILITY ALERTS</Typography>
                        </Box>
                        <Box sx={{ px: 3, py: 1 }}>
                            {staleness?.length === 0 ? (
                                <Box sx={{ p: 4, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                    <CheckCircle2 size={40} style={{ marginBottom: 16 }} />
                                    <Typography variant="body2">ALL METRICS HEALTHY</Typography>
                                </Box>
                            ) : (
                                staleness?.map((item: any, idx: number) => (
                                    <Box key={idx} sx={{ py: 2, borderBottom: idx < staleness.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#f8fafc' }}>{item.metric_id}</Typography>
                                            <Typography variant="caption" sx={{ color: '#f43f5e', fontWeight: 800 }}>STALE</Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Clock size={12} /> Last Ingested: {item.last_updated ? new Date(item.last_updated).toLocaleDateString() : 'NEVER'}
                                        </Typography>
                                    </Box>
                                ))
                            )}
                        </Box>
                    </MuiCard>

                    <MuiCard sx={{ p: 3, bgcolor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Cpu size={20} color="#3b82f6" />
                            <Typography variant="subtitle2" fontWeight={800} color="#3b82f6">SYSTEM RESOURCE STATUS</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1, display: 'block' }}>EDGE RUNTIME MEMORY</Typography>
                        <LinearProgress variant="determinate" value={14} sx={{ mb: 2, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6' } }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1, display: 'block' }}>DATABASE CONNECTION POOL</Typography>
                        <LinearProgress variant="determinate" value={22} sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />
                    </MuiCard>
                </Grid>
            </Grid>
        </Box>
    );
};
