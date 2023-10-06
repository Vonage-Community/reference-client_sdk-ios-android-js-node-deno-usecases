/* eslint-disable @next/next/no-img-element */
'use client';

import { isChatMessage, useChat } from '@vonage/client-sdk-react';

const ChatInfoPage = () => {
    const { state: { name, displayName, id, members, events } } = useChat();

    const lastEvent = Array.from(events.values()).filter(isChatMessage).pop();
    const membersArray = Array.from(members.values());
    return (
        <div className='container mx-auto flex flex-col items-stretch'>
            <div className="stats shadow">
                <div className="stat">
                    <div className="stat-title">Members</div>
                    <div className="stat-value">{members.size}</div>
                </div>

                <div className="stat">
                    <div className="stat-title">Latest Activity</div>
                    <div className="stat-value">{new Date(lastEvent?.timestamp || 0).toLocaleString()}</div>
                </div>
            </div>

            <div className='flex-1'>
                <div className='flex flex-col items-stretch'>
                    {membersArray.map(member => (
                        <div className='flex items-center p-4 border-b border-base-200' key={member.userId}>
                            <div className='flex-1 items-center'>
                                <div className='text-lg font-bold inline-flex gap-2'>
                                    {member.avatarUrl ? (
                                        <div className='avatar'>
                                            <div className='rounded-full w-10 h-10'>
                                                <img src={member.avatarUrl} alt={member.displayName || member.name} />
                                            </div>
                                        </div>) : null}
                                    <span>
                                        {member.displayName || member.name}
                                    </span>
                                    <small className='flex gap-2'>
                                        <div className='badge badge-outline badge-info'>{member.state}</div>
                                        <div className='badge badge-outline badge-accent'>Channel: {member.channel}</div>
                                    </small>
                                </div>
                                <div className='text-sm text-base-content-secondary'>{member.userId}</div>
                            </div>
                            <div className='flex-none'>
                                <button className='btn btn-error'>Remove</button>
                            </div>
                        </div>
                    ))}

                </div>
            </div>
        </div>
    );

};

export default ChatInfoPage;