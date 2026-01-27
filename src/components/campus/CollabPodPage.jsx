import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api.js';
import { Button } from '@/components/ui/button.jsx';
import usePodWs from '@/hooks/usePodWs.js';
import CollabPodInput from './CollabPodInput.jsx';

export default function CollabPodPage({ user, podId: propPodId, onBack }) {
    const routeParams = useParams();
    const podId = propPodId || routeParams.podId;
    const navigate = useNavigate();
    const [pod, setPod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [attachment, setAttachment] = useState(null);

    const messagesEndRef = useRef(null);

    const userId = user?.id;
    const currentUserName = user?.fullName || "You";

    // ArrowLeft Icon Component
    const ArrowLeft = () => (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
    );

    // Fetch pod info and messages from new endpoint
    useEffect(() => {
        let mounted = true;
        const fetchPod = async () => {
            try {
                const res = await api.get(`/pods/${podId}`);
                if (!mounted) return;
                setPod(res.data);

                // Fetch messages from separate endpoint
                const messagesRes = await api.get(`/pods/${podId}/messages`);
                // Normalize message fields: convert backend format to UI format
                const normalizedMessages = (messagesRes.data || []).map(msg => ({
                    ...msg,
                    content: msg.content || msg.text, // Use content if available, fall back to text
                    timestamp: msg.timestamp || msg.sentAt, // Use timestamp if available, fall back to sentAt
                    id: msg.id || msg._id // Ensure id field exists
                }));
                setMessages(normalizedMessages);
            } catch (err) {
                console.error("Failed to load pod", err);
                setError("Could not load pod");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchPod();
        return () => { mounted = false; };
    }, [podId]);

    // WebSocket for live chat
    const handleIncoming = useCallback((payload) => {
        const saved = payload.comment || payload.message || payload;
        setMessages(prev => [...prev, saved]);
    }, []);
    const podWs = usePodWs({ podId, onMessage: handleIncoming });

    // Auto-scroll to bottom on new message
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    if (loading) return <div className="p-4">Loading pod...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (!pod) return <div className="p-4">Pod not found</div>;

    // Members display ("Alice, Bob, You")
    const memberNames = (pod.members || pod.memberNames || []).length
        ? (pod.members || pod.memberNames).map(m => m === currentUserName ? "You" : m).join(", ")
        : (pod.memberIds?.length ? `${pod.memberIds.length} members` : "");

    // Helper function to fix image URLs
    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `http://localhost:8080${url}`;
    };

    // Handle send message from input component
    const handleSendMessage = async (inputText, inputAttachment) => {
        if (!inputText.trim() && !inputAttachment) return;

        let attachmentUrl = null;
        let attachmentType = "NONE";

        setUploading(true);
        try {
            // Upload file if attachment exists
            if (inputAttachment) {
                const formData = new FormData();
                formData.append('file', inputAttachment.file);
                const res = await api.post('/uploads/pod-files', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                attachmentUrl = res.data.url;
                attachmentType = res.data.type;
            }

            // Create message object
            const messagePayload = {
                content: inputText || (inputAttachment ? `Shared ${attachmentType === 'IMAGE' ? 'an image' : 'a file'}` : ''),
                parentId: null,
                authorName: currentUserName,
                senderId: userId,
                senderName: currentUserName,
                replyToId: replyingTo?.id || null,
                replyToName: replyingTo?.senderName || null,
                replyToContent: replyingTo?.content || null,
                attachmentUrl: attachmentUrl,
                attachmentType: attachmentType,
                timestamp: new Date().toISOString()
            };

            // IMPORTANT: Add message to local state immediately so user sees it
            setMessages(prev => [...prev, messagePayload]);

            // Send WebSocket message
            podWs.send(messagePayload);

            // Reset state
            setAttachment(null);
            setReplyingTo(null);
        } catch (err) {
            console.error('Send failed:', err);
        } finally {
            setUploading(false);
        }
    };

    // Message bubble component
    function MessageBubble({ msg }) {
        const isMe = msg.senderId === userId;
        const isSystemText = msg.content === "Shared an image";
        const hasAttachment = !!msg.attachmentUrl;

        return (
            <div className={`flex w-full mb-3 ${isMe ? "justify-end" : "justify-start"} group`}>
                <div className="flex items-end gap-2">
                    <div className={`min-w-[60px] max-w-[75%] px-3 py-2 rounded-2xl shadow-md ${isMe
                        ? "bg-cyan-600 text-white rounded-br-none"
                        : "bg-slate-800 text-slate-200 rounded-bl-none"}
                        `}>
                        {/* Sender name for others' messages */}
                        {!isMe && (
                            <div className="text-xs font-semibold text-cyan-400 mb-1">{msg.senderName}</div>
                        )}

                        {/* Reply block - WhatsApp style */}
                        {msg.replyToId && (
                            <div className="bg-black/20 border-l-4 border-cyan-300 p-1 mb-1 rounded text-xs opacity-80">
                                <span className="font-bold block text-cyan-300">{msg.replyToName}</span>
                                <span className="line-clamp-1">{msg.replyToContent}</span>
                            </div>
                        )}

                        {/* Image attachment - Show first */}
                        {hasAttachment && msg.attachmentType === "IMAGE" && (
                            <div className={`${isSystemText ? "mb-0" : "mb-2"}`}>
                                <img src={getImageUrl(msg.attachmentUrl)} alt="attachment" className="max-w-[250px] max-h-64 rounded-lg object-cover" />
                            </div>
                        )}

                        {/* Message content - Hide if it's system text with attachment */}
                        {!isSystemText || !hasAttachment ? (
                            <div className="break-words whitespace-pre-line text-sm">{msg.content}</div>
                        ) : null}

                        {/* File attachment */}
                        {hasAttachment && msg.attachmentType === "FILE" && (
                            <div className="mt-2 flex items-center gap-2 bg-black/20 p-2 rounded">
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="flex-shrink-0">
                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="currentColor" strokeWidth="2" fill="none" />
                                    <polyline points="13 2 13 9 20 9" stroke="currentColor" strokeWidth="2" fill="none" />
                                </svg>
                                <a href={msg.attachmentUrl} download className="text-xs underline truncate">{msg.attachmentUrl.split('/').pop()}</a>
                            </div>
                        )}

                        {/* Timestamp */}
                        <div className="text-[10px] text-right mt-1 opacity-80">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </div>
                    </div>

                    {/* Reply button - Always rendered, opacity hidden to prevent jitter */}
                    <button
                        onClick={() => setReplyingTo(msg)}
                        className="flex-shrink-0 p-1 hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Reply"
                    >
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-cyan-400" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }



    return (
        <div className="fixed inset-0 top-[64px] z-40 bg-slate-950 flex flex-col">
            {/* fixed inset-0 top-[64px] = Forces full screen below navbar */}
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-slate-900/95 border-b border-slate-800 flex-shrink-0">
                <Button variant="ghost" size="icon" className="mr-2" onClick={() => {
                    if (onBack) {
                        onBack();
                    } else {
                        navigate('/collab-pods');
                    }
                }}>
                    <ArrowLeft />
                </Button>
                <div className="flex flex-col">
                    <span className="font-bold text-lg text-white leading-tight">{pod.title}</span>
                    <span className="text-xs text-slate-400 font-medium">{memberNames}</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4 bg-slate-900" style={{ backgroundImage: 'linear-gradient(135deg,rgba(0,255,255,0.03) 25%,transparent 25%,transparent 50%,rgba(0,255,255,0.03) 50%,rgba(0,255,255,0.03) 75%,transparent 75%,transparent)', backgroundSize: '40px 40px' }}>
                {messages.length === 0 && (
                    <div className="text-center text-slate-500 mt-10">No messages yet. Start the conversation!</div>
                )}
                {messages.map((msg, i) => (
                    <MessageBubble key={msg.id || i} msg={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 bg-slate-900/95 border-t border-slate-800">
                {/* Reply Preview Bar */}
                {replyingTo && (
                    <div className="px-3 py-2 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between text-sm">
                        <div className="flex-1">
                            <div className="text-cyan-400 font-semibold text-xs">Replying to {replyingTo.senderName}</div>
                            <div className="text-slate-300 text-xs truncate">{replyingTo.content}</div>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-white ml-2 flex-shrink-0">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                )}

                {/* Attachment Preview Card */}
                {attachment && (
                    <div className="px-3 py-2 bg-slate-800/40 border-b border-slate-700 flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                            {attachment.type === "IMAGE" ? (
                                <img src={attachment.previewUrl} alt="preview" className="w-16 h-16 rounded object-cover" />
                            ) : (
                                <div className="w-16 h-16 bg-slate-700 rounded flex items-center justify-center">
                                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                        <polyline points="13 2 13 9 20 9" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate font-medium">{attachment.name}</p>
                            <p className="text-xs text-slate-400">{attachment.type === "IMAGE" ? "Image" : "File"} ready to send</p>
                        </div>
                        <button onClick={() => setAttachment(null)} className="flex-shrink-0 text-slate-400 hover:text-white">
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                )}

                {/* Input Component - Separate to prevent flickering */}
                <CollabPodInput
                    onSendMessage={handleSendMessage}
                    uploading={uploading}
                    attachment={attachment}
                    onAttachmentChange={setAttachment}
                    onAttachmentRemove={() => setAttachment(null)}
                />
            </div>
        </div>
    );
}
