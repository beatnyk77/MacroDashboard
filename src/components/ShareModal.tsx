import React from 'react';

interface ShareModalProps {
    open: boolean;
    onClose: () => void;
    dataUrl: string;
    blob: Blob;
    title: string;
    href: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ open, onClose, dataUrl, blob: _blob, title, href }) => {
    if (!open) return null;

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.png`;
        a.click();
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(href);
        } catch {
            // fallback: ignore
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={`Share ${title}`}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.7)',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                style={{
                    background: '#0f1117',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: 24,
                    maxWidth: 480,
                    width: '90%',
                    color: '#fff',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontWeight: 600 }}>{title}</span>
                    <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                        ×
                    </button>
                </div>
                <img
                    src={dataUrl}
                    alt={`Chart: ${title}`}
                    style={{ width: '100%', borderRadius: 8, marginBottom: 16 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={handleDownload}
                        style={{
                            flex: 1,
                            padding: '8px 16px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 6,
                            color: '#fff',
                            cursor: 'pointer',
                        }}
                    >
                        Download PNG
                    </button>
                    <button
                        onClick={handleCopyLink}
                        style={{
                            flex: 1,
                            padding: '8px 16px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 6,
                            color: '#fff',
                            cursor: 'pointer',
                        }}
                    >
                        Copy Link
                    </button>
                </div>
            </div>
        </div>
    );
};
