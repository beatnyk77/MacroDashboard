import React, { useState } from 'react';
import { Copy, Check, Quote } from 'lucide-react';
import { trackAuthorityCitationCopy } from '@/lib/authority/authorityEvents';

interface AuthorityCitationBlockProps {
    metricName: string;
    metricId: string;
    snapshotId?: string;
    observedAt?: string;
}

export const AuthorityCitationBlock: React.FC<AuthorityCitationBlockProps> = ({
    metricName,
    metricId,
    snapshotId,
    observedAt,
}) => {
    const [format, setFormat] = useState<'apa' | 'bibtex' | 'chicago'>('apa');
    const [copied, setCopied] = useState(false);

    const year = observedAt ? new Date(observedAt).getFullYear() : new Date().getFullYear();
    const url = snapshotId
        ? `https://graphiquestor.com/metrics/${metricId}/history/${snapshotId}`
        : `https://graphiquestor.com/metrics/${metricId}`;

    const getCitationText = () => {
        switch (format) {
            case 'apa':
                return `GraphiQuestor. (${year}). ${metricName} [Data set]. FounderHQ LLP. ${url}`;
            case 'chicago':
                return `GraphiQuestor. "${metricName}." Macro Intelligence Terminal. FounderHQ LLP, ${year}. ${url}.`;
            case 'bibtex':
                return `@misc{graphiquestor_${metricId.replace(/-/g, '_')},\n  author = {GraphiQuestor},\n  title = {${metricName}},\n  year = {${year}},\n  publisher = {FounderHQ LLP},\n  url = {${url}}\n}`;
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(getCitationText());
            setCopied(true);
            trackAuthorityCitationCopy(metricId, format, snapshotId);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy citation:', err);
        }
    };

    return (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-[12px] space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black uppercase tracking-widest text-white/50 text-[10px]">
                    <Quote size={12} className="text-blue-400" />
                    Cite this research object
                </div>
                <div className="flex items-center gap-1 bg-black/40 rounded-lg p-0.5 border border-white/10">
                    {(['apa', 'chicago', 'bibtex'] as const).map((fmt) => (
                        <button
                            key={fmt}
                            onClick={() => setFormat(fmt)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                                format === fmt
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'text-white/40 hover:text-white/70'
                            }`}
                        >
                            {fmt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-black/50 p-3 font-mono text-[11px] text-white/70 whitespace-pre-wrap">
                    {getCitationText()}
                </pre>
                <button
                    onClick={handleCopy}
                    className="absolute right-2 top-2 flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/10 text-[10px] font-bold text-white transition-all active:scale-95"
                >
                    {copied ? (
                        <>
                            <Check size={11} className="text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                        </>
                    ) : (
                        <>
                            <Copy size={11} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
