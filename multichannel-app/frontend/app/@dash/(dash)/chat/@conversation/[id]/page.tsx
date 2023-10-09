import { ChatHistory, ChatInput } from '@vonage/client-sdk-react';

type ConversationPageProps = {
    params: {
        id: string;
    };
};

const ConversationPage = ({ }: ConversationPageProps) => {
    return (
        <>
            <ChatHistory filter='messages' scrollToEnd />
            <ChatInput displayEnableAudio />
        </>
    );
};

export default ConversationPage;