import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/lib/api.js';
import CollabPodPage from '@/components/campus/CollabPodPage.jsx';
import Navigation from '@/components/Navigation.jsx';
import XPDisplay from '@/components/ui/XPDisplay.jsx';
import LoadingSpinner from '@/components/animations/LoadingSpinner.jsx';

/**
 * Dedicated Pod View component that handles scope detection and proper navigation context.
 * Fetches pod data to determine if it's a Campus Pod (CAMPUS scope) or Global Room (GLOBAL scope),
 * then displays the appropriate navigation header.
 */
export default function PodView({ user, setUser }) {
    const { podId } = useParams();
    const [pod, setPod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch pod to determine its scope
    useEffect(() => {
        let mounted = true;
        const fetchPod = async () => {
            try {
                const res = await api.get(`/pods/${podId}`);
                if (mounted) {
                    setPod(res.data);
                }
            } catch (err) {
                if (mounted) {
                    console.error('Failed to load pod:', err);
                    setError('Could not load pod');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchPod();
        return () => { mounted = false; };
    }, [podId]);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (!pod) return <div className="p-4">Pod not found</div>;

    // Determine the correct view based on pod scope
    const currentView = pod.scope === 'GLOBAL' ? 'inter' : 'campus';

    return (
        <>
            <Navigation user={user} setUser={setUser} currentView={currentView} onViewChange={() => { }} />
            <XPDisplay user={user} />
            <main className="pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <CollabPodPage user={user} podId={podId} />
                </div>
            </main>
        </>
    );
}
