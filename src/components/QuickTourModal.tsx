import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    IconButton,
    MobileStepper
} from '@mui/material';
import { X, ChevronRight, Zap, FlaskConical, Globe, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
    {
        title: "Welcome to GraphiQuestor",
        description: "Your institutional-grade macro observatory. We track global liquidity, sovereign stress, and multipolar regime transitions in real-time.",
        icon: <Zap className="text-blue-400" size={48} />,
        color: "blue"
    },
    {
        title: "Deep-Dive Labs",
        description: "Explore specialized telemetry in our Labs—from the US Maturity Wall to India's Fiscal Quality. Built for professional analytical independence.",
        icon: <FlaskConical className="text-emerald-400" size={48} />,
        color: "emerald"
    },
    {
        title: "Weekly Regime Digest",
        description: "Get human-readable structural summaries every week. Subscribe to never miss a regime shift in the global macro landscape.",
        icon: <Globe className="text-orange-400" size={48} />,
        color: "orange"
    },
    {
        title: "Institutional API",
        description: "Access the raw telemetric feed powering this terminal. Our $28/mo Quantum API is built for funds and professional offices.",
        icon: <Shield className="text-blue-500" size={48} />,
        color: "blue"
    }
];

export const QuickTourModal: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('gq_tour_seen');
        if (!hasSeenTour) {
            const timer = setTimeout(() => setOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem('gq_tour_seen', '1');
        setOpen(false);
    };

    const handleNext = () => {
        if (activeStep === slides.length - 1) {
            handleClose();
        } else {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{
                sx: {
                    bgcolor: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '32px',
                    maxWidth: '500px',
                    width: '100%',
                    m: 2,
                    overflow: 'hidden'
                }
            }}
        >
            <IconButton
                onClick={handleClose}
                sx={{ position: 'absolute', right: 16, top: 16, color: 'white/40', '&:hover': { color: 'white' } }}
            >
                <X size={20} />
            </IconButton>

            <DialogContent sx={{ p: 6, pt: 8 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <Box sx={{
                                mb: 4,
                                p: 4,
                                borderRadius: '24px',
                                bg: `rgba(var(--${slides[activeStep].color}-500-rgb), 0.1)`,
                                border: `1px solid rgba(var(--${slides[activeStep].color}-500-rgb), 0.2)`
                            }}>
                                {slides[activeStep].icon}
                            </Box>

                            <Typography variant="h4" sx={{ fontWeight: 900, textTransform: 'uppercase', mb: 2, tracking: '-0.02em', color: 'white' }}>
                                {slides[activeStep].title}
                            </Typography>

                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.6, mb: 6, fontSize: '1rem', fontWeight: 500 }}>
                                {slides[activeStep].description}
                            </Typography>
                        </Box>
                    </motion.div>
                </AnimatePresence>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                    <MobileStepper
                        variant="dots"
                        steps={slides.length}
                        position="static"
                        activeStep={activeStep}
                        sx={{
                            bgcolor: 'transparent',
                            p: 0,
                            '& .MuiMobileStepper-dot': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                            '& .MuiMobileStepper-dotActive': { bgcolor: '#3b82f6' }
                        }}
                        backButton={null}
                        nextButton={null}
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {activeStep > 0 && (
                            <Button
                                onClick={handleBack}
                                sx={{ color: 'white/60', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem' }}
                            >
                                Back
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            endIcon={activeStep === slides.length - 1 ? null : <ChevronRight size={16} />}
                            sx={{
                                bgcolor: '#3b82f6',
                                fontWeight: 900,
                                borderRadius: '12px',
                                px: 4,
                                py: 1.5,
                                fontSize: '0.75rem',
                                '&:hover': { bgcolor: '#2563eb' }
                            }}
                        >
                            {activeStep === slides.length - 1 ? "Start Exploring" : "Next"}
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};
