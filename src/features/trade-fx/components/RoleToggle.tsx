import React, { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Role } from '../lib/tradeFxTypes';

const ROLES: { id: Role; label: string }[] = [
    { id: 'exporter', label: 'Exporter' },
    { id: 'importer', label: 'Importer' },
    { id: 'balanced', label: 'Balanced' },
];

const ACTIVE_STYLES: Record<Role, string> = {
    exporter: 'bg-[#B8860B]/20 text-[#B8860B] border-[#B8860B]/40',
    importer: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    balanced: 'bg-white/10 text-white border-white/20',
};

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
            className={cn('flex flex-wrap gap-2', className)}
        >
            {ROLES.map((role, index) => {
                const active = value === role.id;
                return (
                    <button
                        key={role.id}
                        ref={(el) => { buttonRefs.current[index] = el; }}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        tabIndex={active ? 0 : -1}
                        onClick={() => onChange(role.id)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className={cn(
                            'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border',
                            active
                                ? ACTIVE_STYLES[role.id]
                                : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/5',
                        )}
                    >
                        {role.label}
                    </button>
                );
            })}
        </div>
    );
};