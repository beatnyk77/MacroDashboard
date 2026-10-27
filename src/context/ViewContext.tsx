/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ViewContextType {
    isInstitutionalView: boolean;
    setInstitutionalView: (val: boolean) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isInstitutionalView, setInstitutionalView] = useState(() => {
        const saved = localStorage.getItem('isInstitutionalView');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('isInstitutionalView', String(isInstitutionalView));
    }, [isInstitutionalView]);

    // The terminal is dark-only. Pin the root classes and drop the retired theme preference.
    useEffect(() => {
        const root = document.documentElement;
        root.dataset.theme = 'dark';
        root.classList.add('dark');
        root.classList.remove('light', 'lively');
        try {
            localStorage.removeItem('gq_theme_mode');
        } catch {
            // Storage can be unavailable (private mode, embeds); nothing to clean up.
        }
    }, []);

    return (
        <ViewContext.Provider
            value={{
                isInstitutionalView,
                setInstitutionalView,
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
