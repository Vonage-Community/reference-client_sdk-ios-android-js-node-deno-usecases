import { HangupReason } from '@vonage/client-sdk';
import { useEffect } from 'react';
import { useVoiceCallContainer } from '../VoiceCallContainer';
import { useVonageClient } from '../VonageClientProvider';

export const useHangup = () => {
    const [call, callDispatch] = useVoiceCallContainer();
    const vonageClient = useVonageClient();

    useEffect(() => {
        vonageClient.on('callHangup', (callId, Quality, reason) => {
            if (call.callId !== callId) return;
            callDispatch({ type: 'call:hangup', reason });
        });
    }, [callDispatch, call.callId, vonageClient]);

    const hangup = async () => {
        if (!call.callId) return;
        if (call.callState != 'in-progress' && call.callState != 'ringing') return;

        try {
            await vonageClient.hangup(call.callId);
            callDispatch({ type: 'call:hangup', reason: HangupReason.LOCAL_HANGUP });
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    return { hangup };
};
