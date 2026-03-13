import { Container, Typography, Box } from '@mui/material';
import { SEOManager } from '@/components/SEOManager';

export const TermsOfService = () => {
    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            <SEOManager 
                title="Terms of Service | GraphiQuestor"
                description="Terms and conditions for using the GraphiQuestor platform and its institutional intelligence tools."
                keywords={['Terms of Service', 'User Agreement', 'GraphiQuestor Terms']}
            />
            <Typography variant="h3" gutterBottom>Terms of Service</Typography>
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6">1. API Usage</Typography>
                <Typography paragraph>
                    GraphiQuestor provides API access to institutional clients for market intelligence and macro data.
                    Redistribution of raw data without explicit written consent is prohibited.
                </Typography>
                <Typography variant="h6">2. Subscription & Payments</Typography>
                <Typography paragraph>
                    Payments are handled via Paddle. Subscriptions are billed monthly. You can cancel at any time.
                </Typography>
                <Typography variant="h6">3. Professional Tier Quotas</Typography>
                <Typography paragraph>
                    Professional tier is limited to 10,000 calls per day unless otherwise negotiated for Institutional clients.
                </Typography>
                {/* Simplified for now */}
            </Box>
        </Container>
    );
};
