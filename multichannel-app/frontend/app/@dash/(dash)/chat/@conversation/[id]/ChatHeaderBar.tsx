'use client';
import { useChat, useChatActions } from '@vonage/client-sdk-react';
import { IconArrowAutofitLeft, IconArrowElbowLeft, IconChevronLeft, IconChevronRight, IconMenu2 } from '@tabler/icons-react';
import Link from 'next/link';
const VonageNumber = process.env.NEXT_PUBLIC_VONAGE_LVN;

export const ChatHeaderBar = () => {
    const { state: { name, displayName, id } } = useChat();
    const { leaveConversation } = useChatActions();
    return (
        <div className=' navbar shadow-lg bg-base-100 text-base-content h-24'>
            <div className='flex-1'>
                <label htmlFor='chat-list' className='btn drawer-button lg:hidden'>
                    <IconChevronRight aria-label='Open Chat List' />
                </label>
                <div className='inline-flex items-start gap-2 flex-col'>
                    <Link href={`/chat/${id}`} className='btn btn-ghost text-lg font-bold'>{displayName || name}</Link>
                    <a href={`tel:${VonageNumber}`} className='badge badge-outline'>Call in with {VonageNumber} <span className='ml-2'>Room Code:{name}</span></a>
                </div>
            </div>

            <div className='flex-none'>
                <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn m-1" role='button'>
                        <IconMenu2 aria-label='Menu' />
                    </label>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                            <Link href={`/chat/${id}/info`}>
                                Conversation Info
                            </Link>
                        </li>
                        <li><a onClick={leaveConversation} >Leave Conversation</a></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
