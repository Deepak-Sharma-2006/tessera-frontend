import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';

export default function CollabPodInput({
    onSendMessage,
    uploading = false,
    attachment = null,
    onAttachmentChange = () => { },
    onAttachmentRemove = () => { }
}) {
    const [input, setInput] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const emojiPickerRef = useRef(null);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() && !attachment) return;
        onSendMessage(input, attachment);
        setInput("");
    };

    const handleFileSelect = (file) => {
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        const type = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
        onAttachmentChange({
            file,
            previewUrl,
            type,
            name: file.name
        });
        // Clear file input to prevent double-trigger
        if (imageInputRef.current) imageInputRef.current.value = '';
        if (fileInputRef.current) fileInputRef.current.value = '';
        setShowAttachmentMenu(false);
        document.querySelector('input[placeholder="Type a message..."]')?.focus();
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let item of items) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                handleFileSelect(file);
                break;
            }
        }
    };

    // SVG Icons
    const PlusIcon = () => (
        <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
    );

    const EmojiIcon = () => (
        <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24" className="text-cyan-400"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><circle cx="9" cy="9" r="1.5" fill="currentColor" /><circle cx="15" cy="9" r="1.5" fill="currentColor" /><path d="M8 14c1 1 2.5 1.5 4 1.5s3-.5 4-1.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
    );

    const SendIcon = () => (
        <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16151496 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.98721575 L3.03521743,10.4282088 C3.03521743,10.5853061 3.19218622,10.7424035 3.50612381,10.7424035 L16.6915026,11.5278905 C16.6915026,11.5278905 17.1624089,11.5278905 17.1624089,12.0592618 C17.1624089,12.5906331 16.6915026,12.4744748 16.6915026,12.4744748 Z" /></svg>
    );

    return (
        <div className="backdrop-blur-xl bg-cyan-950/20 border-t border-cyan-400/20 shadow-lg shadow-cyan-400/5">
            {/* Attachment Preview */}
            {attachment && (
                <div className="px-3 py-2 backdrop-blur-xl bg-cyan-400/10 border-b border-cyan-400/20 flex items-center gap-2">
                    {attachment.type === 'IMAGE' && (
                        <img
                            src={attachment.previewUrl}
                            alt="preview"
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                    )}
                    {attachment.type === 'FILE' && (
                        <div className="flex-shrink-0">
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                <polyline points="13 2 13 9 20 9" />
                            </svg>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate font-medium">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground/70">{attachment.type === "IMAGE" ? "Image" : "File"} ready to send</p>
                    </div>
                    <button onClick={() => onAttachmentRemove()} className="flex-shrink-0 text-muted-foreground/70 hover:text-cyan-300 transition-colors">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSend} className="px-3 py-3 flex items-center gap-2">
                <Button variant="ghost" size="icon" type="button" className="flex-shrink-0 text-cyan-400 hover:bg-cyan-400/10" title="Attachments" onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}>
                    <PlusIcon />
                </Button>
                <div className="relative">
                    <Button variant="ghost" size="icon" type="button" className="flex-shrink-0 text-cyan-400 hover:bg-cyan-400/10" title="Emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                        <EmojiIcon />
                    </Button>
                    {/* Emoji Picker Dropdown */}
                    {showEmojiPicker && (
                        <div ref={emojiPickerRef} className="absolute bottom-12 left-0 backdrop-blur-xl bg-cyan-950/30 border border-cyan-400/30 rounded-lg p-2 grid grid-cols-6 gap-1 z-50 w-48 max-h-60 overflow-y-auto shadow-lg shadow-cyan-400/10">
                            {['😀', '😂', '❤️', '🔥', '👍', '😍', '🎉', '😎', '👏', '💯', '✨', '🚀', '😴', '😤', '😱', '🤔', '😌', '🙏'].map((emoji, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        setInput(input + emoji);
                                        setShowEmojiPicker(false);
                                        document.querySelector('input[placeholder="Type a message..."]')?.focus();
                                    }}
                                    className="text-xl hover:bg-cyan-400/10 p-1 rounded transition cursor-pointer"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* INPUT WRAPPER: flex-1 ensures it stretches */}
                <div className="flex-1 backdrop-blur-xl bg-cyan-950/20 border border-cyan-400/30 rounded-lg px-4 py-2 flex items-center min-h-[44px]">
                    <input
                        className="w-full bg-transparent outline-none text-white placeholder-muted-foreground/60 border-none focus:ring-0 focus:outline-none"
                        type="text"
                        placeholder="Type a message..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onPaste={handlePaste}
                        autoComplete="off"
                        maxLength={1000}
                    />
                </div>

                <Button type="submit" variant="neon" size="icon" className="flex-shrink-0" disabled={!input.trim() && !attachment || uploading} title="Send message">
                    <SendIcon />
                </Button>
            </form>

            {/* Attachment Menu */}
            {showAttachmentMenu && (
            <div className="backdrop-blur-xl bg-cyan-950/20 border-t border-cyan-400/20 px-3 py-2 flex gap-3">
                <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-xl bg-cyan-400/15 hover:bg-cyan-400/25 text-sm text-white transition border border-cyan-400/30"
                >
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /><circle cx="9" cy="9" r="1.5" fill="currentColor" /><path d="M21 15l-5-5-5 5" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
                    Photos & Videos
                </button>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-xl bg-cyan-400/15 hover:bg-cyan-400/25 text-sm text-white transition border border-cyan-400/30"
                >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
                    Document
                </button>
            </div>
            )}

            {/* Hidden File Inputs */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={e => handleFileSelect(e.target.files?.[0])}
                className="hidden"
            />
            <input
                ref={fileInputRef}
                type="file"
                onChange={e => handleFileSelect(e.target.files?.[0])}
                className="hidden"
            />
        </div>
    );
}
