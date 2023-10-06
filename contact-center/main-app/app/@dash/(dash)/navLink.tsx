'use client';

import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';


type NavLinkProps = {
    href: string;
    parallelRouteKey?: string;
    children: React.ReactNode;
};

export const NavLink = ({ children, href, parallelRouteKey, ...props }: NavLinkProps) => {
    const segments = useSelectedLayoutSegments().filter((segment) => segment !== '__DEFAULT__');
    const path = href.split('/').filter(Boolean);
    const isSelected = path.every((segment, index) => segments[index] === segment) && path.length === segments.length;

    return <Link className={isSelected? 'active' : ''} href={href} {...props} >
        {children}
    </Link>;
}; 