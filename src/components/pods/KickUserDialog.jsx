import { useState } from 'react';
import { kickMemberFromPod } from '@/lib/api.js';
import { Button } from '@/components/ui/button.jsx';

/**
 * ✅ STAGE 3: KickUserDialog Component
 * 
 * Modal dialog for kicking a user from a pod.
 * 
 * Features:
 * - Reason dropdown (Spam, Harassment, Other)
 * - Confirm button disabled until reason selected
 * - Loading state during API call
 * - Error handling with user-friendly messages
 * - Success callback to refresh pod data
 */
export default function KickUserDialog({ isOpen, podId, targetUser, actorId, onClose, onSuccess }) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const reasons = [
        { label: 'Spam', value: 'Spam' },
        { label: 'Harassment', value: 'Harassment' },
        { label: 'Other', value: 'Other' }
    ];

    const handleKick = async () => {
        if (!reason) {
            setError('Please select a reason');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await kickMemberFromPod(podId, actorId, targetUser.id, reason);
            
            // Call parent callback to refresh pod data
            if (onSuccess) {
                onSuccess();
            }
            
            // Close dialog
            onClose();
        } catch (err) {
            console.error('Kick failed:', err);
            
            if (err.response?.status === 403) {
                setError('You do not have permission to kick this user');
            } else if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError('Failed to kick user. Please try again.');
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
                    Kick {targetUser?.fullName || targetUser?.name || 'User'}?
                </h2>
                <p className="text-sm text-slate-400 mb-6">
                    This user will be removed from the pod and unable to rejoin for 15 minutes.
                </p>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-sm text-red-300">
                        {error}
                    </div>
                )}

                {/* Reason Dropdown */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Reason for kicking
                    </label>
                    <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm 
                            placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500
                            disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">-- Select a reason --</option>
                        {reasons.map((r) => (
                            <option key={r.value} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                </div>

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
                        onClick={handleKick}
                        disabled={!reason || loading}
                        className={`flex-1 ${
                            !reason || loading
                                ? 'opacity-50 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                    >
                        {loading ? 'Kicking...' : 'Kick User'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
