import React from 'react';

export const TradeRankerSkeleton: React.FC = () => {
    return (
        <div className="w-full space-y-4 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-slate-800/30 rounded-2xl border border-slate-800/50"></div>
                ))}
            </div>
            
            <div className="border border-slate-800/50 rounded-xl overflow-hidden bg-slate-900/20">
                <div className="bg-slate-800/30 p-4 border-b border-slate-800/50">
                    <div className="grid grid-cols-6 gap-4">
                        <div className="h-4 bg-slate-700/50 rounded w-24"></div>
                        <div className="h-4 bg-slate-700/50 rounded w-32"></div>
                        <div className="h-4 bg-slate-700/50 rounded w-24"></div>
                        <div className="h-4 bg-slate-700/50 rounded w-20"></div>
                        <div className="h-4 bg-slate-700/50 rounded w-24"></div>
                        <div className="h-4 bg-slate-700/50 rounded w-28"></div>
                    </div>
                </div>
                
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="p-4 border-b border-slate-800/30 flex items-center space-x-4">
                        <div className="h-10 w-10 bg-slate-800/50 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 grid grid-cols-5 gap-4">
                            <div className="h-4 bg-slate-800/50 rounded w-full"></div>
                            <div className="h-4 bg-slate-800/50 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-800/50 rounded w-1/2"></div>
                            <div className="h-4 bg-slate-800/50 rounded w-2/3"></div>
                            <div className="h-8 bg-slate-800/50 rounded-full w-24 ml-auto"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
