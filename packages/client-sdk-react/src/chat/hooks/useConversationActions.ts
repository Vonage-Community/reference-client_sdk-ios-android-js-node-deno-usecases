import { useCallback } from "react";
import { useVonageClient, useVonageSession } from "../../VonageClientProvider";
import { useChat } from "../ChatContainer";

/**
 * Returns an object with functions to perform actions on a conversation.
 * @param conversationId The ID of the conversation to perform actions on.
 * @returns An object with functions to leave, join, and invite users to a conversation.
 */
export const useConversationActions = (conversationId: string) => {
  const vonageClient = useVonageClient();
  const session = useVonageSession();

  /**
   * Leaves the conversation with the given ID.
   */
  const leaveConversation = useCallback(async () => {
    if (!session) return;
    await vonageClient.leaveConversation(conversationId);
  }, [session, vonageClient, conversationId]);

  /**
   * Joins the conversation with the given ID.
   * @returns A Promise that resolves when the user has joined the conversation.
   */
  const joinConversation = useCallback(async () => {
    if (!session) return;
    return await vonageClient.joinConversation(conversationId);
  }, [session, vonageClient, conversationId]);

  /**
   * Invites a user with the given name to the conversation with the given ID.
   * @param name The name of the user to invite.
   * @returns A Promise that resolves when the user has been invited to the conversation.
   */
  const inviteUser = useCallback(
    async (name: string) => {
      if (!session) return;
      return await vonageClient.inviteToConversation(conversationId, name);
    },
    [session, vonageClient, conversationId]
  );

  return { leaveConversation, joinConversation, inviteUser };
};

/**
 * Returns an object with functions to perform actions on the current chat conversation.
 * @returns An object with functions to leave, join, and invite users to the current chat conversation.
 */
export const useChatActions = () => {
  const {
    state: { id },
  } = useChat();
  return useConversationActions(id);
};
