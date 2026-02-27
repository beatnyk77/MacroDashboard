import React, { useState } from 'react';
import {
    LayoutDashboard,
    ShieldAlert,
    BookOpen,
    Rss,
    FileText,
    Eye,
    ChevronDown,
    Building2,
    FlaskConical,
    Globe,
    Zap,
    TrendingUp,
    Anchor,
    Box
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
    id: string;
    label: string;
    path: string;
    icon: React.ReactNode;
    children?: { label: string; path: string; icon: React.ReactNode }[];
}

const navItems: NavItem[] = [
    { id: 'home', label: 'Home', path: '/', icon: <LayoutDashboard size={18} strokeWidth={2.5} /> },
    { id: 'digest', label: 'Regime Digest', path: '/regime-digest', icon: <FileText size={18} strokeWidth={2.5} /> },
    { id: 'notes', label: 'Research Notes', path: '/blog', icon: <Rss size={18} strokeWidth={2.5} /> },
    { id: 'observatory', label: 'Macro Observatory', path: '/macro-observatory', icon: <Eye size={18} strokeWidth={2.5} /> },
    { id: 'india-equities', label: 'India Equities', path: '/india-equities', icon: <Building2 size={18} strokeWidth={2.5} /> },
    {
        id: 'labs',
        label: 'Labs',
        path: '#',
        icon: <FlaskConical size={18} strokeWidth={2.5} />,
        children: [
            { label: 'US Macro & Fiscal', path: '/labs/us-macro-fiscal', icon: <Zap size={14} /> },
            { label: 'India Lab', path: '/labs/india', icon: <Globe size={14} /> },
            { label: 'China Lab', path: '/labs/china', icon: <TrendingUp size={14} /> },
            { label: 'De-Dollarization', path: '/labs/de-dollarization-gold', icon: <Anchor size={14} /> },
            { label: 'Energy & Commodities', path: '/labs/energy-commodities', icon: <Zap size={14} /> },
            { label: 'Sovereign Stress', path: '/labs/sovereign-stress', icon: <ShieldAlert size={14} /> },
            { label: 'Shadow System', path: '/labs/shadow-system', icon: <Box size={14} /> },
        ]
    },
    { id: 'institutional', label: 'For Funds & Family Offices', path: '/institutional', icon: <ShieldAlert size={18} strokeWidth={2.5} /> },
    { id: 'methodology', label: 'Methodology & Data', path: '/methodology', icon: <BookOpen size={18} strokeWidth={2.5} /> },
];

export const NavigationSidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [openMenus, setOpenMenus] = useState<string[]>(['labs']); // Keep Labs open by default

    const toggleMenu = (id: string) => {
        setOpenMenus(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const handleNavClick = (e: React.MouseEvent, path: string, hasChildren?: boolean, id?: string) => {
        if (hasChildren && id) {
            e.preventDefault();
            toggleMenu(id);
            return;
        }

        if (path.startsWith('/#')) {
            e.preventDefault();
            const elementId = path.replace('/#', '');

            if (location.pathname !== '/') {
                navigate(path);
            } else {
                const element = document.getElementById(elementId);
                if (element) {
                    const offset = 80;
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

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
                        Intelligence Console
                    </span>
                </div>
                <ul className="space-y-1.5">
                    {navItems.map((item) => {
                        const hasChildren = !!item.children;
                        const isOpen = openMenus.includes(item.id);
                        const isChildActive = item.children?.some(child => location.pathname === child.path);
                        const isActive = location.pathname === item.path || (item.path.includes('#') && location.hash === `#${item.path.split('#')[1]}`) || isChildActive;

                        return (
                            <li key={item.id} className="space-y-1">
                                <NavLink
                                    to={item.path}
                                    onClick={(e) => handleNavClick(e, item.path, hasChildren, item.id)}
                                    className={cn(
                                        "group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300",
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
                                    {hasChildren && (
                                        <ChevronDown size={14} className={cn("ml-auto transition-transform duration-300", isOpen && "rotate-180")} />
                                    )}
                                    {!hasChildren && isActive && (
                                        <div className="ml-auto w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                    )}
                                </NavLink>

                                {hasChildren && isOpen && (
                                    <ul className="pl-9 space-y-1 mt-1">
                                        {item.children?.map((child) => {
                                            const isChildCurrent = location.pathname === child.path;
                                            return (
                                                <li key={child.path}>
                                                    <NavLink
                                                        to={child.path}
                                                        className={cn(
                                                            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.7rem] transition-all duration-200",
                                                            isChildCurrent
                                                                ? "text-blue-400 font-bold bg-blue-500/5"
                                                                : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/5 font-medium"
                                                        )}
                                                    >
                                                        <span className={isChildCurrent ? "text-blue-400" : "opacity-50"}>{child.icon}</span>
                                                        {child.label}
                                                    </NavLink>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
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
