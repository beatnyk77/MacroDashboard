import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
    name?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Error in section "${this.props.name || 'Unknown'}":`, error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-12 rounded-3xl border border-rose-500/20 bg-rose-500/[0.02] backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                        <AlertTriangle size={32} />
                    </div>
                    <div className="max-w-md space-y-2">
                        <h3 className="text-lg font-black text-foreground uppercase tracking-widest">
                            {this.props.name || 'Section'} Latency Breakdown
                        </h3>
                        <p className="text-sm text-muted-foreground/60 leading-relaxed italic">
                            The institutional data feed for this section encountered a runtime divergence. Our systems are monitoring the relay.
                        </p>
                    </div>
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/12 text-xs font-black text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all active:scale-95"
                    >
                        <RotateCcw size={14} />
                        RE-INITIALIZE FEED
                    </button>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-8 p-4 rounded-lg bg-black/40 border border-white/5 w-full text-left overflow-auto max-h-40">
                            <code className="text-xs text-rose-400/50 block">
                                {this.state.error?.toString()}
                            </code>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
