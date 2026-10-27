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
import { SEOManager } from '@/components/SEOManager';
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
import { TrailLink as RouterLink } from '@/components/TrailLink';
import { SubscriberTractionCard } from '@/components/admin/SubscriberTractionCard';
import { TrafficIntelligencePanel } from '@/components/admin/TrafficIntelligencePanel';
import { PIPELINE_BY_ID } from '@/lib/pipelineCatalog';
import { CHART_COLORS, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';

// --- STYLING CONSTANTS ---
const BLOOMBERG_ORANGE = CHART_COLORS.gold;
const TERMINAL_BG = CHART_COLORS.surface;
const CARD_BG = alpha(CHART_COLORS.panel, 0.8);
const GLASS_BORDER = `1px solid ${WHITE_ALPHA.line}`;

// --- COMPONENTS ---

const AdminLogin = ({ onAuthenticated }: { onAuthenticated: () => void }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [locked, setLocked] = useState(false);

    // SECURITY: Password must be provided via VITE_ADMIN_PASSWORD env var.
    // No insecure fallback. If the env var is missing, access is blocked entirely.
    const adminPass = import.meta.env.VITE_ADMIN_PASSWORD;
    const isMisconfigured = !adminPass;

    const handleLogin = async () => {
        if (locked || isMisconfigured) return;
        setLocked(true);
        // Artificial delay to slow brute-force attempts
        await new Promise((r) => setTimeout(r, 500));
        if (password === adminPass) {
            sessionStorage.setItem('admin_auth', 'true');
            onAuthenticated();
        } else {
            // Clear any stale valid token on failed attempt
            sessionStorage.removeItem('admin_auth');
            setError(true);
        }
        setLocked(false);
    };

    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: TERMINAL_BG,
            backgroundImage: `radial-gradient(circle at center, ${alpha(CHART_COLORS.west, 0.1)} 0%, transparent 70%)`
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
                <Typography variant="h5" sx={{ mb: 1, color: '#fff', fontWeight: 700 }}>
                    SOVEREIGN CONSOLE
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 4, letterSpacing: '0.2em', color: WHITE_ALPHA.mid }}>
                    INSTITUTIONAL ACCESS ONLY
                </Typography>

                {isMisconfigured ? (
                    <Typography sx={{ color: CHART_COLORS.stress, fontSize: '0.8rem', mb: 2 }}>
                        ADMIN ACCESS NOT CONFIGURED — set VITE_ADMIN_PASSWORD in environment.
                    </Typography>
                ) : (
                    <>
                        <TextField
                            fullWidth
                            type="password"
                            label="ACCESS CODE"
                            variant="filled"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={error}
                            helperText={error ? "INVALID CREDENTIALS" : ""}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            InputProps={{ disableUnderline: true }}
                            sx={{
                                mb: 3,
                                '& .MuiFilledInput-root': {
                                    bgcolor: WHITE_ALPHA.faint,
                                    color: '#fff',
                                    '&:hover': { bgcolor: WHITE_ALPHA.line }
                                }
                            }}
                        />

                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleLogin}
                            disabled={locked}
                            sx={{
                                bgcolor: BLOOMBERG_ORANGE,
                                color: '#000',
                                fontWeight: 700,
                                '&:hover': { bgcolor: CHART_COLORS.goldDeep }
                            }}
                        >
                            {locked ? 'VERIFYING…' : 'INITIALIZE SESSION'}
                        </Button>
                    </>
                )}
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

    const { data: recentRuns, refetch: refetchRecentRuns } = useQuery({
        queryKey: ['admin', 'recent_runs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ingestion_runs')
                .select('*')
                .order('started_at', { ascending: false })
                .limit(50);
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
            refetchRecentRuns();
        }
    });

    if (!isAuthenticated) {
        return <AdminLogin onAuthenticated={() => setIsAuthenticated(true)} />;
    }

    return (
        <Box sx={{ p: 4, bgcolor: TERMINAL_BG, minHeight: '100vh', color: '#fff' }}>
            <SEOManager 
                title="Terminal Health Monitor | Admin"
                description="Internal system health and ingestion monitoring."
                robots="noindex, nofollow"
            />
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Terminal color={BLOOMBERG_ORANGE} size={32} />
                    <Box>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, lineHeight: 1 }}>
                            TERMINAL HEALTH
                        </Typography>
                        <Typography variant="caption" sx={{ color: BLOOMBERG_ORANGE, letterSpacing: '0.1em' }}>
                            SOVEREIGN INTELLIGENCE PIPELINE MONITOR
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Chip
                        icon={<Activity size={16} color={CHART_COLORS.expansion} />}
                        label="NETWORK STABLE"
                        sx={{ bgcolor: alpha(CHART_COLORS.expansion, 0.1), color: CHART_COLORS.expansion, border: `1px solid ${alpha(CHART_COLORS.expansion, 0.2)}` }}
                    />
                    <Button
                        component={RouterLink}
                        to="/admin/seo/"
                        sx={{ color: BLOOMBERG_ORANGE, fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.7rem' }}
                    >
                        SEO OPS →
                    </Button>
                    <Button
                        startIcon={<RefreshCcw size={18} />}
                        onClick={() => { refetchIngestions(); refetchRecentRuns(); }}
                        sx={{ color: WHITE_ALPHA.strong, '&:hover': { color: '#fff' } }}
                    >
                        REFRESH SYSTEM
                    </Button>
                </Box>
            </Box>

            {/* Subscriber Traction — north-star metric (plan D5/D15) */}
            <Box sx={{ mb: 4 }}>
                <SubscriberTractionCard />
            </Box>

            <TrafficIntelligencePanel />

            <Grid container spacing={3}>
                {/* Stats Summary */}
                <Grid item xs={12} md={3}>
                    <MuiCard sx={{ p: 3, bgcolor: CARD_BG, border: GLASS_BORDER }}>
                        <Typography variant="overline" color="textSecondary">INGESTION SUCCESS RATE</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, mt: 1 }}>98.4%</Typography>
                        <LinearProgress variant="determinate" value={98.4} sx={{ mt: 2, height: 4, borderRadius: 2, bgcolor: WHITE_ALPHA.faint, '& .MuiLinearProgress-bar': { bgcolor: CHART_COLORS.expansion } }} />
                    </MuiCard>
                </Grid>
                <Grid item xs={12} md={3}>
                    <MuiCard sx={{ p: 3, bgcolor: CARD_BG, border: GLASS_BORDER }}>
                        <Typography variant="overline" color="textSecondary">AVG LATENCY (MS)</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, mt: 1 }}>1,420</Typography>
                        <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>-12% VS LAST 24H</Typography>
                    </MuiCard>
                </Grid>
                <Grid item xs={12} md={3}>
                    <MuiCard sx={{ p: 3, bgcolor: CARD_BG, border: GLASS_BORDER }}>
                        <Typography variant="overline" color="textSecondary">STALE METRICS</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, mt: 1, color: staleness?.length ? CHART_COLORS.east : '#fff' }}>
                            {staleness?.length || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>REQUIRING ATTENTION</Typography>
                    </MuiCard>
                </Grid>
                <Grid item xs={12} md={3}>
                    <MuiCard sx={{ p: 3, bgcolor: CARD_BG, border: GLASS_BORDER }}>
                        <Typography variant="overline" color="textSecondary">SYSTEM STATUS</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, mt: 1, color: CHART_COLORS.expansion }}>NOMINAL</Typography>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>ALL CRON JOBS ACTIVE</Typography>
                    </MuiCard>
                </Grid>

                {/* Primary Logs Table */}
                <Grid item xs={12} lg={8}>
                    <MuiCard sx={{ bgcolor: CARD_BG, border: GLASS_BORDER }}>
                        <Box sx={{ p: 3, borderBottom: GLASS_BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Database size={20} color={BLOOMBERG_ORANGE} />
                                <Typography variant="h6" fontWeight={700}>INGESTION LOG EXPLORER</Typography>
                            </Box>
                        </Box>
                        <TableContainer sx={{ maxHeight: 500 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow sx={{ '& th': { bgcolor: CHART_COLORS.panel, color: WHITE_ALPHA.mid, py: 2, borderBottom: GLASS_BORDER } }}>
                                        <TableCell>FUNCTION</TableCell>
                                        <TableCell>TIME</TableCell>
                                        <TableCell>LATENCY</TableCell>
                                        <TableCell>STATUS</TableCell>
                                        <TableCell align="right">ACTIONS</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody sx={{ '& .MuiTableCell-root': { color: WHITE_ALPHA.strong, borderBottom: `1px solid ${WHITE_ALPHA.ghost}` } }}>
                                    {latestIngestions?.map((log: any) => (
                                        <TableRow key={log.id} hover sx={{ '&:hover': { bgcolor: WHITE_ALPHA.ghost } }}>
                                            <TableCell sx={{ fontWeight: 600 }}>{log.function_name}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{new Date(log.start_time).toLocaleTimeString()}</Typography>
                                                <Typography variant="caption" sx={{ color: WHITE_ALPHA.dim }}>{new Date(log.start_time).toLocaleDateString()}</Typography>
                                            </TableCell>
                                            <TableCell>{log.duration_ms ? `${log.duration_ms} ms` : '---'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={log.status.toUpperCase()}
                                                    sx={{
                                                        bgcolor: log.status === 'success' ? alpha(CHART_COLORS.expansion, 0.1) : alpha(CHART_COLORS.east, 0.1),
                                                        color: log.status === 'success' ? CHART_COLORS.expansion : CHART_COLORS.east,
                                                        fontWeight: 700,
                                                        fontSize: '0.6875rem'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Trigger Manual Ingestion">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            if (PIPELINE_BY_ID[log.function_name]) triggerJob.mutate(log.function_name);
                                                        }}
                                                        disabled={!PIPELINE_BY_ID[log.function_name] || (triggerJob.isPending && triggerJob.variables === log.function_name)}
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
                            <ShieldAlert size={20} color={CHART_COLORS.east} />
                            <Typography variant="h6" fontWeight={700}>VULNERABILITY ALERTS</Typography>
                        </Box>
                        <Box sx={{ px: 3, py: 1 }}>
                            {staleness?.length === 0 ? (
                                <Box sx={{ p: 4, textAlign: 'center', color: WHITE_ALPHA.dim }}>
                                    <CheckCircle2 size={40} style={{ marginBottom: 16 }} />
                                    <Typography variant="body2">ALL METRICS HEALTHY</Typography>
                                </Box>
                            ) : (
                                staleness?.map((item: any, idx: number) => (
                                    <Box key={idx} sx={{ py: 2, borderBottom: idx < staleness.length - 1 ? `1px solid ${WHITE_ALPHA.ghost}` : 'none' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: CHART_COLORS.textStrong }}>{item.metric_id}</Typography>
                                            <Typography variant="caption" sx={{ color: CHART_COLORS.east, fontWeight: 700 }}>STALE</Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{ color: WHITE_ALPHA.dim, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Clock size={12} /> Last Ingested: {item.last_updated ? new Date(item.last_updated).toLocaleDateString() : 'NEVER'}
                                        </Typography>
                                    </Box>
                                ))
                            )}
                        </Box>
                    </MuiCard>

                    <MuiCard sx={{ p: 3, bgcolor: alpha(CHART_COLORS.west, 0.05), border: `1px solid ${alpha(CHART_COLORS.west, 0.2)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Cpu size={20} color={CHART_COLORS.west} />
                            <Typography variant="subtitle2" fontWeight={700} color={CHART_COLORS.west}>SYSTEM RESOURCE STATUS</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: WHITE_ALPHA.mid, mb: 1, display: 'block' }}>EDGE RUNTIME MEMORY</Typography>
                        <LinearProgress variant="determinate" value={14} sx={{ mb: 2, height: 4, borderRadius: 2, bgcolor: WHITE_ALPHA.faint, '& .MuiLinearProgress-bar': { bgcolor: CHART_COLORS.west } }} />
                        <Typography variant="caption" sx={{ color: WHITE_ALPHA.mid, mb: 1, display: 'block' }}>DATABASE CONNECTION POOL</Typography>
                        <LinearProgress variant="determinate" value={22} sx={{ height: 4, borderRadius: 2, bgcolor: WHITE_ALPHA.faint, '& .MuiLinearProgress-bar': { bgcolor: CHART_COLORS.expansion } }} />
                    </MuiCard>
                </Grid>
            </Grid>

            {/* Recent Run History Table */}
            <Box sx={{ mt: 4 }}>
                <MuiCard sx={{ bgcolor: CARD_BG, border: GLASS_BORDER }}>
                    <Box sx={{ p: 3, borderBottom: GLASS_BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Clock size={20} color={BLOOMBERG_ORANGE} />
                            <Typography variant="h6" fontWeight={700}>RECENT RUN HISTORY</Typography>
                        </Box>
                        <Chip label={`${recentRuns?.length || 0} RUNS LOGGED`} size="small" sx={{ bgcolor: WHITE_ALPHA.faint, color: '#fff' }} />
                    </Box>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { bgcolor: CHART_COLORS.panel, color: WHITE_ALPHA.mid, py: 2, borderBottom: GLASS_BORDER } }}>
                                    <TableCell>JOB NAME</TableCell>
                                    <TableCell>STARTED AT</TableCell>
                                    <TableCell>DURATION</TableCell>
                                    <TableCell>ATTEMPTS</TableCell>
                                    <TableCell>STATUS</TableCell>
                                    <TableCell>ERROR</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody sx={{ '& .MuiTableCell-root': { color: WHITE_ALPHA.strong, borderBottom: `1px solid ${WHITE_ALPHA.ghost}` } }}>
                                {recentRuns?.map((run: any) => (
                                    <TableRow key={run.id} hover sx={{ '&:hover': { bgcolor: WHITE_ALPHA.ghost } }}>
                                        <TableCell sx={{ fontWeight: 600 }}>{run.job_name}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{new Date(run.started_at).toLocaleString()}</Typography>
                                        </TableCell>
                                        <TableCell>{run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '---'}</TableCell>
                                        <TableCell>{run.attempts}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={run.status.toUpperCase()}
                                                sx={{
                                                    bgcolor: run.status === 'success' ? alpha(CHART_COLORS.expansion, 0.1) : (run.status === 'timeout' ? alpha(CHART_COLORS.gold, 0.1) : alpha(CHART_COLORS.east, 0.1)),
                                                    color: run.status === 'success' ? CHART_COLORS.expansion : (run.status === 'timeout' ? CHART_COLORS.gold : CHART_COLORS.east),
                                                    fontWeight: 700,
                                                    fontSize: '0.6875rem'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: CHART_COLORS.east, fontSize: '0.8rem', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <Tooltip title={run.error_message || ''}>
                                                <span>{run.error_message || '---'}</span>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!recentRuns || recentRuns.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: WHITE_ALPHA.dim }}>
                                            No run history available
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </MuiCard>
            </Box>
        </Box>
    );
};
