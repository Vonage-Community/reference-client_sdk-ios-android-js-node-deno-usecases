/* eslint-disable @next/next/no-img-element */
'use client';

import { Conversation, useConversationList } from '@vonage/client-sdk-react';
import Link from 'next/link';

const ChatImage = ({ chat }: { chat: Conversation }) => {
    if (!chat.imageUrl) return (
        <div className="avatar placeholder">
            <div className="bg-neutral-focus text-neutral-content mask mask-squircle w-12">
                <span className="text-3xl">{chat.displayName?.charAt(0) || chat.name.charAt(0)}</span>
            </div>
        </div>
    );

    return (
        <div className="avatar">
            <div className="bg-neutral-focus text-neutral-content mask mask-squircle w-12">
                <img src={chat.imageUrl} alt={chat.displayName || chat.name} />
            </div>
        </div>
    );
};

export const Chats = () => {
    const { conversation } = useConversationList();
    const chatList = Array.from(conversation.values());

    return (
        <div className='flex flex-col gap-3'>
            {chatList.map((chat) => (
                <Link href={`/chat/${chat.id}`} key={chat.id} className='alert shadow-lg'>
                    <div>
                        <ChatImage chat={chat} />
                        <span className='font-bold'>{chat.displayName || chat.name}</span>
                    </div>
                </Link>
            ))}
        </div>
    );
};