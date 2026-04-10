import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { FileText, ExternalLink, Lightbulb } from 'lucide-react';

interface CountryNarrativeBlockProps {
  iso: string;
  countryName: string;
  data: any;
  narrativeData: {
    thesis: string;
    analysis: string;
    relatedLabs?: { name: string; path: string }[];
  } | null;
}

export const CountryNarrativeBlock: React.FC<CountryNarrativeBlockProps> = ({
  iso,
  countryName,
  data,
  narrativeData
}) => {
  if (!narrativeData) return null;

  // Function to interpolate variables into the narrative analysis
  const interpolatedAnalysis = useMemo(() => {
    let text = narrativeData.analysis;
    
    // Simple variable replacement: {{metric_key}}
    const matches = text.match(/{{(.*?)}}/g);
    if (matches) {
      matches.forEach(match => {
        const key = match.replace(/{{|}}/g, '').trim();
        let value = data?.[key];
        
        // Handle formatting if it's a number
        if (typeof value === 'number') {
          // If the key has 'pct' in it, add %, otherwise format normally
          if (key.includes('pct')) {
            value = `${value.toFixed(2)}%`;
          } else if (key.includes('bn')) {
            value = `$${value.toFixed(1)}Bn`;
          } else {
            value = value.toLocaleString();
          }
        } else if (value === undefined || value === null) {
          value = '[N/A]';
        }
        
        text = text.replace(match, String(value));
      });
    }
    
    return text;
  }, [narrativeData.analysis, data]);

  // Function to wrap specific technical terms with links
  // In a real app, this might be more complex (e.g., regex mapping)
  const renderWithLinks = (text: string) => {
    const linkMap: Record<string, string> = {
      'Net Liquidity Z-score': '/methods/net-liquidity-z-score',
      'Debt/Gold Z-score': '/methods/debt-gold-z-score',
      'Loan-to-Job Efficiency': '/methods/loan-to-job-efficiency',
      'Energy Dependency Ratio': '/methods/energy-dependency-ratio',
      'Fiscal Dominance Meter': '/methods/fiscal-dominance-meter',
      'de-dollarization': '/labs/de-dollarization-gold',
      'sovereign stress': '/labs/sovereign-stress',
      'shadow system': '/labs/shadow-system',
      'petrodollar system': '/glossary/petrodollar-system',
      'fiscal dominance': '/glossary/fiscal-dominance-meter',
      'Mbridge': '/glossary/mbridge',
      'MOSPI': '/glossary/mospi',
      'TGA': '/glossary/tga',
    };

    let parts: (string | JSX.Element)[] = [text];

    Object.entries(linkMap).forEach(([term, path]) => {
      const newParts: (string | JSX.Element)[] = [];
      parts.forEach(part => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }

        const regex = new RegExp(`(${term})`, 'gi');
        const split = part.split(regex);
        split.forEach((subPart, i) => {
          if (subPart.toLowerCase() === term.toLowerCase()) {
            newParts.push(
              <Link
                key={`${term}-${i}`}
                to={path}
                className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-400/30 transition-colors font-semibold"
              >
                {subPart}
              </Link>
            );
          } else if (subPart !== '') {
            newParts.push(subPart);
          }
        });
      });
      parts = newParts;
    });

    return parts;
  };

  return (
    <Box className="mb-16">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Thesis Column */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/10 h-full">
            <div className="flex items-center gap-2 mb-4 text-blue-400">
              <Lightbulb size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Core Thesis</span>
            </div>
            <Typography variant="h5" className="font-black tracking-tight leading-none mb-4 uppercase italic italic">
              {narrativeData.thesis}
            </Typography>
            <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-white/5">
              {narrativeData.relatedLabs?.map(lab => (
                <Link
                  key={lab.path}
                  to={lab.path}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-white/10 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <ExternalLink size={10} />
                  {lab.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Narrative Analysis Column */}
        <div className="lg:col-span-2">
          <div className="relative p-8 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <FileText size={120} />
            </div>
            
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-px bg-blue-500/50" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Expert Intelligence Narrative</span>
            </div>

            <div className="prose prose-invert max-w-none">
              <Typography 
                variant="body1" 
                className="text-muted-foreground/90 leading-relaxed text-lg font-medium space-y-4"
                sx={{ 
                  '& p': { mb: 3 },
                  fontFamily: 'var(--font-inter)',
                  '& a': { textDecoration: 'none' }
                }}
              >
                {renderWithLinks(interpolatedAnalysis)}
              </Typography>
            </div>

            <div className="mt-8 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/20">
              <div className="flex items-center gap-1.5 text-emerald-500/50">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Data Integrated
              </div>
              <div className="w-px h-3 bg-white/10" />
              <span>Institutional Grade</span>
              <div className="w-px h-3 bg-white/10" />
              <span>Methodology Checked</span>
            </div>
          </div>
        </div>
      </div>
    </Box>
  );
};
