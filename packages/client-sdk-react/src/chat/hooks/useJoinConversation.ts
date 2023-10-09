import { useCallback } from 'react';
import { useVonageClient, useVonageSession } from '../../VonageClientProvider';

export const useJoinConversationActions = () => {
  const vonageClient = useVonageClient();
  const session = useVonageSession();

  const joinConvesation = useCallback(
    async (conversationId: string) => {
      if (!session) return;
      const memberId = await vonageClient.joinConversation(conversationId);
      return {
        conversationId,
        memberId
      };
    },
    [session, vonageClient]
  );

  return { joinConvesation };
};
