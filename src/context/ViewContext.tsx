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

    return (
        <ViewContext.Provider value={{ isInstitutionalView, setInstitutionalView }}>
            {children}
        </ViewContext.Provider>
    );
};

export const useViewContext = () => {
    const context = useContext(ViewContext);
    if (!context) throw new Error('useViewContext must be used within a ViewProvider');
    return context;
};
