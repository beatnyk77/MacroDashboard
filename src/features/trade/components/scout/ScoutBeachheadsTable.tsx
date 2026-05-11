import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Beachhead {
  country: string;
  total_market: string;
  india_share: number;
  yoy_growth: number;
  opportunity_score: number;
  priority: string;
  recommended_action: string;
}

interface ScoutBeachheadsTableProps {
  beachheads: Beachhead[];
}

export const ScoutBeachheadsTable: React.FC<ScoutBeachheadsTableProps> = ({ beachheads }) => {
  return (
    <div className="px-8 lg:px-20 py-24 bg-slate-950/30">
      <div className="mb-12 flex flex-col lg:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-6">Market Prioritization</h2>
          <h3 className="text-4xl lg:text-5xl font-black tracking-tighter text-white font-syne">Priority Beachheads</h3>
        </div>
        <p className="text-white/40 font-medium max-w-md text-right text-sm">
          Ranked target markets for immediate strategic deployment based on demand velocity and entry friction.
        </p>
      </div>

      <div className="bg-[#020617] border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-xl">
        <Table>
          <TableHeader className="bg-white/[0.02] border-b border-white/5">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="py-6 px-8 font-black text-white/40 uppercase tracking-widest text-[10px]">Rank / Market</TableHead>
              <TableHead className="py-6 px-8 font-black text-white/40 uppercase tracking-widest text-[10px] text-right">TAM (Value)</TableHead>
              <TableHead className="py-6 px-8 font-black text-white/40 uppercase tracking-widest text-[10px] text-right">Growth</TableHead>
              <TableHead className="py-6 px-8 font-black text-white/40 uppercase tracking-widest text-[10px] text-right">India Share</TableHead>
              <TableHead className="py-6 px-8 font-black text-white/40 uppercase tracking-widest text-[10px] text-center">Opportunity Index</TableHead>
              <TableHead className="py-6 px-8 font-black text-white/40 uppercase tracking-widest text-[10px]">Strategic Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {beachheads.map((bh, idx) => (
              <TableRow key={bh.country} className="border-b border-white/5 last:border-none hover:bg-white/[0.02] transition-colors group">
                <TableCell className="py-8 px-8">
                  <div className="flex items-center gap-6">
                    <span className="text-white/10 font-black text-xl font-mono w-8">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">{bh.country}</span>
                  </div>
                </TableCell>
                <TableCell className="py-8 px-8 text-right font-bold text-white/80 font-mono tracking-wider">{bh.total_market}</TableCell>
                <TableCell className="py-8 px-8 text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${bh.yoy_growth > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/40'}`}>
                    {bh.yoy_growth > 0 ? '+' : ''}{bh.yoy_growth}%
                  </div>
                </TableCell>
                <TableCell className="py-8 px-8 text-right font-bold text-white/60 font-mono">{bh.india_share}%</TableCell>
                <TableCell className="py-8 px-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-full max-w-[120px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${bh.opportunity_score > 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-500'}`} 
                        style={{ width: `${bh.opportunity_score}%` }} 
                      />
                    </div>
                    <span className="text-xs font-black text-white/60 font-mono tracking-widest">{bh.opportunity_score}</span>
                  </div>
                </TableCell>
                <TableCell className="py-8 px-8">
                  <div className="flex items-center justify-between gap-4">
                    <Badge className={`
                      font-black tracking-[0.2em] text-[9px] px-4 py-1.5 rounded-full border-none shadow-lg
                      ${bh.priority === 'NOW' ? 'bg-rose-600 text-white shadow-rose-600/20' : 
                        bh.priority === 'HIGH' ? 'bg-amber-500 text-white shadow-amber-500/20' : 
                        'bg-white/10 text-white/60'}
                    `}>
                      {bh.priority}
                    </Badge>
                    <span className="text-[10px] font-bold text-white/40 italic text-right max-w-[120px] leading-tight">
                      {bh.recommended_action}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
