import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
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
                <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-2">
                    <div className="w-full max-w-sm mx-auto">
                        <div className="flex flex-col items-center text-center gap-3 p-6 border border-red-500/20 rounded-3xl bg-red-500/5 backdrop-blur-lg">
                            <AlertCircle size={48} className="text-red-500" />
                            <h2 className="text-2xl font-black tracking-tight text-red-400" style={{ letterSpacing: '-0.02em' }}>
                                System Malfunction
                            </h2>
                            <p className="text-sm text-slate-400">
                                An unexpected error has occurred in the rendering pipeline.
                                <br />
                                {this.state.error?.message}
                            </p>
                            <Button
                                onClick={this.handleReload}
                                variant="outline"
                                className="mt-1 uppercase tracking-wider font-bold border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                aria-label="Re-initialize terminal"
                            >
                                <RotateCcw size={16} className="mr-2" />
                                Re-Initialize Terminal
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
