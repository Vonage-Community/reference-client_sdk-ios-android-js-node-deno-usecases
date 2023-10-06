import { ConversationListContainer, VoiceCall } from '@vonage/client-sdk-react';

import '@vonage/client-sdk-react/dist/vonage-client-sdk-react.css';
import { CreateConversation } from './CreateConversation';


export default function Page() {
  return (
    <>
      <CreateConversation />
    </>
  );
}
