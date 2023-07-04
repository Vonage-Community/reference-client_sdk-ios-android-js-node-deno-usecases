import { useCallback } from 'react';
import { useVonageClient } from '../../VonageClientProvider';
import { useChat } from '../ChatContainer';


export const useSendMessage = () => {
    const vonageClient = useVonageClient();
    const { state: { id } } = useChat();

    const sendTextMessage = useCallback((text: string) => {
        vonageClient.sendTextMessage(id, text);
    }, [vonageClient, id]);

    return { sendTextMessage };
};