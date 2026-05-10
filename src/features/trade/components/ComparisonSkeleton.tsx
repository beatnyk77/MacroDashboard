import React from 'react';

export const ComparisonSkeleton: React.FC = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
            {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/5 rounded-full"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-white/10 rounded w-32"></div>
                                <div className="h-3 bg-white/5 rounded w-20"></div>
                            </div>
                        </div>
                        <div className="h-6 w-16 bg-white/5 rounded"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="h-3 bg-white/5 rounded w-16"></div>
                            <div className="h-8 bg-white/10 rounded w-full"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 bg-white/5 rounded w-16"></div>
                            <div className="h-8 bg-white/10 rounded w-full"></div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 space-y-4">
                        <div className="h-3 bg-white/5 rounded w-32"></div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-white/10 rounded-full w-2/3"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
