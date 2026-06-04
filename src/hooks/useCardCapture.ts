import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';

interface CaptureResult { dataUrl: string; blob: Blob; }
interface CaptureOptions { dataSource: string; }

export function useCardCapture() {
    const [isCapturing, setIsCapturing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const capture = useCallback(async (el: HTMLElement, { dataSource }: CaptureOptions): Promise<CaptureResult> => {
        setIsCapturing(true);
        setError(null);
        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const wm = document.createElement('div');
        wm.setAttribute('data-gq-watermark', '1');
        wm.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:28px;background:linear-gradient(to right,rgba(2,6,23,0.95),rgba(2,6,23,0.90));display:flex;align-items:center;justify-content:space-between;padding:0 12px;z-index:9999;pointer-events:none;';
        wm.innerHTML = `<span style="color:rgba(255,255,255,0.9);font-size:10px;font-weight:700;font-family:monospace;letter-spacing:0.05em;">◆ GraphiQuestor · graphiquestor.com</span><span style="color:rgba(255,255,255,0.5);font-size:10px;font-family:monospace;">${dataSource} · ${today}</span>`;
        const prevPosition = el.style.position;
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
        el.appendChild(wm);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const canvas = await (html2canvas as any)(el, { useCORS: true, allowTaint: false, scale: 2, logging: false });
            const dataUrl = canvas.toDataURL('image/png');
            const blob = await new Promise<Blob>((resolve, reject) => {
                (canvas as HTMLCanvasElement).toBlob(b => (b ? resolve(b) : reject(new Error('toBlob returned null'))), 'image/png');
            });
            return { dataUrl, blob };
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Capture failed';
            setError(msg);
            throw err;
        } finally {
            if (el.contains(wm)) el.removeChild(wm);
            el.style.position = prevPosition;
            setIsCapturing(false);
        }
    }, []);

    return { capture, isCapturing, error };
}
