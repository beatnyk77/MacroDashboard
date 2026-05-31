import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';

export function getRegimeDetails(spread: number) {
    if (spread > 16) return {
        label: 'EXTREME BACKWARDATION',
        color: 'text-rose-500 bg-rose-500/10',
        icon: AlertTriangle,
        desc: 'Extreme physical shortage — immediate supply crisis signal.',
    };
    if (spread > 10) return {
        label: 'STRESSED',
        color: 'text-orange-500 bg-orange-500/10',
        icon: AlertTriangle,
        desc: 'Severe market tightening — front-loading by physical buyers.',
    };
    if (spread > 5) return {
        label: 'TIGHTENING',
        color: 'text-amber-500 bg-amber-500/10',
        icon: TrendingUp,
        desc: 'Market tightening — physical buyers front-loading deliveries.',
    };
    if (spread < -5) return {
        label: 'OVERSUPPLY',
        color: 'text-blue-500 bg-blue-500/10',
        icon: TrendingDown,
        desc: 'Oversupply — excess supply forcing front-month below next-month.',
    };
    return {
        label: 'NORMAL REGIME',
        color: 'text-emerald-500 bg-emerald-500/10',
        icon: CheckCircle2,
        desc: 'Balanced physical flows — no immediate stress signals.',
    };
}
