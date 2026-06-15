import React from 'react';
import { Link, LinkProps, NavLink, NavLinkProps } from 'react-router-dom';
import { normalizeTo } from '@/lib/urlPath';

export const TrailLink = React.forwardRef<HTMLAnchorElement, LinkProps>(
    ({ to, ...rest }, ref) => <Link ref={ref} to={normalizeTo(to)} {...rest} />
);
TrailLink.displayName = 'TrailLink';

export const TrailNavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
    ({ to, ...rest }, ref) => <NavLink ref={ref} to={normalizeTo(to)} {...rest} />
);
TrailNavLink.displayName = 'TrailNavLink';