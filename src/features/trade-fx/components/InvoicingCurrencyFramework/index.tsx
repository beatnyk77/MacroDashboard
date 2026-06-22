import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useInvoicingFxRates } from '../../hooks/useInvoicingFxRates';
import type { CollarHandoffParams } from '../../lib/invoicingTypes';
import type { Role, TradeFxData } from '../../lib/tradeFxTypes';
import { HistoricalCostComparator } from './HistoricalCostComparator';
import { ForwardLookingRegimeView } from './ForwardLookingRegimeView';
import { DecisionFactorMatrix } from './DecisionFactorMatrix';
import { ScenarioSimulator } from './ScenarioSimulator';
import { NaturalHedgeRecommender } from './NaturalHedgeRecommender';

const STORAGE_KEY = 'gq_invoicing_expanded';

type Props = {
    role: Role;
    tradeFxData: TradeFxData;
    onCollarHandoff: (params: CollarHandoffParams) => void;
};

export const InvoicingCurrencyFramework: React.FC<Props> = ({
    role,
    tradeFxData,
    onCollarHandoff,
}) => {
    const fxMeta = useInvoicingFxRates();
    const [expanded, setExpanded] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        } catch {
            return false;
        }
    });
    const [monthlyImportValue, setMonthlyImportValue] = useState(1_00_00_000);

    const toggleExpanded = () => {
        setExpanded((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(STORAGE_KEY, String(next));
            } catch {
                // ignore
            }
            return next;
        });
    };

    const dedolSignal = tradeFxData.macroSignals.find((s) => s.source === 'dedol_lab');

    return (
        <section
            id="invoicing-framework"
            className="border border-white/10 bg-white/[0.02] rounded-2xl overflow-hidden scroll-mt-28"
        >
            <button
                type="button"
                onClick={toggleExpanded}
                className="w-full px-5 py-4 md:px-6 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors text-left"
            >
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-sm md:text-base font-black uppercase tracking-tight text-white m-0">
                            Invoicing Currency Decision Framework
                        </h2>
                        <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">
                            China Importers
                        </span>
                    </div>
                    <p className="text-[11px] text-white/45 m-0 leading-relaxed max-w-3xl">
                        Should your China imports be invoiced in USD, CNY, or INR? CNY/INR appreciation
                        since mid-2025 has materially raised INR costs for CNY-invoiced importers.
                    </p>
                </div>
                <div className="shrink-0 text-white/40">
                    {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
            </button>

            <div
                className={cn(
                    'transition-all duration-500 ease-in-out border-t border-white/5',
                    expanded ? 'max-h-[8000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden',
                )}
            >
                <div className="px-5 py-6 md:px-6 space-y-5">
                    {role === 'exporter' ? (
                        <p className="text-[11px] text-amber-400/80 m-0 border border-amber-500/20 rounded-lg px-3 py-2 bg-amber-500/[0.04]">
                            This framework is primarily relevant for importers. Exporters: see the
                            Hedging Strategy Matrix above.
                        </p>
                    ) : null}

                    <Tabs defaultValue="historical" className="space-y-5">
                        <TabsList className="flex flex-wrap h-auto gap-1 bg-white/[0.03] border border-white/10 p-1">
                            <TabsTrigger
                                value="historical"
                                className="text-[9px] font-black uppercase tracking-wider data-[state=active]:bg-[#B8860B]/20 data-[state=active]:text-[#B8860B]"
                            >
                                Historical Cost
                            </TabsTrigger>
                            <TabsTrigger
                                value="regime"
                                className="text-[9px] font-black uppercase tracking-wider data-[state=active]:bg-[#B8860B]/20 data-[state=active]:text-[#B8860B]"
                            >
                                Regime View
                            </TabsTrigger>
                            <TabsTrigger
                                value="factors"
                                className="text-[9px] font-black uppercase tracking-wider data-[state=active]:bg-[#B8860B]/20 data-[state=active]:text-[#B8860B]"
                            >
                                Decision Factors
                            </TabsTrigger>
                            <TabsTrigger
                                value="scenario"
                                className="text-[9px] font-black uppercase tracking-wider data-[state=active]:bg-[#B8860B]/20 data-[state=active]:text-[#B8860B]"
                            >
                                Scenario Simulator
                            </TabsTrigger>
                            <TabsTrigger
                                value="natural"
                                className="text-[9px] font-black uppercase tracking-wider data-[state=active]:bg-[#B8860B]/20 data-[state=active]:text-[#B8860B]"
                            >
                                Natural Hedges
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="historical">
                            <HistoricalCostComparator
                                monthlyRates={fxMeta.monthlyRates}
                                fxMeta={fxMeta}
                                monthlyImportValue={monthlyImportValue}
                                onMonthlyImportChange={setMonthlyImportValue}
                            />
                        </TabsContent>
                        <TabsContent value="regime">
                            <ForwardLookingRegimeView
                                monthlyRates={fxMeta.monthlyRates}
                                fxMeta={fxMeta}
                                tradeFxData={tradeFxData}
                            />
                        </TabsContent>
                        <TabsContent value="factors">
                            <DecisionFactorMatrix />
                        </TabsContent>
                        <TabsContent value="scenario">
                            <ScenarioSimulator
                                monthlyImportValue={monthlyImportValue}
                                monthlyRates={fxMeta.monthlyRates}
                                onCollarHandoff={onCollarHandoff}
                            />
                        </TabsContent>
                        <TabsContent value="natural">
                            <NaturalHedgeRecommender dedolSignal={dedolSignal} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </section>
    );
};