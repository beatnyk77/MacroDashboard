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
    <div className="px-8 lg:px-12 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight font-syne text-slate-900 mb-2">Priority Beachheads</h2>
        <p className="text-slate-500 font-medium">Ranked markets for immediate strategic focus based on TAM and growth dynamics.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-slate-900">Country / Market</TableHead>
              <TableHead className="font-bold text-slate-900 text-right">Market Size (TAM)</TableHead>
              <TableHead className="font-bold text-slate-900 text-right">YoY Growth</TableHead>
              <TableHead className="font-bold text-slate-900 text-right">India Share</TableHead>
              <TableHead className="font-bold text-slate-900 text-center">Score</TableHead>
              <TableHead className="font-bold text-slate-900">Recommended Action</TableHead>
              <TableHead className="font-bold text-slate-900">Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {beachheads.map((bh, idx) => (
              <TableRow key={bh.country} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-slate-300 font-mono text-[10px] w-4">{idx + 1}</span>
                  {bh.country}
                </TableCell>
                <TableCell className="text-right font-medium text-slate-700">{bh.total_market}</TableCell>
                <TableCell className={`text-right font-bold ${bh.yoy_growth > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {bh.yoy_growth > 0 ? '+' : ''}{bh.yoy_growth}%
                </TableCell>
                <TableCell className="text-right font-medium text-slate-700">{bh.india_share}%</TableCell>
                <TableCell className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-900 font-black text-xs border border-slate-200">
                    {bh.opportunity_score}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-600 max-w-[200px] leading-snug">{bh.recommended_action}</TableCell>
                <TableCell>
                  <Badge className={`
                    font-black tracking-widest text-[10px] px-2 py-0.5 rounded-full
                    ${bh.priority === 'NOW' ? 'bg-rose-500 hover:bg-rose-600' : 
                      bh.priority === 'HIGH' ? 'bg-amber-500 hover:bg-amber-600' : 
                      'bg-slate-400 hover:bg-slate-500'}
                  `}>
                    {bh.priority}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
