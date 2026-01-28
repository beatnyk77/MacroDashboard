import React, { useState } from 'react';
import {
    Box,
    Typography,
    Modal,
    Fade,
    Backdrop,
    IconButton,
    Grid,
    Divider,
    Paper,
    useTheme
} from '@mui/material';
import { X, Info, Clock, Layers } from 'lucide-react';
import { Sparkline } from '@/components/Sparkline';

interface HoverDetailProps {
    title: string;
    subtitle?: string;
    children: React.ReactElement; // The card to wrap
    detailContent: {
        description?: string;
        stats?: { label: string; value: string | number; color?: string }[];
        history?: { date: string; value: number }[];
        methodology?: string;
        source?: string;
    };
}

export const HoverDetail: React.FC<HoverDetailProps> = ({
    title,
    subtitle,
    children,
    detailContent
}) => {
    const [open, setOpen] = useState(false);
    const theme = useTheme();

    const handleOpen = () => setOpen(true);
    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(false);
    };

    return (
        <>
            <Box
                onClick={handleOpen}
                sx={{
                    cursor: 'pointer',
                    height: '100%',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.01)' }
                }}
            >
                {children}
            </Box>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                    sx: { backdropFilter: 'blur(8px)', bgcolor: 'rgba(2, 6, 23, 0.85)' }
                }}
            >
                <Fade in={open}>
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: { xs: '95vw', md: 700 },
                        maxWidth: '100%',
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
                        p: { xs: 3, md: 5 },
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: 'primary.main' }}>
                                    {title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {subtitle || 'Institutional Data Analysis & Methodology'}
                                </Typography>
                            </Box>
                            <IconButton onClick={(e) => handleClose(e)} sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
                                <X size={24} />
                            </IconButton>
                        </Box>

                        <Grid container spacing={4}>
                            {/* Left Column: Stats & Description */}
                            <Grid item xs={12} md={6}>
                                <Box sx={{ mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                        <Info size={16} color={theme.palette.primary.main} />
                                        <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary' }}>EXECUTIVE SUMMARY</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ lineHeight: 1.6, color: 'text.primary', opacity: 0.9 }}>
                                        {detailContent.description || 'No detailed description available for this metric.'}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                    {detailContent.stats?.map((stat, idx) => (
                                        <Paper
                                            key={idx}
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                bgcolor: 'rgba(255,255,255,0.02)',
                                                borderColor: stat.color ? `${stat.color}40` : 'divider'
                                            }}
                                        >
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                                {stat.label.toUpperCase()}
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 800, color: stat.color || 'text.primary' }}>
                                                {stat.value}
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Box>
                            </Grid>

                            {/* Right Column: Mini Chart & Context */}
                            <Grid item xs={12} md={6}>
                                <Box sx={{ mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                        <Clock size={16} color={theme.palette.primary.main} />
                                        <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary' }}>RECENT TREND (90D)</Typography>
                                    </Box>
                                    <Box sx={{ height: 120, width: '100%', mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
                                        {detailContent.history && detailContent.history.length > 0 ? (
                                            <Sparkline data={detailContent.history} height={80} />
                                        ) : (
                                            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Typography variant="caption" color="text.disabled">Historical data loading...</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>

                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                        <Layers size={16} color={theme.palette.primary.main} />
                                        <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary' }}>METHODOLOGY</Typography>
                                    </Box>
                                    <Typography variant="caption" component="div" sx={{ color: 'text.secondary', bgcolor: 'rgba(255,255,255,0.02)', p: 1.5, borderRadius: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
                                        {detailContent.methodology || 'Calculated using standardized Z-Score normalization against institutional source data.'}
                                        <Box sx={{ mt: 1, fontWeight: 700, color: 'primary.main', fontSize: '0.6rem' }}>
                                            DATA SOURCE: {detailContent.source || 'Standard Financial Feeds'}
                                        </Box>
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 4, opacity: 0.1 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                                Tap outside or click X to return to dashboard
                            </Typography>
                        </Box>
                    </Box>
                </Fade>
            </Modal>
        </>
    );
};
