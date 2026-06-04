import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { useCardCapture } from '@/hooks/useCardCapture';
import { ShareModal } from '@/components/ShareModal';

interface ShareButtonProps {
    targetRef: React.RefObject<HTMLElement>;
    title: string;
    dataSource: string;
    href?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ targetRef, title, dataSource, href }) => {
    const { capture, isCapturing } = useCardCapture();
    const [modalOpen, setModalOpen] = useState(false);
    const [captureResult, setCaptureResult] = useState<{ dataUrl: string; blob: Blob } | null>(null);

    const shareUrl = href
        ? `https://graphiquestor.com${href}`
        : typeof window !== 'undefined' ? window.location.href : 'https://graphiquestor.com';

    const handleClick = async () => {
        if (!targetRef.current) return;
        try {
            const result = await capture(targetRef.current, { dataSource });
            setCaptureResult(result);
            setModalOpen(true);
        } catch {
            // error surfaced via hook state
        }
    };

    return (
        <>
            <button
                onClick={handleClick}
                disabled={isCapturing}
                aria-label="Share this chart"
                className="absolute top-3 right-3 z-10 p-1.5 rounded-md bg-white/5 border border-white/10 text-white/30 opacity-0 group-hover:opacity-100 sm:opacity-30 sm:group-hover:opacity-100 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
            >
                <Share2 size={14} aria-hidden="true" />
            </button>

            {captureResult && (
                <ShareModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    dataUrl={captureResult.dataUrl}
                    blob={captureResult.blob}
                    title={title}
                    href={shareUrl}
                />
            )}
        </>
    );
};
