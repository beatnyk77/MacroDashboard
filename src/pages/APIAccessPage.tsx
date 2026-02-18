import { Container, Typography, Box, Button, Card, CardContent, Grid } from '@mui/material';
import { useEffect } from 'react';

declare global {
    interface Window {
        Paddle: any;
    }
}

export const APIAccessPage = () => {
    useEffect(() => {
        // Load Paddle.js - in a real app, use the Sandbox ID or Live ID from env
        const script = document.createElement('script');
        script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (window.Paddle) {
                // Initialize Paddle with Sandbox mode for testing
                window.Paddle.Environment.set('sandbox');
                window.Paddle.Setup({
                    token: 'test_8928682b1356f91d84b80b0800d' // Example Sandbox token
                });
            }
        };
    }, []);

    const handleCheckout = () => {
        if (window.Paddle) {
            window.Paddle.Checkout.open({
                items: [
                    {
                        priceId: 'pri_01j_mock_professional_tier', // Mock Price ID
                        quantity: 1
                    }
                ],
                customer: {
                    email: 'institutional@example.com' // Should be dynamic from auth
                }
            });
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <Typography variant="h2" align="center" gutterBottom sx={{ fontWeight: 800 }}>Institutional API Access</Typography>
            <Typography variant="h5" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
                Professional-grade macro intelligence delivered via REST API.
            </Typography>

            <Grid container spacing={4} justifyContent="center">
                <Grid item xs={12} md={6}>
                    <Card sx={{
                        p: 4,
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 4
                    }}>
                        <CardContent>
                            <Typography variant="h4" gutterBottom>Professional Tier</Typography>
                            <Typography variant="h3" sx={{ my: 2, fontWeight: 700 }}>$299<Typography component="span" variant="h6">/mo</Typography></Typography>
                            <Box sx={{ mt: 4, mb: 4 }}>
                                <Typography>• 10,000 requests per day</Typography>
                                <Typography>• Full access to all 270+ metrics</Typography>
                                <Typography>• Historical data (25 years)</Typography>
                                <Typography>• Webhook support</Typography>
                            </Box>
                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={handleCheckout}
                                sx={{
                                    py: 2,
                                    borderRadius: 2,
                                    fontSize: '1.1rem',
                                    textTransform: 'none',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
                                }}
                            >
                                Get API Access
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ mt: 8, textAlign: 'center' }}>
                <Typography color="text.secondary">
                    Need custom volume? <Button color="primary">Contact Sales</Button>
                </Typography>
            </Box>
        </Container>
    );
};
