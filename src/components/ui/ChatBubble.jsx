import { useState } from 'react'

export default function ChatBubble({ comment, postType, isOP, onReply, theme }) {
    const [showReply, setShowReply] = useState(false)
    const [replyText, setReplyText] = useState('')

    const handleSend = () => {
        if (!replyText.trim()) return
        onReply(comment.id, replyText)
        setReplyText('')
        setShowReply(false)
    }

    return (
        <div className={`pl-4 border-l-2 ${theme === 'cyber' ? 'border-cyan-400/30' : 'border-primary/20'}`}>
            <div className={`p-4 rounded-lg backdrop-blur-sm transition-all ${isOP 
              ? theme === 'cyber'
                ? 'bg-cyan-400/10 border border-cyan-400/20'
                : 'bg-primary/10 border border-primary/20'
              : theme === 'cyber'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white/8 border border-white/15'
            }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-semibold text-foreground tracking-wide">{comment.authorName}</div>
                  {isOP && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary-solid">OP</span>}
                </div>
                <div className="text-xs text-muted-foreground/60 mb-2">{new Date(comment.createdAt).toLocaleString()}</div>
                <div className="mt-3 text-sm text-muted-foreground/90 leading-relaxed">{comment.content}</div>
                <div className="mt-3">
                    <button 
                      className={`text-xs font-semibold transition-colors ${theme === 'cyber'
                        ? 'text-cyan-400/70 hover:text-cyan-400'
                        : 'text-primary/70 hover:text-primary'
                      }`}
                      onClick={() => setShowReply(s => !s)}
                    >
                      {showReply ? '✕ Cancel' : '↳ Reply'}
                    </button>
                </div>
            </div>
            {showReply && (
                <div className="mt-3 ml-4 space-y-2">
                    <textarea 
                      className={`w-full border rounded-lg p-3 text-sm focus:outline-none transition-all ${theme === 'cyber'
                        ? 'bg-cyan-400/10 border-cyan-400/20 focus:bg-cyan-400/15 focus:border-cyan-400/30 text-foreground placeholder:text-muted-foreground/50'
                        : 'bg-white/8 border-white/15 focus:bg-white/12 focus:border-white/30 text-foreground placeholder:text-muted-foreground/50'
                      }`}
                      value={replyText} 
                      onChange={e => setReplyText(e.target.value)} 
                      placeholder="Write a reply..."
                    />
                    <div className="flex gap-2">
                        <button 
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${theme === 'cyber'
                            ? 'bg-cyan-400/20 text-cyan-300 hover:bg-cyan-400/30 border border-cyan-400/30'
                            : 'bg-primary/20 text-primary-solid hover:bg-primary/30 border border-primary/40'
                          }`}
                          onClick={handleSend}
                        >
                          Send
                        </button>
                        <button 
                          className="px-4 py-2 border border-white/20 rounded-lg font-semibold text-sm text-muted-foreground hover:text-foreground hover:border-white/40 transition-all"
                          onClick={() => setShowReply(false)}
                        >
                          Cancel
                        </button>
                    </div>
                </div>
            )}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 space-y-3">
                    {comment.replies.map(r => (
                        <ChatBubble key={r.id} comment={r} postType={postType} isOP={isOP} onReply={onReply} theme={theme} />
                    ))}
                </div>
            )}
        </div>
    )
}
