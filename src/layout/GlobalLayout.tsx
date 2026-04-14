import React, { useMemo, useState, useEffect } from 'react';
import { Activity, Menu, X, Globe, TrendingUp, Anchor, Zap, ShieldAlert, Database, BarChart3, Radio, FileText, ShieldCheck } from 'lucide-react';
import { useLocation, NavLink, useSearchParams } from 'react-router-dom';
import { useRegime } from '@/hooks/useRegime';
import { SocialShareMode } from '@/components/SocialShareMode';
import { MobileNav } from '@/components/MobileNav';
import { InstitutionalFooter } from '@/components/InstitutionalFooter';
import { TerminalSidebar } from '@/components/TerminalSidebar';
import { IntelligenceSidebar } from '@/components/IntelligenceSidebar';
import { cn } from '@/lib/utils';
import { DataHealthBanner } from '@/components/DataHealthBanner';
import { QuickTourModal } from '@/components/QuickTourModal';
import { CommandPalette } from '@/components/CommandPalette/CommandPalette';
import { Button } from '@/components/ui/button';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Box } from '@mui/material';

interface GlobalLayoutProps {
    children: React.ReactNode;
}

const terminalNavItems = [
    { id: 'weekly-narrative', label: 'Weekly Narrative', path: '/weekly-narrative', icon: <FileText size={18} /> },
    { id: 'observatory', label: 'Global Macro Overview', path: '/', icon: <Radio size={18} /> },
    { id: 'regime-digest', label: 'Regime Digest', path: '/regime-digest', icon: <FileText size={18} /> },
    { id: 'us-macro', label: 'US Macro Pulse', path: '/labs/us-macro-fiscal', icon: <TrendingUp size={18} /> },
    { id: 'china', label: 'China Macro Pulse', path: '/intel/china', icon: <TrendingUp size={18} /> },
    { id: 'india-flow', label: 'India Flow Pulse (FII/DII)', path: '/india-equities/fii-dii', icon: <Activity size={18} /> },
    { id: 'india', label: 'India Macro Pulse', path: '/intel/india', icon: <Globe size={18} /> },
    { id: 'commodities', label: 'Energy & Commodities', path: '/labs/energy-commodities', icon: <Database size={18} /> },
    { id: 'sovereign', label: 'Sovereign Stress', path: '/labs/sovereign-stress', icon: <ShieldAlert size={18} /> },
    { id: 'de-dollarization', label: 'De-Dollarization & Gold', path: '/labs/de-dollarization-gold', icon: <Anchor size={18} /> },
];

export const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children }) => {
    const { data: regime } = useRegime();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [cmdKOpen, setCmdKOpen] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const isEmbedded = searchParams.get('embed') === 'true';
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


    return (
        <div
            className="min-h-screen flex flex-col bg-background transition-colors duration-500 ease-in-out"
        >
            {/* Skip to main content for keyboard navigation */}
            <a
                href="#main-content"
                className="skip-link"
                style={{
                    position: 'absolute',
                    top: '-40px',
                    left: 0,
                    backgroundColor: '#F59E0B',
                    color: '#0F172A',
                    padding: '8px 12px',
                    zIndex: 100,
                    transition: 'top 0.3s',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    borderRadius: '0 0 4px 0'
                }}
            >
                Skip to main content
            </a>

            {isObservatory && !isEmbedded && <DataHealthBanner />}
            {!isEmbedded && (
                <header className="sticky top-0 z-[1300] w-full border-b border-white/12 bg-slate-950/90 backdrop-blur-md">
                <div className="flex h-16 items-center justify-between px-4 md:px-8">
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity">
                            <Activity
                                size={28}
                                className={regimeColorClass}
                            />
                            <div className="hidden sm:block text-2xl font-black tracking-heading leading-none">
                                <span className="text-foreground">Graphi</span>
                                <span className="text-blue-500">Questor</span>
                                <div className="text-xs font-bold text-muted-foreground/50 tracking-uppercase mt-1 uppercase">
                                    Macro Observatory · Not Sovereign AI
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:block h-6 w-px bg-white/10 mx-2" />

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
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Hamburger menu button for mobile */}
                        <button
                            className="lg:hidden flex items-center justify-center w-12 h-12 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            onClick={() => setMobileDrawerOpen(true)}
                            aria-label="Open navigation menu"
                        >
                            <Menu size={24} />
                        </button>

                        {regime && (
                            <div className={cn(
                                "flex items-center px-2 py-0.5 rounded border text-xs font-black tracking-uppercase uppercase h-6",
                                regimeColorClass,
                                regimeColorClass.replace('text-', 'bg-').replace('500', '500/10'),
                                regimeColorClass.replace('text-', 'border-').replace('500', '500/30')
                            )}>
                                DETECTION: {regime.regimeLabel.toUpperCase()}
                            </div>
                        )}

                        <Button
                            variant="contained"
                            size="sm"
                            onClick={() => {
                                const el = document.getElementById('weekly-narrative');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                else window.location.href = '/#weekly-narrative';
                            }}
                            className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider text-sm px-3 py-2 min-h-11"
                        >
                            Subscribe
                        </Button>
                    </div>
                </div>
                </header>
            )}

            {/* Mobile Navigation Drawer */}
            <Drawer
                anchor="left"
                open={mobileDrawerOpen}
                onClose={() => setMobileDrawerOpen(false)}
                ModalProps={{
                    keepMounted: true,
                }}
                PaperProps={{
                    sx: {
                        width: 280,
                        bgcolor: 'rgba(2, 6, 23, 0.98)',
                        backdropFilter: 'blur(12px)',
                        borderRight: '1px solid rgba(255,255,255,0.08)',
                    },
                }}
            >
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-sm font-black text-white uppercase tracking-uppercase">Navigation</span>
                    <button
                        onClick={() => setMobileDrawerOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Close navigation menu"
                    >
                        <X size={20} className="text-white" />
                    </button>
                </Box>
                <Box component="nav" sx={{ p: 2 }}>
                    <List dense>
                        {terminalNavItems.map((item) => {
                            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
                            return (
                                <ListItem
                                    button
                                    key={item.id}
                                    onClick={() => setMobileDrawerOpen(false)}
                                    component={NavLink}
                                    to={item.path}
                                    sx={{
                                        borderRadius: 1,
                                        mb: 0.5,
                                        color: isActive ? 'primary.main' : 'text.secondary',
                                        bgcolor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.05)',
                                            color: 'text.primary',
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            className: "text-xs font-black uppercase tracking-uppercase"
                                        }}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </Box>
            </Drawer>

            <div className="flex flex-1">
                {/* Persistent Terminal Sidebar */}
                {!isEmbedded && <TerminalSidebar />}

                <main id="main-content" tabIndex={-1} className={cn("flex-1 px-0 flex flex-col w-full overflow-x-hidden min-w-0", !isEmbedded && "py-4 md:py-8")}>
                    <div className={cn("flex-1 w-full max-w-[1920px] mx-auto", !isEmbedded && "px-4 sm:px-6 lg:px-8")}>
                        {children}
                    </div>
                </main>

                {/* Intelligence Sidebar (Desktop Only) */}
                {!isEmbedded && <IntelligenceSidebar />}
            </div>

            {/* Dashboard Footer with Disclaimer & Data Transparency */}
            {!isEmbedded && <InstitutionalFooter />}

            <CommandPalette open={cmdKOpen} setOpen={setCmdKOpen} />
            {!isEmbedded && <SocialShareMode />}
            {!isEmbedded && <MobileNav />}
            {!isEmbedded && <QuickTourModal />}
        </div>
    );
};
