import { ComponentType } from 'react';
import { useCallStatus } from '../hooks';
import { Earmuff } from './Earmuff';
import { Hangup } from './Hangup';
import { Mute } from './Mute';
import { ContainerProps, defaultContainer } from './utils';

type CallControlsProps = {
    className?: string;
    RootContainer?: ComponentType<ContainerProps>;

    actionClassName?: string;
    muteClassName?: string;
    earmuffClassName?: string;
    hangupClassName?: string;
};

export const CallControls = ({
    className = ' vg-btn-group vg-call-controls',
    RootContainer = defaultContainer,

    actionClassName = 'vg-call-controls__action',
    muteClassName = 'vg-btn vg-swap vg-mute-btn',
    earmuffClassName = 'vg-btn vg-swap vg-earmuff-btn',
    hangupClassName = 'vg-btn vg-btn-error vg-hangup'
}: CallControlsProps) => {
    const {callStatus} =useCallStatus();

    if (callStatus === 'idle') return null;

    return (
        <RootContainer className={className}>
            <Mute className={`${actionClassName} ${muteClassName}`} />
            <Earmuff className={`${actionClassName} ${earmuffClassName}`} />
            <Hangup className={`${actionClassName} ${hangupClassName}`} />
        </RootContainer>
    );
};