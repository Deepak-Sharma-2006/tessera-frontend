import { useState } from 'react';
import { transferOwnership } from '@/lib/api.js';
import { Button } from '@/components/ui/button.jsx';
import { Avatar } from '@/components/ui/avatar.jsx';

/**
 * ✅ Transfer Ownership Dialog Component
 * 
 * Modal dialog for transferring pod ownership to another member/admin.
 * 
 * Features:
 * - Lists all current members and admins
 * - Prevents owner from being selectable
 * - Confirm button disabled until recipient selected
 * - Loading state during API call
 * - Error handling
 * - Success callback to refresh pod data
 */
export default function TransferOwnershipDialog({ isOpen, podId, currentOwnerId, members, admins, onClose, onSuccess }) {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Combine members and admins, excluding current owner
    const candidates = [
        ...(members || []).filter(m => m.id !== currentOwnerId),
        ...(admins || []).filter(a => a.id !== currentOwnerId)
    ];

    // Remove duplicates
    const uniqueCandidates = Array.from(
        new Map(candidates.map(c => [c.id, c])).values()
    );

    const handleTransfer = async () => {
        if (!selectedUserId) {
            setError('Please select a user');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await transferOwnership(podId, currentOwnerId, selectedUserId);

            // Call parent callback to refresh pod data
            if (onSuccess) {
                onSuccess();
            }

            // Close dialog
            onClose();
        } catch (err) {
            console.error('Transfer failed:', err);

            if (err.response?.status === 403) {
                setError('You do not have permission to transfer ownership');
            } else if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError('Failed to transfer ownership. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        // Overlay
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            {/* Dialog */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-2xl p-6 max-w-sm w-full mx-4">
                {/* Header */}
                <h2 className="text-xl font-bold text-white mb-2">
                    Transfer Ownership
                </h2>
                <p className="text-sm text-slate-400 mb-6">
                    Select a member to become the new pod owner. You will be demoted to a regular member.
                </p>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-sm text-red-300">
                        {error}
                    </div>
                )}

                {/* Member List */}
                <div className="mb-6 max-h-64 overflow-y-auto space-y-2">
                    {uniqueCandidates.length === 0 ? (
                        <p className="text-sm text-slate-400">No members available to transfer ownership to.</p>
                    ) : (
                        uniqueCandidates.map((user) => (
                            <label
                                key={user.id}
                                className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${
                                    selectedUserId === user.id
                                        ? 'bg-cyan-600/30 border border-cyan-500'
                                        : 'bg-slate-700/50 border border-slate-600 hover:border-cyan-500'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="owner"
                                    value={user.id}
                                    checked={selectedUserId === user.id}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    disabled={loading}
                                    className="w-4 h-4"
                                />
                                <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500">
                                    {(user.fullName || user.name || user.id).charAt(0).toUpperCase()}
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">
                                        {user.fullName || user.name || user.id}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {user.email || 'No email'}
                                    </p>
                                </div>
                            </label>
                        ))
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleTransfer}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                        disabled={!selectedUserId || loading}
                    >
                        {loading ? '⏳ Transferring...' : '✓ Transfer'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
