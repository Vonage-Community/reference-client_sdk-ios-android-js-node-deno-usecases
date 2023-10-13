'use client';
import { isChatMessage, isMemberEvent, useChat } from '../ChatContainer';


export type UseChatHistoryOptions = {
    sort?: 'asc' | 'desc';
    filter?: 'all' | 'messages' | 'members';
};
export const useChatHistory = ({ sort = 'asc', filter = 'all' }: UseChatHistoryOptions) => {
    const { state, isLoading } = useChat();
    const history = [...state.events.values()]
        .filter((event) => (
            (filter == 'messages' || filter == 'all' && isChatMessage(event)) ||
            (filter == 'members' || filter == 'all' && isMemberEvent(event))
        ))
        .sort((a, b) => sort == 'asc' ? a.id - b.id : b.id - a.id);
    return { history, isLoading };
};