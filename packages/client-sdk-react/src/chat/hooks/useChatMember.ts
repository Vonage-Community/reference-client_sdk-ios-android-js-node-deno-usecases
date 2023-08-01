'use client';
import { useMemo } from 'react';
import { useChatMembers } from './useChatMembers';



export const useChatMember = (userId: string) => {
    const { members, isLoading } = useChatMembers();

    const member = useMemo(() => {
        if (!isLoading) return;
        if (members.has(userId)) {
            return members.get(userId);
        }
    }, [isLoading, members, userId]);

    return { member, isLoading };
};
