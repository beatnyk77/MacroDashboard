/// <reference types="vite/client" />
interface Window {
    gtag: (command: string, ...args: any[]) => void;
}

declare const gtag: (command: string, ...args: any[]) => void;
