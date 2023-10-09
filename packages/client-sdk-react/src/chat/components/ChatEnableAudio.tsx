import { useVonageClient, useVonageSession } from '../../VonageClientProvider';
import { IconPhoneCall, IconPhoneOff } from '@tabler/icons-react';
import { useChat } from '../ChatContainer';

export type SubmitEnableAudioActionProps = {
    className?: string;
    activeClassName?: string;
    unactiveClassName?: string;
    type: 'button';
    onClick:  (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    audioActive: boolean
};

export const SubmitEnableAudio = ({
    className,
    type,
    onClick,
    activeClassName = 'vg-btn-error',
    unactiveClassName,
    audioActive = false
}: SubmitEnableAudioActionProps) => {

    return (
        <button className={`${className} ${audioActive ? activeClassName : unactiveClassName}`} aria-label='Audio' type={type} onClick={onClick} >
            {audioActive? <IconPhoneOff /> : <IconPhoneCall /> }
        </button>
    );
};

export const ChatEnableAudio = ({
    className = 'vg-btn vg-join-item vg-w-24 vg-btn-primary'

}) => {
    const vonageClient = useVonageClient();
    const { state: { callId }, joinCall, leaveCall } = useChat();
    // useEffect(() => {

    // }, [vonageClient, callId]);

    const onClick = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        if (callId) {
            leaveCall();
        } else {
            joinCall();
        }
    };


    return(
        <SubmitEnableAudio 
            className={className} 
            type='button' 
            audioActive={!!callId}
            onClick={onClick}
        />
    );
};

