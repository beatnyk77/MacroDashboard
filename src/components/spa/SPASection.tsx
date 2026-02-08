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
    /** Apply staggered fade-in to children */
    staggerChildren?: boolean;
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
    staggerChildren = false,
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

    const animationStyles = isVisible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-8';

    return (
        <section
            ref={ref}
            id={id}
            className={cn(
                baseStyles,
                variant === 'band' && 'shaded-band',
                'transition-all duration-1000 cubic-bezier(0.22, 1, 0.36, 1)',
                animationStyles,
                staggerChildren && '[&>*]:opacity-0',
                isVisible && staggerChildren && '[&>*]:animate-in [&>*]:fade-in [&>*]:slide-in-from-bottom-4 [&>*]:duration-700',
                className
            )}
        >
            <div className={cn(
                "spa-row mx-auto transition-all duration-1000 delay-100",
                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
            )}>
                {children}
            </div>
        </section>
    );
};
