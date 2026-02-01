import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import api from '@/lib/api.js'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import HelpChatSection from '@/components/ui/HelpChatSection.jsx'

export default function PostCommentsPage({ user }) {
    const { postId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const [post, setPost] = useState(null)
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(true)

    // Get the source view and filter from navigation state
    const sourceView = location.state?.sourceView || 'campus'
    const sourceFilter = location.state?.sourceFilter || 'ASK_HELP'

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                const res = await api.get(`/api/posts/${postId}`)
                if (mounted) {
                    const postData = { ...res.data, type: res.data.postType || res.data.type }
                    setPost(postData)

                    // Fetch comments for this post
                    const commentsRes = await api.get(`/api/comments/post/${postId}`)
                    setComments(commentsRes.data || [])
                }
            } catch (err) {
                console.error('Failed to load post', err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [postId])

    if (loading) return <div className="p-6">Loading post...</div>
    if (!post) return <div className="p-6 text-red-500">Post not found.</div>

    const handleBack = () => {
        // Navigate back to source with correct view context and filter
        if (sourceView === 'inter') {
            navigate('/campus', { state: { view: 'inter', viewContext: { initialView: 'feed' }, from: 'comment' } })
        } else {
            // For campus, pass the specific filter so we return to the correct tab
            navigate('/campus', { state: { view: 'campus', viewContext: { initialView: 'feed', activeFilter: sourceFilter }, from: 'comment' } })
        }
    }

    const isGlobalPost = post && post.type === 'DISCUSSION'
    const hubName = isGlobalPost ? 'Global Hub' : 'Campus Hub'

    return (
        <div className="space-y-8 py-4">
            <div className="flex items-center justify-between px-2">
                <Button variant="ghost" onClick={handleBack} className="font-semibold text-muted-foreground hover:text-foreground">← Back to Feed</Button>
                <div className="text-lg font-semibold text-foreground tracking-tight">Replies & Discussion</div>
                <div />
            </div>

            <Card variant="glass" className="shadow-md">
                <CardContent className="p-8">
                    <div className="mb-3 font-bold text-lg text-foreground tracking-tight leading-snug">{post.title}</div>
                    {post.content && <div className="text-muted-foreground/80 mb-4 text-sm leading-relaxed">{post.content}</div>}
                    <div className="text-xs text-muted-foreground/60 font-medium">{new Date(post.createdAt).toLocaleString()}</div>
                </CardContent>
            </Card>

            <HelpChatSection post={post} comments={comments} currentUserName={user?.fullName || user?.email || 'You'} />
        </div>
    )
}
