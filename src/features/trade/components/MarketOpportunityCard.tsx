import React from 'react'
import { ShieldAlert, Trophy, TrendingUp, AlertTriangle } from 'lucide-react'
import { OpportunityScoreBadge } from './OpportunityScoreBadge'
import type { OpportunityScore } from '../types/trade'
import { buildOpportunityTags, buildInsightText } from '../types/trade'

interface MarketOpportunityCardProps {
    score: OpportunityScore
}

export const MarketOpportunityCard: React.FC<MarketOpportunityCardProps> = ({ score }) => {
    const tags = buildOpportunityTags(score)
    const insight = buildInsightText(score)

    return (
        <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 relative overflow-hidden group">
            {/* Background gradient flare */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="flex items-start justify-between mb-6">
                <div className="space-y-1">
                    <h3 className="text-sm font-black text-white italic tracking-heading uppercase">Opportunity Analysis</h3>
                    <p className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-uppercase">AI-Driven Synthesis</p>
                </div>
                <OpportunityScoreBadge score={score.overall_score} size="md" />
            </div>

            <div className="space-y-6 relative z-10">
                <p className="text-sm leading-relaxed text-white/80 font-medium">
                    {insight}
                </p>

                <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                        <span key={tag} className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-white/10 text-white border border-white/5">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Score breakdown mini-bars */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                        <span>Component Breakdown</span>
                        <span>0-100</span>
                    </div>

                    {[
                        { label: 'Market Size', value: score.market_size_score, icon: Trophy },
                        { label: 'Growth Trend', value: score.growth_score, icon: TrendingUp },
                        { label: 'Macro Stability', value: score.macro_score, icon: AlertTriangle },
                    ].map(item => (
                        <div key={item.label} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-white/60">
                                    <item.icon className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                                </div>
                                <span className="text-[10px] font-black font-mono text-white/80">{item.value}</span>
                            </div>
                            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 rounded-full" 
                                    style={{ width: `${item.value}%` }} 
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
