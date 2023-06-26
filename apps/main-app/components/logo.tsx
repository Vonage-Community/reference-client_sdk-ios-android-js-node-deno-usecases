import DarkLogo from './VonageLogo_Primary_Black.svg';
import LightLogo from './VonageLogo_Primary_White.svg';
import Image from 'next/image';
import Link from 'next/link';


type LogoProps = {
    className?: string;
};

export const Logo = ({className}: LogoProps) => {
    return (<Link href='/' className={`btn btn-ghost btn-lg rounded-btn items-center justify-center ${className}`} aria-label='Vonage Home Page' >
        <Image src={DarkLogo} alt='Vonage Logo' className='dark:hidden' width={200} height={50} />
        <Image src={LightLogo} alt='Vonage Logo' className='hidden dark:block' width={200} height={50} />
    </Link>);
};