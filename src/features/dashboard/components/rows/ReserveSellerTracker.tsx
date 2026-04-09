import React from 'react';
import { Card } from "@/components/ui/card";
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis 
} from 'recharts';
import { 
    AlertTriangle, 
    TrendingDown, 
    TrendingUp, 
    Droplets, 
    Landmark,
    ShieldAlert,
    BarChart3
} from 'lucide-react';
import { useReserveSellerData, ReserveSellerCountry } from '@/hooks/useReserveSellerData';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const CountrySparkline: React.FC<{ data: any[], color: string, dataKey: string }> = ({ data, color, dataKey }) => {
    const gradId = React.useId();
    return (
        <div className="h-12 w-32">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        fill={`url(#${gradId})`}
                        strokeWidth={2}
                        isAnimationActive={true}
                    />
                    <XAxis dataKey="date" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const SellerRow: React.FC<{ country: ReserveSellerCountry, oilPrice: number }> = ({ country, oilPrice }) => {
    // Signal: Oil > 80 AND TIC Holdings decreasing (QoQ)
    const isSellingSignal = oilPrice > 80 && country.tic_delta_qoq < 0;
    
    const FLAG_MAP: Record<string, string> = {
        JP: '🇯🇵', CN: '🇨🇳', IN: '🇮🇳', SA: '🇸🇦',
        KR: '🇰🇷', TW: '🇹🇼', SG: '🇸🇬', HK: '🇭🇰',
        GB: '🇬🇧', AE: '🇦🇪', BR: '🇧🇷', CH: '🇨🇭',
        LU: '🇱🇺', KY: '🇰🇾'
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-6 border-b border-white/5 hover:bg-white/[0.01] transition-colors"
        >
            {/* Country Identity */}
            <div className="md:col-span-3 flex items-center gap-4">
                <div className="text-2xl opacity-80">
                    {FLAG_MAP[country.country_code] || '🏳️'}
                </div>
                <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-uppercase">{country.country_label}</h4>
                    <span className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest">
                        {country.country_type}
                    </span>
                </div>
            </div>

            {/* UST Holdings (TIC) */}
            <div className="md:col-span-3 flex items-center justify-between px-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Landmark size={12} className="text-blue-400 opacity-50" />
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-uppercase">UST Holdings</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-white tabular-nums">${country.latest_tic.toFixed(1)}B</span>
                        <div className={cn(
                            "text-[10px] font-black tabular-nums flex items-center",
                            country.tic_delta_qoq >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                            {country.tic_delta_qoq >= 0 ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
                            {Math.abs(country.tic_delta_qoq).toFixed(1)}%
                        </div>
                    </div>
                </div>
                <CountrySparkline 
                    data={country.tic_holdings} 
                    color={country.tic_delta_qoq >= 0 ? "#10b981" : "#f43f5e"} 
                    dataKey="value" 
                />
            </div>

            {/* Total FX Reserves */}
            <div className="md:col-span-3 flex items-center justify-between px-4 border-l border-white/5">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={12} className="text-indigo-400 opacity-50" />
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-uppercase">Total Reserves</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-white tabular-nums">${country.latest_fx.toFixed(1)}B</span>
                        <div className={cn(
                            "text-[10px] font-black tabular-nums flex items-center",
                            country.fx_delta_qoq >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                            {country.fx_delta_qoq >= 0 ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
                            {Math.abs(country.fx_delta_qoq).toFixed(1)}%
                        </div>
                    </div>
                </div>
                <CountrySparkline 
                    data={country.fx_reserves} 
                    color="#6366f1" 
                    dataKey="value" 
                />
            </div>

            {/* Signal Logic Area */}
            <div className="md:col-span-3 flex justify-end items-center gap-3 pr-4">
                {isSellingSignal ? (
                    <div className="animate-pulse flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
                        <ShieldAlert size={14} />
                        <span className="text-[10px] font-black uppercase tracking-uppercase">Selling to fund Oil</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground/40">
                        <span className="text-[10px] font-black uppercase tracking-uppercase">Neutral Accumulation</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export const ReserveSellerTracker: React.FC = () => {
    const { data } = useReserveSellerData();

    if (!data) return null;

    const { countries, oilPrice, latestOil } = data;

    return (
        <Card className="p-8 bg-black/40 backdrop-blur-3xl border-white/5 shadow-2xl relative overflow-hidden rounded-[2.5rem] w-full mt-8">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 blur-[120px] rounded-full -mr-48 -mt-48" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                <AlertTriangle className="text-orange-500 w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-black tracking-heading text-white uppercase italic">
                                Reserve-Seller <span className="text-orange-500">Tracker</span>
                            </h2>
                        </div>
                        <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
                            Monitoring secondary market liquidations. High oil prices force energy importers and petrodollar anchors to rotate <span className="text-white font-bold">UST Holdings</span> to maintain liquidity.
                        </p>
                    </div>

                    {/* Oil Context Card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 min-w-[240px]">
                        <div className="p-2.5 rounded-xl bg-black/20 text-orange-400">
                            <Droplets size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Global Energy Context</div>
                            <div className="flex items-end gap-2">
                                <span className="text-xl font-black text-white tabular-nums">${latestOil.toFixed(2)}</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase pb-1">Brent / BBL</span>
                            </div>
                        </div>
                        <div className="h-10 w-16 opacity-50">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={oilPrice}>
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#f97316"
                                        fill="transparent"
                                        strokeWidth={1}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Countries List */}
                <div className="space-y-2">
                    {countries.map(country => (
                        <SellerRow 
                            key={country.country_code} 
                            country={country} 
                            oilPrice={latestOil} 
                        />
                    ))}
                </div>

                {/* Legend / Methodology */}
                <div className="mt-8 flex flex-wrap gap-6 items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Active Signal: Selling Condition Met</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/30 font-medium italic underline underline-offset-4 decoration-white/5">
                        *UST Holdings derived from TIC Long-Term Securities. Reserves represent official gross FX excluding Gold.
                    </p>
                </div>
            </div>
        </Card>
    );
};
