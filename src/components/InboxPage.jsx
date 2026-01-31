import { useState, useEffect } from 'react';
import { fetchMyInbox, markInboxAsRead, deleteInboxItem, deleteInboxItemsBulk, clearInboxByType, clearAllInbox } from '@/lib/api.js';
import { Button } from '@/components/ui/button.jsx';
import LoadingSpinner from '@/components/animations/LoadingSpinner.jsx';

/**
 * ✅ INBOX FEATURE: Main inbox page with filtering, selection, and bulk delete
 * 
 * Features:
 * - Filter tabs: All / Rejections / Bans
 * - Selection mode with checkboxes
 * - Floating action bar for bulk delete
 * - Clear options modal
 * - Type-specific styling (POD_BAN red, APPLICATION_REJECTION yellow)
 * 
 * Stage 4 & 5 Frontend Implementation
 */
export default function InboxPage({ user }) {
    const [inboxItems, setInboxItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [markingAsRead, setMarkingAsRead] = useState(null);
    const [deleting, setDeleting] = useState(null);

    // Filter state
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Selection mode state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());

    // Clear options modal state
    const [showClearModal, setShowClearModal] = useState(false);
    const [isClearing, setIsClearing] = useState(null);

    // Fetch inbox items on mount
    useEffect(() => {
        loadInbox();
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
            {/* Header with Clear button */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">📬</span>
                        <h1 className="text-3xl font-bold text-white">Inbox</h1>
                    </div>
                    <div className="relative">
                        <Button
                            onClick={() => setShowClearModal(!showClearModal)}
                            className="bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-sm"
                        >
                            Clear 🔽
                        </Button>

                        {/* Clear Options Modal */}
                        {showClearModal && (
                            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50">
                                <div className="p-4 space-y-2">
                                    <p className="text-xs text-slate-400 font-semibold mb-3">
                                        Clear Options
                                    </p>

                                    <Button
                                        onClick={() => handleClearByType('APPLICATION_REJECTION')}
                                        disabled={isClearing !== null}
                                        className="w-full justify-start text-left bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 text-sm h-9"
                                    >
                                        {isClearing === 'APPLICATION_REJECTION' ? '...' : '✓'} Clear All Rejections
                                    </Button>

                                    <Button
                                        onClick={() => handleClearByType('POD_BAN')}
                                        disabled={isClearing !== null}
                                        className="w-full justify-start text-left bg-red-600/20 hover:bg-red-600/30 text-red-300 text-sm h-9"
                                    >
                                        {isClearing === 'POD_BAN' ? '...' : '✓'} Clear All Bans
                                    </Button>

                                    <hr className="border-slate-700 my-2" />

                                    <Button
                                        onClick={handleClearAll}
                                        disabled={isClearing !== null}
                                        className="w-full justify-start text-left bg-red-700/20 hover:bg-red-700/30 text-red-400 text-sm h-9 font-semibold"
                                    >
                                        {isClearing === 'all' ? '...' : '⚠️'} Delete All Messages
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-slate-400">
                    {inboxItems.length === 0
                        ? 'No notifications yet'
                        : `You have ${inboxItems.length} notification${inboxItems.length !== 1 ? 's' : ''}`}
                </p>
            </div>

            {/* Filter Tabs */}
            {inboxItems.length > 0 && (
                <div className="mb-6 flex gap-2">
                    {[
                        { id: 'all', label: 'All', icon: '📋' },
                        { id: 'rejections', label: 'Rejections', icon: '❌' },
                        { id: 'bans', label: 'Bans/Alerts', icon: '🚫' }
                    ].map(filter => (
                        <Button
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter.id)}
                            className={`text-sm h-9 px-4 ${selectedFilter === filter.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                                }`}
                        >
                            {filter.icon} {filter.label}
                        </Button>
                    ))}
                </div>
            )}

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
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-xl font-semibold text-white mb-2">No new notifications</h2>
                    <p className="text-slate-400">
                        You're all caught up! Come back when you have activity on your pods.
                    </p>
                </div>
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
