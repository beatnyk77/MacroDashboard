import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCardCapture } from '../useCardCapture';

vi.mock('html2canvas', () => ({ default: vi.fn() }));

import html2canvas from 'html2canvas';

const mockDataUrl = 'data:image/png;base64,abc123';
const mockBlob = new Blob(['fake'], { type: 'image/png' });

beforeEach(() => {
    const mockCanvas = {
        toDataURL: vi.fn().mockReturnValue(mockDataUrl),
        toBlob: vi.fn().mockImplementation((cb: (b: Blob) => void) => cb(mockBlob)),
    };
    (html2canvas as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockCanvas);
});

describe('useCardCapture', () => {
    it('starts with isCapturing=false and error=null', () => {
        const { result } = renderHook(() => useCardCapture());
        expect(result.current.isCapturing).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('returns dataUrl and blob on successful capture', async () => {
        const { result } = renderHook(() => useCardCapture());
        const el = document.createElement('div');
        document.body.appendChild(el);
        let captureResult: Awaited<ReturnType<typeof result.current.capture>>;
        await act(async () => { captureResult = await result.current.capture(el, { dataSource: 'FRED' }); });
        expect(captureResult!.dataUrl).toBe(mockDataUrl);
        expect(captureResult!.blob).toBe(mockBlob);
        expect(result.current.isCapturing).toBe(false);
        document.body.removeChild(el);
    });

    it('removes the watermark element after capture', async () => {
        const { result } = renderHook(() => useCardCapture());
        const el = document.createElement('div');
        document.body.appendChild(el);
        await act(async () => { await result.current.capture(el, { dataSource: 'FRED' }); });
        expect(el.children.length).toBe(0);
        document.body.removeChild(el);
    });

    it('sets error and re-throws on html2canvas failure', async () => {
        (html2canvas as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('canvas fail'));
        const { result } = renderHook(() => useCardCapture());
        const el = document.createElement('div');
        document.body.appendChild(el);
        await act(async () => {
            await expect(result.current.capture(el, { dataSource: 'FRED' })).rejects.toThrow('canvas fail');
        });
        expect(result.current.error).toBe('canvas fail');
        expect(result.current.isCapturing).toBe(false);
        document.body.removeChild(el);
    });
});
