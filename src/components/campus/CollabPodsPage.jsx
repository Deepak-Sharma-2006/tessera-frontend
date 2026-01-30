import { useEffect, useState } from 'react'
import api from '@/lib/api.js'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { useNavigate } from 'react-router-dom'

export default function CollabPodsPage({ user, onEnterCollabPod, onRefreshPosts }) {
    const [lookingForPods, setLookingForPods] = useState([])
    const [myTeamPods, setMyTeamPods] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState('LOOKING_FOR')
    const [settingsModalPod, setSettingsModalPod] = useState(null)
    const navigate = useNavigate()

    const currentUserId = user?.id || 'placeholder-user-id'

    useEffect(() => {
        let mounted = true

        const fetchPods = async () => {
            try {
                setLoading(true)
                setError(null)

                // Fetch CAMPUS scope pods only (strict scope isolation)
                const lookingForRes = await api.get('/pods/campus')
                if (mounted) {
                    setLookingForPods(lookingForRes.data || [])
                }

                // Fetch My Teams pods (user's pods) - explicitly with CAMPUS scope
                const myPodsRes = await api.get('/pods/my-teams?scope=CAMPUS', {
                    headers: { 'X-User-Id': currentUserId }
                })
                if (mounted) {
                    setMyTeamPods(myPodsRes.data || [])
                }
            } catch (err) {
                console.error('Failed to load pods', err)
                if (mounted) {
                    setError('Could not load pods')
                }
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchPods()
        return () => { mounted = false }
    }, [currentUserId])

    if (loading) return <div className="p-4">Loading pods...</div>
    if (error) return <div className="p-4 text-red-500">{error}</div>

    const handleDeletePod = async (podId) => {
        if (!window.confirm('Are you sure? This will delete all chat history permanently.')) {
            return
        }

        try {
            // Backend now uses @AuthenticationPrincipal, so no need to pass X-User-Id header
            const response = await api.delete(`/pods/${podId}`)

            // Remove deleted pod from state
            setMyTeamPods(prev => prev.filter(p => p.id !== podId))
            setLookingForPods(prev => prev.filter(p => p.id !== podId))
            setSettingsModalPod(null)

            // Trigger post tabs refresh to prevent ghost posts
            // This is especially important for LOOKING_FOR posts which are linked to pods
            if (onRefreshPosts) {
                onRefreshPosts()
                console.log('✅ Post tabs refreshed after pod deletion')
            }

            // Log the cascade delete flow for debugging
            if (response.data) {
                console.log('Pod deletion metadata:', response.data)
            }
        } catch (err) {
            console.error('Failed to delete pod:', err)
            alert('Failed to delete pod. You may not have permission.')
        }
    }

    const displayPods = activeTab === 'LOOKING_FOR' ? lookingForPods : myTeamPods
    const isMyTeamsTab = activeTab === 'TEAM'

    return (
        <div className="space-y-6">
            {/* DEBUG BANNER - REMOVE AFTER FIX */}

            {/* Standardized Pill Tabs - Collab Pods */}
            <div className="flex justify-center gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('LOOKING_FOR')}
                    className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border flex items-center justify-center gap-2 ${activeTab === 'LOOKING_FOR'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
                        }`}
                >
                    Looking For
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${activeTab === 'LOOKING_FOR'
                        ? 'bg-slate-900/40 text-cyan-300'
                        : 'bg-slate-800 text-slate-400'
                        }`}>
                        {lookingForPods.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('TEAM')}
                    className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border flex items-center justify-center gap-2 ${activeTab === 'TEAM'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
                        }`}
                >
                    My Teams
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${activeTab === 'TEAM'
                        ? 'bg-slate-900/40 text-cyan-300'
                        : 'bg-slate-800 text-slate-400'
                        }`}>
                        {myTeamPods.length}
                    </span>
                </button>
            </div>

            {displayPods.length === 0 ? (
                <div className="text-slate-400 p-4">
                    {isMyTeamsTab
                        ? 'You are not a member of any pods yet. Join pods from the "Looking For" tab!'
                        : 'No public pods available at the moment.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayPods.map(pod => {
                        // Compare pod creator with current user
                        // The backend now sets creatorId to user.id, so compare IDs directly
                        const isOwner = pod.creatorId === user?.id || pod.creator?.id === user?.id;
                        console.log(`Pod Creator: ${pod.creatorId || pod.creator?.id} | Me: ${user?.id} | Match: ${isOwner}`);

                        return (
                            <Card key={pod.id} className="bg-slate-800/20 border-slate-700 text-white hover:border-slate-600 transition-colors relative group">
                                <CardContent className="p-4 space-y-3">
                                    {/* Settings Gear Icon - Only show for pod owners on My Teams tab */}
                                    {isMyTeamsTab && isOwner && (
                                        <button
                                            onClick={() => setSettingsModalPod(pod)}
                                            className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-700 rounded"
                                            title="Pod settings"
                                        >
                                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                                            </svg>
                                        </button>
                                    )}

                                    <div>
                                        <h3 className="font-semibold text-lg truncate">{pod.title}</h3>
                                        <p className="text-sm text-slate-300 line-clamp-2">{pod.description}</p>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span>Members: {(pod.memberIds || []).length}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${pod.type === 'LOOKING_FOR'
                                            ? 'bg-green-900/40 text-green-300'
                                            : 'bg-blue-900/40 text-blue-300'
                                            }`}>
                                            {pod.type === 'LOOKING_FOR' ? 'Public' : 'Private'}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                if (onEnterCollabPod) {
                                                    onEnterCollabPod(pod.id)
                                                } else {
                                                    navigate(`/collab-pods/${pod.id}`)
                                                }
                                            }}
                                            className={`flex-1 ${isMyTeamsTab
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                                                : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700'
                                                } text-white`}
                                        >
                                            {isMyTeamsTab ? 'Open' : 'Join'}
                                        </Button>

                                        {/* Delete Button - Only visible to pod creators on LOOKING_FOR tab */}
                                        {activeTab === 'LOOKING_FOR' && isOwner && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (window.confirm('Delete this Pod? This cannot be undone.')) {
                                                        handleDeletePod(pod.id);
                                                    }
                                                }}
                                                className="px-3 py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg hover:bg-red-900/40 transition-colors"
                                                title="Delete Pod"
                                            >
                                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Settings Modal */}
            {settingsModalPod && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-6 space-y-4">
                        <h2 className="text-xl font-bold text-white">Pod Settings</h2>
                        <div className="space-y-2 text-slate-300">
                            <p><strong>Name:</strong> {settingsModalPod.title}</p>
                            <p><strong>Type:</strong> {settingsModalPod.type === 'LOOKING_FOR' ? 'Public' : 'Private'}</p>
                            <p><strong>Members:</strong> {(settingsModalPod.memberIds || []).length}</p>
                        </div>

                        {/* Danger Zone */}
                        <div className="mt-6 pt-6 border-t border-red-900/30">
                            <h4 className="text-red-400 font-bold mb-3">Danger Zone</h4>
                            <button
                                onClick={() => handleDeletePod(settingsModalPod.id)}
                                className="w-full py-2 bg-red-900/20 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <span>🗑️</span> Delete Pod
                            </button>
                        </div>

                        <button
                            onClick={() => setSettingsModalPod(null)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors mt-4"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
