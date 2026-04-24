import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe2, PackageSearch, BarChart3, Target } from 'lucide-react'
import { HSCodeSearch } from '../features/trade/components/HSCodeSearch'
import type { HSCodeMaster } from '../features/trade/types/trade'

const TradeIntelligencePage: React.FC = () => {
    const navigate = useNavigate()

    const handleSelect = (code: HSCodeMaster) => {
        navigate(`/trade/hs/${code.code}`)
    }

    const categories = [
        { label: 'Semiconductors & Electronics', code: '85', icon: '⚡' },
        { label: 'Apparel & Textiles', code: '61', icon: '👕' },
        { label: 'Machinery & Equipment', code: '84', icon: '⚙️' },
        { label: 'Pharmaceuticals', code: '30', icon: '💊' },
        { label: 'Vehicles & Automotive', code: '87', icon: '🚗' },
        { label: 'Plastics & Polymers', code: '39', icon: '🧪' },
    ]

    return (
        <div className="max-w-6xl mx-auto space-y-16 pb-24">
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
                <p className="text-white/60 max-w-xl mx-auto pt-2">
                    Instantly rank the world's most lucrative destination markets for any product.
                    We fuse UN Comtrade bilateral flows with real-time macroeconomic health scores.
                </p>
            </div>

            {/* Main Search */}
            <div className="max-w-2xl mx-auto bg-white/[0.02] border border-white/5 p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative">
                {/* Decorative glow */}
                <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
                
                <div className="relative space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-lg font-black text-white uppercase tracking-widest">
                            Enter HS Code
                        </h2>
                        <p className="text-xs text-white/40 font-semibold">
                            Search by 2, 4, or 6-digit Harmonized System code or product name.
                        </p>
                    </div>

                    <HSCodeSearch 
                        onSelect={handleSelect}
                        autoFocus
                        className="scale-105 transform origin-top shadow-xl shadow-black/50"
                    />

                    <div className="pt-8 border-t border-white/5">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 text-center">
                            Popular Categories
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {categories.map(c => (
                                <button
                                    key={c.code}
                                    onClick={() => navigate(`/trade/hs/${c.code}`)}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all group"
                                >
                                    <span className="text-2xl mb-2 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{c.icon}</span>
                                    <span className="text-[10px] font-bold text-white/60 group-hover:text-emerald-400 uppercase tracking-widest text-center">
                                        {c.label}
                                    </span>
                                    <span className="text-[10px] font-mono text-white/30 mt-1">
                                        Ch. {c.code}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-white/5">
                {[
                    {
                        icon: PackageSearch,
                        title: "Global Demand Ranking",
                        desc: "Discover where demand is growing fastest based on 5-year UN Comtrade import value trends."
                    },
                    {
                        icon: Target,
                        title: "Competition Analysis",
                        desc: "Analyze HHI concentration and dominant suppliers to find fragmented, open markets."
                    },
                    {
                        icon: BarChart3,
                        title: "Macro Overlay",
                        desc: "Filter out risky markets. We overlay GDP, Inflation, and FX stability on top of trade flows."
                    }
                ].map((f, i) => (
                    <div key={i} className="space-y-4 p-6 rounded-3xl bg-white/[0.01]">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                            <f.icon className="w-5 h-5 text-white/60" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">{f.title}</h3>
                        <p className="text-xs text-white/40 leading-relaxed font-semibold">{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default TradeIntelligencePage
