import React, { useState } from 'react';
import api from '@/lib/api.js';

export default function ReportModal({ isOpen, onClose, reportedUserId, reportedUserName, currentUserId }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      setError("Please select a reason");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
      const headers = {};
      
      // Add authorization header if token exists
      if (token) {
        const cleanToken = token.replace(/['"]+/g, '').trim();
        headers['Authorization'] = `Bearer ${cleanToken}`;
      }

      const response = await api.post('/api/users/reports', {
        reporterId: currentUserId,
        reportedUserId,
        reason,
        details
      }, { headers });

      console.log("✅ Report submitted:", response.data);
      setSuccess(true);
      
      setTimeout(() => {
        onClose();
        setReason("");
        setDetails("");
        setSuccess(false);
      }, 2000);

    } catch (err) {
      console.error("❌ Report submission failed:", err);
      console.error("Error details:", err.response?.data);
      setError(err.response?.data?.error || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#1a1c2e] p-8 rounded-xl border border-red-500/50 w-96 max-h-96 overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-2">Report User</h2>
        <p className="text-sm text-gray-400 mb-6">
          Reporting: <span className="text-cyan-400">{reportedUserName}</span>
        </p>

        {success ? (
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 text-green-400 text-center">
            ✅ Report submitted successfully! The Spam Alert badge has been applied.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-300 mb-2">Reason for Report *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#0f111a] text-white p-3 rounded-lg border border-gray-700 focus:border-cyan-500 focus:outline-none transition"
              >
                <option value="">Select a reason...</option>
                <option value="spam">Spamming Hub</option>
                <option value="harassment">Harassment or Bullying</option>
                <option value="fake">Fake Profile</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Details (Optional)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide more context about this report..."
                className="w-full bg-[#0f111a] text-white p-3 rounded-lg border border-gray-700 focus:border-cyan-500 focus:outline-none transition h-24 resize-none"
              />
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-200">
              ⚠️ False reports may have consequences. Please only report genuine violations.
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-400 hover:text-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !reason}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
