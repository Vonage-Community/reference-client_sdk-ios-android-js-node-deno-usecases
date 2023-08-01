'use client';
import { ChatMember, useChat } from '../ChatContainer';
import { Member, User } from '@vonage/client-sdk';

export const useChatMembers = (): {
    members: Map<string, ChatMember>;
    isLoading: boolean;
} => {
    const { state, isLoading } = useChat();
    const members = state.members;
    return { members, isLoading };
};
