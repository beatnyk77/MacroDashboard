import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { reportClientError } from '@/lib/errorReporting';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    isEmailLanding: boolean;
}

function isSubscribePath(pathname: string | undefined): boolean {
    if (!pathname) return false;
    return pathname.startsWith('/subscribe');
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        isEmailLanding: false,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        const isEmailLanding =
            typeof window !== 'undefined' && isSubscribePath(window.location.pathname);
        return { hasError: true, error, isEmailLanding };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        void reportClientError({
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack ?? undefined,
            route: typeof window !== 'undefined' ? window.location.pathname : undefined,
            boundary: 'GlobalErrorBoundary',
        });
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            const soft = this.state.isEmailLanding;
            return (
                <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
                    <div className="mx-auto w-full max-w-sm">
                        <div
                            className={`flex flex-col items-center gap-3 rounded-3xl border p-6 text-center backdrop-blur-lg ${
                                soft
                                    ? 'border-amber-500/25 bg-amber-500/5'
                                    : 'border-red-500/20 bg-red-500/5'
                            }`}
                            role="alert"
                        >
                            <AlertCircle
                                size={48}
                                className={soft ? 'text-amber-400' : 'text-red-500'}
                                aria-hidden
                            />
                            <h2
                                className={`text-2xl font-black tracking-tight ${
                                    soft ? 'text-amber-300' : 'text-red-400'
                                }`}
                                style={{ letterSpacing: '-0.02em' }}
                            >
                                {soft ? 'Something went wrong' : 'System Malfunction'}
                            </h2>
                            <p className="text-sm text-slate-400">
                                {soft ? (
                                    <>
                                        We couldn&apos;t finish that email link. Your subscription may already be
                                        active — try again, or open the free terminal.
                                    </>
                                ) : (
                                    <>
                                        An unexpected error has occurred in the rendering pipeline.
                                        <br />
                                        {this.state.error?.message}
                                    </>
                                )}
                            </p>
                            <div className="mt-2 flex w-full flex-col gap-2">
                                <Button
                                    onClick={this.handleReload}
                                    variant="outline"
                                    className={`min-h-[44px] uppercase tracking-wider font-bold ${
                                        soft
                                            ? 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10'
                                            : 'border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300'
                                    }`}
                                    aria-label="Retry"
                                >
                                    <RotateCcw size={16} className="mr-2" />
                                    Try again
                                </Button>
                                {soft && (
                                    <Button
                                        onClick={this.handleHome}
                                        variant="outline"
                                        className="min-h-[44px] border-white/20 font-bold uppercase tracking-wider text-white/80 hover:bg-white/5"
                                        aria-label="Open free terminal"
                                    >
                                        <Home size={16} className="mr-2" />
                                        Open free terminal
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
