import React, { useMemo, useState } from 'react'
import { TrendingDown } from 'lucide-react'
import { GlobalTradePulse } from '../GlobalTradePulse'
import { GlobalImportPulse } from '../GlobalImportPulse'
import { IndiaChinaDeepDive } from '../IndiaChinaDeepDive'
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge'
import { useAvailableImportCountries } from '../../hooks/useAvailableImportCountries'
import { FALLBACK_REPORTERS, COMTRADE_PROVENANCE, TRADE_DATA_YEAR } from '../../constants'
import { isoToFlag } from '../../types/trade'
import { cn } from '@/lib/utils'

export const BilateralView: React.FC = () => {
    const [selectedISO, setSelectedISO] = useState('CHN')
    const { data: availableCountries = [] } = useAvailableImportCountries(20)

    const displayCountries = useMemo(() => {
        if (availableCountries.length > 0) {
            return availableCountries.map(c => ({
                iso3: c.iso3,
                name: c.name,
                iso2: c.iso2,
            }))
        }
        return [...FALLBACK_REPORTERS]
    }, [availableCountries])

    const selectedCountry = displayCountries.find(r => r.iso3 === selectedISO) ?? displayCountries[0]

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-white/40 font-semibold">
                    Side-by-side export and import chapter telemetry by country.
                </p>
                <DataProvenanceBadge
                    source={COMTRADE_PROVENANCE.source}
                    methodology={`2-digit HS chapters · ${TRADE_DATA_YEAR}`}
                    size="sm"
                />
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] shrink-0">Country</span>
                <div className="flex flex-wrap gap-2">
                    {displayCountries.map(r => (
                        <button
                            key={r.iso3}
                            onClick={() => setSelectedISO(r.iso3)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all',
                                selectedISO === r.iso3
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-white/5 text-white/40 border border-transparent hover:bg-white/10'
                            )}
                        >
                            <span className="mr-1.5">{isoToFlag(r.iso2)}</span>
                            {r.iso3}
                        </button>
                    ))}
                </div>
                <div className="sm:ml-auto flex items-center gap-2 text-[10px] font-bold text-white/25 uppercase tracking-wider shrink-0">
                    <TrendingDown className="w-3 h-3" />
                    UN Comtrade 2-Digit HS · {TRADE_DATA_YEAR}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/5">
                        <div className="w-2 h-6 rounded-full bg-emerald-500/60" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em]">Exports</span>
                        <span className="text-[9px] text-white/20 uppercase tracking-wider ml-1">
                            {isoToFlag(selectedCountry.iso2)} {selectedCountry.name}
                        </span>
                    </div>
                    <GlobalTradePulse selectedISO={selectedISO} onCountryChange={setSelectedISO} hideCountrySelector />
                </div>

                <div className="p-6 rounded-3xl bg-white/[0.02] border border-cyan-500/10">
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/5">
                        <div className="w-2 h-6 rounded-full bg-cyan-500/60" />
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.25em]">Imports</span>
                        <span className="text-[9px] text-white/20 uppercase tracking-wider ml-1">
                            {isoToFlag(selectedCountry.iso2)} {selectedCountry.name}
                        </span>
                    </div>
                    <GlobalImportPulse
                        selectedISO={selectedISO}
                        selectedCountryName={selectedCountry.name}
                        selectedISO2={selectedCountry.iso2}
                    />
                </div>
            </div>

            <IndiaChinaDeepDive />
        </div>
    )
}