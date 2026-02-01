import { useEffect, useState, useCallback } from 'react'
import useCommentWs from '@/hooks/useCommentWs'
import usePodWs from '@/hooks/usePodWs'
import ChatBubble from './ChatBubble'
import { useTheme } from '@/lib/theme'

export default function HelpChatSection({ post, comments: initialComments, currentUserName, topicType, topicId }) {
    const { theme } = useTheme()
    // Determine topic source: if explicit topicType/topicId provided, use those;
    // otherwise fall back to post object (legacy behavior).
    const sourceType = topicType || (post ? 'POST' : null)
    const sourceId = topicId || (post ? post.id : null)

    // Use initialComments prop if provided, otherwise use post.comments (legacy)
    const [comments, setComments] = useState(initialComments || (post && post.comments) || [])

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

    return (
        <div className={`p-6 rounded-lg border backdrop-blur-xl ${theme === 'cyber' 
          ? 'bg-cyan-400/5 border-cyan-400/15' 
          : 'bg-white/8 border-white/15'
        }`}>
            <div className="text-sm font-semibold text-muted-foreground/80 mb-4 tracking-wide">💬 Discussion</div>
            <div className="space-y-4">
                {(comments || []).map(c => (
                    <ChatBubble key={c.id} comment={c} postType={post ? post.type : (sourceType)} isOP={post && c.authorName === post.authorName} onReply={handleReply} theme={theme} />
                ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10">
                <ReplyBox onSend={(content) => commentHook.send({ content, parentId: null, authorName: currentUserName })} theme={theme} />
            </div>
        </div>
    )
}

function ReplyBox({ onSend, theme }) {
    const [text, setText] = useState('')
    return (
        <div className="flex gap-2">
            <input 
              className={`flex-1 border rounded-lg p-3 text-sm focus:outline-none transition-all ${theme === 'cyber'
                ? 'bg-cyan-400/10 border-cyan-400/20 focus:bg-cyan-400/15 focus:border-cyan-400/30 text-foreground placeholder:text-muted-foreground/50'
                : 'bg-white/8 border-white/15 focus:bg-white/12 focus:border-white/30 text-foreground placeholder:text-muted-foreground/50'
              }`}
              value={text} 
              onChange={e => setText(e.target.value)} 
              placeholder="Write a reply..." 
            />
            <button 
              className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${theme === 'cyber'
                ? 'bg-cyan-400/20 text-cyan-300 hover:bg-cyan-400/30 border border-cyan-400/30'
                : 'bg-primary/20 text-primary-solid hover:bg-primary/30 border border-primary/40'
              }`}
              onClick={() => { if (text.trim()) { onSend(text.trim()); setText('') } }}
            >
              Send
            </button>
        </div>
    )
}
