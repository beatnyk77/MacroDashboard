import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import { SEOManager } from '@/components/SEOManager';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
    return (
        <Container maxWidth="md">
            <SEOManager 
                title="404 - Terminal Access Denied" 
                description="The requested macro coordinate does not exist in the current regime."
                robots="noindex, nofollow"
            />
            <Box 
                sx={{ 
                    minHeight: '80vh', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: 4
                }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box 
                        sx={{ 
                            p: 3, 
                            borderRadius: '50%', 
                            bgcolor: 'error.main', 
                            color: 'white',
                            mb: 2,
                            display: 'inline-flex'
                        }}
                    >
                        <AlertCircle size={48} />
                    </Box>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <Typography variant="h1" component="h1" sx={{ fontWeight: 900, mb: 2, color: 'white' }}>
                        404
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'text.secondary', mb: 4, maxWidth: 500 }}>
                        The requested macro coordinate does not exist. 
                        The path may have been deprecated or the regime has shifted.
                    </Typography>
                    
                    <Button
                        component={Link}
                        to="/"
                        variant="contained"
                        size="large"
                        startIcon={<ArrowLeft />}
                        sx={{
                            borderRadius: '12px',
                            px: 4,
                            py: 1.5,
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: 'primary.main',
                            '&:hover': {
                                bgcolor: 'primary.dark',
                            }
                        }}
                    >
                        Return to Terminal
                    </Button>
                </motion.div>
            </Box>
        </Container>
    );
};

export default NotFound;
