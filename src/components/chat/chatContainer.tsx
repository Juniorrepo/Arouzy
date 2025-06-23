import React, { useEffect, useRef } from 'react';
import { useChat } from '../../store/useChatStore';
import { useAuth } from '../../contexts/AuthContext';
import ChatHeader from './chatHeader';
import MessageInput from './messageInput';
import MessageSkeleton from './skeletons/MessageSkeleton';
import { formatMessageTime } from '../../utils/formatDate';

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChat();
  const { user: authUser } = useAuth();
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedUser?.id) {
      getMessages(selectedUser.id);
      subscribeToMessages();
    }

    return () => unsubscribeFromMessages();
  }, [selectedUser?.id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef?.current && messages?.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  if (!authUser || !selectedUser) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Select a user to start chatting</p>
        </div>
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((message , index) => (
          <div
            // key={message?.id}
            key={index}
            className={`chat ${message?.senderId === authUser?.id ? 'chat-end' : 'chat-start'}`}
          >
            <div className="chat-image avatar">
              {/* <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser.id
                      ? authUser.username || '/avatar.png'
                      : selectedUser.username || '/avatar.png'
                  }
                  alt="profile pic"
                />
              </div> */}
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message?.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {/* {message?.image && (
                <img
                  src={message?.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )} */}
              {message?.content && <p>{message?.content}</p>}
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
