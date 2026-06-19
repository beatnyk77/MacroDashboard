import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { SubscribeCard } from '@/components/SubscribeCard';
import { trackEngagementPrompt } from '@/lib/analytics';
import { withoutTrailingSlash } from '@/lib/urlPath';

const SESSION_KEY = 'gq_engagement_prompt_dismissed';
const SCROLL_TRIGGER = 65;

export const EngagementNewsletterPrompt: React.FC = () => {
    const { pathname } = useLocation();
    const [visible, setVisible] = useState(false);
    const [trigger, setTrigger] = useState<'scroll' | 'exit_intent'>('scroll');
    const path = withoutTrailingSlash(pathname);

    const dismiss = useCallback(() => {
        sessionStorage.setItem(SESSION_KEY, '1');
        setVisible(false);
        trackEngagementPrompt('dismissed', trigger);
    }, [trigger]);

    useEffect(() => {
        if (sessionStorage.getItem(SESSION_KEY) === '1') return;

        const onScroll = () => {
            const doc = document.documentElement;
            const scrollHeight = doc.scrollHeight - doc.clientHeight;
            if (scrollHeight <= 0) return;
            const pct = (window.scrollY / scrollHeight) * 100;
            if (pct >= SCROLL_TRIGGER && !visible) {
                setTrigger('scroll');
                setVisible(true);
                trackEngagementPrompt('shown', 'scroll');
            }
        };

        const onMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && !visible) {
                setTrigger('exit_intent');
                setVisible(true);
                trackEngagementPrompt('shown', 'exit_intent');
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        document.addEventListener('mouseleave', onMouseLeave);
        return () => {
            window.removeEventListener('scroll', onScroll);
            document.removeEventListener('mouseleave', onMouseLeave);
        };
    }, [path, visible]);

    if (!visible) return null;

    return (
        <div
            className="fixed bottom-20 left-4 right-4 z-[1200] mx-auto max-w-md transition-transform duration-300 md:bottom-8 md:left-auto md:right-8"
            role="dialog"
            aria-label="Weekly Regime Digest signup"
        >
            <div className="relative rounded-2xl border border-blue-500/25 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
                <button
                    type="button"
                    onClick={dismiss}
                    className="absolute right-3 top-3 rounded-md p-1 text-white/30 transition-colors hover:text-white/70"
                    aria-label="Dismiss"
                >
                    <X size={16} />
                </button>
                <p className="mb-3 pr-6 text-[10px] font-black uppercase tracking-[0.18em] text-blue-400/80">
                    Before you go — Weekly Regime Digest
                </p>
                <SubscribeCard source={`engagement-prompt-${trigger}`} className="max-w-none border-0 bg-transparent p-0" />
            </div>
        </div>
    );
};