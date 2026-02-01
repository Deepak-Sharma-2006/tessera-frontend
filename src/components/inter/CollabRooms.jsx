import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardHeader, CardContent } from '@/components/ui/card.jsx'
import { Avatar } from '@/components/ui/avatar.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { useTheme } from '@/lib/theme.js'
import api from '@/lib/api.js'

export default function CollabRooms({ user, onNavigateToRoom, onEnterCollabRoom, onRefreshPosts }) {
  const { theme } = useTheme()
  const navigate = useNavigate()

  const [rooms, setRooms] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('ACTIVE')

  const currentUserId = user?.id || 'placeholder-user-id'

  // Fetch global collab rooms (GLOBAL scope)
  useEffect(() => {
    let mounted = true

    const fetchRooms = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch pods with GLOBAL scope using strict endpoint
        const response = await api.get('/pods/global')
        if (!mounted) return

        const globalRooms = (response.data || []).map(pod => ({
          id: pod.id,
          name: pod.name,
          title: pod.name,
          description: pod.description,
          memberIds: pod.memberIds || [],
          memberNames: pod.memberNames || [],
          adminIds: pod.adminIds || [],
          adminNames: pod.adminNames || [],
          ownerId: pod.ownerId,
          ownerName: pod.ownerName,
          creatorId: pod.creatorId,
          topics: pod.topics || [],
          status: pod.status || 'ACTIVE',
          type: pod.type,
          createdAt: pod.createdAt,
          scope: pod.scope,
          linkedPostId: pod.linkedPostId
        }))

        setRooms(globalRooms)
      } catch (err) {
        if (!mounted) return
        console.error('Failed to fetch collab rooms:', err)
        setError('Failed to load collaboration rooms')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchRooms()
    return () => { mounted = false }
  }, [])

  // Filter rooms based on active tab
  useEffect(() => {
    let filtered = rooms

    // Filter by tab (ACTIVE or JOINED)
    if (activeTab === 'JOINED') {
      // ✅ FIXED: Show rooms user is member of, OR rooms they created/own
      // Previously only showed memberIds, missing owned rooms
      filtered = filtered.filter(room => 
        room.memberIds.includes(currentUserId) || 
        room.ownerId === currentUserId || 
        room.creatorId === currentUserId
      )
    } else {
      // ACTIVE tab shows all rooms
      filtered = filtered.filter(room => room.status === 'ACTIVE')
    }

    setFilteredRooms(filtered)
  }, [rooms, activeTab, currentUserId])

  const handleEnterRoom = (room) => {
    // Navigate to the pod chat interface
    navigate(`/pod/${room.id}`)
  }

  const handleDeleteRoom = async (roomId, event) => {
    event.stopPropagation()
    if (!window.confirm('Delete this Collaboration Room? This cannot be undone.')) {
      return
    }

    try {
      const response = await api.delete(`/pods/${roomId}`)
      setRooms(rooms.filter(r => r.id !== roomId))

      // Trigger post tabs refresh to prevent ghost posts
      // This is especially important for COLLAB posts which are linked to rooms
      if (onRefreshPosts) {
        onRefreshPosts()
        console.log('✅ Post tabs refreshed after room deletion')
      }

      // Log the cascade delete flow for debugging
      if (response.data) {
        console.log('Room deletion metadata:', response.data)
      }
    } catch (err) {
      console.error('Failed to delete room:', err)
      alert('Failed to delete room')
    }
  }

  const isRoomOwner = (room) => {
    // ✅ FIXED: Allow delete if user is CREATOR OR current OWNER
    // This preserves delete access for creators who haven't transferred ownership
    // AND allows new owners to delete after ownership transfer
    return room.ownerId === currentUserId || room.creatorId === currentUserId
  }

  const isRoomMember = (room) => {
    return room.memberIds.includes(currentUserId)
  }

  const getStatusColor = (status) => {
    return {
      ACTIVE: theme === 'windows1992' ? '#008000' : '#10b981',
      INACTIVE: theme === 'windows1992' ? '#808080' : '#6b7280',
      FULL: theme === 'windows1992' ? '#FF8000' : '#f97316'
    }[status] || '#6b7280'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading collaboration rooms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold text-foreground ${theme === 'windows1992' ? 'text-lg font-bold' : ''}`}>
            {theme === 'windows1992' ? 'COLLAB ROOMS' : 'Collaboration Rooms'}
          </h2>
          <p className={`text-muted-foreground ${theme === 'windows1992' ? 'text-xs' : ''}`}>
            {theme === 'windows1992' ? 'CROSS-COLLEGE PROJECT SPACES' : 'Cross-college project collaboration spaces'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Standardized Pill Tabs - Collab Rooms */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border flex items-center justify-center gap-2 ${activeTab === 'ACTIVE'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-lg shadow-cyan-500/20'
            : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
            }`}
        >
          Active Rooms
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${activeTab === 'ACTIVE'
            ? 'bg-slate-900/40 text-cyan-300'
            : 'bg-slate-800 text-slate-400'
            }`}>
            {rooms.filter(r => r.status === 'ACTIVE').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('JOINED')}
          className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border flex items-center justify-center gap-2 ${activeTab === 'JOINED'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-lg shadow-cyan-500/20'
            : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
            }`}
        >
          My Rooms
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${activeTab === 'JOINED'
            ? 'bg-slate-900/40 text-cyan-300'
            : 'bg-slate-800 text-slate-400'
            }`}>
            {rooms.filter(r => r.memberIds.includes(currentUserId)).length}
          </span>
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRooms.map((room, index) => (
          <Card
            key={room.id}
            className={`${theme === 'windows1992' ? 'card-glass border-2 border-outset' : 'card-glass'} hover-lift transition-all duration-300 animate-in cursor-pointer`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className={`font-semibold text-foreground ${theme === 'windows1992' ? 'text-xs font-bold' : ''}`}>
                      {theme === 'windows1992' ? room.title.toUpperCase() : room.title}
                    </h3>
                  </div>
                  <p className={`text-sm text-muted-foreground line-clamp-2 ${theme === 'windows1992' ? 'text-xs' : ''}`}>
                    {room.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <div
                    className={`w-3 h-3 ${theme === 'windows1992' ? 'rounded-none border border-black' : 'rounded-full'} animate-pulse`}
                    style={{ backgroundColor: getStatusColor(room.status) }}
                  ></div>
                  {isRoomOwner(room) && (
                    <Badge
                      variant="secondary"
                      className={`text-xs whitespace-nowrap ${theme === 'windows1992' ? 'bg-yellow-200 text-black border-2 border-outset' : ''}`}
                    >
                      {theme === 'windows1992' ? 'OWNER' : '👑 Owner'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Topics */}
              {room.topics && room.topics.length > 0 && (
                <div>
                  <div className={`text-sm font-medium text-foreground mb-2 ${theme === 'windows1992' ? 'text-xs font-bold' : ''}`}>
                    {theme === 'windows1992' ? 'TOPICS' : 'Topics'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {room.topics.slice(0, 4).map((topic, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        size="sm"
                        className={`${theme === 'windows1992' ? 'text-xs border-2 border-outset bg-blue-100' : ''}`}
                      >
                        {theme === 'windows1992' ? topic.toUpperCase() : topic}
                      </Badge>
                    ))}
                    {room.topics.length > 4 && (
                      <Badge variant="outline" size="sm" className="text-xs">
                        +{room.topics.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Members Preview */}
              <div>
                <div className={`text-sm font-medium text-foreground mb-2 ${theme === 'windows1992' ? 'text-xs font-bold' : ''}`}>
                  {theme === 'windows1992' ? 'MEMBERS' : 'Members'} ({room.memberIds.length})
                </div>
                <div className="flex -space-x-2">
                  {room.memberIds.slice(0, 4).map((memberId, idx) => (
                    <Avatar
                      key={idx}
                      className={`w-8 h-8 border-2 border-background ${theme === 'windows1992' ? 'rounded-none bg-primary text-primary-foreground border-2 border-outset' : 'bg-gradient-to-br from-purple-500 to-pink-500'} text-white font-medium text-xs`}
                      title={memberId}
                    >
                      {memberId.charAt(0).toUpperCase()}
                    </Avatar>
                  ))}
                  {room.memberIds.length > 4 && (
                    <div className={`w-8 h-8 ${theme === 'windows1992' ? 'rounded-none bg-muted border-2 border-outset' : 'rounded-full bg-muted'} border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground`}>
                      +{room.memberIds.length - 4}
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between text-sm">
                <div className={`text-muted-foreground ${theme === 'windows1992' ? 'text-xs' : ''}`}>
                  <Badge variant="outline" className={`text-xs ${room.status === 'ACTIVE' ? 'bg-green-900/40 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
                    {room.status}
                  </Badge>
                </div>
                <div className={`font-medium ${theme === 'windows1992' ? 'text-xs font-bold' : ''}`}>
                  {isRoomMember(room) && (
                    <Badge variant="secondary" className="text-xs bg-cyan-900/40 text-cyan-300">
                      ✓ Joined
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button
                  onClick={() => handleEnterRoom(room)}
                  size="sm"
                  className={`flex-1 ${theme === 'windows1992' ? 'button-win95 text-xs' : 'bg-cyan-600 hover:bg-cyan-700'}`}
                >
                  {theme === 'windows1992' ? 'ENTER' : '🚀 Enter Room'}
                </Button>
                {isRoomOwner(room) && (
                  <Button
                    onClick={(e) => handleDeleteRoom(room.id, e)}
                    variant="destructive"
                    size="sm"
                    className={`${theme === 'windows1992' ? 'button-win95 text-xs' : ''}`}
                    title="Delete Room"
                  >
                    {theme === 'windows1992' ? 'X' : '🗑️'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredRooms.length === 0 && !loading && (
        <Card className={`${theme === 'windows1992' ? 'card-glass border-2 border-outset' : 'card-glass'} text-center py-12`}>
          <div className={`text-6xl mb-4 ${theme === 'windows1992' ? 'text-2xl' : ''}`}>
            {theme === 'windows1992' ? '404' : '🌐'}
          </div>
          <h3 className={`text-xl font-semibold text-foreground mb-2 ${theme === 'windows1992' ? 'text-sm font-bold' : ''}`}>
            {activeTab === 'JOINED' ? 'No Joined Rooms' : 'No Collaboration Rooms Found'}
          </h3>
          <p className={`text-muted-foreground mb-6 ${theme === 'windows1992' ? 'text-xs' : ''}`}>
            {activeTab === 'JOINED'
              ? 'Join a room from the Active tab to start collaborating'
              : 'Create a collaboration opportunity in the InterFeed or check back later'}
          </p>
          {activeTab === 'JOINED' && (
            <Button
              onClick={() => setActiveTab('ACTIVE')}
              className={`${theme === 'windows1992' ? 'button-win95 text-xs' : ''}`}
            >
              {theme === 'windows1992' ? 'VIEW ACTIVE ROOMS' : 'View Active Rooms'}
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}