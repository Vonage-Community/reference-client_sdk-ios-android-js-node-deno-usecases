import { useCallback, useEffect, useMemo } from 'react';
import { useVoiceCallContainer } from '../VoiceCallContainer';
import { useVonageClient } from '../VonageClientProvider';

export const useEarmuff = () => {
    const vonageClient = useVonageClient();
    const [call, callDispatch] = useVoiceCallContainer();

    useEffect(() => {
        vonageClient.on('earmuff', (callId, legId, earmuffed) => {
            if (callId != legId) return;
            if (call.callId !== callId) return;
            callDispatch({ type: 'call:earmuff:updated', earmuffed });
        });
    }, [callDispatch, call.callId, vonageClient]);

    const isEarmuffed = useMemo(() => call.earmuffed, [call.earmuffed]);
    const toggleEarmuff = useCallback(async () => {
        if (!call.callId) return;
        if (call.callState != 'in-progress') return;
        try {
            if (call.earmuffed) {
                await vonageClient.disableEarmuff(call.callId);
            }
            else {
                await vonageClient.enableEarmuff(call.callId);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }, [call.callId, call.callState, call.earmuffed, vonageClient]);

    return { isEarmuffed, toggleEarmuff };
};

