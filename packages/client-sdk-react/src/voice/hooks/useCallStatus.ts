import { useMemo } from 'react';
import { useVoiceCallContainer } from '../VoiceCallContainer';


export const useCallStatus = () => {
    const [call] = useVoiceCallContainer();

    const callStatus = useMemo(() => call.callState, [call.callState]);

    return { callStatus };
};
