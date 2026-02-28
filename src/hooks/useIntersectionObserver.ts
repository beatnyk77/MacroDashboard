/* eslint-disable no-undef */
import { useState, useEffect, useRef, MutableRefObject } from 'react';

export function useIntersectionObserver(
    options: IntersectionObserverInit = { threshold: 0.1, rootMargin: '200px' }
): [MutableRefObject<HTMLDivElement | null>, boolean] {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsIntersecting(true);
                // Disconnect after first intersection for lazy loading
                observer.unobserve(element);
            }
        }, options);

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.rootMargin, options.root, options.threshold]);

    return [ref, isIntersecting];
}

