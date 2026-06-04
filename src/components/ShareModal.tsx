import React, { useState } from 'react';
import { Twitter, Linkedin, Download, Link2, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ShareModalProps {
    open: boolean;
    onClose: () => void;
    dataUrl: string;
    blob: Blob;
    title: string;
    href: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ open, onClose, dataUrl, title, href }) => {
    const [copied, setCopied] = useState(false);

    const shareText = encodeURIComponent(`"${title}" — institutional macro intelligence via GraphiQuestor`);
    const shareUrl = encodeURIComponent(href);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const platforms = [
        {
            label: 'X / Twitter',
            icon: <Twitter size={16} aria-hidden="true" />,
            href: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
        },
        {
            label: 'LinkedIn',
            icon: <Linkedin size={16} aria-hidden="true" />,
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
        },
        {
            label: 'WhatsApp',
            icon: <MessageCircle size={16} aria-hidden="true" />,
            href: `https://wa.me/?text=${shareText}%20${shareUrl}`,
        },
    ];

    const handleCopy = async () => {
        await navigator.clipboard.writeText(href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-lg bg-slate-950 border-white/12 text-white">
                <DialogHeader>
                    <DialogTitle className="text-sm font-black uppercase tracking-widest">Share Chart</DialogTitle>
                </DialogHeader>

                <div className="rounded-lg overflow-hidden border border-white/10 bg-black/40">
                    <img src={dataUrl} alt={title} className="w-full object-contain max-h-64" />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                    {platforms.map(p => (
                        <a
                            key={p.label}
                            href={p.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
                        >
                            {p.icon}
                            {p.label}
                        </a>
                    ))}

                    <button
                        onClick={handleCopy}
                        aria-label="Copy Link"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
                    >
                        <Link2 size={16} aria-hidden="true" />
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>

                    <a
                        href={dataUrl}
                        download={`gq-${slug}.png`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
                    >
                        <Download size={16} aria-hidden="true" />
                        Download PNG
                    </a>
                </div>
            </DialogContent>
        </Dialog>
    );
};
