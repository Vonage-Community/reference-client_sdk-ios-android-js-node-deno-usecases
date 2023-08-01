import { useCallback, useEffect, useMemo } from 'react';
import { useVoiceCallContainer } from '../VoiceCallContainer';
import { useVonageClient } from '../../VonageClientProvider';

export const useMute = () => {
    const vonageClient = useVonageClient();
    const [call, callDispatch] = useVoiceCallContainer();

    useEffect(() => {
        vonageClient.on('mute', (callId, legId, muted) => {
            if (callId != legId) return;
            if (call.callId !== callId) return;
            callDispatch({ type: 'call:mute:updated', muted });
        });
    }, [callDispatch, call.callId, vonageClient]);

    const isMuted = useMemo(() => call.muted, [call.muted]);
    const toggleMute = useCallback(async () => {
        if (!call.callId) return;
        if (call.callState != 'in-progress') return;
        try {
            if (call.muted) {
                await vonageClient.unmute(call.callId);
            }
            else {
                await vonageClient.mute(call.callId);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }, [call.callId, call.callState, call.muted, vonageClient]);

    return { isMuted, toggleMute };

};
