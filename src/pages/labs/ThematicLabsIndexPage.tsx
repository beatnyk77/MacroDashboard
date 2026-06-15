import React from 'react';

import { 
    Globe, TrendingUp, Anchor,
    ShieldAlert, Database,
    Zap, Cpu, BarChart3, Compass, Library
} from 'lucide-react';
import { SEOManager } from '@/components/SEOManager';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { TrailLink } from '@/components/TrailLink';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LabItem {
    id: string;
    name: string;
    path: string;
    icon: React.ReactNode;
    color: string;
    description: string;
    methodology: string;
    primaryIndicators: string[];
    dataSource: string;
    status: 'Nominal' | 'Active' | 'Beta';
}

const labsList: LabItem[] = [
    {
        id: 'us-macro',
        name: 'US Macro & Fiscal Lab',
        path: '/labs/us-macro-fiscal',
        icon: <TrendingUp className="w-6 h-6 text-blue-400" />,
        color: 'from-blue-500/10 to-indigo-500/5 hover:border-blue-500/30',
        description: 'High-frequency monetary liquidity mapping and fiscal stress telemetry. Tracks the systemic plumbline of the global financial core.',
        methodology: 'Monetary base Z-score mapping (25-year structural boundaries) fused with Treasury auction bids and maturity schedules.',
        primaryIndicators: ['US Net Liquidity Proxy', 'Treasury General Account (TGA) Balance', 'Reverse Repo (RRP) Facility', 'US Debt Maturity Wall'],
        dataSource: 'FRED / US Treasury Dept',
        status: 'Active'
    },
    {
        id: 'de-dollarization',
        name: 'De-Dollarization & Gold',
        path: '/labs/de-dollarization-gold',
        icon: <Anchor className="w-6 h-6 text-yellow-400" />,
        color: 'from-yellow-500/10 to-amber-500/5 hover:border-yellow-500/30',
        description: 'Surveillance of central bank asset diversification, international trade settlements outside the SWIFT network, and hard asset pricing dynamics.',
        methodology: 'Global sovereign reserve allocation divergence vs. physical gold positioning indicators.',
        primaryIndicators: ['Central Bank Gold Purchases', 'Sovereign Debt-to-Gold Ratio', 'SWIFT vs. Non-SWIFT Settlements', 'BRICS+ Reserve Diversification'],
        dataSource: 'IMF / World Gold Council',
        status: 'Active'
    },
    {
        id: 'india-pulse',
        name: 'India Macro Pulse',
        path: '/intel/india',
        icon: <Globe className="w-6 h-6 text-emerald-400" />,
        color: 'from-emerald-500/10 to-teal-500/5 hover:border-emerald-500/30',
        description: 'Deep-dive micro-surveillance of the Indian growth premium, monetary transmission cycles, and state-level capital spending pipelines.',
        methodology: 'RBI liquidity stress monitoring matched with Ministry of Statistics core industrial production outputs.',
        primaryIndicators: ['MOSPI Industrial Production (IIP)', 'RBI FX Capital Account Defense', 'Digitization Premium Index', 'Corporate Credit Cycle Clock'],
        dataSource: 'RBI DBIE / MOSPI India',
        status: 'Active'
    },
    {
        id: 'china-pulse',
        name: 'China Macro Pulse',
        path: '/intel/china',
        icon: <Zap className="w-6 h-6 text-rose-400" />,
        color: 'from-rose-500/10 to-red-500/5 hover:border-rose-500/30',
        description: 'Granular provincial tracking of credit aggregates, central bank liquidity operations, and industrial manufacturing capacity shifts.',
        methodology: 'PBOC aggregate credit injections matched with physical energy grid utilization and high-frequency property stress indicators.',
        primaryIndicators: ['Aggregate Financing (TSF)', 'PBOC Credit Injections', 'Provincial Growth Divergence Matrix', 'Real Economy Manufacture Proxies'],
        dataSource: 'PBOC / National Bureau of Stats',
        status: 'Active'
    },
    {
        id: 'commodities',
        name: 'Energy & Commodities Lab',
        path: '/labs/energy-commodities',
        icon: <Database className="w-6 h-6 text-orange-400" />,
        color: 'from-orange-500/10 to-red-500/5 hover:border-orange-500/30',
        description: 'Physical trade flows, strategic oil reserves, refining margins, and commodity term-structure spreads tracking the structural energy deficit.',
        methodology: 'Bilateral tanker flow mapping, refinery capacity constraints, and prompt-month futures spread matrices.',
        primaryIndicators: ['Prompt-Month Calendar Spreads', 'Bilateral Maritime Flows', 'Strategic Petroleum Reserve (SPR) Levels', 'Global Refining Capacity Stress'],
        dataSource: 'EIA / UN Comtrade / OPEC',
        status: 'Active'
    },
    {
        id: 'sovereign-stress',
        name: 'Sovereign Stress Lab',
        path: '/labs/sovereign-stress',
        icon: <ShieldAlert className="w-6 h-6 text-purple-400" />,
        color: 'from-purple-500/10 to-fuchsia-500/5 hover:border-purple-500/30',
        description: 'Debt sustainability, structural interest coverage, sovereign CDS spreads, and yield curve inversion models for G20 nations.',
        methodology: 'Debt service cost ratios vs. fiscal revenue capacities with real-time volatility thresholds.',
        primaryIndicators: ['Sovereign CDS Spreads', 'Interest Service-to-Revenue Ratio', 'Yield Curve Divergence Index', 'Debt-to-GDP Real Thresholds'],
        dataSource: 'BIS / IMF Sovereign Database',
        status: 'Active'
    },
    {
        id: 'shadow-system',
        name: 'Shadow System Lab',
        path: '/labs/shadow-system',
        icon: <Cpu className="w-6 h-6 text-cyan-400" />,
        color: 'from-cyan-500/10 to-blue-500/5 hover:border-cyan-500/30',
        description: 'Monitoring of non-bank liquidity conduits, eurodollar funding stresses, offshore leverage, and private repurchase plumbing.',
        methodology: 'Cross-border repo rate stress indicators and offshore dollar funding basis spreads.',
        primaryIndicators: ['SOFR-Repo Basis Spread', 'Eurodollar Funding Basis', 'Non-Bank Financial Leverage Indices', 'Offshore Collateral Velocity'],
        dataSource: 'Federal Reserve / BIS',
        status: 'Active'
    },
    {
        id: 'china-fyp',
        name: 'China 15th FYP Lab',
        path: '/labs/china-15th-fyp',
        icon: <BarChart3 className="w-6 h-6 text-amber-500" />,
        color: 'from-amber-500/10 to-orange-500/5 hover:border-amber-500/30',
        description: 'Strategic surveillance of industrial policy pivots, government clean energy allocations, and resource stockpiling indices for the upcoming 15th Five-Year Plan.',
        methodology: 'Provincial capital allocation mapping vs. physical supply chain investment.',
        primaryIndicators: ['Strategic Metals Allocation', 'Green Energy Grid Additions', 'Advanced Lithography Injections', 'Local Debt Swap Velocities'],
        dataSource: 'NDRC / Ministry of Commerce CN',
        status: 'Active'
    },
    {
        id: 'africa-pulse',
        name: 'Africa Macro Pulse',
        path: '/labs/africa-macro',
        icon: <Compass className="w-6 h-6 text-pink-400" />,
        color: 'from-pink-500/10 to-rose-500/5 hover:border-pink-500/30',
        description: 'Surveillance of resources, infrastructure financing dynamics, structural currency debasement, and physical bilateral commerce ratios across the continent.',
        methodology: 'Bilateral mining royalty benchmarks matched with food import security index dynamics.',
        primaryIndicators: ['Mining Royalty Benchmarks', 'Bilateral Debt Liabilities', 'Currency Volatility Thresholds', 'Food Import Dependence Index'],
        dataSource: 'AfDB / African Union / Comtrade',
        status: 'Active'
    },
    {
        id: 'central-bank-gold',
        name: 'Central Bank Gold Purchases',
        path: '/labs/central-bank-gold-purchases',
        icon: <Anchor className="w-6 h-6 text-yellow-300" />,
        color: 'from-yellow-400/10 to-yellow-600/5 hover:border-yellow-400/30',
        description: 'Real-time tracking of global central bank gold accumulation, PBoC and RBI reserve build-up, and the structural de-dollarization via hard asset rotation.',
        methodology: 'IMF COFER + World Gold Council quarterly data reconciled against SWIFT cross-border reserve flow proxies.',
        primaryIndicators: ['PBoC Gold Accumulation Rate', 'RBI Reserve Diversification', 'Net Central Bank Purchases (QoQ)', 'Gold-to-FX Reserve Ratio'],
        dataSource: 'IMF / World Gold Council / BIS',
        status: 'Active'
    },
    {
        id: 'brics-trade',
        name: 'BRICS Trade Settlement',
        path: '/labs/brics-trade-settlement',
        icon: <Globe className="w-6 h-6 text-teal-400" />,
        color: 'from-teal-500/10 to-cyan-500/5 hover:border-teal-500/30',
        description: 'Monitor BRICS bilateral trade settlement volumes, local currency adoption rates, and the structural gravity shift away from USD-denominated G7 trade networks.',
        methodology: 'UN Comtrade bilateral flow analysis cross-referenced with SWIFT message volume divergence and CNH settlement data.',
        primaryIndicators: ['Local Currency Settlement Share', 'BRICS Bilateral Trade Volumes', 'SWIFT vs. Non-SWIFT Divergence', 'CNH/INR/BRL Settlement Growth'],
        dataSource: 'UN Comtrade / SWIFT / PBoC',
        status: 'Active'
    },
    {
        id: 'us-treasury-holdings',
        name: 'US Treasury Foreign Holdings',
        path: '/labs/us-treasury-foreign-holdings',
        icon: <Library className="w-6 h-6 text-indigo-400" />,
        color: 'from-indigo-500/10 to-blue-500/5 hover:border-indigo-500/30',
        description: 'Deep analysis of foreign central bank UST holdings, sovereign selloff trajectories, and the fiscal dominance implications of declining demand at Treasury auctions.',
        methodology: 'TIC data cross-referenced with auction bid-to-cover ratios and primary dealer positioning to identify structural demand erosion.',
        primaryIndicators: ['Foreign UST Holdings (TIC Data)', 'Auction Bid-to-Cover Ratio', 'China / Japan Liquidation Rate', 'Primary Dealer Absorption Rate'],
        dataSource: 'US Treasury TIC / Federal Reserve',
        status: 'Active'
    },
    {
        id: 'petrodollar-decay',
        name: 'Petrodollar Decay Indicators',
        path: '/labs/petrodollar-decay-indicators',
        icon: <Zap className="w-6 h-6 text-orange-300" />,
        color: 'from-orange-400/10 to-red-500/5 hover:border-orange-400/30',
        description: 'Structural decay monitoring of the USD-oil peg system, Petroyuan settlement adoption, and the Gold/Oil revaluation scenario as the recycling mechanism fractures.',
        methodology: 'Saudi Aramco settlement currency composition, CNY oil futures open interest, and OPEC+ invoice currency tracking.',
        primaryIndicators: ['CNY-Denominated Oil Settlement Share', 'Petroyuan Futures OI', 'Gold/Oil Revaluation Ratio', 'OPEC+ Invoice Currency Breakdown'],
        dataSource: 'EIA / OPEC / Shanghai INE / PBOC',
        status: 'Active'
    }
];

export const ThematicLabsIndexPage: React.FC = () => {
    return (
        <div className="w-full max-w-[1400px] mx-auto space-y-12 pb-24 px-4 sm:px-6">
            <SEOManager
                title="Thematic Macro Labs | Institutional Research Hub"
                description="GraphiQuestor analytical laboratories tracking structural macroeconomic shifts: US net liquidity plumbline, sovereign stress thresholds, de-dollarization flows, and India/China credit aggregates."
                keywords={[
                    'Macroeconomic research labs', 'Sovereign stress terminal', 'US Net Liquidity analysis',
                    'De-dollarization tracker', 'China Five Year Plan data', 'Energy security mapping',
                    'Africa macro pulse', 'Institutional data terminals'
                ]}
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "Dataset",
                    "@id": "https://graphiquestor.com/labs#dataset",
                    "name": "GraphiQuestor Macro Surveillance Thematic Labs Dataset Collection",
                    "description": "Comprehensive collections of sovereign risk, net liquidity, energy flows, and BRICS+ reserve allocation telemetry.",
                    "url": "https://graphiquestor.com/labs",
                    "creator": {
                        "@id": "https://graphiquestor.com/#organization"
                    },
                    "temporalCoverage": "2000-01-01/2026-05-30",
                    "spatialCoverage": "Worldwide"
                }}
            />

            {/* Header section with Outfit-style typography */}
            <div className="space-y-4 text-center mt-12">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-500/10 mb-2 border border-blue-500/20">
                    <Library className="w-8 h-8 text-blue-400 animate-pulse" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-heading uppercase">
                    Thematic Macro Labs
                </h1>
                <p className="text-xs sm:text-sm font-bold text-blue-400/80 uppercase tracking-[0.25em] max-w-2xl mx-auto">
                    Structural Telemetry • Regime Detection • Multipolar Research Hubs
                </p>
                <p className="text-sm text-white/50 max-w-2xl mx-auto mt-4 font-medium leading-relaxed">
                    Surveillance modules cataloging the fracturing of the post-1971 fiat monetary regime. We monitor real-time flows, liquidity corridors, and sovereign stress markers — bypassing retail narratives.
                </p>
            </div>

            <div className="border-t border-white/5 pt-8">
                {/* Labs Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {labsList.map((lab) => (
                        <Card 
                            key={lab.id} 
                            className={`relative overflow-hidden bg-slate-950/40 backdrop-blur-md border border-white/5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-gradient-to-br ${lab.color}`}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] rounded-full blur-2xl pointer-events-none" />
                            
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 shrink-0">
                                        {lab.icon}
                                    </div>
                                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-white/60">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        {lab.status}
                                    </span>
                                </div>
                                <CardTitle className="text-lg font-black text-white uppercase tracking-tight leading-snug">
                                    {lab.name}
                                </CardTitle>
                            </CardHeader>
                            
                            <CardContent className="space-y-4 pb-6">
                                <p className="text-xs font-semibold text-white/55 leading-relaxed">
                                    {lab.description}
                                </p>
                                
                                <div className="border-t border-white/[0.05] pt-3">
                                    <span className="block text-[9px] font-black uppercase tracking-wider text-blue-400/80 mb-1">
                                        Methodology Core
                                    </span>
                                    <p className="text-[10px] font-medium text-white/35 leading-relaxed">
                                        {lab.methodology}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <span className="block text-[9px] font-black uppercase tracking-wider text-blue-400/80">
                                        Surveillance Telemetry
                                    </span>
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {lab.primaryIndicators.map(ind => (
                                            <span 
                                                key={ind} 
                                                className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/[0.03] text-white/50 border border-white/[0.04]"
                                            >
                                                {ind}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-white/[0.05] pt-4 mt-2">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                                        Source: {lab.dataSource}
                                    </span>
                                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-wider px-3 h-8">
                                        <TrailLink to={lab.path}>
                                            Enter Lab →
                                        </TrailLink>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <RelatedMetrics />
            </div>
        </div>
    );
};
