import { useCallback, useEffect, useMemo } from 'react';
import { useVoiceCallContainer } from '../VoiceCallContainer';
import { useVonageClient } from '../VonageClientProvider';

export const useIncomingCall = () => {
    const [call, callDispatch] = useVoiceCallContainer();
    const vonageClient = useVonageClient();

    useEffect(() => {
        vonageClient.on('callInvite', (callId, name, channel) => {
            callDispatch({ type: 'call:invite', callId, from: { name, channel } });
        });
        vonageClient.on('callInviteCancel', (callId, reason) => {
            callDispatch({ type: 'call:invite:cancel', reason });
        });
    }, [callDispatch, vonageClient]);

    const isRinging = useMemo(() => {
        return call.callState === 'ringing' && call.direction === 'incoming';
    }, [call.callState, call.direction]);

    const invite = useMemo(() => {
        if (isRinging) return null;
        return {
            from: call.from?.name,
            channel: call.from?.channel,
        };
    }, [call.from?.channel, call.from?.name, isRinging]);

    const answerCall = useCallback(async () => {
        if (!call.callId) return;
        try {
            await vonageClient.answerCall(call.callId);
            callDispatch({ type: 'call:invite:answered' });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }, [callDispatch, call.callId, vonageClient]);

    const rejectCall = useCallback(async () => {
        if (!call.callId) return;
        try {
            await vonageClient.rejectCall(call.callId);
            callDispatch({ type: 'call:invite:rejected' });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }, [callDispatch, call.callId, vonageClient]);

    return { answerCall, rejectCall, isRinging, invite };
};
