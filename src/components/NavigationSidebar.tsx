import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Droplets,
    Coins,
    AlertTriangle,
    Globe,
    Flag,
    Table,
    BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { id: 'top', label: 'Cockpit', icon: <LayoutDashboard size={20} /> },
    { id: 'global-liquidity-section', label: 'Liquidity', icon: <Droplets size={20} /> },
    { id: 'hard-asset-valuation-section', label: 'Hard Assets', icon: <Coins size={20} /> },
    { id: 'treasury-snapshot-section', label: 'Sovereign Stress', icon: <AlertTriangle size={20} /> },
    { id: 'de-dollarization-section', label: 'BRICS & De-USD', icon: <Globe size={20} /> },
    { id: 'china-macro-section', label: 'Country Pulses', icon: <Flag size={20} /> },
    { id: 'major-economies-section', label: 'Data Tables', icon: <Table size={20} /> },
    { id: 'how-to-use', label: 'Methodology', icon: <BookOpen size={20} /> },
];

export const NavigationSidebar: React.FC = () => {
    const [activeId, setActiveId] = useState('top');

    useEffect(() => {
        const handleIntersect: IntersectionObserverCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveId(entry.target.id);
                }
            });
        };

        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px', // Detect when item is roughly in top-middle of view
            threshold: 0
        };

        const observer = new IntersectionObserver(handleIntersect, observerOptions);

        navItems.forEach((item) => {
            const el = document.getElementById(item.id);
            if (el) {
                observer.observe(el);
            }
        });

        return () => observer.disconnect();
    }, []);

    const handleNavClick = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const offset = 80; // Offset for sticky header
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            setActiveId(id);
        }
    };

    return (
        <aside className="hidden lg:flex w-[240px] h-[calc(100vh-72px)] sticky top-[72px] left-0 flex-col border-r border-white/10 bg-background py-8 z-[1200] overflow-y-auto">
            <nav className="px-3 flex-1">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = activeId === item.id;
                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => handleNavClick(item.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border-l-[3px]",
                                        isActive
                                            ? "bg-blue-500/10 text-primary border-yellow-500 font-bold"
                                            : "text-muted-foreground border-transparent hover:bg-white/5 font-medium"
                                    )}
                                >
                                    <span className={cn(
                                        "shrink-0",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {item.icon}
                                    </span>
                                    <span className="truncate">{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="mt-auto px-6 py-4 border-t border-white/10">
                <span className="block text-[0.65rem] font-black tracking-widest text-muted-foreground uppercase mb-3">
                    SIGNAL KEY
                </span>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span className="text-xs font-semibold text-muted-foreground">Healthy</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                        <span className="text-xs font-semibold text-muted-foreground">Watch</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                        <span className="text-xs font-semibold text-muted-foreground">Danger</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};
