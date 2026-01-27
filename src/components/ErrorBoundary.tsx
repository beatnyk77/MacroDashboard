import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <Container maxWidth="sm">
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '80vh',
                            textAlign: 'center',
                            gap: 3,
                        }}
                    >
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: '50%',
                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                color: 'error.main',
                            }}
                        >
                            <AlertCircle size={48} />
                        </Box>

                        <Box>
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                                Something went wrong
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 4 }}>
                                The application encountered an unexpected error. This has been logged and we'll look into it.
                            </Typography>
                            {this.state.error && (
                                <Typography
                                    variant="caption"
                                    component="pre"
                                    sx={{
                                        p: 2,
                                        bgcolor: 'background.paper',
                                        borderRadius: 1,
                                        width: '100%',
                                        overflowX: 'auto',
                                        textAlign: 'left',
                                        mb: 4,
                                        color: 'text.secondary'
                                    }}
                                >
                                    {this.state.error.message}
                                </Typography>
                            )}
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<RefreshCw size={18} />}
                            onClick={() => window.location.reload()}
                            sx={{
                                px: 4,
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                            }}
                        >
                            Reload Dashboard
                        </Button>
                    </Box>
                </Container>
            );
        }

        return this.props.children;
    }
}
