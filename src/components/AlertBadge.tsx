import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AlertBadgeProps {
    zScore: number;
    size?: 'sm' | 'md' | 'lg';
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({ zScore, size = 'md' }) => {
    const absZ = Math.abs(zScore);

    if (absZ < 2) return null;

    const sizeClasses = {
        sm: 'text-xs px-1.5 py-0.5',
        md: 'text-xs px-2 py-1',
        lg: 'text-xs px-2.5 py-1.5'
    };

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
                "inline-flex items-center gap-1 rounded-full font-black uppercase tracking-uppercase",
                sizeClasses[size],
                absZ > 3 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
            )}
        >
            <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                {absZ > 3 ? '🔴' : '⚡'}
            </motion.span>
            {absZ > 3 ? 'EXTREME' : 'ELEVATED'}
        </motion.div>
    );
};
