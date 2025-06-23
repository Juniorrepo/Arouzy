// import { X } from "lucide-react";
// import { useAuthStore } from "../store/useAuthStore";
import { useChat } from "../../store/useChatStore";

import { useAuth } from "../../contexts/AuthContext";

 const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChat();
  const { onlineUsers } = useAuth();

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              {/* <img src={selectedUser?.username || "/avatar.png"} alt={selectedUser?.username} /> */}
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser?.username}</h3>
            {/* <h3 className="font-medium">pratyush</h3> */}

            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser?.id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
        </button> 
      </div>
    </div>
  );
};
export default ChatHeader;