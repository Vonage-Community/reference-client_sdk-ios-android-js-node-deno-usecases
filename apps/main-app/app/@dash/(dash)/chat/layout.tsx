import { ReactNode } from 'react';


type ChatLayoutProps = {
    conversationList: ReactNode
    conversation: ReactNode
}

const ChatLayout = ({ conversationList, conversation }: ChatLayoutProps) => {
    return (
        <div className="flex flex-row w-full h-full gap-4 divide-x-4">
            <div className=' w-2/5' >{conversationList}</div>
            <div className='w-3/5 pl-4' >{conversation}</div>
        </div>
    );
};

export default ChatLayout;