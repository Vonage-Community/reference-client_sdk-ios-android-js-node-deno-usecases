const defaultPage = () => {
    return (
        <div className='flex flex-col items-center justify-center w-full h-full'>
            <h1 className='text-5xl font-bold'>No Conversation Selected</h1>
            <p className='text-xl'>Select a conversation from the list to start chatting</p>
        </div>
    );
};

export default defaultPage;