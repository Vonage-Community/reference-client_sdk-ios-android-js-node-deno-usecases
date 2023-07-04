'use client';

/* eslint-disable @next/next/no-img-element */
import { ChatContainer, ChatMember, ChatMessage, useChat, useSendMessage, useVonageUser } from '@vonage/client-sdk-react';
import { use, useEffect, useRef, useState } from 'react';
import RelativeTime from '@yaireo/relative-time';
import { IconSend } from '@tabler/icons-react';

const relativeTime = new RelativeTime();

const TextBubble = ({ text }: { text: string }) => <div className=' chat-bubble'>{text}</div>;

const CustomDataBubble = ({ data }: { data: any }) => <div className='chat-bubble'>
    <pre>{JSON.stringify(data, null, 2)}</pre>
</div>;

const ChatHeader = ({ name }: { name: string }) => {
    return (
        <div className=' chat-header'>
            {name}
        </div>
    );
};

const ChatFooter = ({ time }: { time?: string }) => {
    const rt = relativeTime.from(new Date(time));
    return (
        <div className=' chat-footer'>
            <time className=' text-xs opacity-50' >{rt}</time>
        </div>
    );
};

const ChatImage = ({ imageUrl, name }: { imageUrl?: string, name: string }) => {

    if (!imageUrl) return (
        <div className="chat-image avatar">
            <div className="w-10 rounded-full text-center flex items-center justify-center">
                <span className="text-3xl">{name.charAt(0)}</span>
            </div>
        </div>
    );

    return (
        <div className="chat-image avatar">
            <div className="w-10 rounded-full">
                <img src={imageUrl} alt={name} />
            </div>
        </div>
    );
};

const ChatMessageItem = ({ message, members }: { message: ChatMessage, members: Map<string, ChatMember> }) => {
    const user = useVonageUser();
    const { type, body, timestamp, } = message;
    const { name, avatarUrl, displayName } = members.get(message.body.sender.id) || { name: body.sender.name, avatarUrl: body.sender.imageUrl, displayName: body.sender.displayName };
    const isLocalUser = user.id === body.sender.id;

    return (
        <div className={`chat ${!isLocalUser ? 'chat-start' : 'chat-end'}`}>
            <ChatImage imageUrl={avatarUrl} name={displayName || name} />
            <ChatHeader name={displayName || name} />
            {type === 'message:text' ? <TextBubble text={body.text} /> : <CustomDataBubble data={JSON.parse(body.customData)} />}
            <ChatFooter time={timestamp} />
        </div>
    );
};



const ChatHistory = () => {
    const { state } = useChat();
    const ref = useRef<HTMLDivElement>(null);
    const messages = Array.from(state.messages.values());

    useEffect(() => {
        if (!ref.current) return;
        // TODO: Do not scroll if user has scrolled up
        ref.current.scrollTop = ref.current.scrollHeight;
    }, [messages]);

    return (
        <div className=' overflow-y-auto overscroll-y-contain' ref={ref}>
            {messages.map((message) => (
                <ChatMessageItem key={message.id} message={message} members={state.members} />
            ))}
        </div>
    );
};

const ChatInput = () => {
    const { sendTextMessage } = useSendMessage();
    const [text, setText] = useState('');

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        sendTextMessage(text);
        setText('');
    };

    return (
        <form className=' join w-full group' onSubmit={onSubmit}>
            <input className=' input input-info join-item w-full' type='text' placeholder='Type a message...' value={text} onChange={(e) => setText(e.target.value)} />
            <button className='btn btn-info join-item w-25' aria-label='Send Message' type='submit'>
                <IconSend />
            </button>
        </form>
    );
};

type ConversationPageProps = {
    params: {
        id: string;
    };
};

const ConversationPage = ({ params: { id } }: ConversationPageProps) => {

    return (
        <ChatContainer conversationId={id} enableEventListening enablePreFetch>
            <div className='flex flex-col w-full h-full items-stretch justify-end gap-4'>
                <ChatHistory />
                <ChatInput />
            </div>
        </ChatContainer>
    );

};

export default ConversationPage;