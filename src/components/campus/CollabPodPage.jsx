import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api.js';
import { Button } from '@/components/ui/button.jsx';
import usePodWs from '@/hooks/usePodWs.js';
import CollabPodInput from './CollabPodInput.jsx';
import PodMemberList from '@/components/pods/PodMemberList.jsx';
import TransferOwnershipDialog from '@/components/pods/TransferOwnershipDialog.jsx';
import { leavePod } from '@/lib/api.js';

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
    const [showMembers, setShowMembers] = useState(false);
    const [leavingPod, setLeavingPod] = useState(false);
    const [showTransferDialog, setShowTransferDialog] = useState(false);
    const [isUserMember, setIsUserMember] = useState(false); // ✅ Track if user is actually a member
    const [joinErrorMessage, setJoinErrorMessage] = useState(null); // ✅ Track join errors (cooldown, banned)

    const messagesEndRef = useRef(null);

    // Get current user ID - try both 'id' and '_id' for compatibility
    // CRITICAL: Normalize to string to match backend senderId format
    const userId = String(user?.id || user?._id || '');
    const currentUserName = user?.fullName || "You";

    console.log("🔐 CollabPodPage User ID (normalized):", userId, "Type:", typeof userId, "from user:", user);

    // ArrowLeft Icon Component
    const ArrowLeft = () => (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
    );

    // Fetch pod info and messages from new endpoint
    // Also AUTO-JOIN if user is not already a member
    useEffect(() => {
        let mounted = true;
        const fetchPod = async () => {
            try {
                const res = await api.get(`/pods/${podId}`);
                if (!mounted) return;
                setPod(res.data);

                // ✅ AUTO-JOIN: Check if user is not already a member, then join
                const isAlreadyMember =
                    res.data.ownerId === userId ||
                    (res.data.memberIds && res.data.memberIds.includes(userId)) ||
                    (res.data.adminIds && res.data.adminIds.includes(userId));

                if (isAlreadyMember) {
                    setIsUserMember(true);
                    setJoinErrorMessage(null);
                } else {
                    console.log('🔀 User not a member, auto-joining pod...');
                    try {
                        const joinRes = await api.post(`/pods/${podId}/join-enhanced`, { userId });
                        console.log('✅ Auto-joined pod successfully');
                        // Use the response pod data which already has the user added
                        if (mounted && joinRes.data) {
                            setPod(joinRes.data);
                            setIsUserMember(true);
                            setJoinErrorMessage(null);
                            console.log('🔄 Updated pod with join response:', {
                                memberIds: joinRes.data.memberIds,
                                memberNames: joinRes.data.memberNames
                            });
                        }
                    } catch (joinErr) {
                        if (joinErr.response?.status === 429) {
                            // Cooldown error - user must wait
                            const minutesRemaining = joinErr.response?.data?.minutesRemaining || 15;
                            const msg = `⏱️ You can rejoin this pod in ${minutesRemaining} minute(s). Please try again later.`;
                            setJoinErrorMessage(msg);
                            setError(msg);
                            setIsUserMember(false);
                            console.error('⏱️ Cooldown in effect:', joinErr.response?.data?.error);
                        } else if (joinErr.response?.status === 403) {
                            // Banned from pod
                            const msg = '🚫 You are banned from this pod and cannot join.';
                            setJoinErrorMessage(msg);
                            setError(msg);
                            setIsUserMember(false);
                            console.error('⛔ User is banned:', joinErr.response?.data?.error);
                        } else {
                            console.error('⚠️ Auto-join failed:', joinErr.response?.data?.error || joinErr.message);
                            setIsUserMember(false);
                        }
                        // If join fails, still fetch latest pod data to show current state
                        try {
                            const refreshRes = await api.get(`/pods/${podId}`);
                            if (mounted) {
                                setPod(refreshRes.data);
                            }
                        } catch (refreshErr) {
                            console.error('⚠️ Failed to refresh pod after join error:', refreshErr.message);
                        }
                    }
                }

                // Fetch messages from separate endpoint
                const messagesRes = await api.get(`/pods/${podId}/messages`);
                // Normalize message fields: convert backend format to UI format
                const normalizedMessages = (messagesRes.data || []).map(msg => ({
                    ...msg,
                    content: msg.content || msg.text, // Use content if available, fall back to text
                    timestamp: msg.timestamp || msg.sentAt, // Use timestamp if available, fall back to sentAt
                    id: msg.id || msg._id, // Ensure id field exists
                    senderId: String(msg.senderId || msg.authorId || ''), // CRITICAL: Normalize senderId to string
                    senderName: msg.senderName || msg.authorName || 'Unknown' // Normalize senderName
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
    }, [podId, userId]);

    // WebSocket for live chat
    const handleIncoming = useCallback((payload) => {
        const saved = payload.comment || payload.message || payload;

        // Normalize incoming message to ensure consistent field names
        const normalizedMsg = {
            ...saved,
            id: saved.id || saved._id,
            content: saved.content || saved.text,
            timestamp: saved.timestamp || saved.sentAt,
            senderId: String(saved.senderId || saved.authorId || ''), // CRITICAL: Ensure string
            senderName: saved.senderName || saved.authorName || 'Unknown'
        };

        // Deduplicate: only add if message ID doesn't already exist
        // This prevents duplicate messages when optimistic update + WebSocket echo occur
        setMessages(prev => {
            if (normalizedMsg.id && prev.some(m => m.id === normalizedMsg.id)) {
                // Message already exists, just update it if needed
                return prev.map(m => m.id === normalizedMsg.id ? { ...m, ...normalizedMsg } : m);
            }
            // New message, add it
            return [...prev, normalizedMsg];
        });
    }, []);
    const podWs = usePodWs({ podId, onMessage: handleIncoming });

    // Auto-scroll to bottom on new message
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // ✅ PERIODIC REFRESH: Fetch pod data every 3 seconds to sync member list updates
    useEffect(() => {
        let mounted = true;
        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/pods/${podId}`);
                if (mounted) {
                    // Only update if member counts changed (avoid unnecessary re-renders)
                    const oldMemberCount = pod?.memberIds?.length || 0;
                    const newMemberCount = res.data?.memberIds?.length || 0;
                    const oldAdminCount = pod?.adminIds?.length || 0;
                    const newAdminCount = res.data?.adminIds?.length || 0;

                    if (oldMemberCount !== newMemberCount || oldAdminCount !== newAdminCount) {
                        console.log('🔄 Member list updated via periodic refresh:', {
                            oldMembers: oldMemberCount,
                            newMembers: newMemberCount,
                            oldAdmins: oldAdminCount,
                            newAdmins: newAdminCount
                        });
                        setPod(res.data);
                    }
                }
            } catch (err) {
                // Silently fail for periodic refresh - don't spam console
            }
        }, 3000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [podId]);

    if (loading) return <div className="p-4">Loading pod...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (!pod) return <div className="p-4">Pod not found</div>;

    // Members display with proper names
    // Try to get member names from pod.memberNames, pod.members, or use memberIds as fallback
    const memberNames = (pod.memberNames || pod.members || []).length > 0
        ? (pod.memberNames || pod.members).map(m => m === currentUserName ? "You" : m).join(", ")
        : (pod.memberIds?.length ? `${pod.memberIds.length} member${pod.memberIds.length !== 1 ? 's' : ''}` : "");

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
                console.log('📤 Starting file upload:', {
                    fileName: inputAttachment.file.name,
                    fileSize: inputAttachment.file.size,
                    fileType: inputAttachment.file.type
                });

                const formData = new FormData();
                formData.append('file', inputAttachment.file);

                // Debug: inspect FormData 'file' entry
                const fdFile = formData.get('file');
                console.log('📤 FormData prepared, sending to /api/uploads/pod-files');
                console.log('🔍 formData.get("file") =>', fdFile);
                console.log('🔍 file instanceof File =>', fdFile instanceof File);
                if (fdFile) {
                    console.log('🔍 file props:', { name: fdFile.name, size: fdFile.size, type: fdFile.type });
                }

                try {
                    const res = await api.post('/api/uploads/pod-files', formData);

                    console.log('✅ Upload successful:', {
                        url: res.data.url,
                        type: res.data.type,
                        fileName: res.data.fileName
                    });

                    attachmentUrl = res.data.url;
                    attachmentType = res.data.type;
                } catch (uploadError) {
                    console.error('❌ Upload error details:', {
                        message: uploadError.message,
                        status: uploadError.response?.status,
                        statusText: uploadError.response?.statusText,
                        error: uploadError.response?.data?.error,
                        errorType: uploadError.response?.data?.errorType,
                        uploadDir: uploadError.response?.data?.uploadDir,
                        path: uploadError.response?.data?.path
                    });

                    throw uploadError;
                }
            }

            // Create message object with a temporary ID for deduplication
            const tempId = `temp-${Date.now()}-${Math.random()}`;
            const messagePayload = {
                id: tempId,
                content: inputText || (inputAttachment ? `Shared ${attachmentType === 'IMAGE' ? 'an image' : 'a file'}` : ''),
                parentId: null,
                authorName: currentUserName,
                senderId: String(userId), // CRITICAL: Ensure senderId is a string
                senderName: currentUserName,
                replyToId: replyingTo?.id || null,
                replyToName: replyingTo?.senderName || null,
                replyToContent: replyingTo?.content || null,
                attachmentUrl: attachmentUrl,
                attachmentType: attachmentType,
                timestamp: new Date().toISOString()
            };

            // IMPORTANT: Add message to local state immediately so user sees it
            // Use temporary ID that will be replaced by real ID when WebSocket returns
            setMessages(prev => [...prev, messagePayload]);

            // Send WebSocket message
            podWs.send(messagePayload);

            // Reset state
            setAttachment(null);
            setReplyingTo(null);
        } catch (err) {
            console.error('❌ Send failed - Error details:', {
                errorMessage: err.message,
                errorStatus: err.response?.status,
                errorData: err.response?.data,
                errorType: err.response?.data?.errorType,
                uploadDir: err.response?.data?.uploadDir,
                path: err.response?.data?.path,
                fullError: err
            });

            // Show user-friendly error message
            if (err.response?.data?.error) {
                alert(`Upload failed: ${err.response.data.error}`);
            } else if (err.message === 'Network Error') {
                alert('Network error: Could not connect to server. Ensure backend is running on port 8080.');
            } else {
                alert(`Error sending message: ${err.message}`);
            }
        } finally {
            setUploading(false);
        }
    };

    // ✅ STAGE 3: Handle leaving the pod
    const handleLeavePod = async () => {
        // Check if user is the owner
        const isOwner = pod?.ownerId === userId;

        if (isOwner) {
            // Owner must transfer ownership first
            setShowTransferDialog(true);
            return;
        }

        // Non-owner can leave normally
        if (!window.confirm('Are you sure you want to leave this pod? You can rejoin after 15 minutes.')) {
            return;
        }

        setLeavingPod(true);
        try {
            await leavePod(podId, userId);

            // Navigate to Global Hub collab room tab (or back if available)
            if (onBack) {
                onBack();
            } else {
                // Navigate to Global Hub with collab room view
                navigate('/', { state: { view: 'inter', viewContext: { initialView: 'collab' } } });
            }
        } catch (err) {
            console.error('Failed to leave pod:', err);
            alert('Failed to leave pod. Please try again.');
        } finally {
            setLeavingPod(false);
        }
    };

    // Handle successful ownership transfer
    const handleTransferSuccess = async () => {
        // Refresh pod data
        try {
            const res = await api.get(`/pods/${podId}`);
            setPod(res.data);
            alert('Ownership transferred successfully!');
        } catch (err) {
            console.error('Failed to refresh pod:', err);
        }
    };

    // Message bubble component
    function MessageBubble({ msg }) {
        const isMe = String(msg.senderId) === String(userId);
        const isSystemText = msg.content === "Shared an image";
        const hasAttachment = !!msg.attachmentUrl;

        // ✅ STAGE 3: Check if message is a system message
        const isSystemMessage = msg.messageType === 'SYSTEM';

        // Debug: Log message alignment - ONLY for other users' messages
        if (msg.senderName !== currentUserName) {
            console.log(`📨 Message from ${msg.senderName}:`, {
                senderId: msg.senderId,
                senderIdType: typeof msg.senderId,
                currentUserId: userId,
                userIdType: typeof userId,
                comparison: `"${String(msg.senderId)}" === "${String(userId)}"`,
                isMe: isMe,
                match: String(msg.senderId) === String(userId)
            });
        }

        // ✅ STAGE 3: Render system messages as centered gray pills
        if (isSystemMessage) {
            return (
                <div className="flex w-full mb-4 justify-center">
                    <div className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-full text-sm text-center max-w-md">
                        {msg.content}
                    </div>
                </div>
            );
        }

        // Regular chat message rendering
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
                                {msg.attachmentUrl ? (
                                    <img src={getImageUrl(msg.attachmentUrl)} alt="attachment" className="max-w-[250px] max-h-64 rounded-lg object-cover" />
                                ) : (
                                    <div className="text-xs text-red-400">Image URL missing</div>
                                )}
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
                                <a href={msg.attachmentUrl} download className="text-xs underline truncate">{msg.fileName || msg.attachmentUrl.split('/').pop() || "Download File"}</a>
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
            {/* Header - Only show breadcrumb context, main navigation is handled by parent */}
            <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-slate-900/95 border-b border-slate-800 flex-shrink-0 justify-between">
                {/* Left section: Back button and pod info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button variant="ghost" size="icon" className="mr-2" onClick={() => {
                        if (onBack) {
                            onBack();
                        } else {
                            // Dynamic navigation based on pod scope
                            if (pod?.scope === 'GLOBAL') {
                                navigate('/campus', { state: { view: 'inter', viewContext: { initialView: 'rooms' }, from: 'pod' } });
                            } else {
                                navigate('/campus/pods');
                            }
                        }
                    }}>
                        <ArrowLeft />
                    </Button>
                    <div className="flex flex-col flex-1 min-w-0">
                        {/* Show context badge */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${pod?.scope === 'GLOBAL'
                                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                                : 'bg-blue-500/30 text-blue-300 border border-blue-500/50'}`}>
                                {pod?.scope === 'GLOBAL' ? '🌍 Global Room' : '🏛️ Campus Pod'}
                            </span>
                        </div>
                        <span className="font-bold text-lg text-white leading-tight truncate">{pod.title}</span>
                        <span className="text-xs text-slate-400 font-medium">{memberNames}</span>
                    </div>
                </div>

                {/* Right section: Members and Leave buttons */}
                <div className="flex items-center gap-2">
                    {/* Members button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMembers(!showMembers)}
                        className="text-xs gap-1"
                        title="View members"
                    >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Members
                    </Button>

                    {/* Leave button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLeavePod}
                        disabled={leavingPod}
                        className="text-xs text-red-400 hover:text-red-300"
                        title="Leave this pod"
                    >
                        {leavingPod ? 'Leaving...' : 'Leave'}
                    </Button>
                </div>
            </div>

            {/* ✅ STAGE 3: Members Drawer */}
            {showMembers && (
                <div className="absolute right-0 top-[60px] w-80 bg-slate-900 border-l border-slate-800 h-full overflow-y-auto z-30 shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 sticky top-0 bg-slate-900">
                        <h3 className="font-semibold text-white">Pod Members</h3>
                        <button
                            onClick={() => setShowMembers(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" />
                                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </button>
                    </div>
                    <PodMemberList
                        pod={pod}
                        currentUserId={userId}
                        onPodUpdate={() => {
                            // Refresh pod data
                            const fetchPod = async () => {
                                try {
                                    const res = await api.get(`/pods/${podId}`);
                                    setPod(res.data);
                                } catch (err) {
                                    console.error('Failed to refresh pod:', err);
                                }
                            };
                            fetchPod();
                        }}
                    />
                </div>
            )}

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



                {/* Input Component - Separate to prevent flickering */}
                <CollabPodInput
                    onSendMessage={handleSendMessage}
                    uploading={uploading}
                    attachment={attachment}
                    onAttachmentChange={setAttachment}
                    onAttachmentRemove={() => setAttachment(null)}
                />
            </div>

            {/* Transfer Ownership Dialog */}
            <TransferOwnershipDialog
                isOpen={showTransferDialog}
                podId={podId}
                currentOwnerId={userId}
                members={pod?.memberIds?.map(id => ({ id, fullName: id, name: id, email: '' })) || []}
                admins={pod?.adminIds?.map(id => ({ id, fullName: id, name: id, email: '' })) || []}
                onClose={() => setShowTransferDialog(false)}
                onSuccess={handleTransferSuccess}
            />
        </div>
    );
}
