import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe2, ArrowRight } from 'lucide-react'
import { HSCodeSearch } from './HSCodeSearch'
import type { HSCodeMaster } from '../types/trade'

export const TradeEntryBanner: React.FC = () => {
    const navigate = useNavigate()

    const handleSelect = (code: HSCodeMaster) => {
        navigate(`/trade/hs/${code.code}`)
    }

    return (
        <div className="relative p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/20 overflow-hidden group">
            {/* Background Map Graphic (abstract representation) */}
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                <Globe2 className="w-96 h-96 text-emerald-500" strokeWidth={1} />
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white italic tracking-heading uppercase">
                            Find Your Next Export Market
                        </h3>
                        <p className="text-xs font-bold text-emerald-400/80 uppercase tracking-[0.2em]">
                            Global Demand • Supplier Competition • Macro Overlay
                        </p>
                    </div>
                    <p className="text-sm text-white/60 font-medium leading-relaxed max-w-md">
                        Instantly rank the world's most lucrative destination markets for any product. 
                        We fuse UN Comtrade bilateral flows with real-time macroeconomic health scores to uncover high-opportunity, low-competition entry points.
                    </p>
                </div>

                <div className="space-y-4 bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                        Enter HS Code to Begin
                    </p>
                    <HSCodeSearch 
                        onSelect={handleSelect} 
                        placeholder="e.g. 8542 (Semiconductors) or 6203 (Mens Suits)"
                    />
                    <div className="pt-2 flex items-center justify-between">
                        <div className="flex gap-2">
                            {['8542', '6203', '3004'].map(code => (
                                <button
                                    key={code}
                                    onClick={() => navigate(`/trade/hs/${code}`)}
                                    className="text-[10px] font-bold font-mono text-emerald-400/80 hover:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded"
                                >
                                    {code}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => navigate('/trade')}
                            className="text-[10px] font-black uppercase tracking-widest text-white hover:text-emerald-400 transition-colors flex items-center gap-1"
                        >
                            Advanced <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
