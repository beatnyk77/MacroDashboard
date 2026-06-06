import React from 'react';
import { Link } from 'react-router-dom';
import { BrandConfig } from '@/config/brandConfig';

interface GQSignalBadgeProps {
  tooltip?: string;
  href?: string;
}

const BadgeContent: React.FC<{ tooltip?: string }> = ({ tooltip }) => (
  <span
    title={tooltip}
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm
      text-[10px] tracking-widest font-mono uppercase
      text-amber-400/80 bg-amber-400/10 border border-amber-400/20
      cursor-default select-none"
  >
    <span aria-hidden>◆</span>
    {BrandConfig.signalBadgePrefix} SIGNAL
  </span>
);

export const GQSignalBadge: React.FC<GQSignalBadgeProps> = ({ tooltip, href }) => {
  if (href) {
    return (
      <Link to={href} className="hover:opacity-80 transition-opacity" tabIndex={-1}>
        <BadgeContent tooltip={tooltip} />
      </Link>
    );
  }
  return <BadgeContent tooltip={tooltip} />;
};
