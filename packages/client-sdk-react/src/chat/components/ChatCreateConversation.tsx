import { ComponentType , useState} from 'react';
import { useCreateConversationActions } from '../hooks/useCreateConversation';
import {InputActionProps, SubmitActionProps, InputAction, SubmitAction} from './ChatInput';

export type ChatCreateConversationProps = {
    className?: string;
    InputName?: ComponentType<InputActionProps>;
    inputNameClassName?: string;
    InputDisplayName?: ComponentType<InputActionProps>;
    inputDisplayNameClassName?: string;
    Button?: ComponentType<SubmitActionProps>;
    buttonClassName?: string;
    
};
const constDefInputClass = 'vg-input vg-join-item vg-w-full vg-input-primary ';

export const ChatCreateConversation = ({ 
    className= 'vg-join vg-w-full vg-group vg-h-12',
    inputNameClassName=constDefInputClass,
    inputDisplayNameClassName=constDefInputClass, 
    buttonClassName='vg-btn vg-join-item vg-w-24 vg-btn-primary', 
    InputName=InputAction,InputDisplayName=InputAction, Button=SubmitAction }: ChatCreateConversationProps) => {
    const { createConversation } = useCreateConversationActions();
    const [name, setName] = useState<string>('');
    const [displayName, setDisplayName] = useState<string>();
    const onSubmit = (e:  React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        createConversation(name, displayName);
    };

    return (
        <form className={className} onSubmit={onSubmit}>
            <InputName className={inputNameClassName} value={name} onChange={(e) => setName(e.target.value)} />
            <InputDisplayName className={inputDisplayNameClassName} value={displayName||''} onChange={(e) => setDisplayName(e.target.value)} />
            <Button className={buttonClassName} type='submit' />
        </form>
    );
};