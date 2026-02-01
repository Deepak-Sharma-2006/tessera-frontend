import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '@/lib/api.js';
import PostCommentsPage from '@/components/campus/PostCommentsPage.jsx';
import Navigation from '@/components/Navigation.jsx';
import XPDisplay from '@/components/ui/XPDisplay.jsx';
import LoadingSpinner from '@/components/animations/LoadingSpinner.jsx';

/**
 * Dedicated Post Comments View component that handles scope detection.
 * Fetches post data to determine if it's a Campus post or Global/Inter post,
 * then displays the appropriate navigation header.
 */
export default function PostCommentsView({ user, setUser }) {
    const { postId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get source view from location state for fallback
    const sourceView = location.state?.sourceView || 'campus';

    // Fetch post to determine its type/scope
    useEffect(() => {
        let mounted = true;
        const fetchPost = async () => {
            try {
                const res = await api.get(`/api/posts/${postId}`);
                if (mounted) {
                    setPost(res.data);
                }
            } catch (err) {
                if (mounted) {
                    console.error('Failed to load post:', err);
                    setError('Could not load post');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchPost();
        return () => { mounted = false; };
    }, [postId]);

    // ✅ FIXED: Handle tab navigation from comment section
    // When user clicks Events, Campus, Inbox, Badges tabs, navigate away from comments
    const handleTabNavigation = (viewId) => {
        if (viewId === 'campus') {
            navigate('/campus', { state: { from: 'comment', view: 'campus' } });
        } else if (viewId === 'events') {
            navigate('/campus', { state: { from: 'comment', view: 'events' } });
        } else if (viewId === 'inter') {
            navigate('/campus', { state: { from: 'comment', view: 'inter', viewContext: { initialView: 'feed' } } });
        } else if (viewId === 'inbox') {
            navigate('/campus', { state: { from: 'comment', view: 'inbox' } });
        } else if (viewId === 'badges') {
            navigate('/campus', { state: { from: 'comment', view: 'badges' } });
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (!post) return <div className="p-4">Post not found</div>;

    // Determine the correct view based on post type
    // DISCUSSION posts are from Global Hub (Inter)
    // Other posts are from Campus Hub
    const currentView = post.postType === 'DISCUSSION' ? 'inter' : 'campus';

    return (
        <>
            <Navigation user={user} setUser={setUser} currentView={currentView} onViewChange={handleTabNavigation} />
            <XPDisplay user={user} />
            <main className="pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <PostCommentsPage user={user} />
                </div>
            </main>
        </>
    );
}
