import React, { useState } from 'react';
import {
    Card,
    Box,
    Typography,
    Tooltip,
    Skeleton,
    Alert,
    Modal,
    Fade,
    Backdrop,
    IconButton,
    Chip,
    Stack
} from '@mui/material';
import { Info, X, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, Sankey, Tooltip as RechartsTooltip } from 'recharts';
import { useSankeyFlows, SankeyNode as SankeyNodeType } from '@/hooks/useSankeyFlows';

// Custom Sankey Tooltip
const CustomSankeyTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0];

    // Check if it's a link or a node
    if (data.payload.source !== undefined) {
        // It's a link
        return (
            <Box sx={{
                bgcolor: '#0f172a',
                p: 2,
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'
            }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 800, display: 'block' }}>
                    FLOW MAGNITUDE
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main' }}>
                    {data.payload.value.toFixed(2)} {data.payload.value > 100 ? 'Index' : '$B'}
                </Typography>
            </Box>
        );
    } else {
        // It's a node
        return (
            <Box sx={{
                bgcolor: '#0f172a',
                p: 2,
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'
            }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 800, display: 'block' }}>
                    {data.payload.name}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: data.payload.color || 'primary.main' }}>
                    {data.payload.category?.replace(/_/g, ' ').toUpperCase()}
                </Typography>
            </Box>
        );
    }
};

export const SankeyFlowCard: React.FC = () => {
    const { data: sankeyData, isLoading, error } = useSankeyFlows();
    const [selectedNode, setSelectedNode] = useState<SankeyNodeType | null>(null);

    if (isLoading) {
        return (
            <Card sx={{ p: 3, height: 700, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={600} sx={{ borderRadius: 2 }} />
            </Card>
        );
    }

    if (error) {
        return (
            <Card sx={{ p: 3, height: 700, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Alert severity="error">
                    Failed to load Sankey flow data. Please try again later.
                </Alert>
            </Card>
        );
    }

    if (!sankeyData || sankeyData.nodes.length === 0) {
        return (
            <Card sx={{ p: 3, height: 700, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Alert severity="info">
                    No flow data available yet. Data will appear after initial ingestion.
                </Alert>
            </Card>
        );
    }

    const handleNodeClick = (node: any) => {
        const nodeData = sankeyData.nodes.find(n => n.index === node.index);
        if (nodeData) {
            setSelectedNode(nodeData);
        }
    };

    // Transform data for Recharts Sankey format
    const chartData = {
        nodes: sankeyData.nodes.map(n => ({
            name: n.name,
            index: n.index,
            category: n.category,
            color: n.color
        })),
        links: sankeyData.links.map(l => ({
            source: l.source,
            target: l.target,
            value: l.value
        }))
    };

    // Category legend
    const categories = [
        { key: 'capital_flows', label: 'Capital Flows', color: '#3b82f6' },
        { key: 'inflation_regime', label: 'Inflation', color: '#f97316' },
        { key: 'balance_of_payments', label: 'BOP', color: '#8b5cf6' },
        { key: 'housing_cycle', label: 'Housing', color: '#ef4444' },
        { key: 'activity_regime', label: 'Activity', color: '#10b981' },
        { key: 'labor_market', label: 'Labor', color: '#f59e0b' }
    ];

    return (
        <>
            <Card sx={{
                p: 3,
                height: '100%',
                minHeight: 700,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative',
                overflow: 'visible'
            }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <TrendingUp size={20} color="#3b82f6" />
                            <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.12em', color: 'text.secondary' }}>
                                MACRO FLOW MAP
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: '0.75rem', lineHeight: 1.5 }}>
                            Visualizing macro indicator flows across 6 high-signal metrics
                        </Typography>
                    </Box>
                    <Tooltip
                        title="Data sources: FRED (Federal Reserve Economic Data), IMF BOP Statistics. Some metrics use high-quality public API proxies. Click nodes for details."
                        placement="left"
                    >
                        <IconButton size="small" sx={{ color: 'text.disabled' }}>
                            <Info size={16} />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Category Legend */}
                <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                    {categories.map(cat => (
                        <Chip
                            key={cat.key}
                            label={cat.label}
                            size="small"
                            sx={{
                                bgcolor: `${cat.color}20`,
                                color: cat.color,
                                border: `1px solid ${cat.color}40`,
                                fontWeight: 700,
                                fontSize: '0.7rem'
                            }}
                        />
                    ))}
                </Stack>

                {/* Sankey Chart */}
                <Box sx={{ height: 540, width: '100%', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <Sankey
                            data={chartData}
                            nodePadding={20}
                            nodeWidth={10}
                            link={{
                                stroke: 'rgba(148, 163, 184, 0.3)',
                                strokeWidth: 2
                            }}
                            node={(props: any) => {
                                const { x, y, width, height, index, payload } = props;
                                const node = sankeyData.nodes.find(n => n.index === index);
                                return (
                                    <rect
                                        x={x}
                                        y={y}
                                        width={width}
                                        height={height}
                                        fill={node?.color || '#6b7280'}
                                        fillOpacity="1"
                                        cursor="pointer"
                                        onClick={() => handleNodeClick(payload)}
                                    />
                                );
                            }}
                            margin={{ top: 10, right: 100, bottom: 10, left: 100 }}
                        >
                            <RechartsTooltip
                                content={<CustomSankeyTooltip />}
                                cursor={{ fill: 'transparent' }}
                            />
                        </Sankey>
                    </ResponsiveContainer>
                </Box>

                {/* Data Source Note */}
                <Box sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>
                        <strong>Data Sources:</strong> FRED (Federal Reserve Economic Data), IMF Balance of Payments Statistics API
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block', mt: 0.5 }}>
                        <strong>Note:</strong> Some metrics use high-quality public API proxies (e.g., equity ETF flows, PMI indicators) instead of paid institutional sources.
                        Last updated: {sankeyData.last_updated ? new Date(sankeyData.last_updated).toLocaleDateString() : 'N/A'}
                    </Typography>
                </Box>
            </Card>

            {/* Detail Modal */}
            <Modal
                open={selectedNode !== null}
                onClose={() => setSelectedNode(null)}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                    sx: { backdropFilter: 'blur(16px)', bgcolor: 'rgba(0,0,0,0.85)' }
                }}
            >
                <Fade in={selectedNode !== null}>
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: { xs: '90vw', md: 600 },
                        bgcolor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        p: 4,
                        borderRadius: 4,
                        color: 'text.primary'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                                    {selectedNode?.name}
                                </Typography>
                                <Chip
                                    label={selectedNode?.category.replace(/_/g, ' ').toUpperCase()}
                                    size="small"
                                    sx={{
                                        bgcolor: `${selectedNode?.color}20`,
                                        color: selectedNode?.color,
                                        border: `1px solid ${selectedNode?.color}40`,
                                        fontWeight: 700
                                    }}
                                />
                            </Box>
                            <IconButton
                                onClick={() => setSelectedNode(null)}
                                sx={{ color: 'text.disabled', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' } }}
                            >
                                <X size={24} />
                            </IconButton>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            This node represents a key macro indicator in the {selectedNode?.category.replace(/_/g, ' ')} category.
                            Flow magnitude is determined by the latest observed value from FRED or IMF data sources.
                        </Typography>

                        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 800, display: 'block' }}>
                                CATEGORY COLOR LEGEND
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 16, height: 16, bgcolor: selectedNode?.color, borderRadius: 1 }} />
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {selectedNode?.category ? (selectedNode.category.replace(/_/g, ' ').charAt(0).toUpperCase() + selectedNode.category.replace(/_/g, ' ').slice(1)) : ''}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Fade>
            </Modal>
        </>
    );
};
