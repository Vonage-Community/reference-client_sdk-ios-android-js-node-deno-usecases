import { useCallback } from 'react';
import { useVonageClient, useVonageSession } from '../../VonageClientProvider';

export const useCreateConversationActions = () => {
  const vonageClient = useVonageClient();
  const session = useVonageSession();

  const createConversation = useCallback(
    async (name: string, displayName?: string) => {
      if (!session) return;
      const conversationId = await vonageClient.createConversation({name, displayName});
      const memberId = await vonageClient.joinConversation(conversationId);
      return {
        conversationId,
        memberId
      };
    },
    [session, vonageClient]
  );

  return { createConversation };
};
