import axios from 'axios';

// 1. Create the axios instance
const api = axios.create({
    baseURL: 'http://localhost:8080/api', // Make sure this matches your backend port
    headers: {
        'Content-Type': 'application/json'
    }
});

// 2. REQUEST INTERCEPTOR (The Token Logic)
api.interceptors.request.use(
    (config) => {
        // 1. Get Token from Storage (Check all keys)
        let token = localStorage.getItem('jwt_token') ||
            localStorage.getItem('token');

        // 2. Fallback: Check user object
        if (!token) {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                token = user.token || user.jwt;
            } catch (e) {
                console.warn("Failed to parse user object", e);
            }
        }

        // 3. SANITIZE: Remove quotes and whitespace (The "Dirty Token" Fix)
        if (token) {
            token = token.replace(/['"]+/g, '').trim();
        }

        // 4. Attach to Header (Prevent duplicates)
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // ⚡ FORCE JSON HEADER
        config.headers['Content-Type'] = 'application/json';

        // 🕵️ HEADER SPY: Check exactly what we are sending
        console.log("⬆️ OUTGOING REQUEST:", {
            url: config.url,
            method: config.method,
            authHeader: config.headers.Authorization, // Is it "Bearer eyJ..."?
            tokenLength: token ? token.length : 0
        });

        // 🕵️ EXPIRY CHECK: Is the token already dead?
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const exp = payload.exp * 1000;
                const now = Date.now();
                console.log("⏳ TOKEN STATUS:", now > exp ? "❌ EXPIRED" : "✅ VALID", `(Expires in ${Math.round((exp - now) / 1000)}s)`);
            } catch (e) {
                console.log("⚠️ COULD NOT DECODE TOKEN DATE");
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// 3. RESPONSE INTERCEPTOR
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error("Session Expired");
        }
        return Promise.reject(error);
    }
);

// ✅ DEFAULT EXPORT (For generic use like api.get, api.post)
export default api;

// ✅ NAMED EXPORTS (The missing functions causing your error)
// Add these at the bottom of the file:

export const createEvent = async (eventData) => {
    return await api.post('/events', eventData);
};

export const fetchEvents = async () => {
    return await api.get('/events');
};

export const joinEvent = async (eventId) => {
    return await api.post(`/events/${eventId}/join`);
};

export const getEvents = async () => {
    return await api.get('/events');
};

export const createTeamPost = async (postData) => {
    return await api.post('/posts/team-finding', postData);
};

export const getBuddyBeaconFeed = async () => {
    return await api.get('/beacon/feed');
};

export const getMyBeaconPosts = async () => {
    return await api.get('/beacon/my-posts');
};

export const getAppliedPosts = async () => {
    return await api.get('/beacon/applied');
};

export const acceptApplication = async (applicationId) => {
    return await api.post(`/beacon/applications/${applicationId}/accept`);
};

export const rejectApplication = async (applicationId) => {
    return await api.post(`/beacon/applications/${applicationId}/reject`);
};

export const deleteMyPost = async (postId) => {
    return await api.delete(`/beacon/posts/${postId}`);
};