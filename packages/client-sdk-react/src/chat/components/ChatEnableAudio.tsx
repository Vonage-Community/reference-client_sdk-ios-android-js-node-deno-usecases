import { useVonageClient, useVonageSession } from '../../VonageClientProvider';
import { IconPhoneCall, IconPhoneOff } from '@tabler/icons-react';
import { useChat } from '../ChatContainer';
import {useEffect,useState} from 'react';

export type SubmitEnableAudioActionProps = {
    className?: string;
    type: 'button';
    onClick:  (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    audioActive: boolean
};

export const SubmitEnableAudio = ({ className, type, onClick, audioActive=false }: SubmitEnableAudioActionProps) => {
    const style = audioActive ? {backgroundColor: "#ff3333"} : {};

    return (
        <button style={style}  className={className} aria-label='Audio' type={type} onClick={onClick} >
            {audioActive? <IconPhoneOff /> : <IconPhoneCall /> }
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

            // if(callId === legId){
                setCallStatus(statusString);
            // }
         });


    }, [vonageClient, callId]);

    return(
        <SubmitEnableAudio 
            className={className} 
            type='button' 
            audioActive={!!callId}
            onClick={async (e) => {
                e.preventDefault();
                if(!callId){
                    const convName = state.name;                
                    const callid = await vonageClient.serverCall({
                        callType: 'app', 
                        connect_to_conversation: convName
                    });
                    setCallId(callid);
                }else{
                    await vonageClient.hangup(callId);
                    setCallId("");
                }
                
            }}
        />
    );
};

