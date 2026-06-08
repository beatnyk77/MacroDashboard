import React, { useState } from 'react';
import { useUKTraderIntel } from '../../hooks/useUKTraderIntel';
import { Lock, Search, AlertCircle, RefreshCw, Building2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UKTraderDirectoryProps {
    code: string;
}

export const UKTraderDirectory: React.FC<UKTraderDirectoryProps> = ({ code }) => {
    // For demonstration of the paid feature, we simulate a non-premium user
    const [isPremium, setIsPremium] = useState(false);
    
    // We pass isPremium to the hook to fetch data only if premium
    const { data: traders, isLoading, error, refetch } = useUKTraderIntel(code, isPremium);

    return (
        <div className="relative flex flex-col h-full bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/80">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        <Building2 size={16} className="text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-100">UK Target Entities Reconnaissance</h3>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">HMRC Overseas Trade API</p>
                    </div>
                </div>
                {!isPremium && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                        <Lock size={12} className="text-amber-400" />
                        <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">Pro Feature</span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="relative flex-1 p-0 min-h-[300px]">
                {!isPremium ? (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-zinc-950/60 backdrop-blur-sm">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-2xl">
                            <Lock size={24} className="text-zinc-500" />
                        </div>
                        <h4 className="text-lg font-medium text-zinc-200 mb-2">Institutional Tier Required</h4>
                        <p className="text-sm text-zinc-400 text-center max-w-sm mb-6 leading-relaxed">
                            Unlock entity-level reconnaissance for HS {code}. Discover actual UK importers and exporters, complete with postcodes and bilateral trade routing data.
                        </p>
                        <button 
                            onClick={() => setIsPremium(true)}
                            className="px-6 py-2 bg-zinc-100 text-zinc-900 font-medium text-sm rounded-lg hover:bg-white transition-colors flex items-center gap-2"
                        >
                            Unlock Intelligence
                        </button>
                    </div>
                ) : null}

                {/* If not premium, we render a blurred mock skeleton to show what the table looks like */}
                <div className={cn("flex flex-col h-full", !isPremium && "opacity-40 blur-sm pointer-events-none")}>
                    
                    {isLoading && isPremium && (
                        <div className="flex items-center justify-center h-full">
                            <RefreshCw size={24} className="text-zinc-500 animate-spin" />
                        </div>
                    )}

                    {error && isPremium && (
                        <div className="flex items-center justify-center h-full text-red-400 flex-col gap-2">
                            <AlertCircle size={24} />
                            <span className="text-sm">Failed to load trader data</span>
                            <button onClick={() => refetch()} className="text-xs underline hover:text-red-300">Retry</button>
                        </div>
                    )}

                    {!isLoading && !error && (traders?.length === 0) && isPremium && (
                        <div className="flex items-center justify-center h-full text-zinc-500 flex-col gap-2">
                            <Search size={24} />
                            <span className="text-sm">No specific trader data found for HS {code}</span>
                        </div>
                    )}

                    {/* Table View */}
                    {((traders && traders.length > 0) || !isPremium) && (
                        <div className="overflow-auto h-[400px]">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-zinc-400">Company Name</th>
                                        <th className="px-4 py-3 font-medium text-zinc-400">Postcode</th>
                                        <th className="px-4 py-3 font-medium text-zinc-400">Flow</th>
                                        <th className="px-4 py-3 font-medium text-zinc-400">Month</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {/* Real Data Render */}
                                    {isPremium && traders?.map((trader) => (
                                        <tr key={trader.id} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-zinc-200">
                                                {trader.company_name}
                                            </td>
                                            <td className="px-4 py-3 text-zinc-400">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={12} className="text-zinc-500" />
                                                    {trader.postcode || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider",
                                                    trader.flow_type === 'Import' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                )}>
                                                    {trader.flow_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                                                {trader.month_id}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Mock Data for Non-Premium Blurred State */}
                                    {!isPremium && Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-zinc-200">
                                                {['AeroTech Supply Ltd', 'Global Components UK', 'Meridian Logistics', 'Apex Industrial Solutions'][i % 4]}
                                            </td>
                                            <td className="px-4 py-3 text-zinc-400">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={12} className="text-zinc-500" />
                                                    {['EC1A 1BB', 'M1 1AE', 'B1 1QU', 'LS1 1UR'][i % 4]}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                                    Import
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                                                202401
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
