import { useState, useEffect } from 'react'
import { Card } from './ui/card.jsx'
import { Button } from './ui/button.jsx'
import { Badge } from './ui/badge.jsx'
import { Avatar } from './ui/avatar.jsx'
import { XCircle } from 'lucide-react'
import axios from 'axios'
import api from '@/lib/api.js'
import SockJS from 'sockjs-client'
import * as Stomp from '@stomp/stompjs'
import PenaltyCountdownTimer from './ui/PenaltyCountdownTimer.jsx'

const powerFiveBadges = [
  { 
    id: 'founding-dev', 
    name: 'Founding Dev', 
    icon: '💻', 
    tier: 'Legendary', 
    color: 'from-yellow-500 to-orange-600', 
    description: 'System Architect', 
    requirement: 'isDev flag = true', 
    progress: { current: 0, total: 1 }, 
    isUnlocked: false, 
    isActive: false, 
    perks: ['Developer access', 'Event creation privileges'],
    unlockedBy: 'Developer status granted by admin'
  },
  { 
    id: 'campus-catalyst', 
    name: 'Campus Catalyst', 
    icon: '📢', 
    tier: 'Epic', 
    color: 'from-blue-500 to-purple-600', 
    description: 'Verified College Head', 
    requirement: 'role = COLLEGE_HEAD',
    progress: { current: 1, total: 1 }, 
    isUnlocked: false, 
    isActive: false, 
    perks: ['Event creation access', 'College leadership'],
    unlockedBy: 'Promoted to College Head role'
  },
  { 
    id: 'pod-pioneer', 
    name: 'Pod Pioneer', 
    icon: '🌱', 
    tier: 'Uncommon', 
    color: 'from-green-500 to-emerald-600', 
    description: 'First Pod Entry', 
    requirement: 'Join your first pod',
    progress: { current: 0, total: 1 }, 
    isUnlocked: false, 
    isActive: false, 
    perks: ['Pod history tracking', 'Collaboration access'],
    unlockedBy: 'Join your first collaboration pod'
  },
  { 
    id: 'bridge-builder', 
    name: 'Bridge Builder', 
    icon: '🌉', 
    tier: 'Rare', 
    color: 'from-cyan-500 to-blue-500', 
    description: 'Inter-college Collaborator', 
    requirement: 'Message across colleges',
    progress: { current: 0, total: 1 }, 
    isUnlocked: false, 
    isActive: false, 
    perks: ['Cross-campus features', 'Inter-college access'],
    unlockedBy: 'Send your first inter-college message'
  },
  { 
    id: 'skill-sage', 
    name: 'Skill Sage', 
    icon: '🧠', 
    tier: 'Rare', 
    color: 'from-pink-500 to-rose-600', 
    description: '3+ Endorsements', 
    requirement: 'Get 3+ endorsements (current: X/3)',
    progress: { current: 0, total: 3 }, 
    isUnlocked: false, 
    isActive: false, 
    perks: ['Skill showcase boost', 'Expert recognition'],
    unlockedBy: 'Receive 3 endorsements from peers'
  }
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
    tier: 'Penalty',
    description: 'Active community penalty - 24hr lockout',
    progress: { current: 1, total: 1 },
    isUnlocked: false,  // ✅ Dynamically set based on user.penaltyExpiry
    isActive: false,    // ✅ Dynamically set based on user.penaltyExpiry
    perks: [],
    cannotBeHidden: true,
    isPenaltyBadge: true,
    duration: '24 hours',
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
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [showFeaturedBadgeModal, setShowFeaturedBadgeModal] = useState(false)
  const [featuredBadgesLoading, setFeaturedBadgesLoading] = useState(false)

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

  // ✅ WebSocket listener for real-time badge unlocks
  useEffect(() => {
    if (!user?._id) return;

    try {
      const socket = new SockJS('http://localhost:8080/ws');
      const stompClient = new Stomp.Client({
        webSocketFactory: () => socket,
        debug: (str) => console.log('[STOMP Debug]', str),
        onConnect: () => {
          console.log('✓ WebSocket connected');
          
          // Subscribe to badge unlock messages
          stompClient.subscribe(
            `/user/${user._id}/queue/badge-unlock`,
            (message) => {
              try {
                const badgeUnlock = JSON.parse(message.body);
                console.log('🎉 Badge unlocked via WebSocket:', badgeUnlock);
                
                // Update user state with new badge
                setUser(prevUser => {
                  if (prevUser.badges && !prevUser.badges.includes(badgeUnlock.badgeName)) {
                    return {
                      ...prevUser,
                      badges: [...prevUser.badges, badgeUnlock.badgeName]
                    };
                  }
                  return prevUser;
                });
              } catch (err) {
                console.error('Error parsing badge unlock message:', err);
              }
            }
          );
          
          console.log('✓ WebSocket badge unlock listener subscribed to /user/' + user._id + '/queue/badge-unlock');
        },
        onStompError: (frame) => {
          console.warn('⚠️ STOMP error:', frame);
        }
      });

      stompClient.activate();

      return () => {
        if (stompClient && stompClient.isActive) {
          stompClient.deactivate();
        }
      };
    } catch (err) {
      console.warn('WebSocket setup failed:', err.message);
    }
  }, [user?._id, setUser])

  // ✅ STRICT DATA-DRIVEN BADGE UNLOCK LOGIC (100% from MongoDB Atlas)
  // Update Power Five badges with dynamic unlock status based on REAL user.badges array only
  
  // ✅ AUDIT LOG: Check each badge unlock requirement
  console.log('\n🔍 BADGE UNLOCK AUDIT:');
  console.log('  User Badges:', user?.badges || []);
  console.log('  isDev:', user?.isDev);
  console.log('  Role:', user?.role);
  console.log('  Posts:', user?.postsCount);
  console.log('  Endorsements:', user?.endorsementsCount);
  
  // 1. FOUNDING DEV: isDev flag = true
  powerFiveBadges[0].isUnlocked = user?.badges?.includes('Founding Dev') || false;
  powerFiveBadges[0].progress = { current: user?.badges?.includes('Founding Dev') ? 1 : 0, total: 1 };
  if (user?.isDev) {
    console.log('  ✅ FOUNDING DEV: isDev=true (SHOULD UNLOCK)');
  } else {
    console.log('  ❌ FOUNDING DEV: isDev=false (LOCKED)');
  }
  
  // 2. CAMPUS CATALYST: role = COLLEGE_HEAD
  powerFiveBadges[1].isUnlocked = user?.badges?.includes('Campus Catalyst') || false;
  powerFiveBadges[1].progress = { current: user?.badges?.includes('Campus Catalyst') ? 1 : 0, total: 1 };
  if (user?.role === 'COLLEGE_HEAD') {
    console.log('  ✅ CAMPUS CATALYST: role=COLLEGE_HEAD (SHOULD UNLOCK)');
  } else {
    console.log('  ❌ CAMPUS CATALYST: role=' + user?.role + ' (LOCKED)');
  }
  
  // 3. POD PIONEER: Unlock on first pod join (permanent)
  powerFiveBadges[2].isUnlocked = user?.badges?.includes('Pod Pioneer') || false;
  powerFiveBadges[2].progress = { current: user?.badges?.includes('Pod Pioneer') ? 1 : 0, total: 1 };
  console.log('  ' + (powerFiveBadges[2].isUnlocked ? '✅' : '❌') + ' POD PIONEER: ' + (powerFiveBadges[2].isUnlocked ? 'UNLOCKED' : 'LOCKED - Join a pod'));
  
  // 4. BRIDGE BUILDER: Inter-college message (permanent)
  powerFiveBadges[3].isUnlocked = user?.badges?.includes('Bridge Builder') || false;
  powerFiveBadges[3].progress = { current: user?.badges?.includes('Bridge Builder') ? 1 : 0, total: 1 };
  console.log('  ' + (powerFiveBadges[3].isUnlocked ? '✅' : '❌') + ' BRIDGE BUILDER: ' + (powerFiveBadges[3].isUnlocked ? 'UNLOCKED' : 'LOCKED - Send inter-college message'));
  
  // 5. SKILL SAGE: endorsementsCount >= 3
  const endorsementCount = user?.endorsementsCount || 0;
  powerFiveBadges[4].isUnlocked = user?.badges?.includes('Skill Sage') || false;
  powerFiveBadges[4].progress = { current: Math.min(endorsementCount, 3), total: 3 };
  console.log('  ' + (endorsementCount >= 3 ? '✅' : '❌') + ' SKILL SAGE: ' + endorsementCount + '/3 endorsements' + (powerFiveBadges[4].isUnlocked ? ' (UNLOCKED)' : ' (LOCKED)'));

  // ✅ SIGNAL GUARDIAN: postsCount >= 5 requirement
  const postCount = user?.postsCount || 0;
  moderatorBadge.isUnlocked = user?.badges?.includes('Signal Guardian') || false;
  moderatorBadge.isActive = user?.badges?.includes('Signal Guardian') || false;
  console.log('  ' + (postCount >= 5 ? '✅' : '❌') + ' SIGNAL GUARDIAN: ' + postCount + '/5 posts' + (moderatorBadge.isUnlocked ? ' (UNLOCKED)' : ' (LOCKED)'));
  
  // ✅ SPAM ALERT: Dynamic penalty badge based on penaltyExpiry
  const hasActivePenalty = user?.penaltyExpiry && new Date(user.penaltyExpiry) > new Date();
  const reportCount = user?.reportCount || 0;
  penaltyBadges[0].isUnlocked = hasActivePenalty;
  penaltyBadges[0].isActive = hasActivePenalty;
  penaltyBadges[0].isPenaltyBadge = true;
  console.log('  ' + (hasActivePenalty ? '✅' : '❌') + ' SPAM ALERT: ' + reportCount + '/3 reports' + (hasActivePenalty ? ' (ACTIVE PENALTY)' : ' (INACTIVE)'));
  console.log('✓ BADGE UNLOCK AUDIT COMPLETE\n');

  // ✅ Check user status - 100% based on REAL badges from MongoDB
  const isModerator = user?.badges?.includes('Signal Guardian') || false;
  const hasModerationBadges = user?.badges?.some(b => 
    ['Chat Warden', 'Content Guardian', 'Event Coordinator', 'Collab Supervisor', 'Community Leader'].includes(b)
  ) || false;
  const hasPenaltyBadges = hasActivePenalty || penaltyBadges.some(badge => badge.isUnlocked)

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
      'Common': 'text-gray-300 bg-gray-700/40 border border-gray-600/60',
      'Uncommon': 'text-green-300 bg-green-900/40 border border-green-700/60',
      'Rare': 'text-blue-300 bg-blue-900/40 border border-blue-700/60',
      'Epic': 'text-purple-300 bg-purple-900/40 border border-purple-700/60',
      'Legendary': 'text-yellow-300 bg-yellow-900/40 border border-yellow-700/60 shadow-lg shadow-yellow-500/30',
      'Basic': 'text-blue-300 bg-blue-900/40 border border-blue-700/60',
      'Advanced': 'text-purple-300 bg-purple-900/40 border border-purple-700/60',
      'Elite': 'text-yellow-300 bg-yellow-900/40 border border-yellow-700/60 shadow-lg shadow-yellow-500/30',
      'Warning': 'text-orange-300 bg-orange-900/40 border border-orange-700/60',
      'Minor': 'text-red-300 bg-red-900/40 border border-red-700/60',
      'Major': 'text-red-300 bg-red-900/60 border border-red-700/80',
      'Severe': 'text-red-200 bg-red-950/70 border border-red-700',
      'Permanent': 'text-red-100 bg-red-950/90 border border-red-600 shadow-lg shadow-red-500/40',
      'Penalty': 'text-red-300 bg-red-900/40 border border-red-700/60'
    }
    return colors[tier] || 'text-gray-300 bg-gray-700/40 border border-gray-600/60'
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
    // ✅ SYNC WITH SERVER: Check user.featuredBadges from server, not just isActive flag
    const featuredBadgeIds = user?.featuredBadges || []
    
    // Get badges that are featured according to server
    const featuredBadges = allBadges.filter(badge => 
      featuredBadgeIds.some(id => id.toLowerCase() === badge.id.toLowerCase() || id.toLowerCase() === badge.name.toLowerCase())
    )
    
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
    
    // Combine: special badges + featured badges
    return [...specialBadges, ...featuredBadges]
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

  const handleSelectFeaturedBadge = async (badge) => {
    if (!badge.isUnlocked) {
      alert('You can only feature unlocked badges')
      return
    }

    const activeBadges = getActiveBadges()
    if (activeBadges.length >= 2) {
      alert('You can feature a maximum of 2 badges')
      return
    }

    setFeaturedBadgesLoading(true)
    try {
      console.log('📤 Sending badge to feature:', { badgeId: badge.id, badgeName: badge.name })
      const response = await api.put(
        `/api/users/${user.id}/profile/featured-badges`,
        { badgeId: badge.id }
      )

      console.log('✅ Feature badge successful:', response.data)
      
      // ✅ IMMEDIATE STATE UPDATE: Update badge and user state
      badge.isActive = true
      setUser(response.data)
      setShowFeaturedBadgeModal(false)
      
      console.log('✅ Featured badges now:', response.data.featuredBadges)
      alert('✓ Badge featured successfully!')
    } catch (error) {
      console.error('❌ Failed to feature badge:', error)
      const errorMessage = error.response?.data || error.message || 'Unknown error'
      console.error('Error details:', errorMessage)
      alert('❌ Failed to feature badge: ' + errorMessage)
    } finally {
      setFeaturedBadgesLoading(false)
    }
  }

  // Remove a badge from featured showcase
  const handleRemoveFeaturedBadge = async (badgeId) => {
    setFeaturedBadgesLoading(true)
    try {
      console.log('🗑️ Removing badge from featured:', badgeId)
      const response = await api.delete(
        `/api/users/${user.id}/profile/featured-badges/${badgeId}`
      )

      console.log('✅ Badge removed successfully:', response.data)
      
      // ✅ IMMEDIATE STATE UPDATE: Update user state with new featured badges list
      setUser(response.data)
      
      console.log('✅ Featured badges now:', response.data.featuredBadges)
      alert('✓ Badge removed from featured showcase!')
    } catch (error) {
      console.error('❌ Failed to remove badge:', error)
      const errorMessage = error.response?.data || error.message || 'Unknown error'
      console.error('Error details:', errorMessage)
      alert('❌ Failed to remove badge: ' + errorMessage)
    } finally {
      setFeaturedBadgesLoading(false)
    }
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
        <h3 className="font-semibold text-lg mb-4 text-center text-cyan-300">Featured Badges (Displayed on Public Profile)</h3>
        <div className="flex justify-center space-x-4">
          {getActiveBadges().map((badge) => (
            <div 
              key={badge.id} 
              className={`flex flex-col items-center p-4 rounded-xl border-2 backdrop-blur-xl transition-all relative group ${
                badge.name === 'Spam Alert' && user?.penaltyExpiry ? 'w-32 h-32 border-red-500/50 bg-red-600/15 shadow-lg shadow-red-500/20 justify-center' :
                badge.tier === 'Legendary' || badge.tier === 'Elite' ? 'border-cyan-400/50 bg-cyan-400/15 shadow-lg shadow-cyan-400/20' : 
                badge.name === 'Spam Alert' ? 'border-red-500/50 bg-red-600/15 shadow-lg shadow-red-500/20' :
                badge.isPenaltyBadge ? 'border-red-500/50 bg-red-600/15 shadow-lg shadow-red-500/20' : 
                badge.isModeratorBadge ? 'border-cyan-400/50 bg-cyan-400/15 shadow-lg shadow-cyan-400/20' :
                'border-cyan-400/30 bg-cyan-950/20'
              }`}
            >
              {/* Spam Alert Badge - Active Penalty */}
              {badge.name === 'Spam Alert' && user?.penaltyExpiry && (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  {/* Red Cross Icon */}
                  <XCircle className="w-12 h-12 text-red-500 mb-2 animate-pulse drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' }} />
                  
                  {/* Title */}
                  <span className="font-bold text-xs text-center text-red-300 mb-2">SPAM ALERT</span>
                  
                  {/* Countdown Timer Centered */}
                  <PenaltyCountdownTimer 
                    targetDate={user.penaltyExpiry}
                    centered={true}
                    onExpired={() => {
                      console.log('✅ Penalty expired, badge should be removed');
                    }}
                  />
                </div>
              )}

              {/* Standard Badge Display - Non-Spam Alert */}
              {!(badge.name === 'Spam Alert' && user?.penaltyExpiry) && (
                <>
                  {/* Lock indicator - hide for Spam Alert with active penalty */}
                  {(badge.cannotBeHidden || badge.id === 'signal-guardian') && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-magenta-500 rounded-full flex items-center justify-center shadow-lg shadow-magenta-500/50">
                      <span className="text-white text-xs">🔒</span>
                    </div>
                  )}

                  {/* Remove Badge Button - Only for removable badges */}
                  {!badge.cannotBeHidden && !badge.isPenaltyBadge && !badge.isModeratorBadge && (
                    <button
                      onClick={() => handleRemoveFeaturedBadge(badge.id)}
                      className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
                      title="Remove from featured"
                      disabled={featuredBadgesLoading}
                    >
                      <span className="text-white text-sm font-bold">−</span>
                    </button>
                  )}
                  
                  {/* Icon */}
                  <div className={`text-3xl mb-2 ${badge.tier === 'Legendary' || badge.tier === 'Elite' ? 'animate-pulse' : ''} ${badge.isPenaltyBadge ? 'opacity-80' : ''}`}>
                    {badge.icon}
                  </div>
                  
                  <span className="font-medium text-sm text-center text-white">{badge.name}</span>
                  
                  {/* Tier Badge */}
                  <Badge className={`${getTierColor(badge.tier)} text-xs mt-1`}>
                    {getTierStars(badge.tier)}
                  </Badge>
                  
                  {/* Duration indicator for timed badges */}
                  {badge.duration && badge.duration !== 'Permanent' && (
                    <div className="text-xs text-cyan-300 mt-1">
                      {getRemainingTime(badge.expiresAt)}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {getActiveBadges().length < 2 && (
            <div 
              onClick={() => setShowFeaturedBadgeModal(true)}
              className="flex flex-col items-center p-4 rounded-xl border-2 border-dashed border-cyan-400/30 bg-cyan-950/10 backdrop-blur-xl cursor-pointer hover:border-cyan-400/60 hover:bg-cyan-950/20 transition-all"
            >
              <div className="text-3xl mb-2 text-cyan-400/60 hover:text-cyan-400">➕</div>
              <span className="text-sm text-cyan-300/70 text-center hover:text-cyan-300 transition-colors">Empty Slot</span>
            </div>
          )}
        </div>
        
        <div className="text-center mt-4 text-sm text-muted-foreground">
          💡 Special badges (Moderator, Moderation, Penalty, Spam Alert) are always visible and cannot be hidden
        </div>
      </div>

      {/* Regular Badges Grid */}
      {(activeTab !== 'mod-badge' && activeTab !== 'moderation-badges' && activeTab !== 'penalty-badges') && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {getFilteredBadges().map((badge) => (
            <Card 
              key={badge.id} 
              className={`component-badge-card p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl cursor-pointer backdrop-blur-xl
                ${badge.isUnlocked 
                  ? `border-2 shadow-lg ${
                      badge.tier === 'Legendary' ? 'border-yellow-500/60 shadow-yellow-500/20 bg-gradient-to-br from-yellow-900/20 to-orange-900/20' :
                      badge.tier === 'Epic' ? 'border-purple-500/60 shadow-purple-500/20 bg-gradient-to-br from-purple-900/20 to-blue-900/20' :
                      badge.tier === 'Rare' ? 'border-blue-500/60 shadow-blue-500/20 bg-gradient-to-br from-blue-900/20 to-cyan-900/20' :
                      'border-cyan-500/40 shadow-cyan-500/10 bg-gradient-to-br from-cyan-900/10 to-slate-900/10'
                    }`
                  : 'border-2 border-gray-700/40 opacity-50 bg-gray-900/20 hover:opacity-70'
                }`}
              onClick={() => setSelectedBadge(badge)}
            >
              <div className="text-center space-y-3">
                <div className={`text-5xl ${badge.tier === 'Legendary' || badge.tier === 'Epic' ? 'animate-pulse' : ''} ${!badge.isUnlocked ? 'grayscale blur-sm' : ''}`}>
                  {badge.isUnlocked ? badge.icon : '🔒'}
                </div>
                <h3 className={`font-semibold text-lg ${!badge.isUnlocked ? 'text-gray-500' : 'text-white'}`}>{badge.name}</h3>
                <Badge className={`${getTierColor(badge.tier)} px-3 py-1 rounded-full w-fit mx-auto`}>
                  {getTierStars(badge.tier)}
                </Badge>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
                
                {/* Progress bar for unearned badges */}
                {!badge.isUnlocked && (
                  <div className="space-y-2 mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="font-semibold">Progress</span>
                      <span className="font-mono">{badge.progress.current}/{badge.progress.total}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden border border-gray-600">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500 shadow-lg shadow-cyan-500/50"
                        style={{ width: `${(badge.progress.current / badge.progress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-8 rounded-2xl shadow-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30">
            <div className="text-center space-y-4">
              <div className={`text-6xl ${selectedBadge.tier === 'Legendary' || selectedBadge.tier === 'Epic' ? 'animate-pulse' : ''}`}>
                {selectedBadge.isUnlocked ? selectedBadge.icon : '🔒'}
              </div>
              <h2 className="text-2xl font-bold text-white">{selectedBadge.name}</h2>
              <Badge className={`${getTierColor(selectedBadge.tier)} px-4 py-2 text-sm mx-auto`}>
                {getTierStars(selectedBadge.tier)} {selectedBadge.tier}
              </Badge>
              <p className="text-muted-foreground">{selectedBadge.description}</p>
              
              {/* Show unlock requirement for locked badges */}
              {!selectedBadge.isUnlocked && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                  <div className="font-semibold mb-1">🔒 Unlock Requirement:</div>
                  <div>{selectedBadge.requirement}</div>
                  {selectedBadge.unlockedBy && <div className="mt-2 text-xs text-red-300/70">{selectedBadge.unlockedBy}</div>}
                </div>
              )}
              
              {/* Show progress bar for evolving badges */}
              {!selectedBadge.isUnlocked && selectedBadge.progress.total > 1 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Progress</span>
                    <span className="font-mono font-bold">{selectedBadge.progress.current}/{selectedBadge.progress.total}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden border border-gray-600">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500 shadow-lg shadow-cyan-500/50"
                      style={{ width: `${(selectedBadge.progress.current / selectedBadge.progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
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

      {/* Featured Badge Selection Modal */}
      {showFeaturedBadgeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full p-8 rounded-2xl shadow-2xl border-cyan-400/30">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-cyan-300">Select Badge to Feature</h2>
                <button 
                  onClick={() => setShowFeaturedBadgeModal(false)}
                  className="text-gray-400 hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-gray-400">
                Choose an unlocked badge to display on your public profile. (Max 2 slots)
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {earnedBadges
                  .filter(badge => !badge.isActive) // Only show non-featured badges
                  .map((badge) => (
                    <div
                      key={badge.id}
                      onClick={() => handleSelectFeaturedBadge(badge)}
                      className="p-4 rounded-lg border-2 border-cyan-400/30 bg-cyan-950/20 hover:bg-cyan-950/40 hover:border-cyan-400/60 cursor-pointer transition-all transform hover:scale-105"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-4xl">{badge.icon}</div>
                        <h3 className="text-sm font-semibold text-center text-cyan-300">{badge.name}</h3>
                        <Badge className={`${getTierColor(badge.tier)} text-xs`}>
                          {getTierStars(badge.tier)}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>

              {earnedBadges.filter(badge => !badge.isActive).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>No more badges available to feature</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}