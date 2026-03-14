import React from 'react';
import { motion } from 'framer-motion';
import { useChinaFYP } from '@/hooks/useChinaFYP';
import { Calendar } from 'lucide-react';

export const FYP_HeroTimeline: React.FC = () => {
    const { data } = useChinaFYP();
    const milestones = data?.filter(item => item.section === 'milestone') || [];

    return (
        <div className="relative py-12 px-4 overflow-hidden">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent -translate-y-1/2" />
            
            <div className="relative flex justify-between items-start max-w-6xl mx-auto gap-8 overflow-x-auto pb-8 scrollbar-hide">
                {milestones.map((ms, idx) => (
                    <motion.div 
                        key={ms.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex flex-col items-center min-w-[180px] group"
                    >
                        {/* Year Node */}
                        <div className="mb-6 relative">
                            <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-red-500/20 flex items-center justify-center group-hover:border-red-500 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                                <Calendar className="text-red-500" size={20} />
                            </div>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-lg font-black text-white italic">
                                {ms.label}
                            </div>
                        </div>

                        {/* Event Content */}
                        <div className="text-center space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:bg-white/[0.05] transition-all group-hover:border-red-500/30">
                            <h4 className="text-[0.65rem] font-black uppercase tracking-widest text-red-400">
                                {ms.value_target}
                            </h4>
                            <p className="text-[0.6rem] text-muted-foreground leading-relaxed line-clamp-3">
                                {ms.metadata?.event}
                            </p>
                        </div>

                        {/* Indicator */}
                        <div className="mt-4 flex flex-col items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <div className="w-[1px] h-8 bg-red-500/20" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
