/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { messageService, userService } from "../services/api";
import { Send, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { getThumbnailUrl } from "../utils/imageUtils";
import toast from "react-hot-toast";

interface Conversation {
  userId: number;
  username: string;
  lastMessage?: string;
  unreadCount?: number;
}

// Update the ChatMessage interface
interface ChatMessage {
  id?: number;
  from: number;
  to: number;
  message: string;
  attachmentUrl?: string;
  timestamp?: string;
  readAt?: string;
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const { sendMessage, unreadCounts, on, off, markRead } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<number | null>(
    userId ? Number(userId) : null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add a new state for the attachment
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    null
  );

  // Define handleEmojiClick and handleKeyDown before they're used
  const handleEmojiClick = (emojiObject: any) => {
    setInput((prev) => prev + emojiObject.emoji);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Add a function to handle attachment selection
  const handleAttachmentSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setAttachment(file);

      // Create a preview for the attachment
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachmentPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add a function to clear the attachment
  const clearAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
  };

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await messageService.getConversations();
        let conversationList = res.data || [];

        // If userId is provided in URL and not in conversations, add it
        if (userId) {
          const targetUserId = Number(userId);
          const existingConv = conversationList.find(
            (conv: Conversation) => conv.userId === targetUserId
          );

          if (!existingConv) {
            // Try to get the username for this user
            try {
              const userRes = await userService.getUserById(targetUserId);
              const newConversation = {
                userId: targetUserId,
                username: userRes.data.username,
                lastMessage: "",
                unreadCount: 0,
              };
              conversationList = [newConversation, ...conversationList];
            } catch (error) {
              console.error("Error fetching user info:", error);
              // Fallback to placeholder username
              const newConversation = {
                userId: targetUserId,
                username: `user${targetUserId}`,
                lastMessage: "",
                unreadCount: 0,
              };
              conversationList = [newConversation, ...conversationList];
            }
          }
        }

        setConversations(conversationList);
        console.log("📋 Loaded conversations:", conversationList);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setConversations([]); // Set empty array on error
      }
    };

    fetchConversations();
  }, [userId]);

  // Fetch message history when selected changes
  useEffect(() => {
    if (selected) {
      messageService
        .getMessageHistory(selected)
        .then((res) => {
          setMessages(res.data || []);
          markRead(selected);
          console.log(
            `📜 Loaded message history with user ${selected}:`,
            res.data
          );
        })
        .catch((error) => {
          console.error("Error fetching message history:", error);
          setMessages([]); // Set empty array on error
        });
    }
  }, [selected, markRead]);

  // Listen for incoming messages
  useEffect(() => {
    const handler = (data: any) => {
      if (data.type === "message") {
        const msg = data as ChatMessage;
        if (
          selected !== null &&
          user &&
          (Number(msg.from) === Number(selected) ||
            Number(msg.to) === Number(selected)) &&
          (Number(msg.from) === Number(user.id) ||
            Number(msg.to) === Number(user.id))
        ) {
          console.log(`📨 Received message in chat:`, msg);
          // Only add message if it's from another user (not from current user)
          if (Number(msg.from) !== Number(user.id)) {
            setMessages((prev) => [...prev, msg]);
            // Mark as read immediately when message is received
            markRead(selected);
          }
        }
      }
    };

    on("message", handler);

    // Proper cleanup using the off function
    return () => {
      off("message", handler); // Fixed: Use off instead of on
    };
  }, [selected, on, off, user, markRead]); // Add off to dependencies

  useEffect(() => {
    setConversations((prev) =>
      prev.map((conv) => ({
        ...conv,
        unreadCount: unreadCounts[conv.userId] || 0,
      }))
    );
  }, [unreadCounts]);

  // Update the handleSend function
  const handleSend = async () => {
    if (selected !== null && (input.trim() || attachment) && user) {
      let attachmentUrl = "";

      // Upload attachment if exists
      if (attachment) {
        try {
          const response = await messageService.uploadAttachment(attachment);
          attachmentUrl = response.data.url;
          console.log("📎 Uploaded attachment:", attachmentUrl);
        } catch (error) {
          console.error("Error uploading attachment:", error);
          return toast.error("Failed to upload attachment");
        }
      }

      console.log(
        `📤 Sending message from ${
          user.id
        } to ${selected}: "${input.trim()}" with attachment: ${attachmentUrl}`
      );

      // Only proceed if we have a message or a successful attachment upload
      if (input.trim() || attachmentUrl) {
        sendMessage(selected, input.trim(), attachmentUrl);

        setMessages((prev) => [
          ...prev,
          {
            from: Number(user.id),
            to: Number(selected),
            message: input.trim(),
            attachmentUrl: attachmentUrl || undefined,
          },
        ]);

        setInput("");
        clearAttachment();
        setShowEmojiPicker(false);
      }
    }
  };

  return (
    <div className="flex h-[80vh] max-w-4xl mx-auto mt-8 bg-dark-800 rounded-lg overflow-hidden shadow-lg">
      {/* Conversation List */}
      <div className="w-1/3 bg-dark-900 border-r border-dark-700 p-4">
        <h2 className="text-lg font-bold text-white mb-4">Messages</h2>
        {conversations && conversations.length > 0 ? (
          <ul>
            {conversations.map((conv: Conversation) => (
              <li
                key={conv.userId}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer mb-2 ${
                  selected === conv?.userId
                    ? "bg-dark-700"
                    : "hover:bg-dark-700"
                }`}
                onClick={() => {
                  console.log(
                    `👤 Selected user: ${conv?.username} (ID: ${conv?.userId})`
                  );
                  setSelected(Number(conv?.userId));
                  // Mark as read when conversation is selected
                  if (conv.unreadCount && conv.unreadCount > 0) {
                    markRead(conv.userId);
                  }
                }}
              >
                <span className="text-white">{conv?.username}</span>
                {conv.unreadCount && conv.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                    {conv.unreadCount}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-400 text-center py-8">
            No conversations yet. Start a conversation by visiting someone's
            profile and clicking the Message button.
          </div>
        )}
      </div>
      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        <div
          ref={chatContainerRef}
          className="flex-1 p-6 overflow-y-auto overflow-x-hidden"
        >
          {selected ? (
            <div>
              {messages && messages.length > 0 ? (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`mb-2 flex ${
                      user && Number(msg.from) === Number(user.id)
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2 rounded-lg max-w-xs break-words ${
                        user && Number(msg.from) === Number(user.id)
                          ? "bg-primary-500 text-white"
                          : "bg-dark-700 text-white"
                      }`}
                    >
                      {msg.attachmentUrl && (
                        <div className="mb-2">
                          <a
                            href={getThumbnailUrl(msg.attachmentUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={getThumbnailUrl(msg.attachmentUrl)}
                              alt="Attachment"
                              className="max-w-full rounded-lg cursor-pointer"
                              onError={(e) => {
                                console.error(
                                  "Image failed to load:",
                                  msg.attachmentUrl
                                );
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </a>
                        </div>
                      )}
                      {msg.message}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-center py-8">
                  No messages yet. Start the conversation!
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-8">
              Select a conversation to start chatting.
            </div>
          )}
        </div>
        {selected && (
          <div className="p-4 border-t border-dark-700">
            {/* Attachment preview */}
            {attachmentPreview && (
              <div className="mb-2 relative">
                <img
                  src={attachmentPreview}
                  alt="Attachment preview"
                  className="max-h-32 rounded-lg"
                />
                <button
                  className="absolute top-1 right-1 bg-dark-800 text-white rounded-full p-1"
                  onClick={clearAttachment}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}

            {/* Input Area with relative positioning for emoji picker */}
            <div className="flex items-center relative">
              <input
                className="flex-1 bg-dark-700 text-white px-4 py-2 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
              />

              {/* Attachment button */}
              <label className="bg-dark-700 hover:bg-dark-600 text-gray-400 hover:text-white px-3 py-2 border-l border-dark-600 cursor-pointer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAttachmentSelect}
                />
              </label>

              <div className="relative">
                <button
                  className="bg-dark-700 hover:bg-dark-600 text-gray-400 hover:text-white px-3 py-2 border-l border-dark-600"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  type="button"
                >
                  <Smile size={20} />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full mb-2 right-0 z-10 shadow-lg">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width={300}
                      height={400}
                    />
                  </div>
                )}
              </div>

              <button
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-r-lg flex items-center gap-2 transition-colors cursor-pointer"
                onClick={handleSend}
                disabled={!input.trim() && !attachment}
              >
                <Send size={18} />
                <span>Send</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
