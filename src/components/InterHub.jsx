import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardHeader, CardContent } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import InterFeed from './inter/InterFeed.jsx'
import CollabRooms from './inter/CollabRooms.jsx'
import Discovery from './inter/Discovery.jsx'
import InterChat from './inter/InterChat.jsx'
import { useTheme } from '@/lib/theme.js'

export default function InterHub({
  user,
  initialView = 'feed',
  onNavigateToRoom,
  onCreateCollabRoom,
  onEnterCollabRoom
}) {
  const { theme } = useTheme()
  const [activeView, setActiveView] = useState(initialView)
  const interFeedRef = useRef(null) // Ref to trigger feed refresh from room deletion

  // Update view when initialView changes
  useEffect(() => {
    setActiveView(initialView)
  }, [initialView])

  const navItems = [
    {
      id: 'feed',
      label: 'Global Feed',
      icon: '🌐',
      description: 'Cross-college discussions'
    },
    {
      id: 'rooms',
      label: 'Collab Rooms',
      icon: '🚀',
      description: 'Project collaboration spaces'
    },
    {
      id: 'discovery',
      label: 'Discovery',
      icon: '🔍',
      description: 'Find peers across colleges'
    },
    {
      id: 'chat',
      label: 'Messages',
      icon: '💬',
      description: 'Direct conversations'
    }
  ]

  const getNavItemStyles = (itemId) => {
    const isActive = activeView === itemId

    if (theme === 'windows1992') {
      return `
        group relative flex items-center space-x-3 px-6 py-4 rounded-none border-2 transition-all duration-500 cursor-pointer overflow-hidden
        ${isActive
          ? 'bg-primary text-primary-foreground border-inset shadow-inset scale-105'
          : 'text-muted-foreground hover:text-foreground glass hover:border-primary border-outset hover:bg-muted button-win95'
        }
        press-effect
      `
    }

    // Modern theme - enhanced active state with color tint, increased opacity, and glow
    return `
      group relative flex items-center space-x-3 px-6 py-4 rounded-lg transition-all duration-500 cursor-pointer overflow-hidden backdrop-blur-xl border
      ${isActive
        ? theme === 'cyber'
          ? 'bg-cyan-400/25 text-cyan-200 border-cyan-400/50 shadow-lg shadow-cyan-400/30 scale-105'
          : 'bg-primary/25 text-primary-solid border-primary/50 shadow-lg shadow-primary/30 scale-105'
        : theme === 'cyber'
          ? 'text-muted-foreground/70 border-white/10 hover:bg-white/5 hover:border-white/20 hover:shadow-sm'
          : 'text-muted-foreground/70 border-white/10 hover:bg-white/5 hover:border-white/20 hover:shadow-sm'
      }
      press-effect
    `
  }

  return (
    <div className="space-y-8 py-6">
      {/* Navigation */}
      <div className="flex flex-wrap gap-4 justify-center px-2">
        {navItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={getNavItemStyles(item.id)}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Button background shimmer (not in windows1992) */}
            {theme !== 'windows1992' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            )}

            <span className={`text-2xl transition-all duration-500 ${theme === 'windows1992' ? 'text-sm' : 'group-hover:scale-110'} relative z-10`}>
              {theme === 'windows1992' ?
                ({ feed: '💬', rooms: '🚀', discovery: '🔍', chat: '📧' }[item.id] || item.icon) :
                item.icon
              }
            </span>
            <div className="flex-1 text-left relative z-10">
              <div className={`font-semibold tracking-wide ${theme === 'windows1992' ? 'text-xs font-bold' : 'text-sm'}`}>
                {theme === 'windows1992' ? item.label.toUpperCase() : item.label}
              </div>
              <div className={`text-xs opacity-60 transition-opacity ${theme === 'windows1992' ? 'text-xs' : ''}`}>
                {theme === 'windows1992' ? item.description.toUpperCase() : item.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="animate-in slide-up">
        {activeView === 'feed' && <InterFeed user={user} onCreateCollabRoom={onCreateCollabRoom} ref={interFeedRef} />}
        {activeView === 'rooms' && (
          <CollabRooms
            user={user}
            onNavigateToRoom={onNavigateToRoom}
            onEnterCollabRoom={onEnterCollabRoom}
            onRefreshPosts={() => {
              // Trigger refresh in InterFeed when a room is deleted
              if (interFeedRef.current?.triggerRefresh) {
                interFeedRef.current.triggerRefresh();
              }
            }}
          />
        )}
        {activeView === 'discovery' && <Discovery user={user} />}
        {activeView === 'chat' && <InterChat user={user} />}
      </div>
    </div>
  )
}