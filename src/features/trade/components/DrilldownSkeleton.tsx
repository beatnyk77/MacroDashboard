import React from 'react';

export const DrilldownSkeleton: React.FC = () => {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2/3): Charts */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 h-72">
                        <div className="flex justify-between mb-8">
                            <div className="space-y-2">
                                <div className="h-3 bg-white/10 rounded w-32"></div>
                                <div className="h-2 bg-white/5 rounded w-20"></div>
                            </div>
                            <div className="h-6 w-20 bg-white/5 rounded-lg"></div>
                        </div>
                        <div className="h-40 w-full bg-white/5 rounded-2xl"></div>
                    </div>
                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 h-72">
                        <div className="flex justify-between mb-8">
                            <div className="space-y-2">
                                <div className="h-3 bg-white/10 rounded w-32"></div>
                                <div className="h-2 bg-white/5 rounded w-20"></div>
                            </div>
                        </div>
                        <div className="h-40 w-full bg-white/5 rounded-2xl"></div>
                    </div>
                </div>

                {/* Right Column (1/3): Context & Macro */}
                <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 h-64">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-white/5"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-white/10 rounded w-24"></div>
                                <div className="h-3 bg-white/5 rounded w-16"></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="h-8 bg-white/5 rounded w-full"></div>
                            <div className="h-8 bg-white/5 rounded w-full"></div>
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 h-96">
                        <div className="h-3 bg-white/10 rounded w-32 mb-6"></div>
                        <div className="space-y-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="h-3 bg-white/5 rounded w-20"></div>
                                    <div className="h-3 bg-white/10 rounded w-12"></div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 h-12 bg-white/5 rounded-xl w-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
