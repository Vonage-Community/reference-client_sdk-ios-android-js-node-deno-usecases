'use client';

import { CustomMessageEvent, Member, MemberInvitedEvent, MemberJoinedEvent, MemberLeftEvent, TextMessageEvent, ConversationEvent, MemberState } from '@vonage/client-sdk';
import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { useVonageClient, useVonageSession } from '../VonageClientProvider';

export type ChatMember = {
    userId: string;
    name: string;
    avatarUrl?: string;
    displayName?: string;
    channel?: string;
    state?: MemberState;
};

export type TextMessage = {
    type: 'message:text';
} & Omit<TextMessageEvent, '__doNotUseIt'>;
export const isTextMessageEvent = (event: ConversationEvent): event is TextMessageEvent => event instanceof TextMessageEvent;
export const isTextMessage = (event: ChatEvent): event is TextMessage => event.type === 'message:text';

export type CustomMessage = {
    type: 'message:custom';
} & Omit<CustomMessageEvent, '__doNotUseIt'>;
export const isCustomMessageEvent = (event: ConversationEvent): event is CustomMessageEvent => event instanceof CustomMessageEvent;
export const isCustomMessage = (event: ChatEvent): event is CustomMessage => event.type === 'message:custom';

export type ChatMessage = TextMessage | CustomMessage;
export const isChatMessage = (event: ChatEvent): event is ChatMessage => isTextMessage(event) || isCustomMessage(event);

export type MemberJoined = {
    type: 'member:joined';
} & Omit<MemberJoinedEvent, '__doNotUseIt'>;
export const isMemberJoinedEvent = (event: ConversationEvent): event is MemberJoinedEvent => event instanceof MemberJoinedEvent;
export const isMemberJoined = (event: ChatEvent): event is MemberJoined => event.type === 'member:joined';

export type MemberInvited = {
    type: 'member:invited';
} & Omit<MemberInvitedEvent, '__doNotUseIt'>;
export const isMemberInvitedEvent = (event: ConversationEvent): event is MemberInvitedEvent => event instanceof MemberInvitedEvent;
export const isMemberInvited = (event: ChatEvent): event is MemberInvited => event.type === 'member:invited';

export type MemberLeft = {
    type: 'member:left';
} & Omit<MemberLeftEvent, '__doNotUseIt'>;
export const isMemberLeftEvent = (event: ConversationEvent): event is MemberLeftEvent => event instanceof MemberLeftEvent;
export const isMemberLeft = (event: ChatEvent): event is MemberLeft => event.type === 'member:left';

export type MemberEvent = MemberJoined | MemberInvited | MemberLeft;
export const isMemberEvent = (event: ChatEvent): event is MemberEvent => isMemberJoined(event) || isMemberInvited(event) || isMemberLeft(event);


export type ChatEvent = ChatMessage | MemberEvent;
// factory function to create a ChatEvent from a ConversationEvent
export const createChatEvent = (event: ConversationEvent): ChatEvent | undefined => {
    const temp = {
        id: event.id,
        timestamp: event.timestamp,
        from: event.from,
    } as any;
    if (isTextMessageEvent(event)) return { type: 'message:text', ...temp, body: event.body };
    if (isCustomMessageEvent(event)) return { type: 'message:custom', ...temp, body: event.body };
    if (isMemberJoinedEvent(event)) return { type: 'member:joined', ...temp, body: event.body };
    if (isMemberInvitedEvent(event)) return { type: 'member:invited', ...temp, body: event.body };
    if (isMemberLeftEvent(event)) return { type: 'member:left', ...temp, body: event.body };
    console.warn('Unknown ConversationEvent type', event);

};

type ChatState = {
    id: string;
    name: string;
    displayName?: string;
    imageUrl?: string;
    members: Map<string, ChatMember>;
    messages: Map<number, ChatMessage>;
};

export type ChatAction =
    { type: 'event', event: ConversationEvent } |
    { type: 'load:events', events: ConversationEvent[] } |
    { type: 'load:members', members: ChatMember[] } |
    { type: 'setup', id: string, name: string, displayName?: string, imageUrl?: string };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {

    console.log('chatReducer', action);
    const curentState = { ...state };

    const loadEvent = (newEvent: ConversationEvent, oldState: ChatState) => {
        const event = createChatEvent(newEvent);
        if (!event) return oldState;
        if (isChatMessage(event)) {
            oldState.messages.set(event.id, event);
            return oldState;
        }
        if (isMemberInvited(event)) {
            oldState.members.set(event.body.invitee.id, {
                userId: event.body.invitee.id,
                name: event.body.invitee.name,
                avatarUrl: event.body.invitee.imageUrl || undefined,
                displayName: event.body.invitee.displayName || undefined,
            });
            return oldState;
        }
        if (isMemberJoined(event)) {
            console.log('isMemberJoined', event);
            oldState.members.set(event.body.user.id, {
                userId: event.body.user.id,
                name: event.body.user.name,
                avatarUrl: event.body.user.imageUrl || undefined,
                displayName: event.body.user.displayName || undefined,
            });
            return oldState;
        }
        if (isMemberLeft(event)) {
            oldState.members.delete(event.body.user.id);
            return oldState;
        }
        throw new Error(`Unknown ChatEvent type: ${newEvent.constructor.name}`);
    };

    const loadMember = (member: ChatMember, oldState: ChatState) => {
        const oldMember = oldState.members.get(member.userId);
        if (!oldMember && member.state == MemberState.LEFT) return oldState;
        switch (member.state) {
            case MemberState.INVITED:
            case MemberState.JOINED:
                oldState.members.set(member.userId, member);
                return oldState;
            case MemberState.LEFT:
                oldState.members.delete(member.userId);
                return oldState;
            default: throw new Error(`Unknown MemberState: ${member.state}`);
        }
    };

    switch (action.type) {
        case 'event': return loadEvent(action.event, curentState);
        case 'load:events': return action.events.reduce((s, event) => loadEvent(event, s), curentState);
        case 'load:members': return action.members.reduce((s, member) => loadMember(member, s), curentState);
        case 'setup': return { ...curentState, id: action.id, name: action.name, displayName: action.displayName, imageUrl: action.imageUrl };
        default: throw new Error(`Unknown action type: ${action}`);
    };
};
const initialState = (id: string): ChatState => ({
    id: id,
    name: '',
    members: new Map(),
    messages: new Map(),
});

/**
 * ChatContext is the context that provides the chat state and the incomingEvent function to the ChatContainer and its children.
 */
type ChatContext = {
    state: ChatState;
    incomingEvent: (event: ConversationEvent) => void;
    incomingEvents: (events: ConversationEvent[]) => void;
    setup: (id: string, name: string, displayName?: string, imageUrl?: string) => void;
    loadMembers: (members: ChatMember[]) => void;
};

const ChatContext = createContext<ChatContext | undefined>(undefined);

/**
 * CatchContainerProps is the type of the props object that must be passed to the ChatContainer component.
 * 
 * @property conversationId - The id of the conversation to listen to.
 * @property enableEventListening - If true, the ChatContainer will listen to events on the conversation and update the state accordingly. Default: undefined.
 * @property enablePreFetch - If true, the ChatContainer will fetch the conversation members and messages on mount. Default: undefined.
 * @property children - The children of the ChatContainer.
 */
type ChatContainerProps = {
    conversationId: string;
    enableEventListening?: boolean;
    enablePreFetch?: boolean;

    children: React.ReactNode;
};

/**
 * ChatContainer is a component that provides a ChatContext to its children.
 * 
 * @param props - {@link ChatContainerProps}
 * 
 * @example
 * ```tsx
 * <ChatContainer conversationId={conversationId} enableEventListening enablePreFetch >
 *    <Chat />
 * </ChatContainer>
 * ```
 * 
 * @category Component
 * @category Provider
 * @category Chat
 */
export const ChatContainer = (props: ChatContainerProps) => {
    const vonageClient = useVonageClient();
    const vonageSession = useVonageSession();
    const [state, dispatch] = useReducer(chatReducer, initialState(props.conversationId));

    const incomingEvent = useCallback((event: ConversationEvent) => {
        if (event.conversationId !== state.id) return;
        dispatch({ type: 'event', event });
    }, [state.id]);
    const incomingEvents = useCallback((events: ConversationEvent[]) => {
        dispatch({ type: 'load:events', events });
    }, []);
    const setup = (id: string, name: string, displayName?: string, imageUrl?: string) => {
        dispatch({ type: 'setup', id, name, displayName, imageUrl });
    };
    const loadMembers = useCallback((members: ChatMember[]) => {
        dispatch({ type: 'load:members', members });
    }, []);

    useEffect(() => {
        if (!props.enableEventListening) return;
        if (!vonageClient) return;
        if (!vonageSession) return;

        const eventsListener = vonageClient.on('conversationEvent', incomingEvent);
        return () => {
            vonageClient.off('conversationEvent', eventsListener);
        };
    }, [vonageClient, props.enableEventListening, incomingEvent, vonageSession]);

    useEffect(() => {
        if (!props.enablePreFetch) return;
        if (!vonageClient) return;
        if (!vonageSession) return;

        const fetchConversation = async () => {
            const conversation = await vonageClient.getConversation(state.id);
            setup(conversation.id, conversation.name, conversation.displayName || undefined, conversation.imageUrl || undefined);
        };

        const fetchEvents = async (cursor?: string) => {
            const { events, nextCursor } = await vonageClient.getConversationEvents(state.id, undefined, undefined, cursor);
            incomingEvents(events);
            if (nextCursor) fetchEvents(nextCursor);
        };

        const getChatMember = async (m: Member): Promise<ChatMember | undefined> => {
            const user = await vonageClient.getUser(m.user!.id);
            if (!user) console.warn(`User ${m.user?.id} not found`);
            const member = await vonageClient.getConversationMember(state.id, m.id);
            if (!member) console.warn(`Member ${m.id} not found`);

            if (!user || !member) return;
            return {
                userId: user.id,
                name: user.name,
                avatarUrl: user.imageUrl || undefined,
                displayName: user.displayName || undefined,
                channel: member.channel?.type.name || undefined,
                state: member.state,
            };
        };

        const fetchMembers = async (cursor?: string) => {
            const { members, nextCursor } = await vonageClient.getConversationMembers(state.id, undefined, undefined, cursor);
            const chatMembers = await Promise.all(members.filter(m => m.user != null).map(getChatMember));
            loadMembers(chatMembers.filter(Boolean) as ChatMember[]);
            if (nextCursor) fetchMembers(nextCursor);
        };

        fetchConversation();
        fetchEvents();
        fetchMembers();
    }, [vonageClient, props.enablePreFetch, state.id, incomingEvents, loadMembers, vonageSession]);

    return (
        <ChatContext.Provider value={{ state, incomingEvent, incomingEvents, setup, loadMembers }}>
            {props.children}
        </ChatContext.Provider>
    );
};

/**
 * useChat is a hook that returns the ChatContext.
 * 
 * @returns {@link ChatContext}
 * @catagory Hook
 * @catagory Chat
 * @example
 * ```tsx
 * const { state} = useChat();
 * ```
 */
export const useChat = (): ChatContext => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within a ChatContainer');
    return context;
};