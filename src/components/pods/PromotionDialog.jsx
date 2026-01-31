import { useState } from 'react';
import { promoteToAdmin, demoteToMember } from '@/lib/api.js';
import { Button } from '@/components/ui/button.jsx';

/**
 * ✅ STAGE 4: PromotionDialog Component
 * 
 * Modal dialog for promoting/demoting users
 * 
 * Features:
 * - Confirm role change
 * - Loading state during API call
 * - Error handling
 * - Success callback
 */
export default function PromotionDialog({
    isOpen,
    podId,
    targetUser,
    actorId,
    action, // 'promote' or 'demote'
    onClose,
    onSuccess
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isPromote = action === 'promote';
    const actionText = isPromote ? 'Make Admin' : 'Remove Admin';
    const confirmText = isPromote
        ? `Are you sure you want to make ${targetUser?.fullName || 'this user'} an Admin?`
        : `Are you sure you want to remove Admin privileges from ${targetUser?.fullName || 'this user'}?`;

    const handleConfirm = async () => {
        setLoading(true);
        setError(null);

        try {
            if (isPromote) {
                await promoteToAdmin(podId, actorId, targetUser.id);
            } else {
                await demoteToMember(podId, actorId, targetUser.id);
            }

            if (onSuccess) {
                onSuccess();
            }

            onClose();
        } catch (err) {
            console.error('Role change failed:', err);

            if (err.response?.status === 403) {
                setError('Only the Pod Owner can change roles');
            } else if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError('Failed to change role. Please try again.');
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
                <h2 className="text-xl font-bold text-white mb-4">
                    {actionText}
                </h2>

                {/* Message */}
                <p className="text-sm text-slate-300 mb-6">
                    {confirmText}
                </p>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-sm text-red-300">
                        {error}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`flex-1 ${isPromote
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Updating...' : actionText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
