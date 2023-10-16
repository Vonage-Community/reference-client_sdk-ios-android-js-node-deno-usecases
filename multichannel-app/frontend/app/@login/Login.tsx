'use client';
// @ts-ignore
import { experimental_useFormState as useFormState } from 'react-dom';
// @ts-ignore
import { experimental_useFormStatus as useFormStatus } from 'react-dom';
import { handleLogin } from './loginActions';
import { defaultLoginState } from './types';


export const Login = () => {
    const [state, formAction] = useFormState(handleLogin, defaultLoginState);


    return (<form action={formAction}>
        <div className="form-control">
            <label className='input-group'>
                <span>Name</span>
                <input className='input' required type="email" id='email' name='email' />
                <button className="btn btn-primary" type='submit' >Login</button>
            </label>
        </div>
        {
            state.error ? <pre className='alert alert-error'>
                {JSON.stringify(state, null, '  ')}
            </pre> : null
        }
    </form>
    );
};
