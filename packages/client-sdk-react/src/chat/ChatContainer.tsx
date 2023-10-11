'use client';

import { MessageCustomEvent, Member, MemberInvitedEvent, MemberJoinedEvent, MemberLeftEvent, MessageTextEvent, ConversationEvent, MemberState, PersistentConversationEvent } from '@vonage/client-sdk';
import { createContext, useCallback, useContext, useEffect, useReducer, useTransition } from 'react';
import { useVonageClient, useVonageSession } from '../VonageClientProvider';
import { match, P } from 'ts-pattern';

export type ChatMember = {
    userId: string;
    name: string;
    avatarUrl?: string;
    displayName?: string;
    channel?: string; 
    state?: MemberState;
};
export const isChatMessage = (event: ConversationEvent): event is ChatMessage => event.kind.startsWith('message:');
export type ChatMessage = MessageTextEvent | MessageCustomEvent;
export const isMemberEvent = (event: ConversationEvent): event is MemberEvent => event.kind.startsWith('member:');
export type MemberEvent = MemberJoinedEvent | MemberInvitedEvent | MemberLeftEvent;
export const isCustomEvent = (event: ConversationEvent): event is MessageCustomEvent => event.kind.startsWith('message:custom');


type ChatState = {
    id: string;
    name: string;
    displayName?: string;
    imageUrl?: string;
    members: Map<string, ChatMember>;
    events: Map<number, PersistentConversationEvent>;
    callId?: string;
};

export type ChatAction =
    { type: 'event', event: ConversationEvent } |
    { type: 'load:events', events: ConversationEvent[] } |
    { type: 'load:members', members: ChatMember[] } |
    { type: 'setup', id: string, name: string, displayName?: string, imageUrl?: string } |
    { type: 'call:join', callId: string } |
    { type: 'call:leave' };

const loadEvent = (event: ConversationEvent, oldState: ChatState) =>
    match<[ChatState, ConversationEvent], ChatState>([oldState, event])
        .with([P._, { kind: P.union('message:text', 'message:custom', 'custom') }], ([state, event]) => {
            state.events.set(event.id, event);
            return state;
        })
        .with([P._, { kind: 'member:invited' }], ([state, event]) => {

            state.members.set(event.body.user.id, {
                userId: event.body.user.id,
                name: event.body.user.name,
                avatarUrl: event.body.user.imageUrl || undefined,
                displayName: event.body.user.displayName || undefined,
            });
            state.events.set(event.id, event);
            return state;
        })
        .with([P._, { kind: 'member:joined' }], ([state, event]) => {
            state.members.set(event.body.user.id, {
                userId: event.body.user.id,
                name: event.body.user.name,
                avatarUrl: event.body.user.imageUrl || undefined,
                displayName: event.body.user.displayName || undefined,
            });
            state.events.set(event.id, event);
            return state;
        })
        .with([P._, { kind: 'member:left' }], ([state, event]) => {
            state.members.delete(event.body.user.id);
            state.events.set(event.id, event);
            return state;
        })
        .otherwise(([state, _event]) => state);

const updateChatMemberState = (member: ChatMember, oldState: ChatState) => {
    const oldMember = oldState.members.get(member.userId);
    return match<[ChatState, ChatMember, ChatMember | undefined], ChatState>([oldState, member, oldMember])
        .with([P._, { state: P.union('INVITED', 'JOINED', 'UNKNOWN') }, P._], ([state, member, _oldMember]) => {
            state.members.set(member.userId, member);
            return state;
        })
        .with([P._, { state: 'LEFT' }, P._], ([state, member, _oldMember]) => {
            state.members.delete(member.userId);
            return state;
        })
        .otherwise(([state, _member, _oldMember]) => state);
};

/**
 * chatReducer is a reducer function that handles actions to update the chat state.
 * @param state The current chat state.
 * @param action The action to be performed on the chat state.
 * @returns The updated chat state.
 */
const chatReducer = (state: ChatState, action: ChatAction): ChatState => match<[ChatState, ChatAction], ChatState>([{ ...state }, action])
    .with([P._, { type: 'event' }], ([state, action]) => loadEvent(action.event, state))
    .with([P._, { type: 'load:events' }], ([state, action]) => action.events.reduce((s, event) => loadEvent(event, s), state))
    .with([P._, { type: 'load:members' }], ([state, action]) => action.members.reduce((s, member) => updateChatMemberState(member, s), state))
    .with([P._, { type: 'setup' }], ([state, action]) => ({ ...state, id: action.id, name: action.name, displayName: action.displayName, imageUrl: action.imageUrl }))
    .with([P._, { type: 'call:join' }], ([state, action]) => ({ ...state, callId: action.callId }))
    .with([P._, { type: 'call:leave' }], ([state, _action]) => ({ ...state, callId: undefined }))
    .exhaustive();


const initialState = (id: string): ChatState => ({
    id: id,
    name: '',
    members: new Map(),
    events: new Map(),
});

/**
 * ChatContext is the context that provides the chat state and the incomingEvent function to the ChatContainer and its children.
 */
type ChatContext = {
    state: ChatState;
    incomingEvent: (event: ConversationEvent) => void;
    incomingEvents: (events: PersistentConversationEvent[]) => void;
    setup: (id: string, name: string, displayName?: string, imageUrl?: string) => void;
    loadMembers: (members: ChatMember[]) => void;
    isLoading: boolean;
    joinCall: () => void;
    leaveCall: () => void;
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
    const [isPending, startTransition] = useTransition();
    const vonageClient = useVonageClient();
    const vonageSession = useVonageSession();
    const [state, dispatch] = useReducer(chatReducer, initialState(props.conversationId));

    const incomingEvent = useCallback((event: ConversationEvent) => {
        console.log('incomingEvent', event);
        if (event.conversationId !== state.id) return;
        startTransition(() => dispatch({ type: 'event', event }));
    }, [state.id]);
    const incomingEvents = useCallback((events: PersistentConversationEvent[]) => {
        startTransition(() => dispatch({ type: 'load:events', events }));
    }, []);
    const setup = (id: string, name: string, displayName?: string, imageUrl?: string) => {
        startTransition(() => dispatch({ type: 'setup', id, name, displayName, imageUrl }));
    };
    const loadMembers = useCallback((members: ChatMember[]) => {
        startTransition(() => dispatch({ type: 'load:members', members }));
    }, []);

    const joinCall = useCallback(() => {
        if (state.callId) return;
        vonageClient.serverCall({ callType: 'conversation', name: state.name })
            .then(callId => {
                startTransition(() => dispatch({ type: 'call:join', callId }));
            })
            .catch(err => {
                console.error(err);
            });
    }, [state.callId, state.name, vonageClient]);

    const leaveCall = useCallback(() => {
        if (!state.callId) return;
        vonageClient.hangup(state.callId!, 'app:user:hangup')
            .then(() => {
                startTransition(() => dispatch({ type: 'call:leave' }));
            })
            .catch(err => {
                console.error(err);
            });
        startTransition(() => dispatch({ type: 'call:leave' }));
    }, [state.callId, vonageClient]);

    useEffect(() => {
        if (!state.callId) return;
        if (!vonageSession) return;

        const l = vonageClient.on('callHangup', (hangupCallId, _, reason) => {
            if (hangupCallId !== state.callId) return;
            startTransition(() => dispatch({ type: 'call:leave' }));
        });
        return () => {
            vonageClient.off('callHangup', l);
        };
    }, [vonageClient, state.callId, vonageSession]);

    useEffect(() => {
        if (!props.enableEventListening) return;
        if (!vonageClient) return;
        if (!vonageSession) return;

        const l = vonageClient.on('conversationEvent', incomingEvent);
        return () => {
            vonageClient.off('conversationEvent', l);
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
            const { events, nextCursor } = await vonageClient.getConversationEvents(state.id, undefined, 100, cursor);
            incomingEvents(events);
            if (nextCursor) fetchEvents(nextCursor);
        };

        const getChatMember = async (m: Member): Promise<ChatMember | undefined> => {
            const user = await vonageClient.getUser(m.user!.id);
            if (!user) {
                console.warn(`User ${m.user?.id} not found`);
                return;
            }
            const member = await vonageClient.getConversationMember(state.id, m.id);
            if (!member) {
                console.warn(`Member ${m.id} not found`);
                return;
            }

            const chatmember = {
                userId: user.id,
                name: user.name,
                avatarUrl: user.imageUrl || undefined,
                displayName: user.displayName || undefined,
                channel: member.channel?.type.name || undefined,
                state: member.state,
            };
            console.log('chatmember', chatmember);
            return chatmember;
        };

        const fetchMembers = async (cursor?: string) => {
            const { members, nextCursor } = await vonageClient.getConversationMembers(state.id, undefined, undefined, cursor);
            const chatMembers = await Promise.all(
                members
                    .filter(m => m.user != null)
                    .filter(m => m.state === 'JOINED' || m.state === 'INVITED')
                    .map((m) => getChatMember(m as Member))
            );
            loadMembers(chatMembers.filter(Boolean) as ChatMember[]);
            if (nextCursor) fetchMembers(nextCursor);
        };

        fetchConversation();
        fetchEvents();
        fetchMembers();
    }, [vonageClient, props.enablePreFetch, state.id, incomingEvents, loadMembers, vonageSession]);

    return (
        <ChatContext.Provider value={{ state, incomingEvent, incomingEvents, setup, loadMembers, isLoading: isPending, joinCall, leaveCall }}>
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
