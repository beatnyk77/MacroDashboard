import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    ui: ['@mui/material', '@emotion/react', '@emotion/styled', 'lucide-react'],
                    charts: ['recharts'],
                },
            },
        },
        chunkSizeWarningLimit: 1000,
    },
});
