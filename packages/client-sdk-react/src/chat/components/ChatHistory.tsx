'use client';

import { ComponentType, useEffect, useRef } from 'react';
import { useChatHistory, useChatMember } from '../hooks';
import { ChatMessageItem } from './ChatMessageItem';
import { match, P } from 'ts-pattern';
import { MemberEvent, isChatMessage, isCustomEvent, isMemberEvent } from '../ChatContainer';
import { CustomConversationEvent, MemberJoinedEvent, MemberLeftEvent } from '@vonage/client-sdk';
import { MemberInvitedEvent } from '@vonage/client-sdk';


const MemberLeftEventItem = ({ event }: { event: MemberLeftEvent }) => {
    const { member } = useChatMember(event.body.user.id);

    if (!member) return null;

    return (
        <div className='vg-chat-event'>
            <div className='vg-chat-event-body'>
                <div className='vg-chat-event-title'>
                    {member.displayName || member.name} left the chat
                </div>
            </div>
        </div>
    );
};


const MemberJoinedEventItem = ({ event }: { event: MemberJoinedEvent }) => {
    const { member } = useChatMember(event.body.user.id);

    if (!member) return null;

    return (
        <div className='vg-chat-event'>
            <div className='vg-chat-event-body'>
                <div className='vg-chat-event-title'>
                    {member.displayName || member.name} joined the chat
                </div>
            </div>
        </div>
    );
};

const MemberInvitedEventItem = ({ event }: { event: MemberInvitedEvent }) => {
    const { member: inviter } = useChatMember(event.from.kind == 'embeddedInfo' ? event.from.user.id : undefined);
    const { member: invitee } = useChatMember(event.body.user.id);

    if (!inviter || !invitee) return null;

    return (
        <div className='vg-chat-event'>
            <div className='vg-chat-event-body'>
                <div className='vg-chat-event-title'>
                    {inviter.displayName || inviter.name} invited {invitee.displayName || invitee.name} to the chat
                </div>
            </div>
        </div>
    );
};


const MemberEventItem = ({ event }: { event: MemberEvent }) => match(event)
    .with({ kind: 'member:joined' }, (event) => <MemberJoinedEventItem event={event} />)
    .with({ kind: 'member:left' }, (event) => <MemberLeftEventItem event={event} />)
    .with({ kind: 'member:invited' }, (event) => <MemberInvitedEventItem event={event} />)
    .exhaustive();

export type CustomEventComponentProps = {
    event: CustomConversationEvent
};

export type ChatHistoryProps = {
    className?: string;
    scrollToEnd?: boolean;

    filter?: 'all' | 'messages' | 'members';
    sort?: 'asc' | 'desc';

    loadingClassName?: string;

    CustomEvent?: ComponentType<CustomEventComponentProps>;
};

export const ChatHistory = (
    {
        className = 'vg-overflow-y-auto vg-overscroll-y-contain vg-overflow-x-hidden vg-h-full vg-max-h-full',
        scrollToEnd = false,
        filter = 'all',
        sort = 'asc',
        loadingClassName = 'vg-loading vg-loading-bars vg-loading-lg',
        CustomEvent
    }: ChatHistoryProps) => {
    const { history, isLoading } = useChatHistory({ sort, filter });
    const chatHistoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chatHistoryRef.current) return;
        if (!scrollToEnd) return;

        chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }, [history, scrollToEnd]);

    return (
        <div className={className} ref={chatHistoryRef}>
            {isLoading && history.length === 0 ? <div className={loadingClassName} /> : null}
            {history.map(event => match(event)
                .with({ kind: P.union('member:invited', 'member:joined', 'member:left') }, (event) => <MemberEventItem key={event.id} event={event} />)
                .with({ kind: P.union('message:text', 'message:custom') }, (event) => <ChatMessageItem key={event.id} message={event} />)
                .with({ kind: 'custom' }, (event) => CustomEvent ? <CustomEvent key={event.id} event={event} /> : null)
                .otherwise(() => null)
            )}
        </div>
    );
};