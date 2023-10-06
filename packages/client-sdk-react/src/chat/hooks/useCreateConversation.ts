import { useCallback } from 'react';
import { useVonageClient, useVonageSession } from '../../VonageClientProvider';

export const useCreateConversationActions = () => {
  const vonageClient = useVonageClient();
  const session = useVonageSession();

  const createConversation = useCallback(
    async (name: string, display_name?: string) => {
      if (!session) return;
      return await vonageClient.createConversation(name, display_name);
    },
    [session, vonageClient]
  );

  return { createConversation };
};
