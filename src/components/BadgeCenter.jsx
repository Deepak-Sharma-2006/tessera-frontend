import { useState, useEffect } from 'react'
import { Card } from './ui/card.jsx'
import { Button } from './ui/button.jsx'
import { Badge } from './ui/badge.jsx'
import { Avatar } from './ui/avatar.jsx'
import axios from 'axios'

const powerFiveBadges = [
  { id: 'founding-dev', name: 'Founding Dev', icon: '💻', tier: 'Legendary', color: 'from-yellow-500 to-orange-600', description: 'System Architect', progress: { current: 0, total: 1 }, isUnlocked: false, isActive: false, perks: ['Developer access'] },
  { id: 'campus-catalyst', name: 'Campus Catalyst', icon: '📢', tier: 'Epic', color: 'from-blue-500 to-purple-600', description: 'Verified College Head', progress: { current: 1, total: 1 }, isUnlocked: false, isActive: false, perks: ['Event creation access'] },
  { id: 'pod-pioneer', name: 'Pod Pioneer', icon: '🌱', tier: 'Common', color: 'from-green-500 to-emerald-600', description: 'First Pod Entry', progress: { current: 0, total: 1 }, isUnlocked: false, isActive: false, perks: ['Pod history tracking'] },
  { id: 'bridge-builder', name: 'Bridge Builder', icon: '🌉', tier: 'Uncommon', color: 'from-cyan-500 to-blue-500', description: 'Inter-college collab', progress: { current: 0, total: 1 }, isUnlocked: false, isActive: false, perks: ['Cross-campus features'] },
  { id: 'skill-sage', name: 'Skill Sage', icon: '🧠', tier: 'Rare', color: 'from-pink-500 to-rose-600', description: '3+ endorsements', progress: { current: 0, total: 3 }, isUnlocked: false, isActive: false, perks: ['Skill showcase boost'] }
];

// MVP Power Five badges
const mvpBadges = [
  {
    id: 'founding-dev',
    name: 'Founding Dev',
    icon: '💻',
    tier: 'Legendary',
    color: 'from-yellow-400 to-orange-500',
    description: 'System Architect'
  },
  {
    id: 'campus-catalyst',
    name: 'Campus Catalyst',
    icon: '📢',
    tier: 'Epic',
    color: 'from-blue-400 to-purple-600',
    description: 'Verified Event Creator'
  },
  {
    id: 'pod-pioneer',
    name: 'Pod Pioneer',
    icon: '🌱',
    tier: 'Common',
    color: 'from-green-400 to-emerald-500',
    description: 'First Pod Entry'
  },
  {
    id: 'bridge-builder',
    name: 'Bridge Builder',
    icon: '🌉',
    tier: 'Uncommon',
    color: 'from-cyan-400 to-blue-500',
    description: 'Cross-College Link'
  },
  {
    id: 'skill-sage',
    name: 'Skill Sage',
    icon: '🧠',
    tier: 'Rare',
    color: 'from-pink-400 to-rose-600',
    description: 'Skill Mastery'
  }
];

const badgeCategories = [
  {
    id: 'power-five',
    name: 'Power Five Achievements',
    color: 'orange',
    badges: powerFiveBadges
  }
];

// Single moderator-exclusive badge (cannot be earned through activities)
const moderatorBadge = {
  id: 'signal-guardian',
  name: 'Signal Guardian',
  icon: '🛡️',
  tier: 'Legendary',
  description: 'Platform enforcer. Community mentor.',
  progress: { current: 1, total: 1 },
  isUnlocked: false, // ✅ Will be set dynamically based on user.badges
  isActive: false, // ✅ Will be set dynamically
  perks: ['Moderation tools', 'Community leadership', 'Special recognition'],
  isModeratorOnly: true,
  cannotBeHidden: true,
  isPermanent: true
};

// 5 Moderation badges for sub-moderators/community wardens
const moderationBadges = [
  {
    id: 'chat-mod',
    name: 'Chat Warden',
    icon: '💬',
    tier: 'Basic',
    nextTier: 'Advanced',
    description: 'Moderates chat and discussion areas',
    progress: { current: 1, total: 1 },
    isUnlocked: false,
    isActive: false,
    perks: ['Chat moderation tools', 'Warning powers'],
    cannotBeHidden: true,
    duration: 'Permanent',
    responsibility: 'Chat & Discussion Moderation',
    isModeratorBadge: true
  },
  {
    id: 'post-mod',
    name: 'Content Guardian',
    icon: '📝',
    tier: 'Advanced',
    nextTier: 'Elite',
    description: 'Moderates posts and content quality',
    progress: { current: 1, total: 1 },
    isUnlocked: false,
    isActive: false,
    perks: ['Post moderation', 'Content approval'],
    cannotBeHidden: true,
    duration: 'Permanent',
    responsibility: 'Post & Content Moderation',
    isModeratorBadge: true
  },
  {
    id: 'event-mod',
    name: 'Event Coordinator',
    icon: '🎯',
    tier: 'Elite',
    description: 'Manages events and activities',
    progress: { current: 1, total: 1 },
    isUnlocked: false,
    isActive: false,
    perks: ['Event creation', 'Activity management'],
    cannotBeHidden: true,
    duration: 'Permanent',
    responsibility: 'Event & Activity Management',
    isModeratorBadge: true
  },
  {
    id: 'pod-mod',
    name: 'Collab Supervisor',
    icon: '🏗️',
    tier: 'Advanced',
    description: 'Supervises collaboration pods and rooms',
    progress: { current: 1, total: 1 },
    isUnlocked: false,
    isActive: false,
    perks: ['Pod oversight', 'Collaboration tools'],
    cannotBeHidden: true,
    duration: 'Permanent',
    responsibility: 'Collaboration Space Management',
    isModeratorBadge: true
  },
  {
    id: 'community-lead',
    name: 'Community Leader',
    icon: '👑',
    tier: 'Elite',
    description: 'Overall community leadership and guidance',
    progress: { current: 1, total: 1 },
    isUnlocked: false,
    isActive: false,
    perks: ['Full community tools', 'Leadership status'],
    cannotBeHidden: true,
    duration: 'Permanent',
    responsibility: 'Community Leadership',
    isModeratorBadge: true
  }
];

// 5 Penalty badges for rule violations
const penaltyBadges = [
  {
    id: 'spammer',
    name: 'Spam Alert',
    icon: '🚫',
    tier: 'Warning',
    nextTier: 'Minor',
    description: 'Issued for spam or repetitive content',
    progress: { current: 1, total: 1 },
    isUnlocked: true,
    isActive: true,
    perks: [],
    cannotBeHidden: true,
    duration: '3 days',
    expiresAt: '2024-02-18',
    isPenaltyBadge: true,
    offense: 'Excessive posting in multiple channels',
    visibilityLevel: 'Profile, Posts, Comments, Chats'
  },
  {
    id: 'toxic-behavior',
    name: 'Behavior Warning',
    icon: '⚠️',
    tier: 'Minor',
    nextTier: 'Major',
    description: 'Warning for toxic or inappropriate behavior',
    progress: { current: 1, total: 1 },
    isUnlocked: false,
    isActive: false,
    perks: [],
    cannotBeHidden: true,
    duration: '7 days',
    expiresAt: null,
    isPenaltyBadge: true,
    offense: 'Inappropriate language and harassment',
    visibilityLevel: 'Profile, Posts, Comments, Chats'
  },
  {
    id: 'fake-info',
    name: 'Misinformation Flag',
    icon: '🔍',
    tier: 'Major',
    nextTier: 'Severe',
    description: 'Sharing false or misleading information',
    progress: { current: 1, total: 1 },
    isUnlocked: false,
    isActive: false,
    perks: [],
    cannotBeHidden: true,
    duration: '30 days',
    expiresAt: null,
    isPenaltyBadge: true,
    offense: 'Spreading misinformation about academic topics',
    visibilityLevel: 'Profile, Posts, Comments, Chats'
  },
  {
    id: 'abuse-violation',
    name: 'Abuse Violation',
    icon: '🚨',
    tier: 'Severe',
    nextTier: 'Permanent',
    description: 'Serious abuse or harassment violation',
    progress: { current: 1, total: 1 },
    isUnlocked: false,
    isActive: false,
    perks: [],
    cannotBeHidden: true,
    duration: '90 days',
    expiresAt: null,
    isPenaltyBadge: true,
    offense: 'Severe harassment of community members',
    visibilityLevel: 'Profile, Posts, Comments, Chats'
  },
  {
    id: 'permanent-record',
    name: 'Permanent Mark',
    icon: '⛔',
    tier: 'Permanent',
    description: 'Permanent mark on community record',
    progress: { current: 1, total: 1 },
    isUnlocked: false,
    isActive: false,
    perks: [],
    cannotBeHidden: true,
    duration: 'Permanent',
    expiresAt: null,
    isPenaltyBadge: true,
    offense: 'Multiple severe violations or illegal content',
    visibilityLevel: 'Profile, Posts, Comments, Chats'
  }
]

export default function BadgeCenter({ user, setUser }) {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // ✅ Sync badges on mount to ensure isDev and role flags unlock badges immediately
  useEffect(() => {
    if (user?._id) {
      axios.post(`/api/users/${user._id}/sync-badges`)
        .then(res => {
          // Update parent component's user state with synced badges
          if (res.data && setUser) {
            setUser(res.data);
            console.log('✓ Badges synced and user state updated');
          }
        })
        .catch(err => console.log('Badge sync completed or error:', err.message))
    }
  }, [user?._id, setUser])
  const [selectedBadge, setSelectedBadge] = useState(null)

  // ✅ STRICT DATA-DRIVEN BADGE UNLOCK LOGIC (100% from MongoDB Atlas)
  // Update Power Five badges with dynamic unlock status based on REAL user.badges array only
  
  // 1. FOUNDING DEV: Unlock ONLY if in user.badges array
  powerFiveBadges[0].isUnlocked = user?.badges?.includes('Founding Dev') || false;
  powerFiveBadges[0].progress = { current: user?.badges?.includes('Founding Dev') ? 1 : 0, total: 1 };
  
  // 2. CAMPUS CATALYST: Unlock ONLY if in user.badges array
  powerFiveBadges[1].isUnlocked = user?.badges?.includes('Campus Catalyst') || false;
  powerFiveBadges[1].progress = { current: user?.badges?.includes('Campus Catalyst') ? 1 : 0, total: 1 };
  
  // 3. POD PIONEER: Unlock ONLY if in user.badges array
  powerFiveBadges[2].isUnlocked = user?.badges?.includes('Pod Pioneer') || false;
  powerFiveBadges[2].progress = { current: user?.badges?.includes('Pod Pioneer') ? 1 : 0, total: 1 };
  
  // 4. BRIDGE BUILDER: Unlock ONLY if in user.badges array
  powerFiveBadges[3].isUnlocked = user?.badges?.includes('Bridge Builder') || false;
  powerFiveBadges[3].progress = { current: user?.badges?.includes('Bridge Builder') ? 1 : 0, total: 1 };
  
  // 5. SKILL SAGE: Unlock ONLY if in user.badges array
  powerFiveBadges[4].isUnlocked = user?.badges?.includes('Skill Sage') || false;
  powerFiveBadges[4].progress = { 
    current: Math.min(user?.endorsementsCount || 0, 3), 
    total: 3 
  };

  // ✅ SIGNAL GUARDIAN: ONLY if in user.badges array (no hardcoded checks)
  moderatorBadge.isUnlocked = user?.badges?.includes('Signal Guardian') || false;
  moderatorBadge.isActive = user?.badges?.includes('Signal Guardian') || false;

  // ✅ Check user status - 100% based on REAL badges from MongoDB
  const isModerator = user?.badges?.includes('Signal Guardian') || false;
  const hasModerationBadges = user?.badges?.some(b => 
    ['Chat Warden', 'Content Guardian', 'Event Coordinator', 'Collab Supervisor', 'Community Leader'].includes(b)
  ) || false;
  const hasPenaltyBadges = penaltyBadges.some(badge => badge.isUnlocked)

  const allBadges = badgeCategories.flatMap(cat => cat.badges.map(badge => ({ ...badge, category: cat.name, categoryColor: cat.color })))
  const earnedBadges = allBadges.filter(badge => badge.isUnlocked)
  const evolvingBadges = allBadges.filter(badge => !badge.isUnlocked && badge.progress.current > 0)

  const tabs = [
    { id: 'all', label: 'All Badges', icon: '🏅' },
    { id: 'earned', label: 'Earned Badges', icon: '✅' },
    { id: 'evolving', label: 'Evolving Badges', icon: '📈' },
    ...(isModerator ? [{ id: 'mod-badge', label: 'Mod Badge', icon: '🛡️' }] : []),
    ...(hasModerationBadges ? [{ id: 'moderation-badges', label: 'Moderation Badges', icon: '🛡️' }] : []),
    ...(hasPenaltyBadges ? [{ id: 'penalty-badges', label: 'Penalty Badges', icon: '🚫' }] : [])
  ]

  const getBadgesForTab = () => {
    switch (activeTab) {
      case 'earned':
        return earnedBadges
      case 'evolving':
        return evolvingBadges
      case 'mod-badge':
        return isModerator ? [moderatorBadge] : []
      case 'moderation-badges':
        return hasModerationBadges ? moderationBadges.filter(badge => badge.isUnlocked) : []
      case 'penalty-badges':
        return hasPenaltyBadges ? penaltyBadges.filter(badge => badge.isUnlocked) : []
      default:
        return allBadges
    }
  }

  const getFilteredBadges = () => {
    const badges = getBadgesForTab()
    if (selectedCategory === 'all' || activeTab !== 'all') return badges
    return badges.filter(badge => {
      const category = badgeCategories.find(cat => cat.badges.some(b => b.id === badge.id))
      return category?.id === selectedCategory
    })
  }

  const getTierColor = (tier) => {
    const colors = {
      'Common': 'text-gray-600 bg-gray-100',
      'Uncommon': 'text-green-600 bg-green-100',
      'Rare': 'text-blue-600 bg-blue-100',
      'Epic': 'text-purple-600 bg-purple-100',
      'Legendary': 'text-yellow-600 bg-yellow-100',
      'Basic': 'text-blue-600 bg-blue-100',
      'Advanced': 'text-purple-600 bg-purple-100',
      'Elite': 'text-yellow-600 bg-yellow-100',
      'Warning': 'text-orange-600 bg-orange-100',
      'Minor': 'text-red-600 bg-red-100',
      'Major': 'text-red-700 bg-red-200',
      'Severe': 'text-red-800 bg-red-300',
      'Permanent': 'text-black bg-red-400'
    }
    return colors[tier] || 'text-gray-600 bg-gray-100'
  }

  const getTierStars = (tier) => {
    const stars = {
      'Common': '★',
      'Uncommon': '★★',
      'Rare': '★★★',
      'Epic': '★★★★',
      'Legendary': '★★★★★',
      'Basic': '⚡',
      'Advanced': '⚡⚡',
      'Elite': '⚡⚡⚡',
      'Warning': '⚠️',
      'Minor': '⚠️⚠️',
      'Major': '🚨',
      'Severe': '🚨🚨',
      'Permanent': '⛔'
    }
    return stars[tier] || '★'
  }

  const getActiveBadges = () => {
    const regularBadges = allBadges.filter(badge => badge.isActive && badge.isUnlocked)
    const specialBadges = []
    
    // Always include moderator badge if user has it
    if (isModerator) {
      specialBadges.push(moderatorBadge)
    }
    
    // Add active moderation badges (cannot be hidden)
    if (hasModerationBadges) {
      const activeModerationBadges = moderationBadges.filter(badge => badge.isUnlocked && badge.isActive)
      specialBadges.push(...activeModerationBadges)
    }
    
    // Add active penalty badges (cannot be hidden)
    const activePenaltyBadges = penaltyBadges.filter(badge => badge.isUnlocked && badge.isActive)
    specialBadges.push(...activePenaltyBadges)
    
    // Combine: special badges + up to remaining slots of regular badges
    const maxRegularBadges = Math.max(0, 3 - specialBadges.length)
    return [...specialBadges, ...regularBadges.slice(0, maxRegularBadges)]
  }

  const toggleBadgeActive = (badgeId) => {
    const activeBadges = getActiveBadges()
    const badge = allBadges.find(b => b.id === badgeId)
    
    if (!badge || !badge.isUnlocked) return
    
    // Cannot toggle special badges
    if (badgeId === 'signal-guardian' || 
        moderationBadges.some(mb => mb.id === badgeId) || 
        penaltyBadges.some(pb => pb.id === badgeId)) {
      alert('Special badges cannot be hidden or deactivated.')
      return
    }
    
    // Check if adding would exceed limit
    const nonSpecialBadgesActive = activeBadges.filter(b => 
      b.id !== 'signal-guardian' && 
      !moderationBadges.some(mb => mb.id === b.id) &&
      !penaltyBadges.some(pb => pb.id === b.id)
    ).length
    
    const specialBadgesCount = activeBadges.length - nonSpecialBadgesActive
    
    if (nonSpecialBadgesActive >= (3 - specialBadgesCount) && !badge.isActive) {
      alert('You can only display 3 badges total. Special badges are always visible.')
      return
    }

    badgeCategories.forEach(category => {
      category.badges.forEach(b => {
        if (b.id === badgeId) {
          b.isActive = !b.isActive
        }
      })
    })
  }

  const getRemainingTime = (expiresAt) => {
    if (!expiresAt) return null
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days} days remaining`
    return `${hours} hours remaining`
  }

  const totalBadges = allBadges.length + (isModerator ? 1 : 0) + moderationBadges.length + penaltyBadges.length
  const totalEarned = earnedBadges.length + (isModerator ? 1 : 0) + 
    moderationBadges.filter(b => b.isUnlocked).length + 
    penaltyBadges.filter(b => b.isUnlocked).length

  return (
    <div className="badge-center-ui space-y-8">
      {/* Top Navigation Tabs */}
      <div className="flex flex-wrap justify-center gap-2 p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-lg transition-all duration-200 font-medium backdrop-blur-xl border ${
              activeTab === tab.id
                ? 'bg-cyan-400/25 text-cyan-200 border-cyan-400/50 shadow-lg shadow-cyan-400/30 scale-105'
                : 'text-muted-foreground/70 border-white/15 bg-white/8 hover:bg-white/12 hover:border-white/20'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Active Badges Strip */}
      <div className="component-profile-badge-strip backdrop-blur-xl bg-gradient-to-br from-cyan-950/20 via-deep-obsidian to-cyan-950/20 p-6 rounded-2xl border border-cyan-400/30 shadow-lg shadow-cyan-400/10">
        <h3 className="font-semibold text-lg mb-4 text-center text-cyan-300">Featured Badges (Displayed on Profile)</h3>
        <div className="flex justify-center space-x-4">
          {getActiveBadges().map((badge) => (
            <div 
              key={badge.id} 
              className={`flex flex-col items-center p-4 rounded-xl border-2 backdrop-blur-xl transition-all relative ${
                badge.tier === 'Legendary' || badge.tier === 'Elite' ? 'border-cyan-400/50 bg-cyan-400/15 shadow-lg shadow-cyan-400/20' : 
                badge.isPenaltyBadge ? 'border-magenta-400/50 bg-magenta-400/15 shadow-lg shadow-magenta-400/20' : 
                badge.isModeratorBadge ? 'border-cyan-400/50 bg-cyan-400/15 shadow-lg shadow-cyan-400/20' :
                'border-cyan-400/30 bg-cyan-950/20'
              }`}
            >
              {/* Cannot hide indicator for special badges */}
              {(badge.cannotBeHidden || badge.id === 'signal-guardian') && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-magenta-500 rounded-full flex items-center justify-center shadow-lg shadow-magenta-500/50">
                  <span className="text-white text-xs">🔒</span>
                </div>
              )}
              
              <div className={`text-3xl mb-2 ${badge.tier === 'Legendary' || badge.tier === 'Elite' ? 'animate-pulse' : ''} ${badge.isPenaltyBadge ? 'opacity-80' : ''}`}>
                {badge.icon}
              </div>
              <span className="font-medium text-sm text-center text-white">{badge.name}</span>
              <Badge className={`${getTierColor(badge.tier)} text-xs mt-1`}>
                {getTierStars(badge.tier)}
              </Badge>
              
              {/* Duration indicator for timed badges */}
              {badge.duration && badge.duration !== 'Permanent' && (
                <div className="text-xs text-cyan-300 mt-1">
                  {getRemainingTime(badge.expiresAt)}
                </div>
              )}
            </div>
          ))}
          {getActiveBadges().length < 3 && (
            <div className="flex flex-col items-center p-4 rounded-xl border-2 border-dashed border-cyan-400/30 bg-cyan-950/10 backdrop-blur-xl">
              <div className="text-3xl mb-2 text-cyan-400/60">➕</div>
              <span className="text-sm text-cyan-300/70 text-center">Empty Slot</span>
            </div>
          )}
        </div>
        
        <div className="text-center mt-4 text-sm text-muted-foreground">
          💡 Special badges (Moderator, Moderation, Penalty) are always visible and cannot be hidden
        </div>
      </div>

      {/* Regular Badges Grid */}
      {(activeTab !== 'mod-badge' && activeTab !== 'moderation-badges' && activeTab !== 'penalty-badges') && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {getFilteredBadges().map((badge) => (
            <Card 
              key={badge.id} 
              className={`component-badge-card p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl cursor-pointer ${
                !badge.isUnlocked ? 'opacity-60' : ''
              } ${badge.tier === 'Legendary' ? 'border-yellow-300 shadow-lg' : ''}`}
              onClick={() => setSelectedBadge(badge)}
            >
              <div className="text-center space-y-3">
                <div className={`text-5xl ${badge.tier === 'Legendary' ? 'animate-pulse' : ''} ${!badge.isUnlocked ? 'grayscale' : ''}`}>
                  {badge.isUnlocked ? badge.icon : '🔒'}
                </div>
                <h3 className="font-semibold text-lg">{badge.name}</h3>
                <Badge className={`${getTierColor(badge.tier)} px-3 py-1 rounded-full`}>
                  {getTierStars(badge.tier)}
                </Badge>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
                
                {/* Progress bar for unearned badges */}
                {!badge.isUnlocked && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{badge.progress.current}/{badge.progress.total}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(badge.progress.current / badge.progress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Toggle active button for earned badges */}
                {badge.isUnlocked && (
                  <Button
                    size="sm"
                    variant={badge.isActive ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleBadgeActive(badge.id)
                    }}
                    className="w-full"
                  >
                    {badge.isActive ? 'Featured' : 'Add to Profile'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-8 rounded-2xl shadow-2xl">
            <div className="text-center space-y-4">
              <div className="text-6xl">{selectedBadge.isUnlocked ? selectedBadge.icon : '🔒'}</div>
              <h2 className="text-2xl font-bold">{selectedBadge.name}</h2>
              <Badge className={`${getTierColor(selectedBadge.tier)} px-4 py-2 text-sm`}>
                {getTierStars(selectedBadge.tier)} {selectedBadge.tier}
              </Badge>
              <p className="text-muted-foreground">{selectedBadge.description}</p>
              
              {selectedBadge.perks && selectedBadge.perks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Perks:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {selectedBadge.perks.map((perk, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span>•</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Button onClick={() => setSelectedBadge(null)} className="w-full">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}