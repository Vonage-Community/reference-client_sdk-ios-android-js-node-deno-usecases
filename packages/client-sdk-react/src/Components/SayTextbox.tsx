import { ComponentType, useState } from 'react';
import { ActionProps, ContainerProps, TextProps,defaultText,defaultAction, defaultContainer, defaultInput, InputProps } from './utils';
import { useCallStatus, useSay } from '../hooks';

type SayTextboxProps = {
    label?: string;
    placeholder?: string;
    className?: string;

    textBoxClassName?: string;
    labelClassName?: string;
    buttonClassName?: string;

    buttonLabel?: string;
    buttonDisabledLabel?: string;
    buttonDisabled?: boolean;

    RootContainer?: ComponentType<ContainerProps>;
    Label?: ComponentType<TextProps>;
    TextBox?: ComponentType<InputProps>;
    Button?: ComponentType<ActionProps>;
};


export const SayTextbox = ({
    label = 'Text to say',
    placeholder = 'Say something...',
    className = 'vg-input-group vg-w-full',

    textBoxClassName = 'vg-input',
    labelClassName = 'vg-input-group-text',
    buttonClassName = 'vg-btn vg-btn-primary',

    buttonLabel = 'Say',
    buttonDisabledLabel = 'Saying...',
    buttonDisabled = false,

    RootContainer=defaultContainer,
    Label=defaultText,
    TextBox=defaultInput,
    Button=defaultAction,
}: SayTextboxProps) => {
    const {callStatus} = useCallStatus();
    const [text, setText] = useState('');
    const [isSaying, setIsSaying] = useState(false);
    const { say } = useSay();

    const onSay = async () => {
        if (isSaying) return;
        setIsSaying(true);
        try {
            await say(text);
        } catch (error) {
            console.error(error);
        }
        setIsSaying(false);
    };

    if (callStatus !== 'in-progress') return null;
    return (
        <RootContainer className={className}>
            <Label className={labelClassName}>{label}</Label>
            <TextBox className={textBoxClassName} placeholder={placeholder} value={text} onChange={setText} />
            <Button className={buttonClassName} label={buttonLabel} disabled={buttonDisabled} disabledLabel={buttonDisabledLabel} onClick={onSay} />
        </RootContainer>
    );
};