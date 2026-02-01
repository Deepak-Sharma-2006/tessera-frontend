import { Card, CardHeader, CardContent } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { useTheme } from '@/lib/theme.js'

export default function CampusOverview() {
  const { theme } = useTheme()

  const stats = [
    { label: 'Active Students', value: '2,847', change: '+12%', color: 'text-green-600' },
    { label: 'Ongoing Projects', value: '156', change: '+8%', color: 'text-blue-600' },
    { label: 'Study Groups', value: '89', change: '+5%', color: 'text-purple-600' },
    { label: 'Events This Week', value: '24', change: '+15%', color: 'text-orange-600' }
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'collab',
      title: 'New AI Study Group formed',
      time: '2 hours ago',
      participants: 8,
      icon: '🤝'
    },
    {
      id: 2,
      type: 'project',
      title: 'Web Dev Bootcamp completed',
      time: '4 hours ago',
      participants: 24,
      icon: '🎓'
    },
    {
      id: 3,
      type: 'event',
      title: 'Tech Talk: Future of AI scheduled',
      time: '6 hours ago',
      participants: 156,
      icon: '📅'
    }
  ]

  const popularTopics = [
    { name: 'Machine Learning', posts: 89, trend: 'up' },
    { name: 'Web Development', posts: 67, trend: 'up' },
    { name: 'Data Structures', posts: 45, trend: 'stable' },
    { name: 'Mobile Apps', posts: 34, trend: 'down' },
    { name: 'Cybersecurity', posts: 28, trend: 'up' }
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className={`${theme === 'windows1992' ? 'card-glass border-2 border-outset' : 'backdrop-blur-xl border border-white/10 hover:border-white/20 hover:shadow-lg hover:-translate-y-1'} text-center transition-all duration-500`}
            variant="glass"
          >
            <CardContent className="p-8">
              <div className={`text-3xl font-bold tracking-tight ${theme === 'windows1992' ? 'text-primary text-sm' : 'bg-gradient-to-br from-primary-solid to-purple-500 bg-clip-text text-transparent'}`}>
                {stat.value}
              </div>
              <div className={`text-sm text-muted-foreground/80 font-medium mt-2 ${theme === 'windows1992' ? 'text-xs' : ''}`}>
                {stat.label}
              </div>
              <div className={`text-xs font-semibold mt-3 ${stat.color} ${theme === 'windows1992' ? 'text-xs' : ''}`}>
                {stat.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className={`${theme === 'windows1992' ? 'card-glass border-2 border-outset' : 'backdrop-blur-xl border border-white/10 hover:border-white/15 transition-all'}`}>
          <CardHeader className="pb-6">
            <h3 className={`font-semibold text-lg tracking-tight ${theme === 'windows1992' ? 'text-xs font-bold' : 'text-primary-foreground'}`}>
              {theme === 'windows1992' ? 'RECENT ACTIVITY' : 'Recent Activity'}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div 
                key={activity.id} 
                className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${theme === 'windows1992' ? 'bg-muted border border-border rounded-none' : 'bg-white/5 border border-white/5 hover:bg-white/8 hover:border-white/10'}`}
              >
                <div className={`text-2xl flex-shrink-0 ${theme === 'windows1992' ? 'text-sm' : ''}`}>
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm truncate ${theme === 'windows1992' ? 'text-xs font-bold' : 'text-foreground'}`}>
                    {activity.title}
                  </div>
                  <div className={`text-xs text-muted-foreground/70 mt-1 ${theme === 'windows1992' ? 'text-xs' : ''}`}>
                    {activity.time} • {activity.participants} participants
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Popular Topics */}
        <Card className={`${theme === 'windows1992' ? 'card-glass border-2 border-outset' : 'backdrop-blur-xl border border-white/10 hover:border-white/15 transition-all'}`}>
          <CardHeader className="pb-6">
            <h3 className={`font-semibold text-lg tracking-tight ${theme === 'windows1992' ? 'text-xs font-bold' : 'text-primary-foreground'}`}>
              {theme === 'windows1992' ? 'TRENDING TOPICS' : 'Trending Topics'}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {popularTopics.map((topic, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${theme === 'windows1992' ? 'bg-muted border border-border rounded-none' : 'bg-white/5 border border-white/5 hover:bg-white/8 hover:border-white/10'}`}
              >
                <div>
                  <div className={`font-medium text-sm ${theme === 'windows1992' ? 'text-xs font-bold' : 'text-foreground'}`}>
                    {topic.name}
                  </div>
                  <div className={`text-xs text-muted-foreground/70 mt-1 ${theme === 'windows1992' ? 'text-xs' : ''}`}>
                    {topic.posts} posts
                  </div>
                </div>
                <Badge 
                  variant={topic.trend === 'up' ? 'success' : topic.trend === 'down' ? 'destructive' : 'secondary'}
                  className={`flex-shrink-0 ${theme === 'windows1992' ? 'text-xs' : 'font-semibold'}`}
                >
                  {topic.trend === 'up' ? '↗️' : topic.trend === 'down' ? '↘️' : '→'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}