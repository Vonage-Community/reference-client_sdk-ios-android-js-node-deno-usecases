import { ChatHistory, ChatInput } from '@vonage/client-sdk-react';
import React from 'react';

type ConversationPageProps = {
    params: {
        id: string;
    };
};

const ConversationPage = ({ }: ConversationPageProps) => {
    return (
        <>
            <ChatHistory filter='all' scrollToEnd />
            <ChatInput displayEnableAudio />
        </>
    );
};

export default ConversationPage;