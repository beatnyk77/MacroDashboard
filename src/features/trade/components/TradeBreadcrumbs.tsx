import React from 'react'
import { ChevronRight } from 'lucide-react'
import { TrailNavLink } from '@/components/TrailLink'

export interface TradeBreadcrumb {
    label: string
    to?: string
}

interface TradeBreadcrumbsProps {
    crumbs: TradeBreadcrumb[]
    className?: string
}

export const TradeBreadcrumbs: React.FC<TradeBreadcrumbsProps> = ({ crumbs, className }) => (
    <nav
        aria-label="Breadcrumb"
        className={`flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 ${className ?? ''}`}
    >
        <TrailNavLink to="/" className="hover:text-white transition-colors">Home</TrailNavLink>
        {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            return (
                <React.Fragment key={`${crumb.label}-${i}`}>
                    <ChevronRight size={10} aria-hidden />
                    {crumb.to && !isLast ? (
                        <TrailNavLink to={crumb.to} className="hover:text-white transition-colors">
                            {crumb.label}
                        </TrailNavLink>
                    ) : (
                        <span className={isLast ? 'text-emerald-400' : undefined}>{crumb.label}</span>
                    )}
                </React.Fragment>
            )
        })}
    </nav>
)