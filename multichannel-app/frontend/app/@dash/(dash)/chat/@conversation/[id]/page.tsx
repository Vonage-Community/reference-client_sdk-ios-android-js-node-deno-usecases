'use client';
import { ChatFooter, ChatHeader, ChatHistory, ChatImage, ChatInput, CustomEventComponentProps, useChatMembers, useVonageUser } from '@vonage/client-sdk-react';
import { match, P } from 'ts-pattern';

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