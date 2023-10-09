import { ChatContainer } from '@vonage/client-sdk-react';
import { ChatHeaderBar } from './ChatHeaderBar';
import { ChatMembers } from './members';

type ConversationLayoutProps = {
    children: React.ReactNode

    params: {
        id: string
    }
};

const ConversationLayout = ({ children, params: { id } }: ConversationLayoutProps) => {
    return (
        <ChatContainer conversationId={id} enableEventListening enablePreFetch>
            <div className="h-full max-h-full flex flex-col">
                <ChatHeaderBar />
                <ChatMembers />
                {children}
            </div>
        </ChatContainer>
    );
};

export default ConversationLayout;