import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MotionCardProps {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}

export const MotionCard: React.FC<MotionCardProps> = ({ children, delay = 0, className }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
                duration: 0.5,
                delay: delay,
                ease: [0.22, 1, 0.36, 1] // Custom refined bezier
            }}
            className={cn("h-full", className)}
        >
            {children}
        </motion.div>
    );
};
