import { Card, CardHeader, CardContent } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { useTheme } from '@/lib/theme.js'
import { useEffect, useState, useRef } from 'react'
import api from '@/lib/api.js'
import SockJS from 'sockjs-client'
import { over } from 'stompjs'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const WS_URL = `${BASE_URL}/ws-studcollab`

export default function CampusOverview({ user }) {
  const { theme } = useTheme()
  
  // Stats state
  const [stats, setStats] = useState({
    totalStudents: 0,
    myTeams: 0,
    collaborations: 0
  })
  
  // Recent activity state
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // WebSocket state
  const stompClientRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)

  // Fetch campus stats on mount
  useEffect(() => {
    fetchCampusStats()
  }, [])

  // Setup WebSocket for live updates
  useEffect(() => {
    setupWebSocket()
    return () => {
      if (stompClientRef.current?.connected) {
        stompClientRef.current.disconnect()
      }
    }
  }, [])

  const fetchCampusStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch stats
      const statsRes = await api.get('/api/campus/stats')
      setStats(statsRes.data)
      console.log('✅ Campus Stats:', statsRes.data)

      // Fetch recent activities
      const activitiesRes = await api.get('/api/campus/activities')
      setRecentActivity(activitiesRes.data || [])
      console.log('✅ Recent Activities:', activitiesRes.data)
    } catch (err) {
      console.error('❌ Error fetching campus data:', err)
      setError('Failed to load campus overview')
    } finally {
      setLoading(false)
    }
  }

  const setupWebSocket = () => {
    try {
      const sock = new SockJS(WS_URL)
      const stomp = over(sock)

      stomp.connect({}, () => {
        console.log('✅ WebSocket connected for campus activities')
        setIsConnected(true)
        stompClientRef.current = stomp

        // Extract domain from user email
        const userDomain = user?.email?.split('@')[1] || ''
        if (userDomain) {
          const topic = `/topic/campus.activity.${userDomain}`
          console.log('📡 Subscribing to:', topic)

          stomp.subscribe(topic, (msg) => {
            try {
              const activity = JSON.parse(msg.body)
              console.log('📨 New activity:', activity)
              // Add new activity to top of list
              setRecentActivity(prev => [activity, ...prev].slice(0, 5))
            } catch (e) {
              console.error('Failed to parse activity message:', e)
            }
          })
        }
      }, (error) => {
        console.error('❌ WebSocket connection failed:', error)
        setIsConnected(false)
      })
    } catch (err) {
      console.error('❌ WebSocket setup error:', err)
    }
  }

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents },
    { label: 'My Teams', value: stats.myTeams },
    { label: 'Collaborations', value: stats.collaborations }
  ]

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Stats Grid - Only 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className={`${theme === 'windows1992' ? 'card-glass border-2 border-outset' : 'backdrop-blur-xl border border-white/10 hover:border-white/20 hover:shadow-lg hover:-translate-y-1'} text-center transition-all duration-500`}
            variant="glass"
          >
            <CardContent className="p-8 flex flex-col items-center justify-center">
              <div className={`font-bold tracking-tight ${theme === 'windows1992' ? 'text-cyan-400 text-6xl' : 'bg-gradient-to-br from-cyan-400 to-purple-500 bg-clip-text text-transparent text-6xl'}`}>
                {loading ? '...' : stat.value}
              </div>
              <div className={`text-muted-foreground/80 font-medium mt-4 ${theme === 'windows1992' ? 'text-sm font-bold text-cyan-400' : 'text-sm text-white'}`}>
                {stat.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity - Full Width */}
      <Card className={`${theme === 'windows1992' ? 'card-glass border-2 border-outset' : 'backdrop-blur-xl border border-white/10 hover:border-white/15 transition-all'}`}>
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold text-lg tracking-tight ${theme === 'windows1992' ? 'text-xs font-bold' : 'text-primary-foreground'}`}>
              {theme === 'windows1992' ? 'RECENT ACTIVITY' : 'Recent Activity'}
            </h3>
            <div className="text-xs text-muted-foreground/70">
              {isConnected ? '🟢 Live' : '🔴 Offline'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading activities...</div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No recent activities yet</div>
          ) : (
            recentActivity.map((activity) => (
              <div 
                key={activity.id || activity.timestamp} 
                className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${theme === 'windows1992' ? 'bg-muted border border-border rounded-none' : 'bg-white/5 border border-white/5 hover:bg-white/8 hover:border-white/10'}`}
              >
                <div className={`text-2xl flex-shrink-0 ${theme === 'windows1992' ? 'text-sm' : ''}`}>
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm truncate ${theme === 'windows1992' ? 'text-xs font-bold text-white' : 'text-white'}`}>
                    {activity.title}
                  </div>
                  <div className={`text-xs mt-1 ${theme === 'windows1992' ? 'text-xs text-white/70' : 'text-white/70'}`}>
                    {activity.timestamp 
                      ? new Date(activity.timestamp).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : 'just now'
                    } • {activity.participantCount} {activity.participantCount === 1 ? 'participant' : 'participants'}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}