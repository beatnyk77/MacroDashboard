import React, { useMemo, useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useRegime } from '@/hooks/useRegime';
import { SocialShareMode } from '@/components/SocialShareMode';
import { MobileNav } from '@/components/MobileNav';
import { InstitutionalFooter } from '@/components/InstitutionalFooter';
import { NavigationSidebar } from '@/components/NavigationSidebar';
import { IntelligenceSidebar } from '@/components/IntelligenceSidebar';
import { cn } from '@/lib/utils';
import { DataHealthBanner } from '@/components/DataHealthBanner';

interface GlobalLayoutProps {
    children: React.ReactNode;
}

export const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children }) => {
    const { data: regime } = useRegime();
    const [currentTime, setCurrentTime] = useState(new Date());
    const location = useLocation();
    const isObservatory = location.pathname.includes('/macro-observatory');


    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);



    const regimeColorClass = useMemo(() => {
        if (!regime) return 'text-blue-500';
        const label = regime.regimeLabel.toLowerCase();
        if (label.includes('expansion') || label.includes('recovery')) return 'text-emerald-500';
        if (label.includes('tightening') || label.includes('slowdown')) return 'text-rose-500';
        return 'text-blue-500';
    }, [regime]);

    // Hex colors for drop-shadow style which needs exact color
    const regimeColorHex = useMemo(() => {
        if (!regime) return '#3b82f6';
        const label = regime.regimeLabel.toLowerCase();
        if (label.includes('expansion') || label.includes('recovery')) return '#10b981';
        if (label.includes('tightening') || label.includes('slowdown')) return '#f43f5e';
        return '#3b82f6';
    }, [regime]);

    const bgTintStyle = useMemo(() => {
        if (!regime) return 'transparent';
        const label = regime.regimeLabel.toLowerCase();
        // Very subtle tints
        if (label.includes('expansion') || label.includes('recovery')) return `rgba(16, 185, 129, 0.03)`;
        if (label.includes('tightening') || label.includes('slowdown')) return `rgba(244, 63, 94, 0.03)`;
        return 'transparent';
    }, [regime]);

    return (
        <div
            className="min-h-screen flex flex-col bg-background transition-[background-image] duration-500 ease-in-out"
            style={{
                backgroundImage: `radial-gradient(circle at 50% -20%, ${bgTintStyle}, transparent 70%)`
            }}
        >
            {isObservatory && <DataHealthBanner />}
            <header className="sticky top-0 z-[1300] w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
                <div className="flex h-[60px] md:h-[72px] items-center justify-between px-4 md:px-8">
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity">
                            <Activity
                                size={28}
                                className={regimeColorClass}
                                style={{ filter: `drop-shadow(0 0 8px ${regimeColorHex}40)` }}
                            />
                            <div className="hidden sm:block text-2xl font-black tracking-tighter leading-none">
                                <span className="text-foreground">Graphi</span>
                                <span className="text-blue-500">Questor</span>
                                <span className="hidden md:inline ml-2 text-sm font-semibold text-muted-foreground tracking-widest align-middle">
                                    – MACRO OBSERVATORY
                                </span>
                            </div>
                        </div>

                        <div className="hidden md:block h-6 w-px bg-white/10 mx-2" />

                        <div className="hidden md:flex items-center gap-4">
                            <div>
                                <span className="block text-[0.6rem] font-black text-muted-foreground uppercase leading-none mb-0.5">
                                    LOCAL TIME
                                </span>
                                <span className="text-sm font-black text-foreground font-mono">
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                            <div>
                                <span className="block text-[0.6rem] font-black text-muted-foreground uppercase leading-none mb-0.5">
                                    DATE
                                </span>
                                <span className="text-xs font-black text-foreground">
                                    {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Institutional status elements removed from public view for cleaner UI */}

                        {regime && (
                            <div className={cn(
                                "flex items-center px-2 py-0.5 rounded border text-[0.65rem] font-black tracking-wider uppercase h-6",
                                regimeColorClass.replace('text-', 'text-'), // Ensures text color applies
                                regimeColorClass.replace('text-', 'bg-').replace('500', '500/10'), // Background tint
                                regimeColorClass.replace('text-', 'border-').replace('500', '500/30') // Border tint
                            )}>
                                DETECTION: {regime.regimeLabel.toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex flex-1">
                {/* Navigation Sidebar (Desktop Only) */}
                <NavigationSidebar />

                <main className="flex-1 py-4 md:py-8 flex flex-col w-full overflow-x-hidden min-w-0">
                    <div className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>

                {/* Intelligence Sidebar (Desktop Only) */}
                <IntelligenceSidebar />
            </div>

            {/* Dashboard Footer with Disclaimer & Data Transparency */}
            <InstitutionalFooter />

            <SocialShareMode />
            <MobileNav />
        </div>
    );
};

