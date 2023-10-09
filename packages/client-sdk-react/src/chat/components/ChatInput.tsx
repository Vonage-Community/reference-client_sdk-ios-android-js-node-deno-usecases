import { ComponentType, useState } from 'react';
import { useSendMessage } from '../hooks/useSendMessage';
import { IconSend } from '@tabler/icons-react';
import {ChatEnableAudio} from './ChatEnableAudio';

export type InputActionProps = {
    className?: string;
    value?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
};

export const InputAction = ({ className, value, onChange, placeholder='Type a message...' }: InputActionProps) => {
    return (
        <input className={className} type='text' placeholder={placeholder} value={value} onChange={onChange} />
    );
};

export type SubmitActionProps = {
    className?: string;
    type: 'submit';
};
export const SubmitAction = ({ className, type }: SubmitActionProps) => {
    return (
        <button className={className} aria-label='Send Message' type={type}>
            <IconSend />
        </button>
    );
};

type ChatInputProps = {
    className?: string;

    Input?: ComponentType<InputActionProps>;
    inputClassName?: string;
    Button?: ComponentType<SubmitActionProps>;
    buttonClassName?: string;
    displayEnableAudio? : boolean;
};
export const ChatInput = (
    {
        className = 'vg-join vg-w-full vg-group vg-h-12',
        Input = InputAction,
        inputClassName = 'vg-input vg-join-item vg-w-full vg-input-primary ',
        Button = SubmitAction,
        buttonClassName = 'vg-btn vg-join-item vg-w-24 vg-btn-primary',
        displayEnableAudio = false
    }: ChatInputProps) => {
    const { sendTextMessage } = useSendMessage();
    const [text, setText] = useState('');

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        sendTextMessage(text);
        setText('');
    };

    return (
        <form className={className} onSubmit={onSubmit}>
            <Input className={inputClassName} value={text} onChange={(e) => setText(e.target.value)} />
            <Button className={buttonClassName} type='submit' />
            {displayEnableAudio ? <ChatEnableAudio className={buttonClassName}  />: null }

        </form>
    );
};