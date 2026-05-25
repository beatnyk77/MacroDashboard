import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
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

    // Initial check for tour completion
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('gqTourCompleted') === 'true' || localStorage.getItem('gq_tour_seen') === '1';
        if (!hasSeenTour) {
            const timer = setTimeout(() => setOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    // Lock scroll when the modal is open, and restore it on close/unmount
    useEffect(() => {
        if (open) {
            const originalBodyOverflow = document.body.style.overflow;
            const originalHtmlOverflow = document.documentElement.style.overflow;

            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';

            // Prevent scroll/touch propagation outside the modal container
            const handleWheel = (e: WheelEvent) => {
                const modalPaper = document.querySelector('.MuiDialog-paper');
                if (modalPaper && !modalPaper.contains(e.target as Node)) {
                    e.preventDefault();
                }
            };

            const handleTouchMove = (e: TouchEvent) => {
                const modalPaper = document.querySelector('.MuiDialog-paper');
                if (modalPaper && !modalPaper.contains(e.target as Node)) {
                    e.preventDefault();
                }
            };

            window.addEventListener('wheel', handleWheel, { passive: false });
            window.addEventListener('touchmove', handleTouchMove, { passive: false });

            return () => {
                document.body.style.overflow = originalBodyOverflow;
                document.documentElement.style.overflow = originalHtmlOverflow;
                window.removeEventListener('wheel', handleWheel);
                window.removeEventListener('touchmove', handleTouchMove);
            };
        }
    }, [open]);

    const handleClose = () => {
        localStorage.setItem('gqTourCompleted', 'true');
        localStorage.setItem('gq_tour_seen', '1'); // For backwards compatibility
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
            disableScrollLock
            keepMounted={false}
            role="dialog"
            aria-modal="true"
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
            <Button
                onClick={handleClose}
                aria-label="Close welcome tour"
                startIcon={<X size={14} />}
                sx={{
                    position: 'absolute',
                    right: 20,
                    top: 20,
                    color: 'rgba(255, 255, 255, 0.5)',
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    px: 1.5,
                    py: 0.5,
                    zIndex: 10,
                    minHeight: 'auto',
                    minWidth: 'auto',
                    transition: 'all 0.2s',
                    '&:hover': {
                        color: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        borderColor: 'rgba(255, 255, 255, 0.15)'
                    }
                }}
            >
                Close welcome tour
            </Button>

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

                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        {activeStep > 0 ? (
                            <>
                                <Button
                                    onClick={handleBack}
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                        fontSize: '0.75rem',
                                        minWidth: 'auto',
                                        '&:hover': { color: 'white' }
                                    }}
                                >
                                    Back
                                </Button>
                                {activeStep < slides.length - 1 && (
                                    <Button
                                        onClick={handleClose}
                                        sx={{
                                            color: 'rgba(255, 255, 255, 0.4)',
                                            fontWeight: 900,
                                            textTransform: 'uppercase',
                                            fontSize: '0.75rem',
                                            minWidth: 'auto',
                                            '&:hover': { color: 'rgba(255, 255, 255, 0.8)' }
                                        }}
                                    >
                                        Skip
                                    </Button>
                                )}
                            </>
                        ) : (
                            <Button
                                onClick={handleClose}
                                sx={{
                                    color: 'rgba(255, 255, 255, 0.4)',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    fontSize: '0.75rem',
                                    minWidth: 'auto',
                                    '&:hover': { color: 'rgba(255, 255, 255, 0.8)' }
                                }}
                            >
                                Skip
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
