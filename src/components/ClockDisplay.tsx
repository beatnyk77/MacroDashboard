import React, { useState, useEffect } from 'react';

/**
 * ClockDisplay — isolated component that owns its own 1s ticker.
 *
 * Rationale: Previously the clock state lived in GlobalLayout, causing the entire
 * app layout tree to re-render every second. By extracting into its own component,
 * only this tiny node re-renders on each tick.
 */
export const ClockDisplay: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="hidden md:flex items-center gap-4">
            <div>
                <span className="block text-xs font-black text-muted-foreground uppercase leading-none mb-0.5">
                    LOCAL TIME
                </span>
                <span className="text-sm font-black text-foreground font-mono">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
            </div>
            <div>
                <span className="block text-xs font-black text-muted-foreground uppercase leading-none mb-0.5">
                    DATE
                </span>
                <span className="text-xs font-black text-foreground">
                    {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
            </div>
        </div>
    );
};
