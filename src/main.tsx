import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { ErrorBoundary } from './components/ErrorBoundary';

import { HelmetProvider } from 'react-helmet-async';

// Force dark mode
document.documentElement.classList.add('dark');

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <HelmetProvider>
                <App />
            </HelmetProvider>
        </ErrorBoundary>
    </React.StrictMode>
);
