import { ComponentType , useState} from 'react';
import { useJoinConversationActions } from '../hooks/useJoinConversation';
import {InputActionProps, SubmitActionProps, InputAction, SubmitAction} from './ChatInput';

export type ChatJoinConversationProps = {
    className?: string;
    InputName?: ComponentType<InputActionProps>;
    inputNameClassName?: string;
    InputDisplayName?: ComponentType<InputActionProps>;
    inputDisplayNameClassName?: string;
    Button?: ComponentType<SubmitActionProps>;
    buttonClassName?: string;
    
};
const constDefInputClass = 'vg-input vg-join-item vg-w-full vg-input-primary ';

export const ChatJoinConversation = ({ 
    className= 'vg-join vg-w-full vg-group vg-h-12',
    inputNameClassName=constDefInputClass,
    inputDisplayNameClassName=constDefInputClass, 
    buttonClassName='vg-btn vg-join-item vg-w-24 vg-btn-primary', 
    InputName=InputAction,InputDisplayName=InputAction, Button=SubmitAction }: ChatJoinConversationProps) => {
    const [cid, setCid] = useState<string>('');
    const { joinConvesation } = useJoinConversationActions();
    const onSubmit = (e:  React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        joinConvesation(cid);
        // createConversation(name, displayName);
    };

    return (
        <form className={className} onSubmit={onSubmit}>
            <InputName placeholder='conversation id' className={inputNameClassName} value={cid} onChange={(e) => setCid(e.target.value)} />
            <Button className={buttonClassName} type='submit' />
        </form>
    );
};