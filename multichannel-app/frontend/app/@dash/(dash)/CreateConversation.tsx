'use client';

import { useCallStatus, ChatCreateConversation, ChatJoinConversation } from '@vonage/client-sdk-react';
import {useState} from 'react';

const callTypes = ['app', 'phone'] as const;

export const CreateConversation = () => {
    const [cName, setCname] = useState<string>('');
    const [cDisplayName, setCDisplayName] = useState<string>('');

    return (
        <div className='card bg-base-200'>
            <div className='card-body' >Create Conversation</div>
            <div className='card-body'>
               <ChatCreateConversation />
            </div>
            <div className='card-body' >Join Conversation</div>
            <div className='card-body' >
                <ChatJoinConversation />
            </div>
        </div>
        
    );
};