'use client';
import { ConversationEvent } from '@vonage/client-sdk';
import { useCallback, useMemo } from 'react';
import { isChatMessage, isMemberEvent, useChat } from '../ChatContainer';


export type UseChatHistoryOptions = {
    sort?: 'asc' | 'desc';
    filter?: 'all' | 'messages' | 'members';
};
export const useChatHistory = ({ sort = 'asc', filter = 'all' }: UseChatHistoryOptions) => {
    const { state, isLoading } = useChat();
    const history = [...state.events.values()].filter(event => event.id != null)
        .filter((event: ConversationEvent) => filter == 'all' || (filter == 'messages' && isChatMessage(event)) || (filter == 'members' && isMemberEvent(event)))
        .sort((a: ConversationEvent, b: ConversationEvent) => sort == 'asc' ? a.id! - b.id! : b.id! - a.id!);
    return { history, isLoading };
};