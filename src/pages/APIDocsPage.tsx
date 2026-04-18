import { Container, Typography, Box, Paper } from '@mui/material';
import { SEOManager } from '@/components/SEOManager';

export const APIDocsPage = () => {
    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            <SEOManager 
                title="API Documentation — GraphiQuestor"
                description="Technical documentation for the GraphiQuestor REST API. Integration guides for institutional data streams."
            />
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>API Documentation</Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
                Official REST API documentation for GraphiQuestor. Note: Institutional keys required.
            </Typography>

            <Box sx={{ mt: 6 }}>
                <Paper sx={{ p: 4, mb: 4, bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                    <Typography variant="h6" color="primary">GET /metrics</Typography>
                    <Typography paragraph>Returns a list of all 270+ active proprietary macro metrics.</Typography>
                    <Box component="pre" sx={{ p: 2, bgcolor: '#1a1a1a', borderRadius: 1, overflow: 'auto' }}>
                        <code>{`curl -H "x-api-key: YOUR_KEY" https://.../metrics`}</code>
                    </Box>
                </Paper>

                <Paper sx={{ p: 4, mb: 4, bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                    <Typography variant="h6" color="primary">GET /observations</Typography>
                    <Typography paragraph>Returns historical time-series data for a specific metric ID.</Typography>
                    <Box component="pre" sx={{ p: 2, bgcolor: '#1a1a1a', borderRadius: 1, overflow: 'auto' }}>
                        <code>{`curl -H "x-api-key: YOUR_KEY" \\
  "https://.../observations?metric_id=india_vix&limit=100"`}</code>
                    </Box>
                </Paper>

                <Paper sx={{ p: 4, mb: 4, bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                    <Typography variant="h6" color="primary">GET /events</Typography>
                    <Typography paragraph>Returns upcoming geopolitical and macro events with impact levels.</Typography>
                    <Box component="pre" sx={{ p: 2, bgcolor: '#1a1a1a', borderRadius: 1, overflow: 'auto' }}>
                        <code>{`curl -H "x-api-key: YOUR_KEY" https://.../events`}</code>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};
