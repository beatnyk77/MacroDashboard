import React from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface LazyRenderProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    minHeight?: string | number;
    rootMargin?: string;
}

export const LazyRender: React.FC<LazyRenderProps> = ({
    children,
    fallback,
    minHeight = '300px',
    rootMargin = '400px'
}) => {
    const [ref, isIntersecting] = useIntersectionObserver({ rootMargin, threshold: 0.01 });

    return (
        <div ref={ref} style={{ minHeight }} className="lazy-render-container w-full h-full">
            {isIntersecting ? children : fallback}
        </div>
    );
};
