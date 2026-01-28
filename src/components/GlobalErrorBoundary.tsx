import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <Box sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#020617',
                    color: 'white',
                    p: 2
                }}>
                    <Container maxWidth="sm">
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: 3,
                            p: 4,
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: 3,
                            bgcolor: 'rgba(239, 68, 68, 0.05)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <AlertCircle size={48} color="#ef4444" />
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'error.light' }}>
                                System Malfunction
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                An unexpected error has occurred in the rendering pipeline.
                                <br />
                                {this.state.error?.message}
                            </Typography>
                            <Button
                                onClick={this.handleReload}
                                variant="outlined"
                                color="error"
                                startIcon={<RotateCcw size={16} />}
                                sx={{ mt: 1, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}
                            >
                                Re-Initialize Terminal
                            </Button>
                        </Box>
                    </Container>
                </Box>
            );
        }

        return this.props.children;
    }
}
