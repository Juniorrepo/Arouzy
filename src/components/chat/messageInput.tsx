import { useEffect, useState } from 'react';
import { useChat } from '../../store/useChatStore';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';

const MessageInput = () => {
    
  const [text, setText] = useState('');
  const { sendMessage } = useChat();
  // const [call, setCall] = useState(false);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await sendMessage({
        content: text.trim(),
      });
      setText('');
      // setCall(true);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };
//  useEffect(()=>{
//   if(call){
//     toast.success('Message sent successfully');
//     setCall(false);
//   }
//  },[call])
  return (
    <div className="p-4 w-full">
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <input
          type="text"
          className="flex-1 input input-bordered rounded-lg input-sm sm:input-md"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim()}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;