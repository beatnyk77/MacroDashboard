import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe2, PackageSearch, Target } from 'lucide-react'
import { HSCodeSearch } from '../features/trade/components/HSCodeSearch'
import { GlobalTradePulse } from '../features/trade/components/GlobalTradePulse'
import { IndiaChinaDeepDive } from '../features/trade/components/IndiaChinaDeepDive'
import type { HSCodeMaster } from '../features/trade/types/trade'

const TradeIntelligencePage: React.FC = () => {
    const navigate = useNavigate()

    const handleSelect = (code: HSCodeMaster) => {
        navigate(`/trade/hs/${code.code}`)
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-16 pb-24">
            {/* Header */}
            <div className="space-y-4 text-center mt-12">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 mb-2">
                    <Globe2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-heading uppercase">
                    Trade Intelligence
                </h1>
                <p className="text-sm font-bold text-emerald-400/80 uppercase tracking-[0.2em] max-w-2xl mx-auto">
                    Global Demand • Supplier Competition • Macro Overlay
                </p>
            </div>

            {/* Section 1: Global Pulse (2-Digit HS) */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <GlobalTradePulse />
            </section>

            {/* Section 2: Main Search Terminal */}
            <div className="flex justify-center pt-8 border-t border-white/5">
                <div className="w-full max-w-2xl space-y-8">
                    <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative">
                        <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
                        
                        <div className="relative space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-lg font-black text-white uppercase tracking-widest">
                                    Product Deep Dive
                                </h2>
                                <p className="text-xs text-white/40 font-semibold">
                                    Search 6-digit HS codes for precise market opportunity scoring.
                                </p>
                            </div>

                            <HSCodeSearch 
                                onSelect={handleSelect}
                                className="scale-105 transform origin-top shadow-xl shadow-black/50"
                            />
                        </div>
                    </div>

                    {/* Features Grid - Horizontal in own row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            {
                                icon: PackageSearch,
                                title: "Global Demand",
                                desc: "Discover growth based on 5-year UN Comtrade trends."
                            },
                            {
                                icon: Target,
                                title: "Competition",
                                desc: "Analyze HHI concentration and supplier dominance."
                            }
                        ].map((f, i) => (
                            <div key={i} className="flex gap-4 p-5 rounded-2xl bg-white/[0.01] border border-white/5">
                                <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center">
                                    <f.icon className="w-5 h-5 text-white/60" />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">{f.title}</h3>
                                    <p className="text-[10px] text-white/40 leading-relaxed font-semibold">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Section 3: India vs China (6-Digit HS) */}
            <div className="w-full pt-8 border-t border-white/5">
                <IndiaChinaDeepDive />
            </div>
        </div>
    )
}


export default TradeIntelligencePage
