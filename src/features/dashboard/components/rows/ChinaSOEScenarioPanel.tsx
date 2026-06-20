import React from 'react';
import { Factory, AlertTriangle } from 'lucide-react';
import { useChinaSOEScenarios, useLatestChinaFiscalSignals } from '@/hooks/useChinaDebt';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { cn } from '@/lib/utils';

const SCENARIO_COLORS: Record<string, string> = {
    conservative: 'border-emerald-500/20 bg-emerald-500/[0.04]',
    base: 'border-amber-500/20 bg-amber-500/[0.04]',
    stress: 'border-rose-500/20 bg-rose-500/[0.04]',
};

const SCENARIO_ACCENT: Record<string, string> = {
    conservative: 'text-emerald-400',
    base: 'text-amber-400',
    stress: 'text-rose-400',
};

export const ChinaSOEScenarioPanel: React.FC = () => {
    const { data: scenarios, isLoading } = useChinaSOEScenarios();
    const { data: signalMap } = useLatestChinaFiscalSignals([
        'soe_total_assets_pct_gdp',
        'soe_debt_to_asset_ratio',
        'soe_roa_pct',
        'soe_zombie_proxy_pct',
    ]);

    const getSignal = (key: string) => signalMap[key]?.value;

    if (isLoading) {
        return <div className="h-[400px] rounded-2xl bg-white/[0.02] animate-pulse" />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                    <Factory size={20} className="text-orange-400" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-uppercase italic">
                        SOE Contingent Liability Tracker
                    </h3>
                    <p className="text-xs text-muted-foreground/60">
                        Scenario analysis — not point estimates. IMF stress-test framework.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { key: 'soe_total_assets_pct_gdp', label: 'SOE Assets / GDP', unit: '%' },
                    { key: 'soe_debt_to_asset_ratio', label: 'Debt / Assets', unit: '%' },
                    { key: 'soe_roa_pct', label: 'SOE ROA', unit: '%' },
                    { key: 'soe_zombie_proxy_pct', label: 'Zombie SOE Proxy', unit: '%', warn: true },
                ].map(({ key, label, unit, warn }) => (
                    <div key={key} className={cn(
                        'p-5 rounded-2xl border',
                        warn ? 'bg-rose-500/[0.04] border-rose-500/15' : 'bg-white/[0.02] border-white/5'
                    )}>
                        <p className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-2">{label}</p>
                        <p className="text-2xl font-black text-white font-mono">
                            {getSignal(key) != null ? getSignal(key)!.toFixed(1) : '—'}
                            <span className="text-xs text-muted-foreground/50 ml-1">{unit}</span>
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scenarios?.map(s => (
                    <div
                        key={s.scenario_code}
                        className={cn('p-6 rounded-2xl border', SCENARIO_COLORS[s.scenario_code] ?? 'border-white/5')}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h4 className={cn('text-sm font-black uppercase tracking-uppercase italic', SCENARIO_ACCENT[s.scenario_code])}>
                                {s.scenario_label}
                            </h4>
                            <span className="text-xs font-mono text-white/40">{s.probability_weight_pct?.toFixed(0)}% weight</span>
                        </div>
                        <p className="text-3xl font-black text-white font-mono mb-1">
                            {s.consolidated_debt_outcome_pct?.toFixed(0)}%
                            <span className="text-xs text-muted-foreground/50 ml-1">GDP</span>
                        </p>
                        <p className="text-xs text-muted-foreground/50 mb-4">Consolidated debt outcome</p>
                        <div className="space-y-2 text-xs font-mono">
                            <div className="flex justify-between">
                                <span className="text-white/40">Crystallization</span>
                                <span className="text-white/70">{s.crystallization_rate_pct?.toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Contingent liability</span>
                                <span className="text-white/70">{s.contingent_liability_pct_gdp?.toFixed(1)}% GDP</span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground/60 mt-4 leading-relaxed italic">{s.assumptions}</p>
                    </div>
                ))}
            </div>

            <div className="p-5 rounded-2xl bg-orange-500/[0.03] border border-orange-500/10 text-sm text-muted-foreground/70 leading-relaxed flex items-start gap-2">
                <AlertTriangle size={16} className="text-orange-400 shrink-0 mt-0.5" />
                <span>
                    SOE bond defaults remain rare but are increasing. Local SOEs carry higher implicit guarantee expectations
                    than central SASAC-controlled entities. Declining ROA ({getSignal('soe_roa_pct') != null ? `${getSignal('soe_roa_pct')!.toFixed(1)}%` : '—'}) signals
                    growing state subsidy burden.
                </span>
            </div>

            <DataProvenanceBadge source="NBS SOE Survey + IMF Article IV" methodology="Scenario matrix, not point estimate" size="sm" />
        </div>
    );
};