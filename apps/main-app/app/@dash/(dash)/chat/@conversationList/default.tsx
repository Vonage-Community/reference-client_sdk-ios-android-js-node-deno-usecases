import { ConversationListContainer } from '@vonage/client-sdk-react';
import { Chats } from './Chats';


const defaultPage = () => {
    return (
        <ConversationListContainer>
            <Chats />
        </ConversationListContainer>
    );
};

export default defaultPage;