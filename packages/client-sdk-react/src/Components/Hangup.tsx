import { ComponentType } from 'react';
import { useCallStatus, useHangup } from '../hooks';
import { ActionProps, defaultAction } from './utils';

type HangupProps = {
    className?: string;
    label?: string;
    Action?: ComponentType<ActionProps>;
};

export const Hangup = ({
    className = 'vg-btn vg-hangup',
    Action=defaultAction,
    label='Hangup'
}: HangupProps) => {
    const {hangup} = useHangup();
    const {callStatus} = useCallStatus();

    if (callStatus !== 'in-progress') return null;
    return (
        <Action className={className} onClick={hangup} label={label} />
    );
};
