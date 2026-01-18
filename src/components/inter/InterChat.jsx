// --- CHANGE THIS BLOCK ---
import { useState } from "react";
import { Card } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Avatar } from "@/components/ui/avatar.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";

const mockChats = [
  {
    id: 1,
    user: {
      name: 'Ananya Sharma',
      college: 'IIT Delhi',
      avatar: 'A',
      isOnline: true,
      lastSeen: 'Active now'
    },
    lastMessage: 'Thanks for the collaboration on the AI project!',
    lastMessageTime: '2 hours ago',
    unreadCount: 2,
    messages: [
      {
        id: 101,
        senderId: 1,
        senderName: 'Ananya Sharma',
        content: 'Hey! I saw your post about the machine learning project. Interested in collaborating?',
        timestamp: '2024-02-14T10:00:00Z',
        isOwnMessage: false
      },
      {
        id: 102,
        senderId: 'current',
        senderName: 'You',
        content: 'Absolutely! I was looking for someone with your expertise in NLP.',
        timestamp: '2024-02-14T10:15:00Z',
        isOwnMessage: true
      },
      {
        id: 103,
        senderId: 1,
        senderName: 'Ananya Sharma',
        content: 'Great! Should we start a collab room to discuss the project details?',
        timestamp: '2024-02-14T10:30:00Z',
        isOwnMessage: false
      },
      {
        id: 104,
        senderId: 1,
        senderName: 'Ananya Sharma',
        content: 'Thanks for the collaboration on the AI project!',
        timestamp: '2024-02-14T14:00:00Z',
        isOwnMessage: false
      }
    ]
  },
  {
    id: 2,
    user: {
      name: 'Rahul Gupta',
      college: 'BITS Pilani',
      avatar: 'R',
      isOnline: false,
      lastSeen: '1 day ago'
    },
    lastMessage: 'Let me know when you\'re free for the hackathon prep!',
    lastMessageTime: '1 day ago',
    unreadCount: 0,
    messages: [
      {
        id: 201,
        senderId: 2,
        senderName: 'Rahul Gupta',
        content: 'Hey! Are you participating in the upcoming hackathon?',
        timestamp: '2024-02-13T15:00:00Z',
        isOwnMessage: false
      },
      {
        id: 202,
        senderId: 'current',
        senderName: 'You',
        content: 'Yes! Looking for team members. Interested?',
        timestamp: '2024-02-13T15:30:00Z',
        isOwnMessage: true
      },
      {
        id: 203,
        senderId: 2,
        senderName: 'Rahul Gupta',
        content: 'Let me know when you\'re free for the hackathon prep!',
        timestamp: '2024-02-13T16:00:00Z',
        isOwnMessage: false
      }
    ]
  },
  {
    id: 3,
    user: {
      name: 'Priya Patel',
      college: 'VIT Chennai',
      avatar: 'P',
      isOnline: true,
      lastSeen: 'Active now'
    },
    lastMessage: 'The UI designs look amazing! 🎨',
    lastMessageTime: '30 minutes ago',
    unreadCount: 1,
    messages: [
      {
        id: 301,
        senderId: 3,
        senderName: 'Priya Patel',
        content: 'Hi! I loved your portfolio. Could you review my UI designs?',
        timestamp: '2024-02-14T13:00:00Z',
        isOwnMessage: false
      },
      {
        id: 302,
        senderId: 'current',
        senderName: 'You',
        content: 'Sure! Send them over, I\'d be happy to help.',
        timestamp: '2024-02-14T13:15:00Z',
        isOwnMessage: true
      },
      {
        id: 303,
        senderId: 3,
        senderName: 'Priya Patel',
        content: 'The UI designs look amazing! 🎨',
        timestamp: '2024-02-14T15:30:00Z',
        isOwnMessage: false
      }
    ]
  }
]

const reportReasons = [
  'Spam or unwanted messages',
  'Harassment or bullying',
  'Inappropriate content',
  'Impersonation',
  'Hate speech',
  'Other'
]

export default function InterChat({ user }) {
  const [chats, setChats] = useState(mockChats)
  const [selectedChat, setSelectedChat] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportData, setReportData] = useState({
    reason: '',
    details: '',
    targetUserId: null
  })

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return

    const message = {
      id: Date.now(),
      senderId: 'current',
      senderName: 'You',
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isOwnMessage: true
    }

    // Update the chat with new message
    setChats(chats.map(chat => 
      chat.id === selectedChat.id
        ? {
            ...chat,
            messages: [...chat.messages, message],
            lastMessage: newMessage.trim(),
            lastMessageTime: 'Just now'
          }
        : chat
    ))

    // Update selected chat
    setSelectedChat({
      ...selectedChat,
      messages: [...selectedChat.messages, message],
      lastMessage: newMessage.trim(),
      lastMessageTime: 'Just now'
    })

    setNewMessage('')
  }

  const handleReportUser = (userId) => {
    setReportData({ ...reportData, targetUserId: userId })
    setShowReportModal(true)
  }

  const submitReport = () => {
    if (!reportData.reason || !reportData.details.trim()) {
      alert('Please select a reason and provide details')
      return
    }

    const targetChat = chats.find(chat => chat.id === reportData.targetUserId)
    
    // In real implementation, this would send to the user's college moderator
    alert(`Report submitted successfully!\n\nUser: ${targetChat?.user.name}\nCollege: ${targetChat?.user.college}\nReason: ${reportData.reason}\n\nThis report has been sent to ${targetChat?.user.college}'s moderator team for review.`)
    
    setShowReportModal(false)
    setReportData({ reason: '', details: '', targetUserId: null })
  }

  const markChatAsRead = (chatId) => {
    setChats(chats.map(chat =>
      chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
    ))
  }

  const totalUnreadCount = chats.reduce((sum, chat) => sum + chat.unreadCount, 0)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">💬 Inter-College Chats</h2>
        <p className="text-muted-foreground">Direct messaging with students across colleges</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 h-[70vh]">
        {/* Chat List */}
        <Card className="p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Messages</h3>
            {totalUnreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {totalUnreadCount} unread
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  setSelectedChat(chat)
                  markChatAsRead(chat.id)
                }}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedChat?.id === chat.id
                    ? 'bg-primary/10 border-2 border-primary/20'
                    : 'hover:bg-muted/50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {chat.user.avatar}
                    </Avatar>
                    {chat.user.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                    {chat.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate">{chat.user.name}</span>
                      <span className="text-xs text-muted-foreground">{chat.lastMessageTime}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{chat.user.college}</div>
                    <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {chats.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-muted-foreground text-sm">No chats yet</p>
            </div>
          )}
        </Card>

        {/* Chat Messages */}
        <Card className="md:col-span-2 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {selectedChat.user.avatar}
                    </Avatar>
                    {selectedChat.user.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">{selectedChat.user.name}</h4>
                    <div className="text-sm text-muted-foreground">
                      {selectedChat.user.college} • {selectedChat.user.lastSeen}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReportUser(selectedChat.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  🚨 Report
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {selectedChat.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-3 rounded-lg ${
                      message.isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <div className={`text-xs mt-1 ${
                        message.isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="font-semibold text-lg mb-2">Select a chat to start messaging</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the left to view messages
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Report User Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-red-600">🚨 Report User</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowReportModal(false)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Reports are sent to the user's college moderator team for review. Please provide accurate information.
                </p>
              </div>

              <div>
                <label className="block font-medium mb-2">Reason for reporting</label>
                <select
                  value={reportData.reason}
                  onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg"
                  required
                >
                  <option value="">Select a reason...</option>
                  {reportReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-2">Additional details</label>
                <Textarea
                  placeholder="Please provide specific details about the issue..."
                  value={reportData.details}
                  onChange={(e) => setReportData({ ...reportData, details: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="bg-red-50 p-3 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  This report will be sent to <strong>{chats.find(c => c.id === reportData.targetUserId)?.user.college}</strong>'s moderator team.
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={submitReport}
                  disabled={!reportData.reason || !reportData.details.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Submit Report
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowReportModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
        <h4 className="font-semibold text-lg mb-3 text-blue-800">💬 Cross-College Messaging</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <strong>Direct Communication:</strong> Chat one-on-one with students from other colleges
          </div>
          <div>
            <strong>Report System:</strong> Reports are sent to the user's college moderator for review
          </div>
        </div>
        <div className="mt-3 text-xs text-blue-600">
          🛡️ All conversations are monitored for safety and can be reported if inappropriate
        </div>
      </div>
    </div>
  )
}