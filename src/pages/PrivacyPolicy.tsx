import { Container, Typography, Box } from '@mui/material';
import { SEOManager } from '@/components/SEOManager';

export const PrivacyPolicy = () => {
    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            <SEOManager 
                title="Privacy Policy | GraphiQuestor"
                description="Our commitment to your data privacy and security. Learn how GraphiQuestor handles user information."
                keywords={['Privacy Policy', 'Data Security', 'GraphiQuestor Privacy']}
            />
            <Typography variant="h3" gutterBottom>Privacy Policy</Typography>
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6">1. Data Collection</Typography>
                <Typography paragraph>
                    We collect minimal personal data required for billing and authentication via Paddle and Supabase.
                </Typography>
                <Typography variant="h6">2. Third-Party Services</Typography>
                <Typography paragraph>
                    We use Paddle for payment processing and Supabase for authentication and database management.
                </Typography>
                <Typography variant="h6">3. API Keys</Typography>
                <Typography paragraph>
                    Your API key is private. Do not share it. We track usage to enforce quotas.
                </Typography>
            </Box>
        </Container>
    );
};
