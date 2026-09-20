/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ViewContextType {
    isInstitutionalView: boolean;
    setInstitutionalView: (val: boolean) => void;
    themeMode: ThemeMode;
    resolvedTheme: ResolvedTheme;
    setThemeMode: (mode: ThemeMode) => void;
    toggleThemeMode: () => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isInstitutionalView, setInstitutionalView] = useState(() => {
        const saved = localStorage.getItem('isInstitutionalView');
        return saved === 'true';
    });

    const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('gq_theme_mode');
        if (saved === 'dark' || saved === 'system') return saved;
        return 'light';
    });
    const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => (
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    ));

    const resolvedTheme: ResolvedTheme = themeMode === 'system' ? systemTheme : themeMode;

    useEffect(() => {
        localStorage.setItem('isInstitutionalView', String(isInstitutionalView));
    }, [isInstitutionalView]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = (event: Event) => {
            const media = event.currentTarget as unknown as { matches: boolean };
            setSystemTheme(media.matches ? 'dark' : 'light');
        };
        mediaQuery.addEventListener('change', handleSystemThemeChange);
        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }, []);

    useEffect(() => {
        localStorage.setItem('gq_theme_mode', themeMode);
        const root = document.documentElement;
        root.dataset.theme = resolvedTheme;
        root.classList.toggle('dark', resolvedTheme === 'dark');
        root.classList.toggle('light', resolvedTheme === 'light');
        // Keep the legacy selector active while existing utility overrides migrate.
        root.classList.toggle('lively', resolvedTheme === 'light');
        if (resolvedTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [themeMode, resolvedTheme]);

    const toggleThemeMode = () => {
        setThemeMode((prev) => (prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'));
    };

    return (
        <ViewContext.Provider
            value={{
                isInstitutionalView,
                setInstitutionalView,
                themeMode,
                resolvedTheme,
                setThemeMode,
                toggleThemeMode,
            }}
        >
            {children}
        </ViewContext.Provider>
    );
};

export const useViewContext = () => {
    const context = useContext(ViewContext);
    if (!context) throw new Error('useViewContext must be used within a ViewProvider');
    return context;
};
