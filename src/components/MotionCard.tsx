import React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MotionCardProps {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}

export const MotionCard: React.FC<MotionCardProps> = ({ children, delay = 0, className }) => {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
        return <div className={cn('h-full', className)}>{children}</div>;
    }

    return (
        <m.div
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
                duration: 0.35,
                delay,
                ease: [0.22, 1, 0.36, 1],
            }}
            className={cn('h-full', className)}
        >
            {children}
        </m.div>
    );
};
