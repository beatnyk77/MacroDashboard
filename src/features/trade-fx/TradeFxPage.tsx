import React, { Suspense, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { SEOManager } from '@/components/SEOManager';
import { FreshnessChip } from '@/components/FreshnessChip';
import { TrailNavLink } from '@/components/TrailLink';
import { ModuleRow } from '@/components/layout/ModuleRow';
import { getStaleness } from '@/hooks/useStaleness';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { CompactDisclaimer } from './components/CompactDisclaimer';
import { RoleToggle } from './components/RoleToggle';
import { CurrencyPairSelector } from './components/CurrencyPairSelector';
import { RateRegimeChart } from './components/RateRegimeChart';
import { MacroDriversPanel } from './components/MacroDriversPanel';
import { ExposureSimulator } from './components/ExposureSimulator';
import { CollarPayoffDiagram } from './components/CollarPayoffDiagram';
import { HedgingStrategyMatrix } from './components/HedgingStrategyMatrix';
import { InvoicingCurrencyFramework } from './components/InvoicingCurrencyFramework';
import { RiskOpportunityFlags } from './components/RiskOpportunityFlags';
import { AffiliateCTA } from './components/AffiliateCTA';
import { TradeFxFaqSection } from './components/TradeFxFaqSection';
import { RelatedContent } from '@/components/RelatedContent';
import { useTradeFxData } from './hooks/useTradeFxData';
import { buildTradeFxJsonLd } from './lib/tradeFxSeo';
import type { CollarHandoffParams } from './lib/invoicingTypes';
import type { CurrencyPair, Role, TimeHorizon } from './lib/tradeFxTypes';

const TRADE_FX_JSON_LD = buildTradeFxJsonLd();

const DataFallback = () => (
    <div className="w-full min-h-[120px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
            Loading macro telemetry…
        </span>
    </div>
);

type TradeFxWorkspaceProps = {
    role: Role;
    pair: CurrencyPair;
    horizon: TimeHorizon;
    collarNotional: number;
    collarPreFill: CollarHandoffParams | null;
    collarPreFillNonce: number;
    onHorizonChange: (horizon: TimeHorizon) => void;
    onCollarNotionalSync: (notional: number) => void;
    onCollarHandoff: (params: CollarHandoffParams) => void;
};

const TradeFxWorkspace: React.FC<TradeFxWorkspaceProps> = ({
    role,
    pair,
    horizon,
    collarNotional,
    collarPreFill,
    collarPreFillNonce,
    onHorizonChange,
    onCollarNotionalSync,
    onCollarHandoff,
}) => {
    const data = useTradeFxData({ pair, horizon });

    const spotFreshness = getStaleness(
        data.spotHistory[data.spotHistory.length - 1]?.date,
        'daily',
    );

    const roleLabel =
        role === 'exporter' ? 'Exporter' : role === 'importer' ? 'Importer' : 'Balanced';

    return (
        <div className="space-y-6">
            {data.hasError && !data.spot ? (
                <div className="border border-rose-500/30 bg-rose-500/[0.06] rounded-xl px-5 py-4">
                    <p className="text-xs text-rose-300/80 m-0">
                        Macro telemetry partially unavailable. USD/INR spot and regime signals
                        will render when upstream data recovers.
                    </p>
                </div>
            ) : (
                <div className="border border-white/10 bg-white/[0.02] rounded-xl px-5 py-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                            Current Regime
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/30">
                            {roleLabel} view
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider text-[#B8860B]">
                            {data.volatilityRegime} volatility
                        </span>
                        {data.spot !== null && pair === 'USD/INR' && (
                            <span className="text-xs font-mono text-white/70">
                                {pair} ₹{data.spot.toFixed(2)}
                            </span>
                        )}
                        <FreshnessChip
                            status={data.isLoading ? 'lagged' : spotFreshness.state}
                            lastUpdated={data.spotHistory[data.spotHistory.length - 1]?.date}
                            label={data.isLoading ? 'LOADING' : undefined}
                        />
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed m-0">{data.regimeNote}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
                <aside className="space-y-4 order-1 lg:order-none lg:col-start-2 lg:row-start-1 lg:sticky lg:top-32">
                    <MacroDriversPanel
                        signals={data.macroSignals}
                        role={role}
                        onHorizonChange={onHorizonChange}
                    />
                    <RiskOpportunityFlags
                        role={role}
                        volatilityRegime={data.volatilityRegime}
                        macroSignals={data.macroSignals}
                    />
                </aside>

                <div className="space-y-6 min-w-0 order-2 lg:order-none lg:col-start-1 lg:row-start-1">
                    <RateRegimeChart
                        pair={pair}
                        horizon={horizon}
                        spotHistory={data.spotHistory}
                        regimeNote={data.regimeNote}
                        volatilityRegime={data.volatilityRegime}
                        isLoading={data.isLoading}
                        isIllustrative={data.isIllustrativeRates}
                    />
                    <ExposureSimulator
                        role={role}
                        pair={pair}
                        horizon={horizon}
                        spot={data.spot}
                        regimeNote={data.regimeNote}
                        onCollarNotionalSync={onCollarNotionalSync}
                    />
                    <CompactDisclaimer context="simulator" />
                    <CompactDisclaimer context="collar" />
                    <CollarPayoffDiagram
                        role={role}
                        pair={pair}
                        horizon={horizon}
                        spot={data.spot}
                        forwardRate={data.forwardRate}
                        regimeNote={data.regimeNote}
                        externalNotional={collarNotional}
                        externalPreFill={collarPreFill}
                        preFillNonce={collarPreFillNonce}
                    />
                    <HedgingStrategyMatrix
                        role={role}
                        volatilityRegime={data.volatilityRegime}
                    />
                    <CompactDisclaimer context="matrix" />
                </div>
            </div>

            <InvoicingCurrencyFramework
                role={role}
                tradeFxData={data}
                onCollarHandoff={onCollarHandoff}
            />
        </div>
    );
};

export const TradeFxPage: React.FC = () => {
    const [role, setRole] = useState<Role>('balanced');
    const [pair, setPair] = useState<CurrencyPair>('USD/INR');
    const [horizon, setHorizon] = useState<TimeHorizon>('3M');
    const [collarNotional, setCollarNotional] = useState(1_000_000);
    const [collarPreFill, setCollarPreFill] = useState<CollarHandoffParams | null>(null);
    const [collarPreFillNonce, setCollarPreFillNonce] = useState(0);

    const handleCollarHandoff = (params: CollarHandoffParams) => {
        setCollarPreFill(params);
        setCollarPreFillNonce((n) => n + 1);
        setCollarNotional(params.notionalFC);
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto pb-28 lg:pb-24">
            <SEOManager
                title="USD/INR Currency Intelligence for Exporters & Importers"
                description="Real-time USD/INR hedging analysis, zero-cost collar payoff diagrams, and regime-aware currency strategy frameworks for Indian exporters and importers."
                canonical="https://graphiquestor.com/trade-fx"
                keywords={[
                    'USD INR hedging strategy exporters',
                    'zero cost collar USD INR',
                    'forex exposure India',
                    'currency risk management India SME',
                    'RBI intervention USD INR',
                ]}
                geoRegion="IN"
                targetCountry="IN"
                robots="index, follow"
                jsonLd={TRADE_FX_JSON_LD}
            />

            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 mb-8 mt-4">
                <TrailNavLink to="/" className="hover:text-white transition-colors">
                    Home
                </TrailNavLink>
                <ChevronRight size={10} />
                <TrailNavLink to="/trade" className="hover:text-white transition-colors">
                    Trade Intelligence
                </TrailNavLink>
                <ChevronRight size={10} />
                <span className="text-[#B8860B]">TradeFx</span>
            </nav>

            <header className="mb-6">
                <h1 className="trade-fx-speakable text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-2">
                    TradeFx — Currency Intelligence
                </h1>
                <h2 className="trade-fx-speakable text-sm md:text-base text-white/50 font-medium max-w-3xl leading-relaxed">
                    Regime-Aware Hedging Analysis for Indian Exporters &amp; Importers
                </h2>
            </header>

            <DisclaimerBanner className="mb-6" />

            <div className="sticky top-16 z-20 -mx-4 px-4 py-3 mb-6 bg-[#0D0D0D]/95 border-y border-white/10 backdrop-blur-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <RoleToggle value={role} onChange={setRole} />
                    <CurrencyPairSelector
                        pair={pair}
                        horizon={horizon}
                        onPairChange={setPair}
                        onHorizonChange={setHorizon}
                    />
                </div>
            </div>

            <ModuleRow label="CURRENCY INTELLIGENCE" labelColor="text-[#B8860B]/60">
                <Suspense fallback={<DataFallback />}>
                    <TradeFxWorkspace
                        role={role}
                        pair={pair}
                        horizon={horizon}
                        collarNotional={collarNotional}
                        collarPreFill={collarPreFill}
                        collarPreFillNonce={collarPreFillNonce}
                        onHorizonChange={setHorizon}
                        onCollarNotionalSync={setCollarNotional}
                        onCollarHandoff={handleCollarHandoff}
                    />
                </Suspense>
            </ModuleRow>

            <TradeFxFaqSection className="mt-8" />

            <AffiliateCTA role={role} pair={pair} className="mt-8" />

            <DisclaimerBanner className="mt-8" />

            <RelatedContent className="mt-8" />
        </div>
    );
};