import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe2, PackageSearch, Target, TrendingDown } from 'lucide-react'
import { HSCodeSearch } from '../features/trade/components/HSCodeSearch'
import { GlobalTradePulse } from '../features/trade/components/GlobalTradePulse'
import { GlobalImportPulse } from '../features/trade/components/GlobalImportPulse'
import { IndiaChinaDeepDive } from '../features/trade/components/IndiaChinaDeepDive'
import { RecentHSCodes } from '../features/trade/components/RecentHSCodes'
import type { HSCodeMaster } from '../features/trade/types/trade'
import { isoToFlag } from '../features/trade/types/trade'
import { SEOManager } from '@/components/SEOManager'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAvailableImportCountries } from '../features/trade/hooks/useAvailableImportCountries'
import { cn } from '@/lib/utils'
import { getStaleness } from '@/hooks/useStaleness'
import { FreshnessChip } from '@/components/FreshnessChip'

const FALLBACK_REPORTERS = [
    { iso3: 'USA', name: 'United States', iso2: 'US' },
    { iso3: 'CHN', name: 'China', iso2: 'CN' },
    { iso3: 'DEU', name: 'Germany', iso2: 'DE' },
    { iso3: 'JPN', name: 'Japan', iso2: 'JP' },
    { iso3: 'IND', name: 'India', iso2: 'IN' },
    { iso3: 'GBR', name: 'United Kingdom', iso2: 'GB' },
    { iso3: 'FRA', name: 'France', iso2: 'FR' },
    { iso3: 'KOR', name: 'South Korea', iso2: 'KR' },
]

const TradeIntelligencePage: React.FC = () => {
    const navigate = useNavigate()
    // Lifted country selector — shared by both Exports and Imports panels
    const [selectedISO, setSelectedISO] = useState('CHN')

    const { data: availableCountries = [] } = useAvailableImportCountries(20)

    // Use dynamic countries if available, fallback to hardcoded list
    const displayCountries = useMemo(() => {
        if (availableCountries.length > 0) {
            return availableCountries.map(c => ({
                iso3: c.iso3,
                name: c.name,
                iso2: c.iso2,
            }))
        }
        return FALLBACK_REPORTERS
    }, [availableCountries])

    const selectedCountry = displayCountries.find(r => r.iso3 === selectedISO) ?? displayCountries[0]

    const handleSelect = (code: HSCodeMaster) => {
        navigate(`/trade/hs/${code.code}`)
    }

    const { data: latestLog } = useQuery({
        queryKey: ['trade-ingestion-log'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ingestion_logs')
                .select('*')
                .eq('function_name', 'ingest-trade-global-pulse')
                .order('start_time', { ascending: false })
                .limit(1);
            if (error) {
                console.error('[TradePage] Error fetching ingestion log:', error);
                return null;
            }
            return data && data.length > 0 ? data[0] : null;
        },
        refetchInterval: 30000
    });
    const dataFreshness = getStaleness(latestLog?.start_time, 'daily');

    return (
        <div className="max-w-[1400px] mx-auto space-y-16 pb-24">
            <SEOManager
                title="Trade Intelligence Engine | Annual UN Comtrade (2023) Bilateral Flows"
                description="Annual UN Comtrade (2023) bilateral trade telemetry tracking 6-digit HS codes, market opportunity scoring, supplier concentration (HHI), and global demand shifts."
                keywords={[
                    'Global Trade Intelligence', 'HS Code Opportunity Scoring', 'UN Comtrade Telemetry',
                    'Supplier Dominance Analysis', 'Herfindahl-Hirschman Index', 'Export Scout Playbook',
                    'Import Vulnerability Analysis', 'Multipolar Trade Flows', 'Bilateral Trade Data'
                ]}
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "Dataset",
                    "@id": "https://graphiquestor.com/trade#dataset",
                    "name": "Global Bilateral HS-6 Trade Intelligence Dataset",
                    "description": "Annual UN Comtrade (2023) bilateral trade flows, HHI concentration, supplier dominance, and macroeconomic opportunity scoring based on 5-year UN Comtrade trend lines.",
                    "url": "https://graphiquestor.com/trade",
                    "creator": {
                        "@id": "https://graphiquestor.com/#organization"
                    },
                    "temporalCoverage": "2020-01-01/2026-05-30",
                    "spatialCoverage": "Worldwide"
                }}
            />

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="space-y-4 text-center mt-12">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 mb-2">
                    <Globe2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="flex items-center justify-center gap-3">
                    <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-heading uppercase">
                        Trade Intelligence
                    </h1>
                    <FreshnessChip status={dataFreshness.state} lastUpdated={latestLog?.start_time} />
                </div>
                <p className="text-sm font-bold text-emerald-400/80 uppercase tracking-[0.2em] max-w-2xl mx-auto">
                    Global Demand · Supplier Competition · Import Vulnerabilities · Macro Overlay
                </p>
                {latestLog && (
                    <div className="flex justify-center mt-4 animate-in fade-in duration-500">
                        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${
                            latestLog.status === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                            <span className="flex h-1.5 w-1.5 relative shrink-0">
                                {latestLog.status === 'success' ? (
                                    <>
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                    </>
                                ) : (
                                    <>
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                    </>
                                )}
                            </span>
                            Pipeline: {latestLog.status} · Ingested: {new Date(latestLog.completed_at || latestLog.start_time).toLocaleDateString()} {new Date(latestLog.completed_at || latestLog.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Section 1: Dual-Panel Trade Pulse (Exports + Imports) ───── */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
                {/* Shared Country Selector */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2 shrink-0">
                        <Globe2 className="w-4 h-4 text-white/30" />
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Country</span>
                    </div>
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
                        UN Comtrade 2-Digit HS · 2023
                    </div>
                </div>

                {/* Side-by-side panels */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                    {/* LEFT: Exports */}
                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-emerald-500/10 shadow-[0_0_60px_rgba(16,185,129,0.04)] backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/5">
                            <div className="w-2 h-6 rounded-full bg-emerald-500/60" />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em]">
                                Exports
                            </span>
                            <span className="text-[9px] text-white/20 uppercase tracking-wider ml-1">
                                {isoToFlag(selectedCountry.iso2)} {selectedCountry.name}
                            </span>
                        </div>
                        <GlobalTradePulse
                            selectedISO={selectedISO}
                            onCountryChange={setSelectedISO}
                            hideCountrySelector
                        />
                    </div>

                    {/* RIGHT: Imports */}
                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-cyan-500/10 shadow-[0_0_60px_rgba(6,182,212,0.04)] backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/5">
                            <div className="w-2 h-6 rounded-full bg-cyan-500/60" />
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.25em]">
                                Imports
                            </span>
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
            </section>

            {/* ── Section 2: Product Deep Dive ────────────────────────────── */}
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
                            <RecentHSCodes />
                        </div>
                    </div>

                    {/* Features Grid */}
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

            {/* ── Section 3: India vs China (6-Digit HS) ────────────────── */}
            <div className="w-full pt-8 border-t border-white/5">
                <IndiaChinaDeepDive />
            </div>
        </div>
    )
}


export default TradeIntelligencePage
