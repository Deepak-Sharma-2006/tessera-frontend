import { useState, useEffect, useRef } from 'react';
import { fetchMyInbox, markInboxAsRead, deleteInboxItem, deleteInboxItemsBulk, clearInboxByType, clearAllInbox } from '@/lib/api.js';
import { Button } from '@/components/ui/button.jsx';
import LoadingSpinner from '@/components/animations/LoadingSpinner.jsx';
import api from '@/lib/api.js';
import SockJS from 'sockjs-client';
import { over } from 'stompjs';

/**
 * ✅ INBOX FEATURE: Main inbox page with filtering, selection, bulk delete, and PENDING INVITES
 * 
 * Features:
 * - Incoming Requests section at the top (Pending collaboration invites)
 * - Filter tabs: All / Rejections / Bans
 * - Selection mode with checkboxes
 * - Floating action bar for bulk delete
 * - Clear options modal
 * - Type-specific styling (POD_BAN red, APPLICATION_REJECTION yellow)
 * 
 * Stage 4 & 5 Frontend Implementation + Global Hub Integration
 */
export default function InboxPage({ user, onUnreadCountChange }) {
    const [inboxItems, setInboxItems] = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [markingAsRead, setMarkingAsRead] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [respondingTo, setRespondingTo] = useState(null);
    const [inviteInitiators, setInviteInitiators] = useState({}); // Map of inviteId -> initiatorName

    // ✅ NEW: WebSocket state for real-time notifications
    const stompClientRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [latestNotification, setLatestNotification] = useState(null);

    // Filter state
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Selection mode state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());

    // Clear options modal state
    const [showClearModal, setShowClearModal] = useState(false);
    const [isClearing, setIsClearing] = useState(null);

    // Fetch inbox items and pending invites on mount
    useEffect(() => {
        loadInbox();
        loadPendingInvites();
        setupWebSocketNotifications(); // ✅ NEW
        
        // ✅ CRITICAL: Reset unread count when viewing Inbox
        console.log('📬 InboxPage mounted - resetting unread count to 0');
        if (onUnreadCountChange) {
            onUnreadCountChange(0);
        }
    }, [onUnreadCountChange]);

    // ✅ NEW: Cleanup WebSocket on unmount
    useEffect(() => {
        return () => {
            if (stompClientRef.current?.connected) {
                stompClientRef.current.disconnect();
            }
        };
    }, []);

    const loadInbox = async () => {
        setLoading(true);
        setError(null);

        try {
            const items = await fetchMyInbox(user.id);
            setInboxItems(items || []);
            console.log('✅ Loaded inbox items:', items);
        } catch (err) {
            console.error('❌ Error loading inbox:', err);
            setError('Failed to load inbox');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Load pending collaboration invites and fetch initiator names
     */
    const loadPendingInvites = async () => {
        try {
            const res = await api.get(`/api/messages/invites/pending/${user.id}`);
            const invites = res.data || [];
            setPendingInvites(invites);
            console.log('✅ Loaded pending invites:', invites);
            
            // Fetch initiator names for each invite
            const initiatorMap = {};
            for (const invite of invites) {
                if (invite.initiatorId) {
                    try {
                        const userRes = await api.get(`/api/users/${invite.initiatorId}`);
                        initiatorMap[invite.id] = userRes.data?.fullName || invite.initiatorId;
                    } catch (err) {
                        console.error('Error fetching initiator data:', err);
                        initiatorMap[invite.id] = invite.initiatorId;
                    }
                }
            }
            setInviteInitiators(initiatorMap);
        } catch (err) {
            console.error('❌ Error loading pending invites:', err);
            // Don't fail the whole page if invites fail
            setPendingInvites([]);
        }
    };

    /**
     * ✅ NEW: Setup WebSocket subscription for real-time notifications
     * 
     * Listens to /user/{userId}/queue/notifications for:
     * - Event notifications
     * - Pod updates
     * - Other real-time messages
     */
    const setupWebSocketNotifications = () => {
        try {
            const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
            const WS_URL = `${BASE_URL}/ws-studcollab`;

            const sock = new SockJS(WS_URL);
            const stomp = over(sock);

            stomp.connect({}, () => {
                console.log('✅ WebSocket connected for notifications');
                setIsConnected(true);
                stompClientRef.current = stomp;

                // Subscribe to user-specific notification queue
                const notificationTopic = `/user/${user.id}/queue/notifications`;
                console.log('📡 Subscribing to:', notificationTopic);

                stomp.subscribe(notificationTopic, (msg) => {
                    try {
                        const notification = JSON.parse(msg.body);
                        console.log('📨 New notification received:', notification);

                        // Handle event notification
                        if (notification.notificationType === 'NEW_EVENT') {
                            handleNewEventNotification(notification);
                        }

                        // Toast notification
                        showNotificationToast(notification);

                    } catch (e) {
                        console.error('Failed to parse notification message:', e);
                    }
                });
            }, (error) => {
                console.error('❌ WebSocket connection failed:', error);
                setIsConnected(false);
            });
        } catch (err) {
            console.error('❌ WebSocket setup error:', err);
        }
    };

    /**
     * ✅ NEW: Handle event notification
     * Reload inbox to show new event notification
     */
    const handleNewEventNotification = (notification) => {
        // Show the red notification banner
        setLatestNotification(notification);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => setLatestNotification(null), 5000);
        
        // Increment unread count in Navigation - pass a function to setUnreadCount
        if (onUnreadCountChange) {
            onUnreadCountChange((prev) => (typeof prev === 'number' ? prev + 1 : 1));
        }
        
        // Reload inbox to fetch the new notification from backend
        loadInbox();
        
        // Show a visual toast
        console.log('🎉 New event notification:', notification.eventTitle);
    };

    /**
     * ✅ NEW: Show a toast notification
     * You can replace this with your actual toast library (toast, sonner, etc)
     */
    const showNotificationToast = (notification) => {
        // This is a simple console notification
        // Replace with your actual toast library
        console.log(`🔔 ${notification.message}`);
        
        // Optional: Use browser notification API
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Tessera', {
                body: notification.message,
                icon: notification.icon || '📬',
                tag: notification.eventId || 'notification'
            });
        }
    };

    /**
     * Respond to a pending collaboration invite
     */
    const handleRespondToInvite = async (conversationId, accept) => {
        setRespondingTo(conversationId);
        try {
            const response = await api.post(`/api/messages/invite/${conversationId}/respond`, { accept });
            console.log(`✅ Invite ${accept ? 'accepted' : 'declined'}:`, response.data);
            
            // Remove from pending invites list
            setPendingInvites(invites => invites.filter(inv => inv.id !== conversationId));
            
            // If accepted, show success message
            if (accept) {
                alert('✨ Collaboration accepted! You can now chat in Messages.');
            }
        } catch (err) {
            console.error('❌ Error responding to invite:', err);
            alert(`Failed to respond to invite: ${err.response?.data?.error || 'Unknown error'}`);
        } finally {
            setRespondingTo(null);
        }
    };

    /**
     * Get the initiator's name for a pending invite
     */
    const getOtherUser = (conversation) => {
        return inviteInitiators[conversation.id] || conversation.initiatorId || 'Unknown User';
    };

    // Filter items based on selected filter
    const getFilteredItems = () => {
        switch (selectedFilter) {
            case 'rejections':
                return inboxItems.filter(item => item.type === 'APPLICATION_REJECTION');
            case 'bans':
                return inboxItems.filter(item => item.type === 'POD_BAN');
            default: // 'all'
                return inboxItems;
        }
    };

    const filteredItems = getFilteredItems();

    const handleMarkAsRead = async (itemId) => {
        setMarkingAsRead(itemId);

        try {
            await markInboxAsRead(itemId);
            // Update local state
            setInboxItems(items =>
                items.map(item =>
                    item.id === itemId ? { ...item, read: true } : item
                )
            );
        } catch (err) {
            console.error('❌ Error marking as read:', err);
        } finally {
            setMarkingAsRead(null);
        }
    };

    const handleDelete = async (itemId) => {
        setDeleting(itemId);

        try {
            await deleteInboxItem(itemId);
            // Remove from local state
            setInboxItems(items => items.filter(item => item.id !== itemId));
            // Remove from selection if selected
            const newSelection = new Set(selectedItems);
            newSelection.delete(itemId);
            setSelectedItems(newSelection);
        } catch (err) {
            console.error('❌ Error deleting item:', err);
        } finally {
            setDeleting(null);
        }
    };

    // Toggle item selection
    const toggleItemSelection = (itemId) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(itemId)) {
            newSelection.delete(itemId);
        } else {
            newSelection.add(itemId);
        }
        setSelectedItems(newSelection);
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedItems.size === 0) return;

        setDeleting('bulk');
        try {
            await deleteInboxItemsBulk(Array.from(selectedItems));
            // Remove deleted items from local state
            setInboxItems(items =>
                items.filter(item => !selectedItems.has(item.id))
            );
            setSelectedItems(new Set());
            setIsSelectionMode(false);
        } catch (err) {
            console.error('❌ Error bulk deleting items:', err);
        } finally {
            setDeleting(null);
        }
    };

    // Handle clear by type
    const handleClearByType = async (type) => {
        setIsClearing(type);
        try {
            await clearInboxByType(user.id, type);
            // Reload inbox after clearing
            await loadInbox();
            setSelectedItems(new Set());
            setShowClearModal(false);
        } catch (err) {
            console.error('❌ Error clearing inbox by type:', err);
        } finally {
            setIsClearing(null);
        }
    };

    // Handle clear all
    const handleClearAll = async () => {
        setIsClearing('all');
        try {
            await clearAllInbox(user.id);
            // Reload inbox after clearing
            await loadInbox();
            setSelectedItems(new Set());
            setShowClearModal(false);
        } catch (err) {
            console.error('❌ Error clearing all inbox:', err);
        } finally {
            setIsClearing(null);
        }
    };

    // Get styling based on notification type and severity
    const getNotificationStyles = (type, severity) => {
        const baseClasses = 'p-4 rounded-lg border transition-all duration-200 hover:shadow-lg';

        if (type === 'POD_BAN') {
            return `${baseClasses} border-red-500/30 bg-red-500/10 hover:bg-red-500/15`;
        } else if (type === 'APPLICATION_REJECTION') {
            return `${baseClasses} border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/15`;
        }

        return `${baseClasses} border-slate-500/20 bg-slate-500/5 hover:bg-slate-500/10`;
    };

    // Get icon for notification type
    const getNotificationIcon = (type) => {
        if (type === 'POD_BAN') {
            return '🚫';
        } else if (type === 'APPLICATION_REJECTION') {
            return '❌';
        }
        return 'ℹ️';
    };

    // Get title color based on type
    const getTitleColor = (type) => {
        if (type === 'POD_BAN') {
            return 'text-red-400';
        } else if (type === 'APPLICATION_REJECTION') {
            return 'text-yellow-400';
        }
        return 'text-slate-300';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* ✅ RED NOTIFICATION BANNER */}
            {latestNotification && (
                <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500 rounded-lg animate-pulse">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🔴</span>
                            <div>
                                <p className="text-red-300 font-bold text-sm">📬 NEW NOTIFICATION</p>
                                <p className="text-red-200 text-xs mt-1">{latestNotification.message || `New Event: ${latestNotification.eventTitle}`}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setLatestNotification(null)}
                            className="text-red-400 hover:text-red-300 text-xl"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
            {/* Header with Clear button */}
            <div className="mb-8">
                <div className="flex items-center justify-end">
                    <div className="relative">
                        <button
                            onClick={() => setShowClearModal(!showClearModal)}
                            className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border flex items-center justify-center gap-2 bg-slate-900/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white hover:bg-slate-800/50"
                        >
                            <span>🗑️</span>
                            <span>Clear</span>
                            <span className={`transition-transform duration-300 ${showClearModal ? 'rotate-180' : ''}`}>▼</span>
                        </button>

                        {/* Clear Options Modal - Themed Dropdown */}
                        {showClearModal && (
                            <div className="absolute right-0 mt-3 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden">
                                <div className="p-4 space-y-2">
                                    <p className="text-xs text-slate-400 font-semibold mb-4 px-2">
                                        🧹 CLEAR OPTIONS
                                    </p>

                                    <button
                                        onClick={() => handleClearByType('APPLICATION_REJECTION')}
                                        disabled={isClearing !== null}
                                        className="w-full justify-start text-left bg-gradient-to-r from-amber-600/20 to-yellow-600/20 hover:from-amber-600/30 hover:to-yellow-600/30 text-amber-300 text-sm py-3 px-4 rounded-xl transition-all duration-200 border border-amber-500/20 hover:border-amber-500/40 disabled:opacity-50 font-medium"
                                    >
                                        {isClearing === 'APPLICATION_REJECTION' ? '⏳' : '✓'} Clear All Rejections
                                    </button>

                                    <button
                                        onClick={() => handleClearByType('POD_BAN')}
                                        disabled={isClearing !== null}
                                        className="w-full justify-start text-left bg-gradient-to-r from-red-600/20 to-rose-600/20 hover:from-red-600/30 hover:to-rose-600/30 text-red-300 text-sm py-3 px-4 rounded-xl transition-all duration-200 border border-red-500/20 hover:border-red-500/40 disabled:opacity-50 font-medium"
                                    >
                                        {isClearing === 'POD_BAN' ? '⏳' : '✓'} Clear All Bans
                                    </button>

                                    <div className="border-t border-slate-700/50 my-2"></div>

                                    <button
                                        onClick={handleClearAll}
                                        disabled={isClearing !== null}
                                        className="w-full justify-start text-left bg-gradient-to-r from-red-700/20 to-red-600/20 hover:from-red-700/40 hover:to-red-600/40 text-red-400 text-sm py-3 px-4 rounded-xl transition-all duration-200 border border-red-600/20 hover:border-red-600/40 disabled:opacity-50 font-semibold"
                                    >
                                        {isClearing === 'all' ? '⏳' : '⚠️'} Delete All Messages
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ========== INCOMING REQUESTS SECTION ========== */}
            {pendingInvites.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">🤝</span>
                        <h2 className="text-2xl font-bold text-cyan-400">Incoming Requests</h2>
                        <span className="ml-2 px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs font-bold text-cyan-300">
                            {pendingInvites.length} {pendingInvites.length === 1 ? 'request' : 'requests'}
                        </span>
                    </div>

                    <div className="space-y-3 mb-6">
                        {pendingInvites.map((invite) => (
                            <div
                                key={invite.id}
                                className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/15 transition-all"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-cyan-300 mb-1">
                                            {getOtherUser(invite)} sent you a collaboration request
                                        </h3>
                                        <p className="text-sm text-slate-300 mb-2">
                                            They want to collaborate on a project with matching skills
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {invite.createdAt
                                                ? new Date(invite.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                                : 'Unknown date'}
                                        </p>
                                    </div>

                                    <div className="flex gap-2 ml-4 flex-shrink-0">
                                        <Button
                                            onClick={() => handleRespondToInvite(invite.id, true)}
                                            disabled={respondingTo === invite.id}
                                            className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm h-9 px-4 font-semibold"
                                        >
                                            {respondingTo === invite.id ? '...' : '✓ Accept'}
                                        </Button>
                                        <Button
                                            onClick={() => handleRespondToInvite(invite.id, false)}
                                            disabled={respondingTo === invite.id}
                                            className="bg-slate-700 hover:bg-slate-600 text-white text-sm h-9 px-4"
                                        >
                                            {respondingTo === invite.id ? '...' : '✕ Decline'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <hr className="border-slate-700 my-6" />
                </div>
            )}

            {/* Filter Tabs - Pill Shape Design */}
            <div className="mb-6 flex flex-wrap justify-center gap-3">
                {[
                    { id: 'all', label: 'All', icon: '📋', count: inboxItems.length },
                    { id: 'rejections', label: 'Rejections', icon: '❌', count: inboxItems.filter(i => i.type === 'APPLICATION_REJECTION').length },
                    { id: 'bans', label: 'Bans/Alerts', icon: '🚫', count: inboxItems.filter(i => i.type === 'POD_BAN').length }
                ].map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border flex items-center justify-center gap-2 ${selectedFilter === filter.id
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-transparent shadow-lg shadow-blue-500/20'
                            : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
                            }`}
                    >
                        <span>{filter.icon}</span>
                        <span>{filter.label}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedFilter === filter.id
                            ? 'bg-slate-900/40 text-blue-300'
                            : 'bg-slate-800 text-slate-400'
                            }`}>
                            {filter.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Selection Mode Toggle (only show if there are items) */}
            {inboxItems.length > 0 && (
                <div className="mb-4 flex items-center justify-between px-4 py-2 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={isSelectionMode}
                            onChange={(e) => {
                                setIsSelectionMode(e.target.checked);
                                if (!e.target.checked) {
                                    setSelectedItems(new Set());
                                }
                            }}
                            className="w-4 h-4 cursor-pointer"
                        />
                        <span className="text-sm text-slate-300">
                            {isSelectionMode ? '📍 Selection Mode On' : 'Click to select items'}
                        </span>
                    </div>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-red-300">{error}</p>
                    <Button
                        onClick={loadInbox}
                        className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                    >
                        Try Again
                    </Button>
                </div>
            )}

            {/* Empty state */}
            {inboxItems.length === 0 && !error && (
                <div className="text-center py-12"></div>
            )}

            {/* Inbox items list */}
            {filteredItems.length > 0 && (
                <div className="space-y-3">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className={`${getNotificationStyles(item.type, item.severity)} ${!item.read ? 'ring-2 ring-blue-500/30' : ''
                                } ${selectedItems.has(item.id) ? 'ring-2 ring-green-500/50' : ''}`}
                        >
                            <div className="flex gap-4">
                                {/* Checkbox (only in selection mode) */}
                                {isSelectionMode && (
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.has(item.id)}
                                        onChange={() => toggleItemSelection(item.id)}
                                        className="w-5 h-5 mt-1 cursor-pointer flex-shrink-0"
                                    />
                                )}

                                {/* Icon */}
                                <div className="text-2xl flex-shrink-0">
                                    {getNotificationIcon(item.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Title */}
                                    <h3 className={`font-semibold ${getTitleColor(item.type)} mb-1`}>
                                        {item.title}
                                    </h3>

                                    {/* Message */}
                                    <p className="text-slate-300 text-sm mb-2">
                                        {item.message}
                                    </p>

                                    {/* Pod ban specific details */}
                                    {item.type === 'POD_BAN' && item.podName && (
                                        <div className="text-xs text-slate-400 mb-2">
                                            <p className="mb-1">
                                                <span className="font-semibold">Pod:</span> {item.podName}
                                            </p>
                                            {item.reason && (
                                                <p>
                                                    <span className="font-semibold">Reason:</span> {item.reason}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Timestamp */}
                                    <p className="text-xs text-slate-500">
                                        {item.timestamp
                                            ? new Date(item.timestamp).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                            : 'Unknown date'}
                                    </p>
                                </div>

                                {/* Actions */}
                                {!isSelectionMode && (
                                    <div className="flex flex-col gap-2 justify-start flex-shrink-0">
                                        {!item.read && (
                                            <Button
                                                onClick={() => handleMarkAsRead(item.id)}
                                                disabled={markingAsRead === item.id}
                                                className="text-xs bg-blue-600/80 hover:bg-blue-700 text-white h-8"
                                            >
                                                {markingAsRead === item.id ? '...' : 'Mark Read'}
                                            </Button>
                                        )}

                                        <Button
                                            onClick={() => handleDelete(item.id)}
                                            disabled={deleting === item.id}
                                            className="text-xs bg-slate-700/80 hover:bg-slate-600 text-white h-8"
                                        >
                                            {deleting === item.id ? '...' : 'Delete'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty filtered state */}
            {inboxItems.length > 0 && filteredItems.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-slate-400">No items in this filter</p>
                </div>
            )}

            {/* Floating Action Bar (when items selected) */}
            {isSelectionMode && selectedItems.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl">
                    <span className="text-sm text-slate-300 font-semibold">
                        {selectedItems.size} selected
                    </span>
                    <div className="w-px h-6 bg-slate-700"></div>
                    <Button
                        onClick={handleBulkDelete}
                        disabled={deleting === 'bulk'}
                        className="bg-red-600/80 hover:bg-red-700 text-white text-sm h-8 px-4"
                    >
                        {deleting === 'bulk' ? '...' : '🗑️ Delete Selected'}
                    </Button>
                </div>
            )}
        </div>
    );
}
