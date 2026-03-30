import { useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const SocialShareMode: React.FC = () => {
    const [isShareMode, setIsShareMode] = useState(false);

    useEffect(() => {
        if (isShareMode) {
            document.body.classList.add('share-mode');
        } else {
            document.body.classList.remove('share-mode');
        }
        return () => document.body.classList.remove('share-mode');
    }, [isShareMode]);

    // Inject global styles dynamically for share mode
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            body.share-mode ::-webkit-scrollbar { display: none !important; }
            body.share-mode { overflow: hidden !important; }
            body.share-mode header { display: none !important; }
            body.share-mode .share-hidden { display: none !important; }
            body.share-mode .share-visible { display: block !important; }
            body.share-mode main { padding-top: 0 !important; }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <TooltipProvider>
            {/* Toggle Button (Bottom Right) */}
            <div className={cn(
                "fixed bottom-6 right-6 z-[9999] transition-all duration-300",
                isShareMode ? "scale-0 opacity-0" : "scale-100 opacity-100"
            )}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => setIsShareMode(true)}
                            className="p-3 rounded-full bg-slate-900 border border-white/12 shadow-2xl text-white hover:bg-slate-800 transition-all active:scale-95"
                        >
                            <Camera size={20} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-slate-950 border-white/12 text-xs font-black uppercase tracking-widest">
                        Clean Screenshot View
                    </TooltipContent>
                </Tooltip>
            </div>

            {/* Exit Banner (Top Center) - Only Visible in Share Mode */}
            <div className={cn(
                "fixed top-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-500",
                isShareMode ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
            )}>
                <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full shadow-2xl">
                    <span className="text-xs font-black text-white uppercase tracking-[0.2em] px-2 italic">
                        Terminal Active: Capture Mode
                    </span>
                    <button
                        onClick={() => setIsShareMode(false)}
                        className="p-1 rounded-full hover:bg-white/10 transition-colors text-white"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </TooltipProvider>
    );
};
