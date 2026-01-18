import { useEffect, useState, useCallback } from 'react'
import useCommentWs from '@/hooks/useCommentWs'
import usePodWs from '@/hooks/usePodWs'
import ChatBubble from './ChatBubble'

export default function HelpChatSection({ post, currentUserName, topicType, topicId }) {
    // Determine topic source: if explicit topicType/topicId provided, use those;
    // otherwise fall back to post object (legacy behavior).
    const sourceType = topicType || (post ? 'POST' : null)
    const sourceId = topicId || (post ? post.id : null)

    const [comments, setComments] = useState((post && post.comments) || [])

    const handleIncoming = useCallback((payload) => {
        const saved = payload.comment || payload.message || payload
        const parentId = payload.parentId
        setComments(prev => {
            const copy = JSON.parse(JSON.stringify(prev || []))
            if (!parentId) {
                copy.push(saved)
                return copy
            }
            const appended = (function append(list) {
                for (let c of list) {
                    if (c.id === parentId) { c.replies = c.replies || []; c.replies.push(saved); return true }
                    if (c.replies && c.replies.length) {
                        const ok = append(c.replies)
                        if (ok) return true
                    }
                }
                return false
            })(copy)
            if (!appended) copy.push(saved)
            return copy
        })
    }, [])

    // Choose the appropriate WS hook
    const commentHook = sourceType === 'POD'
        ? usePodWs({ podId: sourceId, onMessage: handleIncoming })
        : useCommentWs({ postId: sourceId, onMessage: handleIncoming })

    useEffect(() => { if (post && post.comments) setComments(post.comments || []) }, [post && post.comments])

    const handleReply = (parentId, content) => {
        commentHook.send({ content, parentId, authorName: currentUserName })
    }

    const containerClass = sourceType === 'POST' || (post && post.type === 'ASK_HELP') ? 'bg-blue-50 p-3 rounded' : 'bg-white p-3 rounded'

    return (
        <div className={containerClass}>
            <div className="text-sm text-gray-600 mb-2">Help Chat</div>
            <div className="space-y-3">
                {(comments || []).map(c => (
                    <ChatBubble key={c.id} comment={c} postType={post ? post.type : (sourceType)} isOP={post && c.authorName === post.authorName} onReply={handleReply} />
                ))}
            </div>
            <div className="mt-3">
                <ReplyBox onSend={(content) => commentHook.send({ content, parentId: null, authorName: currentUserName })} />
            </div>
        </div>
    )
}

function ReplyBox({ onSend }) {
    const [text, setText] = useState('')
    return (
        <div className="flex gap-2">
            <input className="flex-1 border rounded p-2" value={text} onChange={e => setText(e.target.value)} placeholder="Write a reply..." />
            <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => { if (text.trim()) { onSend(text.trim()); setText('') } }}>Send</button>
        </div>
    )
}
