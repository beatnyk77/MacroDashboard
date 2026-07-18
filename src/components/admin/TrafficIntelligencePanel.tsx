import React, { useState } from 'react';
import {
    Box,
    Typography,
    Chip,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { BarChart3, Globe2, LogIn, LogOut, Search, Timer, Users } from 'lucide-react';
import { useTrafficIntelligence } from '@/hooks/useTrafficIntelligence';

const CARD_BG = 'rgba(7, 15, 32, 0.8)';
const GLASS_BORDER = '1px solid rgba(255, 255, 255, 0.08)';
const AMBER = '#f59e0b';

const COUNTRY_LABELS: Record<string, string> = {
    chn: 'China',
    usa: 'United States',
    ind: 'India',
    gbr: 'United Kingdom',
    deu: 'Germany',
    jpn: 'Japan',
    bra: 'Brazil',
    can: 'Canada',
    aus: 'Australia',
    fra: 'France',
    unknown: 'Unknown',
};

function formatCountry(code: string): string {
    const key = code?.toLowerCase() ?? 'unknown';
    return COUNTRY_LABELS[key] ?? code?.toUpperCase() ?? '—';
}

function shortenPath(path: string, max = 42): string {
    if (!path) return '—';
    const clean = path.replace('https://graphiquestor.com', '');
    return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

interface StatCardProps {
    label: string;
    value: string | number;
    sub?: string;
    accent?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, accent = '#fff' }) => (
    <Box sx={{ p: 2.5, bgcolor: CARD_BG, border: GLASS_BORDER, borderRadius: '14px', minHeight: 108 }}>
        <Typography sx={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
            {label}
        </Typography>
        <Typography sx={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1.1, mt: 1, color: accent }}>
            {value}
        </Typography>
        {sub && (
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', mt: 0.75 }}>
                {sub}
            </Typography>
        )}
    </Box>
);

interface SparkBarsProps {
    values: number[];
    color?: string;
}

const SparkBars: React.FC<SparkBarsProps> = ({ values, color = AMBER }) => {
    const max = Math.max(1, ...values);
    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 48 }} aria-hidden>
            {values.map((v, i) => (
                <Box
                    key={i}
                    sx={{
                        flex: 1,
                        height: `${Math.max(8, (v / max) * 100)}%`,
                        bgcolor: color,
                        opacity: 0.75,
                        borderRadius: '2px 2px 0 0',
                    }}
                />
            ))}
        </Box>
    );
};

export const TrafficIntelligencePanel: React.FC = () => {
    const [period, setPeriod] = useState<7 | 28>(28);
    const { data, isLoading, error, refetch, isFetching } = useTrafficIntelligence(period, true);

    const engagementSeries = (data?.engagement_trend ?? []).map((d) => Number(d.avg_seconds ?? 0));
    const gscClickSeries = (data?.gsc_organic?.trend ?? []).map((d) => d.clicks);

    return (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <BarChart3 size={22} color={AMBER} />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
                            TRAFFIC INTELLIGENCE
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em' }}>
                            FIRST-PARTY SESSIONS + GSC ORGANIC
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={period}
                        onChange={(_, v) => v && setPeriod(v)}
                        sx={{
                            '& .MuiToggleButton-root': {
                                color: 'rgba(255,255,255,0.5)',
                                borderColor: 'rgba(255,255,255,0.12)',
                                fontSize: 10,
                                fontWeight: 900,
                                px: 2,
                                '&.Mui-selected': { color: AMBER, bgcolor: 'rgba(245,158,11,0.1)' },
                            },
                        }}
                    >
                        <ToggleButton value={7}>7D</ToggleButton>
                        <ToggleButton value={28}>28D</ToggleButton>
                    </ToggleButtonGroup>
                    <Chip
                        label={data?.gsc_connected ? `GSC · ${data.gsc_last_date ?? 'synced'}` : 'GSC not connected'}
                        size="small"
                        sx={{
                            bgcolor: data?.gsc_connected ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                            color: data?.gsc_connected ? '#34d399' : '#f87171',
                            fontWeight: 800,
                            fontSize: '0.65rem',
                        }}
                    />
                    <Chip
                        label={isFetching ? 'Refreshing…' : 'Refresh'}
                        size="small"
                        onClick={() => refetch()}
                        sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer' }}
                    />
                </Box>
            </Box>

            {isLoading ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                    <CircularProgress size={28} sx={{ color: AMBER }} />
                </Box>
            ) : error || !data ? (
                <Box sx={{ p: 3, border: GLASS_BORDER, borderRadius: 2, bgcolor: CARD_BG }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                        Traffic summary is service-role only (public EXECUTE revoked 2026-07-19). Use SQL
                        dashboard or an authenticated edge proxy — not the public anon key.
                    </Typography>
                </Box>
            ) : data ? (
                <>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                            gap: 2,
                            mb: 3,
                        }}
                    >
                        <StatCard
                            label="Active Sessions (7d)"
                            value={data.active_users_7d}
                            sub={`${data.page_views_7d} page views`}
                            accent="#60a5fa"
                        />
                        <StatCard
                            label={`Active Sessions (${period}d)`}
                            value={data.active_users_28d}
                            sub={`${data.page_views_28d} page views`}
                            accent="#60a5fa"
                        />
                        <StatCard
                            label="Avg Engagement (7d)"
                            value={data.avg_engagement_seconds_7d != null ? `${data.avg_engagement_seconds_7d}s` : '—'}
                            sub="time_on_page milestones"
                            accent={AMBER}
                        />
                        <StatCard
                            label="Organic CTR (7d)"
                            value={data.gsc_connected ? `${data.gsc_organic.ctr_7d}%` : '—'}
                            sub={
                                data.gsc_connected
                                    ? `${data.gsc_organic.clicks_7d} clicks / ${data.gsc_organic.impressions_7d} impr.`
                                    : 'Awaiting GSC sync'
                            }
                            accent="#34d399"
                        />
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                            gap: 2,
                            mb: 3,
                        }}
                    >
                        <Box sx={{ p: 2.5, bgcolor: CARD_BG, border: GLASS_BORDER, borderRadius: '14px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Timer size={16} color={AMBER} />
                                <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                                    Engagement Time Trend
                                </Typography>
                            </Box>
                            <SparkBars values={engagementSeries.length ? engagementSeries : [0]} />
                            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', mt: 1 }}>
                                Daily avg seconds from time_on_page events
                            </Typography>
                        </Box>

                        <Box sx={{ p: 2.5, bgcolor: CARD_BG, border: GLASS_BORDER, borderRadius: '14px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Search size={16} color="#34d399" />
                                <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                                    Organic Clicks (GSC)
                                </Typography>
                            </Box>
                            <SparkBars values={gscClickSeries.length ? gscClickSeries : [0]} color="#34d399" />
                            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', mt: 1 }}>
                                {period}d: {data.gsc_organic.impressions_28d.toLocaleString()} impressions ·{' '}
                                {data.gsc_organic.clicks_28d.toLocaleString()} clicks
                            </Typography>
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
                            gap: 2,
                            mb: 3,
                        }}
                    >
                        <MiniTable
                            title="Top Pages (First-Party)"
                            icon={<Users size={16} color="#60a5fa" />}
                            headers={['Path', 'Views']}
                            rows={(data.top_pages ?? []).map((r) => [shortenPath(r.path), String(r.views ?? 0)])}
                            empty="No page views recorded yet"
                        />
                        <MiniTable
                            title="Top Countries (GSC)"
                            icon={<Globe2 size={16} color="#f87171" />}
                            headers={['Country', 'Impr.', 'Clicks']}
                            rows={(data.top_countries ?? []).map((r) => [
                                formatCountry(r.country),
                                String(r.impressions),
                                String(r.clicks),
                            ])}
                            empty={data.gsc_connected ? 'No country data' : 'GSC not connected'}
                        />
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                            gap: 2,
                        }}
                    >
                        <MiniTable
                            title="Entry Pages"
                            icon={<LogIn size={16} color="#a78bfa" />}
                            headers={['Path', 'Sessions']}
                            rows={(data.entry_pages ?? []).map((r) => [shortenPath(r.path), String(r.entries ?? 0)])}
                            empty="Insufficient session data"
                        />
                        <MiniTable
                            title="Exit Pages"
                            icon={<LogOut size={16} color="#fb7185" />}
                            headers={['Path', 'Sessions']}
                            rows={(data.exit_pages ?? []).map((r) => [shortenPath(r.path), String(r.exits ?? 0)])}
                            empty="Insufficient session data"
                        />
                        <MiniTable
                            title="Top Organic Pages (GSC)"
                            icon={<Search size={16} color="#34d399" />}
                            headers={['Page', 'Clicks']}
                            rows={(data.top_gsc_pages ?? []).map((r) => [shortenPath(r.page, 36), String(r.clicks)])}
                            empty={data.gsc_connected ? 'No GSC page data' : 'GSC not connected'}
                        />
                    </Box>
                </>
            ) : null}
        </Box>
    );
};

interface MiniTableProps {
    title: string;
    icon: React.ReactNode;
    headers: string[];
    rows: string[][];
    empty: string;
}

const MiniTable: React.FC<MiniTableProps> = ({ title, icon, headers, rows, empty }) => (
    <Box sx={{ bgcolor: CARD_BG, border: GLASS_BORDER, borderRadius: '14px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: GLASS_BORDER, display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {title}
            </Typography>
        </Box>
        <TableContainer>
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ '& th': { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 800, py: 1.5, borderBottom: GLASS_BORDER } }}>
                        {headers.map((h) => (
                            <TableCell key={h}>{h}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={headers.length} sx={{ py: 3, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                                {empty}
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((row, idx) => (
                            <TableRow key={idx} sx={{ '& td': { color: 'rgba(255,255,255,0.78)', fontSize: 12, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.03)' } }}>
                                {row.map((cell, ci) => (
                                    <TableCell key={ci} sx={{ fontFamily: ci === 0 ? 'monospace' : 'inherit', fontSize: ci === 0 ? 11 : 12 }}>
                                        {cell}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    </Box>
);