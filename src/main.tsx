import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

import { HelmetProvider } from 'react-helmet-async';
import { initErrorReporting } from '@/lib/errorReporting';

// Force dark mode
document.documentElement.classList.add('dark');

initErrorReporting();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <HelmetProvider>
                <App />
            </HelmetProvider>
        </ErrorBoundary>
    </React.StrictMode>
);
