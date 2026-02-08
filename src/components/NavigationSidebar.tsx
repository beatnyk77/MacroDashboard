import React from 'react';
import {
    LayoutDashboard,
    Coins,
    Globe,
    BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { NavLink, useLocation } from 'react-router-dom';

interface NavItem {
    id: string;
    label: string;
    path: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Macro Heartbeat', path: '/', icon: <LayoutDashboard size={18} strokeWidth={2.5} /> },
    { id: 'thematics', label: 'Thematic Labs', path: '/#thematic-labs', icon: <Coins size={18} strokeWidth={2.5} /> },
    { id: 'countries', label: 'Country Pulses', path: '/#country-pulses', icon: <Globe size={18} strokeWidth={2.5} /> },
    { id: 'methodology', label: 'Methodology & Data', path: '/methodology', icon: <BookOpen size={18} strokeWidth={2.5} /> },
];

export const NavigationSidebar: React.FC = () => {
    const location = useLocation();

    return (
        <aside className="hidden lg:flex w-[260px] h-[calc(100vh-72px)] sticky top-[72px] left-0 flex-col border-r border-white/10 bg-background/50 backdrop-blur-xl py-8 z-[1200] overflow-y-auto">
            <nav className="px-4 flex-1">
                <div className="mb-6 px-2">
                    <span className="text-[0.65rem] font-black tracking-[0.2em] text-muted-foreground/50 uppercase">
                        Main Navigation
                    </span>
                </div>
                <ul className="space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <li key={item.id}>
                                <NavLink
                                    to={item.path}
                                    className={cn(
                                        "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300",
                                        isActive
                                            ? "bg-blue-500/10 text-primary font-bold shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] border border-blue-500/20"
                                            : "text-muted-foreground/70 hover:text-primary hover:bg-white/5 font-medium border border-transparent"
                                    )}
                                >
                                    <span className={cn(
                                        "shrink-0 transition-colors duration-300",
                                        isActive ? "text-blue-400" : "text-muted-foreground/50 group-hover:text-muted-foreground"
                                    )}>
                                        {item.icon}
                                    </span>
                                    <span className="truncate">{item.label}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                    )}
                                </NavLink>
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
