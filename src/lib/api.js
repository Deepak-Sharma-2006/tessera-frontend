import axios from 'axios';

// Axios instance setup
const api = axios.create({
    baseURL: 'http://localhost:8080',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// REQUEST INTERCEPTOR (Token handling)
api.interceptors.request.use(
    (config) => {
        // ✅ FIX: Simplified & reliable token retrieval
        // Check both possible storage keys (jwt_token for new, token for legacy)
        const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');

        // Attach Bearer token if available
        if (token) {
            // Clean token (remove quotes if present)
            const cleanToken = token.replace(/['"]+/g, '').trim();
            config.headers.Authorization = `Bearer ${cleanToken}`;
            console.log('✅ Token attached to request:', config.url);
        } else {
            console.log('⚠️ No token found in localStorage');
        }

        // Add userId header from stored user (optional, for backend correlation)
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.id || user.userId || user._id;
            if (userId) {
                config.headers['X-User-Id'] = userId;
            }
        } catch {
            // Silently ignore parsing errors
        }

        // Handle FormData: Don't set Content-Type, let browser auto-detect
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        } else {
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
// ✅ CRITICAL: Handle 401 Unauthorized responses
// Let components handle 401 gracefully - App.jsx will clear session on next request
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn(`❌ 401 Unauthorized - API rejected request at: ${error.config?.url}`);
            // Don't redirect here - let App.jsx session verification catch this
            // and clear the user state on the next check
        } else if (error.response && error.response.status === 403) {
            console.warn(`❌ 403 Forbidden - Access denied to: ${error.config?.url}`);
        }
        return Promise.reject(error);
    }
);

// --- API Functions for Events Hub & Buddy Beacon ---

/**
 * Fetches events, with an optional filter for category.
 * @param {string} category - The category to filter by (e.g., "hackathons").
 * @returns {Promise} An axios promise for the request.
 */
export const getEvents = (category) => {
    let url = '/api/events';
    if (category && category !== 'all') {
        // Format the category for the backend (e.g., 'hackathons' -> 'Hackathon')
        const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1, -1);
        url += `?category=${formattedCategory}`;
    }
    return api.get(url);
};

/**
 * Creates a new team-finding post.
 * @param {object} postData - The data for the new post { eventId, description, extraSkills }.
 * @returns {Promise} An axios promise for the request.
 */
export const createTeamPost = (postData) => {
    return api.post('/api/posts/team-finding', postData);
};

/**
 * Fetches all team-finding posts for a specific event.
 * @param {string} eventId - The ID of the event.
 * @returns {Promise} An axios promise for the request.
 */
export const getPostsForEvent = (eventId) => {
    return api.get(`/api/posts/event/${eventId}`);
};

/**
 * Creates a new event.
 * @param {object} eventData - The data for the new event.
 * @returns {Promise} An axios promise for the request.
 */
export const createEvent = (eventData) => {
    return api.post('/api/events', eventData);
};

/**
 * Fetches the unified Buddy Beacon feed (Team Posts + Beacon Posts).
 */
export const getBuddyBeaconFeed = () => {
    return api.get('/api/beacon/feed');
};

/**
 * Fetches posts the current user has applied to (Applicant View)
 */
export const getAppliedPosts = () => {
    return api.get('/api/beacon/applied-posts');
};

/**
 * Apply to a Team Post or Buddy Beacon
 * @param {string} postId
 * @param {object} applicationData (optional: message, applicantSkills, etc)
 */
export const applyToPost = (postId, applicationData = {}) => {
    return api.post(`/api/beacon/apply/${postId}`, applicationData);
};

/**
 * Fetches posts created by the current user (host dashboard).
 */
export const getMyBeaconPosts = () => {
    return api.get('/api/beacon/my-posts');
};

/**
 * Accepts an applicant for a post.
 * @param {string} applicationId
 * @param {string} postId
 */
export const acceptApplication = (applicationId, postId) => {
    return api.post(`/api/beacon/application/${applicationId}/accept?postId=${postId}`);
};

/**
 * Rejects an applicant for a post.
 * @param {string} applicationId
 * @param {string} postId
 * @param {string} reason
 * @param {string} note
 */
export const rejectApplication = (applicationId, postId, reason, note) => {
    return api.post(`/api/beacon/application/${applicationId}/reject?postId=${postId}&reason=${reason}&note=${encodeURIComponent(note || '')}`);
};

/**
 * Deletes a post from My Posts dashboard.
 * @param {string} postId
 */
export const deleteMyPost = (postId) => {
    return api.delete(`/api/beacon/my-posts/${postId}`);
};

/**
 * Track user registration click for solo events with external links.
 * @param {string} eventId
 * @returns {Promise} Updated event with participantsCount
 */
export const trackEventRegistration = (eventId) => {
    return api.post(`/api/events/${eventId}/register-click`);
};

// ============================================
// ✅ STAGE 3: Pod Management API Functions
// ============================================

/**
 * Kick a member from a pod (admin/owner only)
 * @param {string} podId - Pod ID
 * @param {string} actorId - User performing the kick
 * @param {string} targetId - User being kicked
 * @param {string} reason - Reason (Spam, Harassment, Other)
 * @returns {Promise} Updated pod
 */
export const kickMemberFromPod = (podId, actorId, targetId, reason) => {
    return api.post(`/pods/${podId}/kick`, {
        actorId,
        targetId,
        reason
    });
};

/**
 * Leave a pod (creates 15-minute cooldown)
 * @param {string} podId - Pod ID
 * @param {string} userId - User leaving
 * @returns {Promise} Success message
 */
export const leavePod = (podId, userId) => {
    return api.post(`/pods/${podId}/leave`, {
        userId
    });
};

/**
 * Transfer pod ownership to another member/admin
 * @param {string} podId - Pod ID
 * @param {string} currentOwnerId - Current owner ID
 * @param {string} newOwnerId - New owner ID
 * @returns {Promise} Updated pod
 */
export const transferOwnership = (podId, currentOwnerId, newOwnerId) => {
    return api.post(`/pods/${podId}/transfer-ownership`, {
        currentOwnerId,
        newOwnerId
    });
};

/**
 * Join a pod (checks cooldown, ban, and capacity)
 * @param {string} podId - Pod ID
 * @param {string} userId - User joining
 * @returns {Promise} Updated pod or error with minutesRemaining
 */
export const joinPodEnhanced = (podId, userId) => {
    return api.post(`/pods/${podId}/join-enhanced`, {
        userId
    });
};

/**
 * ✅ STAGE 4: Promote a member to admin
 * @param {string} podId - Pod ID
 * @param {string} actorId - User performing promotion (must be Owner)
 * @param {string} targetId - User being promoted
 * @returns {Promise} Updated pod
 */
export const promoteToAdmin = (podId, actorId, targetId) => {
    return api.post(`/pods/${podId}/promote-to-admin`, {
        actorId,
        targetId
    });
};

/**
 * ✅ STAGE 4: Demote an admin to member
 * @param {string} podId - Pod ID
 * @param {string} actorId - User performing demotion (must be Owner)
 * @param {string} targetId - Admin being demoted
 * @returns {Promise} Updated pod
 */
export const demoteToMember = (podId, actorId, targetId) => {
    return api.post(`/pods/${podId}/demote-to-member`, {
        actorId,
        targetId
    });
};

/**
 * ✅ INBOX FEATURE: Fetch all inbox items for current user
 * @param {string} userId - Current user's ID
 * @returns {Promise<Array>} List of inbox items sorted by newest first
 */
export const fetchMyInbox = (userId) => {
    return api.get('/api/inbox/my', {
        params: { userId }
    }).then(res => res.data);
};

/**
 * ✅ INBOX FEATURE: Fetch unread inbox items
 * @param {string} userId - Current user's ID
 * @returns {Promise<Array>} List of unread inbox items
 */
export const fetchUnreadInbox = (userId) => {
    return api.get('/api/inbox/my/unread', {
        params: { userId }
    }).then(res => res.data);
};

/**
 * ✅ INBOX FEATURE: Mark an inbox item as read
 * @param {string} itemId - ID of the inbox item
 * @returns {Promise} Updated inbox item
 */
export const markInboxAsRead = (itemId) => {
    return api.patch(`/api/inbox/${itemId}/read`).then(res => res.data);
};

/**
 * ✅ INBOX FEATURE: Delete an inbox item
 * @param {string} itemId - ID of the inbox item
 * @returns {Promise} 204 No Content
 */
export const deleteInboxItem = (itemId) => {
    return api.delete(`/api/inbox/${itemId}`);
};

/**
 * ✅ INBOX FEATURE: Delete multiple inbox items in bulk
 * @param {Array<string>} itemIds - Array of inbox item IDs to delete
 * @returns {Promise} { deleted: number }
 */
export const deleteInboxItemsBulk = (itemIds) => {
    return api.delete('/api/inbox/bulk', {
        data: { ids: itemIds }
    }).then(res => res.data);
};

/**
 * ✅ INBOX FEATURE: Clear all inbox items of a specific type
 * @param {string} userId - Current user's ID
 * @param {string} type - Notification type (APPLICATION_REJECTION, POD_BAN)
 * @returns {Promise} { deleted: number, type: string }
 */
export const clearInboxByType = (userId, type) => {
    return api.delete('/api/inbox/clear-type', {
        params: { userId, type }
    }).then(res => res.data);
};

/**
 * ✅ INBOX FEATURE: Clear all inbox items for current user
 * @param {string} userId - Current user's ID
 * @returns {Promise} { deleted: number }
 */
export const clearAllInbox = (userId) => {
    return api.delete('/api/inbox/clear-all', {
        params: { userId }
    }).then(res => res.data);
};

// ============================================
// ✅ MESSAGING & DISCOVERY API Functions
// ============================================

/**
 * Get all conversations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of conversations
 */
export const getUserConversations = (userId) => {
    return api.get(`/api/messages/conversations/${userId}`);
};

/**
 * Create a new conversation with participants
 * @param {Array<string>} participantIds - Array of participant user IDs
 * @returns {Promise<Object>} Created conversation
 */
export const createConversation = (participantIds) => {
    return api.post('/api/messages/conversations', { participantIds });
};

/**
 * Get a specific conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} Conversation object
 */
export const getConversation = (conversationId) => {
    return api.get(`/api/messages/conversation/${conversationId}`);
};

/**
 * Get all messages in a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Array>} List of messages
 */
export const getMessages = (conversationId) => {
    return api.get(`/api/messages/conversation/${conversationId}/messages`);
};

/**
 * Send a message in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} senderId - Sender user ID
 * @param {string} text - Message text
 * @param {Array<string>} attachmentUrls - Optional attachment URLs
 * @returns {Promise<Object>} Sent message
 */
export const sendMessage = (conversationId, senderId, text, attachmentUrls = []) => {
    return api.post(`/api/messages/conversation/${conversationId}/send`, {
        senderId,
        text,
        attachmentUrls
    });
};

/**
 * Send a collab invite to a user
 * @param {string} targetUserId - Target user ID
 * @param {string} senderId - Sender user ID
 * @returns {Promise<Object>} Created conversation/invitation
 */
export const sendCollabInvite = (targetUserId, senderId) => {
    return api.post(`/api/messages/invite/${targetUserId}`, { senderId });
};

/**
 * Get pending invites for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of pending invitations
 */
export const getPendingInvites = (userId) => {
    return api.get(`/api/messages/invites/${userId}`);
};

/**
 * Respond to an invite (accept/reject)
 * @param {string} conversationId - Conversation ID
 * @param {boolean} accept - True to accept, false to reject
 * @returns {Promise<Object>} Updated conversation
 */
export const respondToInvite = (conversationId, accept) => {
    return api.post(`/api/messages/invites/${conversationId}/respond`, { accept });
};

/**
 * Get discovery mesh - global skill-matched collaborators
 * @returns {Promise<Array>} Top 5 skill-matched users globally
 */
export const getDiscoveryMesh = () => {
    return api.get('/api/discovery/mesh');
};

// Default export of the configured axios instance
export default api;