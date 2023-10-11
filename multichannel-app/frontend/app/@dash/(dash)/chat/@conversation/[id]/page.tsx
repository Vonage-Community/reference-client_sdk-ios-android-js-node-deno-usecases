import { ChatHistory, ChatInput, CustomEventComponentProps } from '@vonage/client-sdk-react';
import { match, P } from 'ts-pattern';
import { CustomEventItem } from './CustomEventItem';

type ConversationPageProps = {
    params: {
        id: string;
    };
};

const ConversationPage = ({ }: ConversationPageProps) => {
    return (
        <>
            <ChatHistory filter='all' scrollToEnd CustomEvent={CustomEventItem} />
            <ChatInput displayEnableAudio />
        </>
    );
};

export default ConversationPage;