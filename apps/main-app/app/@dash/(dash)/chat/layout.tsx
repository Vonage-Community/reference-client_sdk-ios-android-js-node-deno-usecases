'use client';

import { ConversationListContainer } from '@vonage/client-sdk-react';
import { ReactNode, useRef } from 'react';


type ChatLayoutProps = {
    conversationList: ReactNode
    conversation: ReactNode
}

const ChatLayout = ({ conversationList, conversation }: ChatLayoutProps) => {


    return (
        <div className="drawer lg:drawer-open w-full max-h-full h-full grid-rows-1">
            <input type="checkbox" id="chat-list" className="drawer-toggle h-0" />
            <div className="drawer-content p-2 h-full">
                {conversation}
            </div>
            <div className="drawer-side h-full pr-2 min-w-full">
                <label htmlFor="chat-list" className=' drawer-overlay'></label>
                <ConversationListContainer>
                    {conversationList}
                </ConversationListContainer>
            </div>
        </div>
    );
};

export default ChatLayout;