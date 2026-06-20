import React from 'react'
import { Link } from 'react-router-dom'
import { Building2, ExternalLink } from 'lucide-react'
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge'

interface UKTraderDirectoryProps {
    code: string
}

/** Compact playbook embed — links to full UK Trade Intelligence route. */
export const UKTraderDirectory: React.FC<UKTraderDirectoryProps> = ({ code }) => {
    return (
        <div className="flex flex-col bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden p-8 gap-5">
            <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                    <Building2 size={18} className="text-indigo-400" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                        UK Target Entities Reconnaissance
                    </h3>
                    <p className="text-sm text-white/40 leading-relaxed max-w-lg">
                        HMRC Overseas Trade Statistics entity directory and monthly OTS flows for HS {code}.
                        Real company records — no preview placeholders.
                    </p>
                    <DataProvenanceBadge
                        source="HMRC OTS"
                        methodology="Entity-level UK trade flows"
                        size="sm"
                    />
                </div>
            </div>
            <Link
                to={`/trade/uk/${code}`}
                className="inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-widest transition-colors"
            >
                Open UK Trade Intel
                <ExternalLink size={14} />
            </Link>
        </div>
    )
}