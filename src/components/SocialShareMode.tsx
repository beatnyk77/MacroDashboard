import React, { useState, useEffect } from 'react';
import { Box, Tooltip, IconButton, Fade, Typography } from '@mui/material';
import { Camera, X } from 'lucide-react';

export const SocialShareMode: React.FC = () => {
    const [isShareMode, setIsShareMode] = useState(false);

    useEffect(() => {
        if (isShareMode) {
            document.body.classList.add('share-mode');
        } else {
            document.body.classList.remove('share-mode');
        }
        return () => document.body.classList.remove('share-mode');
    }, [isShareMode]);

    // Inject global styles dynamically for share mode
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            body.share-mode ::-webkit-scrollbar { display: none !important; }
            body.share-mode { overflow: hidden !important; }
            body.share-mode header { display: none !important; }
            body.share-mode .share-hidden { display: none !important; }
            body.share-mode .share-visible { display: block !important; }
            body.share-mode main { padding-top: 0 !important; }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <>
            {/* Toggle Button (Bottom Right) */}
            <Fade in={!isShareMode}>
                <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
                    <Tooltip title="Toggle Share Mode (Clean Screenshot View)" arrow placement="left">
                        <IconButton
                            onClick={() => setIsShareMode(true)}
                            sx={{
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                boxShadow: 4,
                                color: 'text.primary',
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                        >
                            <Camera size={20} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Fade>

            {/* Exit Banner (Top Center) - Only Visible in Share Mode */}
            <Fade in={isShareMode}>
                <Box sx={{
                    position: 'fixed',
                    top: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    px: 3,
                    py: 1,
                    borderRadius: 10,
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.1em' }}>
                        SHARE MODE ACTIVE
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={() => setIsShareMode(false)}
                        sx={{ color: 'white', p: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                    >
                        <X size={16} />
                    </IconButton>
                </Box>
            </Fade>
        </>
    );
};
