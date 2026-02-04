import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
    {
        ignores: ['dist']
    },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                fetch: 'readonly',
                Response: 'readonly',
                Request: 'readonly',
                React: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                process: 'readonly',
                navigator: 'readonly',
                location: 'readonly',
                history: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                prompt: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                Headers: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                FormData: 'readonly',
                Blob: 'readonly',
                File: 'readonly',
                Image: 'readonly',
                Audio: 'readonly',
                Video: 'readonly',
                CanvasRenderingContext2D: 'readonly',
                WebSocket: 'readonly',
                Event: 'readonly',
                CustomEvent: 'readonly',
                MouseEvent: 'readonly',
                KeyboardEvent: 'readonly',
                FocusEvent: 'readonly',
                UIEvent: 'readonly',
                WheelEvent: 'readonly',
                TouchEvent: 'readonly',
                PopStateEvent: 'readonly',
                IntersectionObserver: 'readonly',
                IntersectionObserverEntry: 'readonly',
                IntersectionObserverCallback: 'readonly',
                MutationObserver: 'readonly',
                ResizeObserver: 'readonly',
                Performance: 'readonly',
                performance: 'readonly',
                gtag: 'readonly',
            }
        },
        plugins: {
            '@typescript-eslint': tseslint,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...tseslint.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
        },
    }
];
