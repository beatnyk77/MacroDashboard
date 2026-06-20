import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DISCLAIMER_TEXT = `This tool is for educational and informational purposes only. All calculations, strategy frameworks, and payoff diagrams are illustrative. Nothing on this page constitutes financial advice, a recommendation, or an offer to buy or sell any financial instrument. Consult your bank, treasury advisor, or authorised forex dealer before making any hedging or currency management decisions.`;

interface DisclaimerBannerProps {
    className?: string;
    compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
    className,
    compact = false,
}) => (
    <div
        role="note"
        aria-label="Educational disclaimer"
        className={cn(
            'border border-amber-500/50 bg-amber-500/[0.06] rounded-xl',
            compact ? 'px-4 py-3' : 'px-5 py-4',
            className,
        )}
    >
        <div className="flex items-start gap-3">
            <AlertTriangle
                size={compact ? 14 : 16}
                className="text-amber-400 shrink-0 mt-0.5"
                aria-hidden
            />
            <p
                className={cn(
                    'text-amber-200/80 leading-relaxed m-0',
                    compact ? 'text-[11px]' : 'text-xs',
                )}
            >
                {DISCLAIMER_TEXT}
            </p>
        </div>
    </div>
);