import React, { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Role } from '../lib/tradeFxTypes';

const ROLES = [
    {
        id: 'exporter' as Role,
        label: 'Exporter',
        caption: 'You receive USD/EUR/CNY against INR.',
        icon: '↑',
    },
    {
        id: 'balanced' as Role,
        label: 'Balanced',
        caption: 'You have both receivables and payables.',
        icon: '⇄',
    },
    {
        id: 'importer' as Role,
        label: 'Importer',
        caption: 'You pay USD/EUR/CNY from INR.',
        icon: '↓',
    },
] as const;

interface RoleToggleProps {
    value: Role;
    onChange: (role: Role) => void;
    className?: string;
}

export const RoleToggle: React.FC<RoleToggleProps> = ({ value, onChange, className }) => {
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const focusRole = useCallback((index: number) => {
        const clamped = Math.max(0, Math.min(index, ROLES.length - 1));
        buttonRefs.current[clamped]?.focus();
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent, index: number) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const next = (index + 1) % ROLES.length;
                onChange(ROLES[next].id);
                focusRole(next);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = (index - 1 + ROLES.length) % ROLES.length;
                onChange(ROLES[prev].id);
                focusRole(prev);
            }
        },
        [onChange, focusRole],
    );

    return (
        <div
            role="radiogroup"
            aria-label="Trade exposure role"
            className={cn('grid grid-cols-1 sm:grid-cols-3 gap-2', className)}
        >
            {ROLES.map((role, index) => {
                const active = value === role.id;
                return (
                    <button
                        key={role.id}
                        ref={(el) => {
                            buttonRefs.current[index] = el;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        tabIndex={active ? 0 : -1}
                        onClick={() => onChange(role.id)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className={cn(
                            'flex flex-col items-start rounded-xl px-4 py-3 transition-all border text-left',
                            active
                                ? 'bg-[#B8860B]/15 text-[#B8860B] border-[#B8860B]/40'
                                : 'text-white/40 border-white/10 hover:text-white/70 hover:bg-white/5',
                        )}
                    >
                        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                            <span aria-hidden className="text-sm leading-none">
                                {role.icon}
                            </span>
                            {role.label}
                        </span>
                        <span
                            className={cn(
                                'text-[10px] mt-1 leading-snug',
                                active ? 'text-[#B8860B]/70' : 'text-white/35',
                            )}
                        >
                            {role.caption}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};