import { useCallback } from 'react';
import { useVonageClient } from '../VonageClientProvider';
import { CallSayParams } from '@vonage/client-sdk';
import { useVoiceCallContainer } from '../VoiceCallContainer';

export type SayOptions = Omit<CallSayParams, 'text'>;

export const useSay = () => {
    const vonageClient = useVonageClient();
    const [call] = useVoiceCallContainer();

    const say = useCallback(async (text: string, options?: SayOptions) => {
        console.log('useSay', call.callId, text, options);
        if (!call.callId) return;
        try {
            await vonageClient.say(call.callId, { text, ...options });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }, [call.callId, vonageClient]);

    return { say };
};