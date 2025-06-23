// import NotFound from "../../pages/NotFound";
import { useChat } from "../../store/useChatStore";
import ChatContainer from './chatContainer';
import Sidebar from './Sidebar';

const ChatHomePage = () => {
  const { selectedUser } = useChat();

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            {selectedUser ? (
              <ChatContainer />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">Select a user to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHomePage;