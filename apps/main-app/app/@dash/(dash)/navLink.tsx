'use client';

import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';


type NavLinkProps = {
    href: string;
    children: React.ReactNode;
};

export const NavLink = ({children, href, ...props}: NavLinkProps) => {
    const segments = useSelectedLayoutSegments();
    const path = href.split('/').filter(Boolean);
    const isSelected = path.every((segment, index) => segments[index] === segment) && path.length === segments.length;

    return <Link className={isSelected? 'active' : ''} href={href} {...props} >
        {children}
    </Link>;
}; 