import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface PowerMixData {
    region: string;
    coal: number;
    renewable: number;
    other: number;
}

interface PowerMixDivergenceCardProps {
    data?: PowerMixData[];
}

const MOCK_DATA: PowerMixData[] = [
    { region: 'China', coal: 62.5, renewable: 32.5, other: 5.0 },
    { region: 'European Union', coal: 12.1, renewable: 44.1, other: 43.8 },
    { region: 'United States', coal: 16.2, renewable: 22.4, other: 61.4 }
];

export const PowerMixDivergenceCard: React.FC<PowerMixDivergenceCardProps> = ({
    data = MOCK_DATA
}) => {
    return (
        <div className="w-full h-full min-h-[400px] p-8 rounded-[2rem] bg-black/40 border border-white/5 backdrop-blur-3xl flex flex-col gap-6 group">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
                        Power Mix Divergence
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-[0.6rem] text-emerald-400 border border-emerald-500/20">
                            STRUCTURAL ALPHA
                        </span>
                    </h4>
                    <p className="text-[0.65rem] text-muted-foreground/60 font-medium uppercase tracking-wider mt-1">
                        Coal vs Renewables vs Base Load (G7 vs BRICS+)
                    </p>
                </div>
            </div>

            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        barSize={32}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis
                            type="number"
                            domain={[0, 100]}
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={10}
                            tickFormatter={(v) => `${v}%`}
                        />
                        <YAxis
                            dataKey="region"
                            type="category"
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={10}
                            width={100}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                fontSize: '10px'
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                        <Bar dataKey="coal" stackId="a" fill="#334155" name="Coal" />
                        <Bar dataKey="renewable" stackId="a" fill="#10b981" name="Renewables" />
                        <Bar dataKey="other" stackId="a" fill="#3b82f6" name="Nuclear/Gas/Other" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] leading-relaxed text-muted-foreground/60 italic">
                    <span className="font-bold text-white/40 not-italic">Observation:</span> China continues to prioritize energy density via coal while simultaneously leading global renewable installations. The EU's high renewable share increases intermittent risk without commensurate storage buffers.
                </p>
            </div>
        </div>
    );
};
