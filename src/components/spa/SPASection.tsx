import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SPASectionProps {
    id?: string;
    children: React.ReactNode;
    className?: string;
    /** Visual treatment - 'default' is standard card, 'band' is full-bleed shaded section */
    variant?: 'default' | 'band' | 'hero';
    /** Disable scroll-triggered animation */
    disableAnimation?: boolean;
}

/**
 * SPASection - Full-width card row component for the unified SPA layout.
 * Features subtle fade-in animation on viewport entry.
 */
export const SPASection: React.FC<SPASectionProps> = ({
    id,
    children,
    className,
    variant = 'default',
    disableAnimation = false,
}) => {
    const ref = useRef<HTMLElement>(null);
    const [isVisible, setIsVisible] = useState(disableAnimation);

    useEffect(() => {
        if (disableAnimation || !ref.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px',
            }
        );

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [disableAnimation]);

    const baseStyles = 'w-full';

    const variantStyles = {
        default: 'px-4 sm:px-6 lg:px-8',
        band: 'py-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-white/5',
        hero: 'px-4 sm:px-6 lg:px-8 py-8',
    };

    const animationStyles = isVisible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-4';

    return (
        <section
            ref={ref}
            id={id}
            className={cn(
                baseStyles,
                variantStyles[variant],
                'transition-all duration-700 ease-out',
                animationStyles,
                className
            )}
        >
            <div className="max-w-[1600px] mx-auto">
                {children}
            </div>
        </section>
    );
};
