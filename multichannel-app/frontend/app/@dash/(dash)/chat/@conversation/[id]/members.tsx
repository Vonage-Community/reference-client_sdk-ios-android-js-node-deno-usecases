'use client';

import { useChat, type ChatMember } from '@vonage/client-sdk-react';

const ChatMemberItem = ({ member }: { member: ChatMember }) => {
    const name = member.displayName || member.name;
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    return (
        <div className="flex items-center justify-between px-2 py-1 border-accent-focus border-2 max-w-xs rounded-box indicator ">
            <span className='indicator-item badge badge-accent'>{member.channel || member.name.split(':')[1]}</span>
            <div className="avatar placeholder ">
                <div className="bg-neutral-focus text-neutral-content mask mask-squircle w-16">
                    <span className="text-xl" aria-label={name}>{initials}</span>
                </div>
            </div>
            <div className="flex-1 ml-4">
                <div className="text-sm font-semibold text-neutral-content">{name}</div>
            </div>
        </div>
    );
};

const isVoiceMember = ({ name }: ChatMember) => !['sms', 'whatsapp'].includes(name.split(':')[1]);

export const ChatMembers = () => {
    const { state: { callId, members } } = useChat();
    const membersArray = Array
        .from(members.values())
        .filter(isVoiceMember);

    if (!callId) return null;

    return (
        <div className='bg-neutral p-2 my-4 rounded-2xl' >
            <h3 className='text-xl font-semibold text-neutral-content'>Voice Huddle Members</h3>
            <div className=' grid grid-flow-col-dense gap-6 min-h-36 my-6 mx-2 justify-start'>
                {membersArray.map(member => (
                    <ChatMemberItem member={member} key={member.userId} />
                ))}


            </div>
        </div>
    );
};