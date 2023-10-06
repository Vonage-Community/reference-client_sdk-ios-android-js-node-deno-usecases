import { Logo } from '../../components/logo';
import { Login } from './Login.client';

const LoginPage = () => {
    return (
        <div className='h-full '>
        <main className="h-full hero bg-base-200">
        
            <div className="flex-col hero-content">
                <Logo />
                <h2 className="mb-4 text-2xl font-bold text-center text-neutral-content">
                    VonageClient SDK Real World Sample App
                </h2>
                <Login />
                <p className="max-w-md mb-4 text-neutral-content">
                    Welcome to the VonageClient SDK Real World Sample App. This app is a
                    reference implementation of the VonageClient SDK. It is intended to
                    demonstrate how to use the VonageClient SDK in a real world
                    application. This app allows for a number of different use cases.
                </p>
            </div>
            
        </main>
        </div>
    );
};

export default LoginPage;