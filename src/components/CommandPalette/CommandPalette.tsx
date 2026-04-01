import React, { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import {
    Search,
    Navigation,
    Zap,
    Book,
    Settings,
    BarChart3,
    Globe,
    FlaskConical,
    Flag,
    Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './command-palette.css';

interface CommandPaletteProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, setOpen }) => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(!open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [open, setOpen]);

    const runCommand = useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, [setOpen]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-[20vh] px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Command
                className="w-full max-w-[640px] bg-slate-900 border border-white/12 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 animate-in zoom-in-95 duration-200"
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        setOpen(false);
                    }
                }}
            >
                <div className="flex items-center border-b border-white/5 px-4 h-14">
                    <Search className="mr-3 h-5 w-5 text-muted-foreground shrink-0" />
                    <Command.Input
                        autoFocus
                        placeholder="Type a command or search..."
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 font-medium py-4"
                        value={search}
                        onValueChange={setSearch}
                    />
                    <div className="flex items-center gap-1">
                        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/12 bg-white/5 px-1.5 font-mono text-xs font-medium text-muted-foreground opacity-100">
                            ESC
                        </kbd>
                    </div>
                </div>

                <Command.List className="max-h-[min(380px,calc(100vh-250px))] overflow-y-auto p-2 scroll-smooth">
                    <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                        No results found.
                    </Command.Empty>

                    <Command.Group heading="Navigation" className="px-2 py-2 text-xs font-bold text-muted-foreground/50 uppercase tracking-uppercase">
                        <Item
                            onSelect={() => runCommand(() => navigate('/'))}
                            icon={<Home className="h-4 w-4" />}
                        >
                            Macro Observatory (Home)
                        </Item>
                        <Item
                            onSelect={() => runCommand(() => navigate('/macro-observatory'))}
                            icon={<BarChart3 className="h-4 w-4" />}
                        >
                            Market Pulse Analytics
                        </Item>
                        <Item
                            onSelect={() => runCommand(() => navigate('/methodology'))}
                            icon={<Zap className="h-4 w-4" />}
                        >
                            Metrics Methodology
                        </Item>
                    </Command.Group>

                    <Command.Group heading="Thematic Labs" className="px-2 py-3 text-xs font-bold text-muted-foreground/50 uppercase tracking-uppercase border-t border-white/5 mt-1">
                        <Item
                            onSelect={() => runCommand(() => navigate('/intel/india'))}
                            icon={<Flag className="h-4 w-4 text-emerald-500" />}
                        >
                            India Intelligence Lab
                        </Item>
                        <Item
                            onSelect={() => runCommand(() => navigate('/intel/china'))}
                            icon={<Flag className="h-4 w-4 text-rose-500" />}
                        >
                            China Macro Lab
                        </Item>
                        <Item
                            onSelect={() => runCommand(() => navigate('/labs/us-macro-fiscal'))}
                            icon={<FlaskConical className="h-4 w-4 text-blue-500" />}
                        >
                            US Fiscal & SOMA Lab
                        </Item>
                        <Item
                            onSelect={() => runCommand(() => navigate('/labs/de-dollarization-gold'))}
                            icon={<Globe className="h-4 w-4 text-amber-500" />}
                        >
                            De-Dollarization & Gold
                        </Item>
                        <Item
                            onSelect={() => runCommand(() => navigate('/labs/energy-commodities'))}
                            icon={<Zap className="h-4 w-4 text-orange-500" />}
                        >
                            Energy Security Matrix
                        </Item>
                    </Command.Group>

                    <Command.Group heading="Terminal Sections" className="px-2 py-3 text-xs font-bold text-muted-foreground/50 uppercase tracking-uppercase border-t border-white/5 mt-1">
                        <Item
                            onSelect={() => runCommand(() => {
                                navigate('/');
                                setTimeout(() => document.getElementById('geopolitical-matrix')?.scrollIntoView({ behavior: 'smooth' }), 100);
                            })}
                            icon={<Globe className="h-4 w-4 text-rose-400" />}
                        >
                            Jump to Geopolitical Risk
                        </Item>
                    </Command.Group>

                    <Command.Group heading="Knowledge" className="px-2 py-3 text-xs font-bold text-muted-foreground/50 uppercase tracking-uppercase border-t border-white/5 mt-1">
                        <Item
                            onSelect={() => runCommand(() => navigate('/glossary'))}
                            icon={<Book className="h-4 w-4" />}
                        >
                            Search Macro Glossary
                        </Item>
                        <Item
                            onSelect={() => runCommand(() => navigate('/blog'))}
                            icon={<Navigation className="h-4 w-4" />}
                        >
                            Regime Narratives & Blog
                        </Item>
                    </Command.Group>

                    <Command.Group heading="External & API" className="px-2 py-3 text-xs font-bold text-muted-foreground/50 uppercase tracking-uppercase border-t border-white/5 mt-1">
                        <Item
                            onSelect={() => runCommand(() => navigate('/api-access'))}
                            icon={<Settings className="h-4 w-4" />}
                        >
                            API Documentation
                        </Item>
                        <Item
                            onSelect={() => runCommand(() => navigate('/institutional'))}
                            icon={<Zap className="h-4 w-4 text-blue-400" />}
                        >
                            Institutional Inquiry
                        </Item>
                    </Command.Group>
                </Command.List>

                <div className="flex items-center justify-between px-4 h-10 border-t border-white/5 bg-slate-900/50">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                            <kbd className="flex h-5 select-none items-center gap-1 rounded bg-white/5 px-1.5 font-mono text-xs font-medium text-muted-foreground border border-white/12">
                                ENTER
                            </kbd>
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-uppercase">to select</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <kbd className="flex h-5 select-none items-center gap-1 rounded bg-white/5 px-1.5 font-mono text-xs font-medium text-muted-foreground border border-white/12">
                                ↓↑
                            </kbd>
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-uppercase">to navigate</span>
                        </div>
                    </div>
                </div>
            </Command>
        </div>
    );
};

const Item = ({ children, onSelect, icon }: { children: React.ReactNode, onSelect: () => void, icon?: React.ReactNode }) => (
    <Command.Item
        onSelect={onSelect}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 cursor-pointer aria-selected:bg-white/5 aria-selected:text-white transition-all group"
    >
        <span className="p-1 rounded-lg bg-white/5 group-aria-selected:bg-blue-500/20 group-aria-selected:text-blue-400 transition-colors">
            {icon}
        </span>
        {children}
    </Command.Item>
);
