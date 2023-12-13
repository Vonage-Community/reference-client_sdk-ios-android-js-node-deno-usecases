import { createContext, useCallback, useContext, useEffect, useState, useTransition } from 'react';
import { useVonageClient, useVonageSession } from '../VonageClientProvider';


export type Conversation = {
    id: string;
    name: string;
    displayName?: string;
    imageUrl?: string
};
type ConversationListContext = {
    conversation: Map<string, Conversation>;
    refresh: () => void;

    isLoading: boolean;
    error?: Error;
};

const ConversationListContext = createContext<ConversationListContext | undefined>(undefined);

type ConversationListContainerProps = {

    children: React.ReactNode;
}

export const ConversationListContainer = (props: ConversationListContainerProps) => {
    const [isPending, startTransition] = useTransition();
    const vonageClient = useVonageClient();
    const vonageSession = useVonageSession();
    const [conversation, setConversations] = useState<Map<string, Conversation>>(() => new Map());
    const [error, setError] = useState<Error | undefined>(undefined);

    const fetchConversation = useCallback(async (id: string): Promise<Conversation> => {
        const conversation = await vonageClient.getConversation(id);
        return {
            id: conversation.id,
            name: conversation.name,
            displayName: conversation.displayName || undefined,
            imageUrl: conversation.imageUrl || undefined,
        } satisfies Conversation;
    }, [vonageClient]);
    const fetchConversations = useCallback(async (cursor?: string, Conversations: Conversation[] = []): Promise<Conversation[]> => {
        const { conversations, nextCursor } = await vonageClient.getConversations({cursor});
        const newConversations = await Promise.all(conversations.map(conversation => fetchConversation(conversation.id)));
        if (!nextCursor) return [...newConversations, ...Conversations];
        return await fetchConversations(nextCursor, [...newConversations, ...Conversations]);
    }, [vonageClient, fetchConversation]);
    const refresh = useCallback(() => {
        if (!vonageClient || !vonageSession) return;
        fetchConversations()
            .then(Conversations => {
                startTransition(() => setConversations(
                    new Map(Conversations.map(Conversation => [Conversation.id, Conversation]))
                ));
            })
            .catch(error => setError(error));
    }, [fetchConversations, vonageClient, vonageSession]);

    useEffect(() => {
        if (!vonageClient || !vonageSession) return;
        refresh();
    }, [refresh, vonageClient, vonageSession]);


    return (
        <ConversationListContext.Provider value={{ conversation, refresh, error, isLoading: isPending }}>
            {props.children}
        </ConversationListContext.Provider>
    );
};

export const useConversationList = () => {
    const context = useContext(ConversationListContext);
    if (!context) throw new Error('useConversationList must be used within a ConversationListContainer');
    return context;
};