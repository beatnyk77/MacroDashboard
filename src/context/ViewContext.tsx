/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'lively' | 'dark';

interface ViewContextType {
    isInstitutionalView: boolean;
    setInstitutionalView: (val: boolean) => void;
    themeMode: ThemeMode;
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
        if (saved === 'dark' || saved === 'lively') return saved;
        return 'lively'; // Default to Lively Porcelain Executive
    });

    useEffect(() => {
        localStorage.setItem('isInstitutionalView', String(isInstitutionalView));
    }, [isInstitutionalView]);

    useEffect(() => {
        localStorage.setItem('gq_theme_mode', themeMode);
        const root = document.documentElement;
        if (themeMode === 'dark') {
            root.classList.add('dark');
            root.classList.remove('lively');
        } else {
            root.classList.remove('dark');
            root.classList.add('lively');
        }
    }, [themeMode]);

    const toggleThemeMode = () => {
        setThemeMode((prev) => (prev === 'lively' ? 'dark' : 'lively'));
    };

    return (
        <ViewContext.Provider
            value={{
                isInstitutionalView,
                setInstitutionalView,
                themeMode,
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
