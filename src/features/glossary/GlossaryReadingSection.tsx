import React from 'react';
import { Box, Typography } from '@mui/material';
import { BookOpen } from 'lucide-react';
import { TrailLink } from '@/components/TrailLink';
import { withTrailingSlash } from '@/lib/urlPath';
import type { GlossaryReadingLink } from '@/features/glossary/glossarySeoEnrichment';

const kindBadge: Record<GlossaryReadingLink['kind'], { label: string; color: string }> = {
    method: { label: 'METHOD', color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
    lab: { label: 'LAB', color: 'text-purple-400 border-purple-400/30 bg-purple-400/5' },
    glossary: { label: 'GLOSSARY', color: 'text-amber-400 border-amber-400/30 bg-amber-400/5' },
    intel: { label: 'INTEL', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
    terminal: { label: 'LIVE', color: 'text-rose-400 border-rose-400/30 bg-rose-400/5' },
};

interface GlossaryReadingSectionProps {
    links: GlossaryReadingLink[];
}

export const GlossaryReadingSection: React.FC<GlossaryReadingSectionProps> = ({ links }) => {
    if (links.length === 0) return null;

    return (
        <Box sx={{ mt: 6, mb: 6 }}>
            <Typography
                component="h2"
                variant="h6"
                sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}
            >
                <BookOpen size={20} /> Related Metrics &amp; Reading
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1.5}>
                {links.map((link) => {
                    const badge = kindBadge[link.kind];
                    return (
                        <TrailLink
                            key={link.to}
                            to={withTrailingSlash(link.to)}
                            className="group flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 no-underline transition-colors hover:border-white/15 hover:bg-white/[0.05]"
                        >
                            <span
                                className={`rounded border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${badge.color}`}
                            >
                                {badge.label}
                            </span>
                            <span className="text-xs font-semibold text-white/70 transition-colors group-hover:text-white">
                                {link.label}
                            </span>
                        </TrailLink>
                    );
                })}
            </Box>
        </Box>
    );
};