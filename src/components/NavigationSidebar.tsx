import React from 'react';
import {
    LayoutDashboard,
    ShieldAlert,
    MapPin,
    Building2,
    Coins,
    Globe,
    BookOpen,
    Rss
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { NavLink, useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
    id: string;
    label: string;
    path: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Macro Heartbeat', path: '/', icon: <LayoutDashboard size={18} strokeWidth={2.5} /> },
    { id: 'policy', label: 'Geopolitics & Policy', path: '/#policy-geopolitics', icon: <ShieldAlert size={18} strokeWidth={2.5} /> },
    { id: 'thematics', label: 'Thematic Deep Dives', path: '/#thematic-labs', icon: <Coins size={18} strokeWidth={2.5} /> },
    { id: 'sovereign', label: 'Sovereign stress', path: '/#sovereign-debt-stress', icon: <Building2 size={18} strokeWidth={2.5} /> },
    { id: 'india', label: 'India Macro Pulse', path: '/#india-pulse', icon: <MapPin size={18} strokeWidth={2.5} /> },
    { id: 'china', label: 'China Pulse', path: '/#china-pulse', icon: <Globe size={18} strokeWidth={2.5} /> },
    { id: 'methodology', label: 'Methodology & Data', path: '/methodology', icon: <BookOpen size={18} strokeWidth={2.5} /> },
];

export const NavigationSidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleNavClick = (e: React.MouseEvent, path: string) => {
        if (path.startsWith('/#')) {
            e.preventDefault();
            const id = path.replace('/#', '');

            if (location.pathname !== '/') {
                navigate(path);
            } else {
                const element = document.getElementById(id);
                if (element) {
                    const offset = 80; // Account for fixed header
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Update URL hash without reload
                    window.history.pushState(null, '', path);
                }
            }
        }
    };

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
                        const isActive = location.pathname === item.path || (item.path.includes('#') && location.hash === `#${item.path.split('#')[1]}`);
                        return (
                            <li key={item.id}>
                                <NavLink
                                    to={item.path}
                                    onClick={(e) => handleNavClick(e, item.path)}
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

                <div className="mt-8">
                    <a
                        href="/rss.xml"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 px-4 py-2 rounded-lg text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-orange-400 hover:bg-orange-500/5 transition-all duration-300 border border-transparent hover:border-orange-500/10"
                    >
                        <Rss size={14} className="text-muted-foreground/40 group-hover:text-orange-500" />
                        Subscribe via RSS
                    </a>
                </div>
            </div>
        </aside>
    );
};
