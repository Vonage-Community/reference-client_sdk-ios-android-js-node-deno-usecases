import { LegStatus } from '@vonage/client-sdk';
import { useEffect, useMemo } from 'react';
import { useVoiceCallContainer } from '../VoiceCallContainer';
import { useVonageClient } from '../VonageClientProvider';

export const useServerCall = () => {
    const [call, callDispatch] = useVoiceCallContainer();
    const vonageClient = useVonageClient();

    useEffect(() => {
        if (call.callState !== 'ringing' || call.direction !== 'outgoing') return;

        vonageClient.on('legStatusUpdate', (callId, legId, status) => {
            if (callId !== call.callId && legId !== call.callId) return;

            if (status === LegStatus.ANSWERED) {
                callDispatch({ type: 'call:state:updated', callState: 'in-progress' });
            }
        });

    }, [call.callState, call.direction, call.callId, vonageClient, callDispatch]);

    const isRinging = call.callState === 'ringing' && call.direction === 'outgoing';


    const startCall = async (context?: Record<string, unknown>) => {
        try {
            const callId = await vonageClient.serverCall(context);
            callDispatch({ type: 'call:initiated', callId, callCtx: context });
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    return { startCall, isRinging };
};

