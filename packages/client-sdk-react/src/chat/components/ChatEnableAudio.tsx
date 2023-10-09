import { useVonageClient, useVonageSession } from '../../VonageClientProvider';
import { IconPhoneCall } from '@tabler/icons-react';
import { useChat } from '../ChatContainer';
import {useEffect,useState} from 'react';

export type SubmitEnableAudioActionProps = {
    className?: string;
    type: 'button';
    onClick:  (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export const SubmitEnableAudio = ({ className, type, onClick }: SubmitEnableAudioActionProps) => {
    return (
        <button className={className} aria-label='Audio' type={type} onClick={onClick} >
            <IconPhoneCall />
        </button>
    );
};

export const ChatEnableAudio = ({
    className = 'vg-btn vg-join-item vg-w-24 vg-btn-primary'

}) => {
    const vonageClient = useVonageClient();
    const { state, isLoading } = useChat();
    const [callStatus , setCallStatus] = useState<String>('not-active');
    const [callId , setCallId] = useState('');
    useEffect(() => {
         vonageClient.on('legStatusUpdate', (callId, legId, status) => {
            console.log('legStatusUpdate' ,callId, legId, status);
            let statusString = status as unknown as String;

            if(callId === legId){
                setCallStatus(statusString);
            }
         });
    }, [vonageClient, callId]);

    return( <div>
        <SubmitEnableAudio 
            className={className} 
            type='button' 
            onClick={async (e) => {
                e.preventDefault();
                
                const convName = state.name;                
                const callid = await vonageClient.serverCall({
                    callType: 'app', 
                    connect_to_conversation: convName
                });
                setCallId(callid);
            }}
        />
        <div>{callStatus} {callId} </div>
        </div>
    );
}

