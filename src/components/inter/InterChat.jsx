import { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";
import { Card } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Input } from "@/components/ui/input.jsx";
import ReportModal from "@/components/ui/ReportModal.jsx";
import api, {
  getUserConversations,
  getMessages,
  sendMessage,
  sendCollabInvite,
  getPendingInvites,
  respondToInvite
} from '@/lib/api.js';

// Emoji list for emoji picker
const EMOJI_LIST = ['😀', '😂', '❤️', '🔥', '👍', '😍', '🎉', '😎', '👏', '💯', '✨', '🚀', '😴', '😤', '😱', '🤔', '😌', '🙏', '🎊', '💪', '🙌', '😘', '👌', '😊'];

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const WS_URL = `${BASE_URL}/ws-studcollab`;

// Hook to fetch conversations for a user
function useConversations(userId) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getUserConversations(userId)
      .then(res => setConversations(res.data || []))
      .catch(err => console.error("Failed to fetch conversations:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  return [conversations, setConversations, loading];
}

// Hook to fetch messages for a conversation
function useMessages(conversationId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    getMessages(conversationId)
      .then(res => setMessages(res.data || []))
      .catch(err => console.error("Failed to fetch messages:", err))
      .finally(() => setLoading(false));
  }, [conversationId]);

  return [messages, setMessages, loading];
}

// Main InterChat Component
export default function InterChat({ user }) {
  const userId = user?.id;
  const [conversations, , convLoading] = useConversations(userId);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages, msgLoading] = useMessages(selected?.id);
  const [input, setInput] = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [userDataCache, setUserDataCache] = useState({}); // Cache user data to avoid repeated API calls
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch user data for other participants in conversations
  useEffect(() => {
    const fetchUserData = async () => {
      const newCache = { ...userDataCache };
      const usersToFetch = new Set();

      // Collect all other user IDs from conversations
      for (const conv of conversations) {
        const otherId = conv.participantIds?.find(id => id !== userId);
        if (otherId && !newCache[otherId]) {
          usersToFetch.add(otherId);
        }
      }

      // Fetch user data for uncached users
      for (const otherId of usersToFetch) {
        try {
          const res = await api.get(`/api/users/${otherId}`);
          newCache[otherId] = res.data;
        } catch (err) {
          console.error(`Failed to fetch user data for ${otherId}:`, err);
          newCache[otherId] = { fullName: 'Unknown User', email: otherId };
        }
      }

      setUserDataCache(newCache);
    };

    if (conversations.length > 0) {
      fetchUserData();
    }
  }, [conversations, userId, userDataCache]);

  // Connect WebSocket
  useEffect(() => {
    const sock = new SockJS(WS_URL);
    const stomp = over(sock);

    stomp.connect({}, () => {
      console.log("WebSocket connected");
      setStompClient(stomp);
      setIsConnected(true);
    }, (error) => {
      console.error("WebSocket connection error:", error);
      setIsConnected(false);
    });

    return () => {
      if (stomp.connected) {
        stomp.disconnect(() => {
          console.log("WebSocket disconnected");
          setIsConnected(false);
        });
      }
    };
  }, []);

  // Subscribe to selected conversation
  useEffect(() => {
    if (!stompClient?.connected || !selected) return;

    const sub = stompClient.subscribe(
      `/topic/conversation.${selected.id}`,
      msg => {
        try {
          const message = JSON.parse(msg.body);
          console.log("Received message:", message);
          setMessages(prev => [...prev, message]);
        } catch (err) {
          console.error("Failed to parse message:", err);
        }
      }
    );

    return () => sub.unsubscribe();
  }, [stompClient, selected, setMessages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() && !attachment) return;
    if (!stompClient?.connected || !selected) {
      alert("WebSocket not connected. Please wait...");
      return;
    }

    // ✅ CRITICAL: Check if conversation is ACCEPTED before allowing message
    if (selected.status && selected.status !== 'ACCEPTED') {
      alert("❌ Cannot send message in pending invitation. Recipient must accept first.");
      return;
    }

    let attachmentUrl = null;
    let attachmentType = "NONE";

    // Upload file if attachment exists
    if (attachment) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', attachment.file);

        const res = await api.post('/api/uploads/pod-files', formData);
        attachmentUrl = res.data.url;
        attachmentType = res.data.type;
        console.log('✅ File uploaded:', { url: attachmentUrl, type: attachmentType });
      } catch (uploadError) {
        console.error('❌ Upload error:', uploadError.response?.data?.error || uploadError.message);
        alert(`Upload failed: ${uploadError.response?.data?.error || 'Unknown error'}`);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const msg = {
      conversationId: selected.id,
      senderId: userId,
      text: input,
      attachmentUrls: attachmentUrl ? [attachmentUrl] : null,
    };

    try {
      stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(msg));
      setInput("");
      setAttachment(null);
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Please try again.");
    }
  };

  // Get other participant info - now uses cached user data
  const getOtherUserInfo = (conv) => {
    if (!conv || !conv.participantIds) return { name: "Unknown", college: "Unknown", id: null };
    const otherId = conv.participantIds.find(id => id !== userId);

    // Get user data from cache or show loading placeholder
    const userData = userDataCache[otherId];
    if (userData) {
      // Extract domain from email for "college" display
      const domain = userData.email?.split('@')[1] || userData.college || 'Unknown';
      return {
        name: userData.fullName || userData.name || 'Unknown User',
        college: domain,
        id: otherId
      };
    }

    // If not cached yet, show ID as placeholder
    return { name: "Loading...", college: "Unknown", id: otherId };
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    const type = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
    setAttachment({
      file,
      previewUrl,
      type,
      name: file.name
    });
    // Clear file input
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowAttachmentMenu(false);
  };

  // SVG Icons
  const PlusIcon = () => (
    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
  );

  const EmojiIcon = () => (
    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24" className="text-cyan-400"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><circle cx="9" cy="9" r="1.5" fill="currentColor" /><circle cx="15" cy="9" r="1.5" fill="currentColor" /><path d="M8 14c1 1 2.5 1.5 4 1.5s3-.5 4-1.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
  );

  const SendIcon = () => (
    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16151496 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.98721575 L3.03521743,10.4282088 C3.03521743,10.5853061 3.19218622,10.7424035 3.50612381,10.7424035 L16.6915026,11.5278905 C16.6915026,11.5278905 17.1624089,11.5278905 17.1624089,12.0592618 C17.1624089,12.5906331 16.6915026,12.4744748 16.6915026,12.4744748 Z" /></svg>
  );

  // Render
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6 h-[70vh]">
        {/* Conversations Sidebar - Styled like Collab Pod */}
        <Card className="p-4 overflow-y-auto rounded-2xl shadow-md backdrop-blur-xl bg-cyan-950/20 border border-cyan-400/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-cyan-200">Messages</h3>
            {convLoading && <span className="text-xs text-cyan-400/60">Loading...</span>}
          </div>

          <div className="space-y-2">
            {conversations.map((conv) => {
              const other = getOtherUserInfo(conv);
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelected(conv)}
                  className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${selected?.id === conv.id
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'bg-cyan-950/20 text-foreground border border-cyan-400/30 rounded-bl-none hover:bg-cyan-950/40 hover:border-cyan-400/50'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {other.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{other.name}</div>
                      <div className={`text-xs ${selected?.id === conv.id ? 'text-white/70' : 'text-cyan-400/70'}`}>{other.college}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {conversations.length === 0 && !convLoading && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-cyan-400/60 text-sm">No conversations yet</p>
            </div>
          )}
        </Card>

        {/* Chat Area - Styled like Collab Pod */}
        <Card className="md:col-span-2 flex flex-col rounded-2xl shadow-md backdrop-blur-xl bg-cyan-950/20 border border-cyan-400/30">
          {selected ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-cyan-400/20 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {getOtherUserInfo(selected).name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{getOtherUserInfo(selected).name}</h4>
                    <div className="text-sm text-cyan-400/70">{getOtherUserInfo(selected).college} • Active now</div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:bg-red-500/10 hover:border-red-500/30"
                  onClick={() => setShowReportModal(true)}
                >
                  🚨 Report
                </Button>
              </div>

              {/* Messages Area - Styled like Collab Pod */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {msgLoading ? (
                  <div className="text-center text-cyan-400/60 py-8">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-cyan-400/60 py-8">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map((msg) => {
                    const isMe = String(msg.senderId) === String(userId);
                    return (
                      <div
                        key={msg.id}
                        className={`flex w-full mb-3 ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[70%] px-3 py-2 rounded-2xl shadow-md backdrop-blur-xl ${isMe
                          ? "bg-cyan-600 text-white rounded-br-none"
                          : "bg-cyan-950/20 text-foreground border border-cyan-400/30 rounded-bl-none hover:bg-cyan-950/30"}
                          transition-all`}>
                          {!isMe && (
                            <div className="text-xs font-semibold text-cyan-400 mb-1">{getOtherUserInfo(selected).name}</div>
                          )}

                          {/* Image attachment */}
                          {msg.attachmentUrls && msg.attachmentUrls.length > 0 && msg.attachmentUrls[0].match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                            <div className="mb-2">
                              <img
                                src={msg.attachmentUrls[0]}
                                alt="attachment"
                                className="max-w-[250px] max-h-64 rounded-lg object-cover"
                              />
                            </div>
                          )}

                          {/* Message text */}
                          {msg.text && (
                            <p className="text-sm break-words whitespace-pre-line">{msg.text}</p>
                          )}

                          {/* File attachment */}
                          {msg.attachmentUrls && msg.attachmentUrls.length > 0 && !msg.attachmentUrls[0].match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                            <div className="mt-2 flex items-center gap-2 bg-black/20 p-2 rounded">
                              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="flex-shrink-0">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="currentColor" strokeWidth="2" fill="none" />
                                <polyline points="13 2 13 9 20 9" stroke="currentColor" strokeWidth="2" fill="none" />
                              </svg>
                              <a href={msg.attachmentUrls[0]} download className="text-xs underline truncate hover:opacity-80">
                                {msg.attachmentUrls[0].split('/').pop() || "Download File"}
                              </a>
                            </div>
                          )}

                          {/* Timestamp */}
                          <div className={`text-[10px] text-right mt-1 opacity-80`}>
                            {new Date(msg.sentAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input - Styled like Collab Pod */}
              <div className="p-4 border-t border-cyan-400/20 backdrop-blur-xl">
                {/* Attachment Preview */}
                {attachment && (
                  <div className="mb-3 backdrop-blur-xl bg-cyan-400/10 border border-cyan-400/20 rounded-lg p-3 flex items-center gap-2">
                    {attachment.type === 'IMAGE' && (
                      <img
                        src={attachment.previewUrl}
                        alt="preview"
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    )}
                    {attachment.type === 'FILE' && (
                      <div className="flex-shrink-0">
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <polyline points="13 2 13 9 20 9" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate font-medium">{attachment.name}</p>
                      <p className="text-xs text-cyan-400/70">{attachment.type === "IMAGE" ? "Image" : "File"} ready to send</p>
                    </div>
                    <button
                      onClick={() => setAttachment(null)}
                      className="flex-shrink-0 text-cyan-400/70 hover:text-cyan-300 transition-colors"
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                )}

                {/* Attachment Menu */}
                {showAttachmentMenu && (
                  <div className="mb-3 flex gap-3 pb-3 border-b border-cyan-400/20">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-xl bg-cyan-400/15 hover:bg-cyan-400/25 text-sm text-white transition border border-cyan-400/30"
                    >
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /><circle cx="9" cy="9" r="1.5" fill="currentColor" /><path d="M21 15l-5-5-5 5" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
                      Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-xl bg-cyan-400/15 hover:bg-cyan-400/25 text-sm text-white transition border border-cyan-400/30"
                    >
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
                      File
                    </button>
                  </div>
                )}

                {/* Input Area with Emoji Picker */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="flex-shrink-0 text-cyan-400 hover:bg-cyan-400/10"
                    title="Attachments"
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  >
                    <PlusIcon />
                  </Button>

                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="flex-shrink-0 text-cyan-400 hover:bg-cyan-400/10"
                      title="Emoji"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <EmojiIcon />
                    </Button>

                    {/* Emoji Picker Dropdown */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 backdrop-blur-xl bg-cyan-950/30 border border-cyan-400/30 rounded-lg p-2 grid grid-cols-6 gap-1 z-50 w-48 max-h-60 overflow-y-auto shadow-lg shadow-cyan-400/10">
                        {EMOJI_LIST.map((emoji, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setInput(input + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-xl hover:bg-cyan-400/10 p-1 rounded transition cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* INPUT WRAPPER */}
                  <div className="flex-1 backdrop-blur-xl bg-cyan-950/30 border border-cyan-400/30 rounded-lg px-4 py-2 flex items-center min-h-[44px]">
                    <input
                      className="w-full bg-transparent outline-none text-white placeholder-cyan-400/40 border-none focus:ring-0 focus:outline-none"
                      type="text"
                      placeholder="Type your message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                      disabled={!isConnected || uploading}
                      maxLength={1000}
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={sendMessage}
                    disabled={!isConnected || (!input.trim() && !attachment) || uploading}
                    className="flex-shrink-0 bg-cyan-600 hover:bg-cyan-700 text-white"
                    title="Send message"
                  >
                    <SendIcon />
                  </Button>
                </div>

                <div className="text-xs mt-2 text-cyan-400/70">
                  {isConnected ? "🟢 Connected" : "🔴 Connecting..."}
                </div>
              </div>

              {/* Hidden File Inputs */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={e => handleFileSelect(e.target.files?.[0])}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                onChange={e => handleFileSelect(e.target.files?.[0])}
                className="hidden"
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="font-semibold text-lg mb-2 text-white">Select a chat to start messaging</h3>
                <p className="text-cyan-400/60">Choose a conversation from the left to view messages</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={selected ? (conversations.find(c => c.id === selected.id)?.participantIds?.find(id => id !== userId)) : null}
        reportedUserName={selected ? getOtherUserInfo(selected).name : "User"}
        currentUserId={userId}
      />
    </div>
  );
}
