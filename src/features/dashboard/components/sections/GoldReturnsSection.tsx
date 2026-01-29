import React from 'react';
import { SectionHeader } from '@/components/SectionHeader';
import GoldReturnsChart from '../charts/GoldReturnsChart';
import { TrendingUp, Map } from 'lucide-react';

const GoldReturnsSection: React.FC = () => {
    return (
        <section id="gold-returns-events" className="scroll-mt-24 space-y-6">
            <SectionHeader
                title="Gold – Historical Monthly Returns & Major Shocks"
                subtitle="Analyzing gold's performance through 50 years of geopolitical and economic volatility."
                icon={<TrendingUp className="w-5 h-5 text-yellow-500" />}
            />

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Map className="w-24 h-24 text-yellow-500" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Institutional Memory</h3>
                                <p className="text-gray-400 text-sm mt-1">Highlighted bars indicate major systemic events or policy shocks.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-emerald-500/80"></div>
                                    <span className="text-xs text-gray-400 font-mono">Positive</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-red-500/80"></div>
                                    <span className="text-xs text-gray-400 font-mono">Negative</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
                                    <span className="text-xs text-gray-400 font-mono">Event</span>
                                </div>
                            </div>
                        </div>

                        <GoldReturnsChart />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GoldReturnsSection;
