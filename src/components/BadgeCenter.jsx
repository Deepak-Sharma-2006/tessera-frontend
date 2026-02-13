import { useState, useEffect } from 'react'
import { Card } from './ui/card.jsx'
import { Button } from './ui/button.jsx'
import { Badge } from './ui/badge.jsx'
import { Avatar } from './ui/avatar.jsx'
import {
  XCircle,
  Trophy,
  Flame,
  Zap,
  Moon,
  Link,
  Sword,
  Gem,
  Building2,
  Wrench,
  Target,
  Shield,
  Globe,
  Megaphone,
  Sparkles,
  Eye,
  Handshake,
  PartyPopper,
  GraduationCap,
  Code,
  Sprout,
  Brain,
  AlertCircle,
  Award,
  Crown,
  Users,
  Lightbulb
} from 'lucide-react'
import axios from 'axios'
import api from '@/lib/api.js'
import SockJS from 'sockjs-client'
import * as Stomp from '@stomp/stompjs'
import PenaltyCountdownTimer from './ui/PenaltyCountdownTimer.jsx'

// ✅ Mapping function to convert emoji to lucide icons
const getIconComponent = (iconName) => {
  const iconMap = {
    'trophy': Trophy,
    'flame': Flame,
    'zap': Zap,
    'moon': Moon,
    'bridge': Link,
    'sword': Sword,
    'gem': Gem,
    'building': Building2,
    'wrench': Wrench,
    'target': Target,
    'shield': Shield,
    'globe': Globe,
    'megaphone': Megaphone,
    'sparkles': Sparkles,
    'eye': Eye,
    'handshake': Handshake,
    'party-popper': PartyPopper,
    'graduation-cap': GraduationCap,
    'code': Code,
    'sprout': Sprout,
    'brain': Brain,
    'alert-circle': AlertCircle,
    'award': Award,
    'crown': Crown,
    'users': Users,
    'lightbulb': Lightbulb,
    'x-circle': XCircle,
    'xCircle': XCircle,
  }
  return iconMap[iconName] || Trophy
}

// ✅ Lucide icon renderer component
const LucideIcon = ({ iconName, className = 'w-6 h-6' }) => {
  const IconComponent = getIconComponent(iconName)
  return <IconComponent className={className} />
}

// ========== UNIVERSAL BADGE LEVEL CONFIGURATION ==========
// Complete configuration for all evolving badges with all tiers
const badgeLevelConfig = {
  'Streak Seeker': {
    series: 'Streak Seeker',
    iconName: 'flame',
    1: { 
      level: 1,
      rank: 'Common', 
      stars: 1, 
      color: '#94a3b8',
      bgColor: 'gray-500/70',
      borderColor: 'border-gray-300',
      textColor: 'text-gray-50',
      shadowColor: 'shadow-gray-500/20',
      req: '7 days', 
      desc: 'Maintain a login streak for 7 consecutive days',
      fullDesc: 'Start small by logging in and participating every single day. Streaks build momentum!',
      targetValue: 7,
      targetUnit: 'days'
    },
    2: { 
      level: 2,
      rank: 'Rare', 
      stars: 3, 
      color: '#3b82f6',
      bgColor: 'blue-500/70',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-50',
      shadowColor: 'shadow-blue-500/20',
      req: '30 days', 
      desc: 'Maintain a login streak for 30 consecutive days',
      fullDesc: 'Consistency is key! Show up every day to compound your engagement.',
      targetValue: 30,
      targetUnit: 'days'
    },
    3: { 
      level: 3,
      rank: 'Legendary', 
      stars: 5, 
      color: '#f59e0b',
      bgColor: 'yellow-500/70',
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-50',
      shadowColor: 'shadow-yellow-500/30',
      req: '100 days (Iron Streak)', 
      desc: 'Maintain an iron login streak for 100 consecutive days',
      fullDesc: 'Become a Tessera legend! Your dedication inspires the community.',
      targetValue: 100,
      targetUnit: 'days'
    }
  },
  'Collab Master': {
    series: 'Collab Master',
    iconName: 'handshake',
    1: { 
      level: 1,
      rank: 'Common', 
      stars: 1, 
      color: '#94a3b8',
      bgColor: 'gray-500/70',
      borderColor: 'border-gray-300',
      textColor: 'text-gray-50',
      shadowColor: 'shadow-gray-500/20',
      req: '10 rooms', 
      desc: 'Join and collaborate in 10 different rooms',
      fullDesc: 'Start by exploring different collaboration spaces. Each room brings new perspectives!',
      targetValue: 10,
      targetUnit: 'rooms'
    },
    2: { 
      level: 2,
      rank: 'Rare', 
      stars: 3, 
      color: '#3b82f6',
      bgColor: 'blue-500/70',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-50',
      shadowColor: 'shadow-blue-500/20',
      req: '25 rooms', 
      desc: 'Join and collaborate in 25 different rooms',
      fullDesc: 'Collaborate across domains to grow your reach. Multi-domain work builds expertise!',
      targetValue: 25,
      targetUnit: 'rooms'
    },
    3: { 
      level: 3,
      rank: 'Epic', 
      stars: 4, 
      color: '#a855f7',
      bgColor: 'purple-500/70',
      borderColor: 'border-purple-300',
      textColor: 'text-purple-50',
      shadowColor: 'shadow-purple-500/30',
      req: '50 rooms (Expert)', 
      desc: 'Join and collaborate in 50 different rooms (Expert)',
      fullDesc: 'Become an expert collaborator! Your deep network makes you invaluable to Tessera.',
      targetValue: 50,
      targetUnit: 'rooms'
    }
  },
  'Voice of the Hub': {
    series: 'Voice of the Hub',
    iconName: 'megaphone',
    1: { 
      level: 1,
      rank: 'Common', 
      stars: 1, 
      color: '#94a3b8',
      bgColor: 'gray-500/70',
      borderColor: 'border-gray-300',
      textColor: 'text-gray-50',
      shadowColor: 'shadow-gray-500/20',
      req: '100 replies', 
      desc: 'Accumulate 100 total replies across all Global Hub posts',
      fullDesc: 'Start small by replying to campus hub threads. Every response builds your voice.',
      targetValue: 100,
      targetUnit: 'replies'
    },
    2: { 
      level: 2,
      rank: 'Rare', 
      stars: 3, 
      color: '#3b82f6',
      bgColor: 'blue-500/70',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-50',
      shadowColor: 'shadow-blue-500/20',
      req: '500 replies', 
      desc: 'Accumulate 500 total replies across all Global Hub posts',
      fullDesc: 'Collaborate across domains to grow your reach. Diverse engagement amplifies impact.',
      targetValue: 500,
      targetUnit: 'replies'
    },
    3: { 
      level: 3,
      rank: 'Legendary', 
      stars: 5, 
      color: '#f59e0b',
      bgColor: 'yellow-500/70',
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-50',
      shadowColor: 'shadow-yellow-500/30',
      req: '1,500 replies (The Guru)', 
      desc: 'Accumulate 1,500 total replies (The Guru) - Become the most active voice',
      fullDesc: 'Become an active voice in the Global Hub community. Your wisdom guides others.',
      targetValue: 1500,
      targetUnit: 'replies'
    }
  },
  'The Oracle': {
    series: 'The Oracle',
    iconName: 'eye',
    1: { 
      level: 1,
      rank: 'Common', 
      stars: 1, 
      color: '#94a3b8',
      bgColor: 'gray-500/70',
      borderColor: 'border-gray-300',
      textColor: 'text-gray-50',
      shadowColor: 'shadow-gray-500/20',
      req: '5 poll wins', 
      desc: 'Win 5 poll predictions',
      fullDesc: 'Start your prediction journey! Trust your instincts in campus discussions.',
      targetValue: 5,
      targetUnit: 'poll wins'
    },
    2: { 
      level: 2,
      rank: 'Rare', 
      stars: 3, 
      color: '#3b82f6',
      bgColor: 'blue-500/70',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-50',
      shadowColor: 'shadow-blue-500/20',
      req: '15 poll wins', 
      desc: 'Win 15 poll predictions',
      fullDesc: 'Your predictions are getting sharper! You understand campus pulse.',
      targetValue: 15,
      targetUnit: 'poll wins'
    },
    3: { 
      level: 3,
      rank: 'Epic', 
      stars: 4, 
      color: '#a855f7',
      bgColor: 'purple-500/70',
      borderColor: 'border-purple-300',
      textColor: 'text-purple-50',
      shadowColor: 'shadow-purple-500/30',
      req: '50 poll wins (Grandmaster)', 
      desc: 'Win 50 poll predictions (Grandmaster) - Achieve mastery over collective wisdom',
      fullDesc: 'Your predictive prowess is legendary! Master the art of reading the room.',
      targetValue: 50,
      targetUnit: 'poll wins'
    }
  }
}

const powerFiveBadges = [
  { 
    id: 'founding-dev', 
    name: 'Founding Dev', 
    iconName: 'code',
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
    iconName: 'megaphone',
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
    iconName: 'sprout',
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
    iconName: 'bridge',
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
  iconName: 'shield',
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
    iconName: 'megaphone',
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
    iconName: 'code',
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
    iconName: 'target',
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
    iconName: 'building',
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
    iconName: 'crown',
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
    iconName: 'alert-circle',
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
    offense: 'Excessive posting in multiple channels',
    visibilityLevel: 'Profile, Posts, Comments, Chats'
  },
  {
    id: 'toxic-behavior',
    name: 'Behavior Warning',
    iconName: 'alert-circle',
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
    iconName: 'eye',
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
    iconName: 'alert-circle',
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
    iconName: 'xCircle',
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
  const [previewLevel, setPreviewLevel] = useState(null)
  const [showFeaturedBadgeModal, setShowFeaturedBadgeModal] = useState(false)
  const [featuredBadgesLoading, setFeaturedBadgesLoading] = useState(false)
  const [hardModeBadges, setHardModeBadges] = useState([])
  const [hardModeBadgesLoading, setHardModeBadgesLoading] = useState(true)
  const [unlockedCountdown, setUnlockedCountdown] = useState({})

  // 20 Hard-Mode Badge Definitions (Fallback)
  // ========== HARD-MODE BADGE CONFIGURATION ==========
  // All 20 elite badges with complete styling, tiers, icons, and requirements
  const HARD_MODE_BADGE_DEFINITIONS = [
    {
      id: 'discussion-architect',
      badgeId: 'discussion-architect',
      name: 'Discussion Architect',
      badgeName: 'Discussion Architect',
      iconName: 'trophy',
      tier: 'Legendary',
      visualStyle: 'gold-glow',
      category: 'engagement',
      description: 'Start a Global Hub thread that reaches 50+ total replies',
      requirement: 'Create posts in Global Hub that collectively receive 50+ replies',
      unlockedBy: 'Post engaging content and topics that spark discussions across the platform',
      perks: ['Architect status', 'Custom badge glow', 'Leadership recognition'],
      progress: { current: 0, total: 50 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    },
    {
      id: 'active-talker-elite',
      badgeId: 'active-talker-elite',
      name: 'Active Talker (Elite)',
      badgeName: 'Active Talker (Elite)',
      iconName: 'flame',
      tier: 'Epic',
      visualStyle: 'purple-shimmer',
      category: 'engagement',
      description: 'Post 150 replies across various college threads in 7 days',
      requirement: 'Post 150+ replies within a single 7-day period',
      unlockedBy: 'Stay active in college discussions and maintain consistent engagement throughout the week',
      perks: ['Weekly streak tracking', 'High visibility', 'Discussion leader badge'],
      progress: { current: 0, total: 150 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    },
    {
      id: 'ultra-responder',
      badgeId: 'ultra-responder',
      name: 'Ultra-Responder',
      badgeName: 'Ultra-Responder',
      iconName: 'zap',
      tier: 'Rare',
      visualStyle: 'electric-blue',
      category: 'speed',
      description: 'Reply to an Inbox message in <30 seconds, 20 times in a row',
      requirement: 'Respond to 20 inbox messages in under 30 seconds each',
      unlockedBy: 'Enable notifications and stay online to catch messages quickly',
      perks: ['Speed bonus', 'Fast-response notifications', 'Quick-draw achievement'],
      progress: { current: 0, total: 20 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    },
    {
      id: 'midnight-legend',
      badgeId: 'midnight-legend',
      name: 'Midnight Legend',
      badgeName: 'Midnight Legend',
      iconName: 'moon',
      tier: 'Rare',
      visualStyle: 'dark-moon-glow',
      category: 'devotion',
      description: 'Post a reply in the Global Hub between 2 AM – 4 AM for 3 nights straight',
      requirement: 'Reply in Global Hub between 2-4 AM on 3 consecutive nights',
      unlockedBy: 'Burn the midnight oil! Post during late night hours for 3 nights in a row',
      perks: ['Night owl status', 'Nocturnal dedication badge', 'Late-night boost'],
      progress: { current: 0, total: 3 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    },
    {
      id: 'bridge-master',
      badgeId: 'bridge-master',
      name: 'Bridge Master',
      badgeName: 'Bridge Master',
      iconName: 'bridge',
      tier: 'Epic',
      visualStyle: 'green-aurora',
      category: 'collaboration',
      description: 'Start DMs with students from 5 different colleges in 24 hours',
      requirement: '5 cross-college connections',
      unlockedBy: 'Network with students from different colleges and start meaningful DMs within 24 hours',
      perks: ['Inter-college access', 'Network amplifier', 'Bridge builder status'],
      progress: { current: 0, total: 5 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    },
    {
      id: 'doubt-destroyer',
      badgeId: 'doubt-destroyer',
      name: 'Doubt Destroyer',
      badgeName: 'Doubt Destroyer',
      iconName: 'sword',
      tier: 'Epic',
      visualStyle: 'ruby-red',
      category: 'helpfulness',
      description: 'Provide the first reply to 25 questions tagged as #HelpNeeded',
      requirement: '25 first-help replies',
      unlockedBy: 'Answer questions promptly and be the first to help students in need of assistance',
      perks: ['Help seeker status', 'Student advisor badge', 'Doubt resolver glow'],
      progress: { current: 0, total: 25 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    },
    {
      id: 'resource-titan',
      badgeId: 'resource-titan',
      name: 'Resource Titan',
      badgeName: 'Resource Titan',
      iconName: 'gem',
      tier: 'Legendary',
      visualStyle: 'emerald-shine',
      category: 'sharing',
      description: 'Have 25 of your shared files/links "pinned" by other users',
      requirement: '25 pinned resources',
      unlockedBy: 'Share valuable materials that others find helpful and worth pinning to their resources',
      perks: ['Resource vault', 'Material curator status', 'Emerald contribution badge'],
      progress: { current: 0, total: 25 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    },
    {
      id: 'lead-architect',
      badgeId: 'lead-architect',
      name: 'Lead Architect',
      badgeName: 'Lead Architect',
      iconName: 'building',
      tier: 'Legendary',
      visualStyle: 'molten-gold',
      category: 'leadership',
      description: 'Fill 10 Collab Rooms with members from 4+ different colleges each',
      requirement: '10 multi-college collab rooms',
      unlockedBy: 'Create and lead 10 collaborative projects, each with members from at least 4 different colleges',
      perks: ['Project lead status', 'Architecture master', 'Creation privileges'],
      progress: { current: 0, total: 10 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    },
    {
      id: 'team-engine',
      badgeId: 'team-engine',
      name: 'Team Engine',
      badgeName: 'Team Engine',
      iconName: 'wrench',
      tier: 'Epic',
      visualStyle: 'cobalt-steel',
      category: 'collaboration',
      description: 'Join 15 Collab Rooms and contribute 20+ replies to each',
      requirement: '15 active collaborations',
      unlockedBy: 'Actively participate in multiple collaborative rooms and contribute meaningfully to each project',
      perks: ['Team player badge', 'Collab machine status', 'Contribution tracker'],
      progress: { current: 0, total: 15 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    },
    {
      id: 'first-responder',
      badgeId: 'first-responder',
      name: 'First Responder',
      badgeName: 'First Responder',
      iconName: 'target',
      tier: 'Common',
      visualStyle: 'silver-gloss',
      category: 'speed',
      description: 'Be the first reply to a campus question within 30 minutes of posting',
      requirement: '1 first response',
      unlockedBy: 'Stay alert and be quick to offer help to campus questions posted recently',
      perks: ['Quick-draw bonus', 'First achiever status'],
      progress: { current: 0, total: 1 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    },
    {
      id: 'streak-seeker-lvl1',
      badgeId: 'streak-seeker-lvl1',
      name: 'Streak Seeker (Bronze)',
      badgeName: 'Streak Seeker (Bronze)',
      iconName: 'shield',
      tier: 'Common',
      visualStyle: 'bronze-glow',
      category: 'devotion',
      description: 'Evolving Badge • Log in for 7 consecutive days (Bronze)',
      requirement: 'Maintain a 7-day login streak',
      unlockedBy: 'Log in every single day for 7 consecutive days',
      perks: ['Starting streaker', 'Daily habit badge'],
      progress: { current: 0, total: 7 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked',
      evolvesTo: 'streak-seeker-lvl2'
    },
    {
      id: 'streak-seeker-lvl2',
      badgeId: 'streak-seeker-lvl2',
      name: 'Streak Seeker (Silver)',
      badgeName: 'Streak Seeker (Silver)',
      iconName: 'shield',
      tier: 'Rare',
      visualStyle: 'silver-shimmer',
      category: 'devotion',
      description: 'Evolving Badge • Log in for 30 consecutive days (Silver)',
      requirement: 'Maintain a 30-day login streak',
      unlockedBy: 'Log in every single day for 30 consecutive days',
      perks: ['Committed streaker', 'Monthly loyalty badge'],
      progress: { current: 0, total: 30 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked',
      evolvesTo: 'streak-seeker-lvl3'
    },
    {
      id: 'streak-seeker-lvl3',
      badgeId: 'streak-seeker-lvl3',
      name: 'Streak Seeker: Iron Streak',
      badgeName: 'Streak Seeker: Iron Streak',
      iconName: 'shield',
      tier: 'Legendary',
      visualStyle: 'animated-fire',
      category: 'devotion',
      description: 'Evolving Badge • Log in for 100 consecutive days (Gold)',
      requirement: 'Maintain a 100-day login streak without missing a single day',
      unlockedBy: 'Log in every single day for 100 consecutive days to keep the streak alive',
      perks: ['Unstoppable streaker', 'Daily loyalty badge', 'Presence master'],
      progress: { current: 0, total: 100 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked',
      isMaxLevel: true
    },
    {
      id: 'collab-master-lvl1',
      badgeId: 'collab-master-lvl1',
      name: 'Collab Master (Bronze)',
      badgeName: 'Collab Master (Bronze)',
      iconName: 'globe',
      tier: 'Common',
      visualStyle: 'bronze-collaboration',
      category: 'collaboration',
      description: 'Evolving Badge • Join 10 Collab Rooms (Bronze)',
      requirement: 'Join and contribute to 10 unique Collab Rooms',
      unlockedBy: 'Participate in 10 collaborative projects',
      perks: ['Emerging collaborator', 'Team builder'],
      progress: { current: 0, total: 10 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked',
      evolvesTo: 'collab-master-lvl2'
    },
    {
      id: 'collab-master-lvl2',
      badgeId: 'collab-master-lvl2',
      name: 'Collab Master (Silver)',
      badgeName: 'Collab Master (Silver)',
      iconName: 'globe',
      tier: 'Rare',
      visualStyle: 'silver-collaboration',
      category: 'collaboration',
      description: 'Evolving Badge • Join 25 Collab Rooms (Silver)',
      requirement: 'Join and actively contribute to 25 unique Collab Rooms',
      unlockedBy: 'Explore and participate in 25 collaborative projects',
      perks: ['Seasoned collaborator', 'Multi-project explorer'],
      progress: { current: 0, total: 25 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked',
      evolvesTo: 'collab-master-lvl3'
    },
    {
      id: 'collab-master-lvl3',
      badgeId: 'collab-master-lvl3',
      name: 'Collab Master: Expert',
      badgeName: 'Collab Master: Expert',
      iconName: 'globe',
      tier: 'Epic',
      visualStyle: 'cyan-pulse',
      category: 'collaboration',
      description: 'Evolving Badge • Join 50 Collab Rooms (Gold)',
      requirement: 'Join and actively contribute to 50 unique Collab Rooms',
      unlockedBy: 'Explore and participate in diverse collaborative projects across the platform',
      perks: ['Collab veteran', 'Multi-project experience', 'Collaboration master glow'],
      progress: { current: 0, total: 50 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked',
      isMaxLevel: true
    },
    {
      id: 'voice-of-hub-lvl1',
      badgeId: 'voice-of-hub-lvl1',
      name: 'Voice of the Hub (Bronze)',
      badgeName: 'Voice of the Hub (Bronze)',
      iconName: 'megaphone',
      tier: 'Common',
      visualStyle: 'bronze-voice',
      category: 'engagement',
      description: 'Evolving Badge • 100 total replies (Bronze)',
      requirement: 'Accumulate 100 total replies in the Global Hub',
      unlockedBy: 'Participate actively in Global Hub discussions',
      perks: ['Emerging voice', 'Community participant'],
      progress: { current: 0, total: 100 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked',
      evolvesTo: 'voice-of-hub-lvl2'
    },
    {
      id: 'voice-of-hub-lvl2',
      badgeId: 'voice-of-hub-lvl2',
      name: 'Voice of the Hub (Silver)',
      badgeName: 'Voice of the Hub (Silver)',
      iconName: 'megaphone',
      tier: 'Rare',
      visualStyle: 'silver-voice',
      category: 'engagement',
      description: 'Evolving Badge • 500 total replies (Silver)',
      requirement: 'Accumulate 500 total replies across Global Hub posts',
      unlockedBy: 'Be an active participant in consistent Global Hub discussions',
      perks: ['Known voice', 'Discussion regular'],
      progress: { current: 0, total: 500 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked',
      evolvesTo: 'voice-of-hub-lvl3'
    },
    {
      id: 'voice-of-hub-lvl3',
      badgeId: 'voice-of-hub-lvl3',
      name: 'Voice of the Hub: The Guru',
      badgeName: 'Voice of the Hub: The Guru',
      iconName: 'megaphone',
      tier: 'Legendary',
      visualStyle: 'solar-flare',
      category: 'engagement',
      description: 'Evolving Badge • 1,500 total replies (Gold)',
      requirement: 'Accumulate 1,500 total replies across all Global Hub posts',
      unlockedBy: 'Be an active voice in the community by consistently participating in Global Hub discussions',
      perks: ['Hub voice status', 'Discussion influencer', 'Solar flare distinction'],
      progress: { current: 0, total: 1500 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked',
      isMaxLevel: true
    },
    {
      id: 'the-oracle-lvl1',
      badgeId: 'the-oracle-lvl1',
      name: 'The Oracle (Bronze)',
      badgeName: 'The Oracle (Bronze)',
      iconName: 'lightbulb',
      tier: 'Common',
      visualStyle: 'bronze-oracle',
      category: 'predictions',
      description: 'Evolving Badge • 5 poll wins (Bronze)',
      requirement: 'Correctly predict 5 community poll outcomes',
      unlockedBy: 'Develop your prediction skills by getting polls right',
      perks: ['Emerging oracle', 'Poll predictor'],
      progress: { current: 0, total: 5 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked',
      evolvesTo: 'the-oracle-lvl2'
    },
    {
      id: 'the-oracle-lvl2',
      badgeId: 'the-oracle-lvl2',
      name: 'The Oracle (Silver)',
      badgeName: 'The Oracle (Silver)',
      iconName: 'lightbulb',
      tier: 'Rare',
      visualStyle: 'silver-oracle',
      category: 'predictions',
      description: 'Evolving Badge • 15 poll wins (Silver)',
      requirement: 'Correctly predict 15 community poll outcomes',
      unlockedBy: 'Show consistent accuracy by predicting correct poll winners',
      perks: ['Skilled oracle', 'Poll enthusiast'],
      progress: { current: 0, total: 15 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked',
      evolvesTo: 'the-oracle-lvl3'
    },
    {
      id: 'the-oracle-lvl3',
      badgeId: 'the-oracle-lvl3',
      name: 'The Oracle: Grandmaster',
      badgeName: 'The Oracle: Grandmaster',
      iconName: 'lightbulb',
      tier: 'Epic',
      visualStyle: 'amethyst-eye',
      category: 'predictions',
      description: 'Evolving Badge • 50 poll wins (Gold)',
      requirement: 'Correctly predict the winning outcome of 50 community Polls',
      unlockedBy: 'Develop a keen sense of the community pulse and accurately predict poll outcomes 50 times',
      perks: ['Oracle status', 'Prediction master', 'Amethyst eye vision'],
      progress: { current: 0, total: 50 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked',
      isMaxLevel: true
    },
    {
      id: 'profile-perfectionist',
      badgeId: 'profile-perfectionist',
      name: 'Profile Perfectionist',
      badgeName: 'Profile Perfectionist',
      iconName: 'sparkles',
      tier: 'Common',
      visualStyle: 'polished-chrome',
      category: 'profile',
      description: 'Fill all fields and update "Project Links" every 30 days to keep the badge',
      requirement: 'Complete profile maintenance',
      unlockedBy: 'Keep your profile complete and updated regularly by refreshing project links every 30 days',
      perks: ['Perfect profile badge', 'Profile maintenance tracking'],
      progress: { current: 0, total: 1 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    },
    {
      id: 'silent-sentinel',
      badgeId: 'silent-sentinel',
      name: 'Silent Sentinel',
      badgeName: 'Silent Sentinel',
      iconName: 'eye',
      tier: 'Rare',
      visualStyle: 'white-marble',
      category: 'conduct',
      description: 'Reach 500 replies with a 100% report-free record',
      requirement: '500 clean replies',
      unlockedBy: 'Maintain perfect conduct while building a substantial contribution history of 500+ quality replies',
      perks: ['Clean record badge', 'Sentinel guardian status', 'Marble integrity seal'],
      progress: { current: 0, total: 500 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    },
    {
      id: 'campus-helper',
      badgeId: 'campus-helper',
      name: 'Campus Helper',
      badgeName: 'Campus Helper',
      iconName: 'handshake',
      tier: 'Common',
      visualStyle: 'bronze-oak',
      category: 'helpfulness',
      description: 'Provide 10 replies that are marked as "Helpful" by institutional peers',
      requirement: '10 helpful replies',
      unlockedBy: 'Give quality responses to campus questions and get them marked as helpful by other students',
      perks: ['Helper badge', 'Community aid status'],
      progress: { current: 0, total: 10 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    },
    {
      id: 'event-vanguard',
      badgeId: 'event-vanguard',
      name: 'Event Vanguard',
      badgeName: 'Event Vanguard',
      iconName: 'party-popper',
      tier: 'Rare',
      visualStyle: 'orange-neon',
      category: 'engagement',
      description: 'Reply to an Event announcement within 5 minutes of its creation',
      requirement: '1 quick event reply',
      unlockedBy: 'Respond quickly to new event announcements and show your enthusiasm early',
      perks: ['Event enthusiast', 'First participator badge', 'Neon vanguard glow'],
      progress: { current: 0, total: 1 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    },
    {
      id: 'cross-domain-pro',
      badgeId: 'cross-domain-pro',
      name: 'Cross-Domain Pro',
      badgeName: 'Cross-Domain Pro',
      iconName: 'graduation-cap',
      tier: 'Epic',
      visualStyle: 'multicolor-prism',
      category: 'interdisciplinary',
      description: 'Join Collab Rooms in 5 different academic branches (IT, Mech, Civil, etc)',
      requirement: '5 academic domains mastered',
      unlockedBy: 'Explore and collaborate across different academic disciplines and domains',
      perks: ['Interdisciplinary expert', 'Multi-branch master', 'Prism vision badge'],
      progress: { current: 0, total: 5 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    },
    {
      id: 'spam-alert-sanction',
      badgeId: 'spam-alert-sanction',
      name: 'Spam Alert (Sanction)',
      badgeName: 'Spam Alert (Sanction)',
      iconName: 'alert-circle',
      tier: 'Penalty',
      visualStyle: 'red-pulsing-cross',
      category: 'penalty',
      description: 'Triggered by any valid report; locks profile for 24 hours',
      requirement: 'Avoid repetitive, irrelevant, or disruptive posting behavior',
      unlockedBy: 'Follow community guidelines and avoid spam or violating content',
      perks: ['None - Penalty badge'],
      progress: { current: 0, total: 1 },
      isUnlocked: false,
      isEquipped: false,
      status: 'locked'
    }
  ]


  // Helper: Extract user ID safely (support both _id and id properties)
  const getUserId = () => {
    if (!user) return null
    return user._id || user.id || null
  }

  // Helper: Normalize tier name (convert UPPERCASE to Title Case)
  const normalizeTier = (tier) => {
    if (!tier) return 'Common'
    const tierMap = {
      'LEGENDARY': 'Legendary',
      'EPIC': 'Epic',
      'RARE': 'Rare',
      'COMMON': 'Common',
      'PENALTY': 'Penalty',
      'BASIC': 'Basic',
      'ADVANCED': 'Advanced',
      'ELITE': 'Elite',
      'UNCOMMON': 'Uncommon',
      'WARNING': 'Warning',
      'MINOR': 'Minor',
      'MAJOR': 'Major',
      'SEVERE': 'Severe',
      'PERMANENT': 'Permanent'
    }
    return tierMap[tier.toUpperCase()] || tier
  }

  // ✅ Fetch hard-mode badges on mount
  // Helper: Create fallback badges with all required properties
  const createFallbackBadges = () => {
    return HARD_MODE_BADGE_DEFINITIONS.map(def => ({
      id: def.id || def.badgeId,
      badgeId: def.badgeId || def.id,
      name: def.name || def.badgeName,
      badgeName: def.badgeName || def.name,
      iconName: def.iconName || 'award',
      icon: def.icon,
      tier: normalizeTier(def.tier),
      visualStyle: def.visualStyle,
      category: def.category || 'engagement',
      description: def.description || 'Elite badge',
      requirement: def.requirement || 'Meet criteria',
      unlockedBy: def.unlockedBy,
      perks: def.perks || ['Elite status'],
      progress: def.progress || { current: 0, total: 100 },
      isUnlocked: def.isUnlocked || false,
      isEquipped: def.isEquipped || false,
      status: 'locked',
      evolvesTo: def.evolvesTo,
      isMaxLevel: def.isMaxLevel || false
    }))
  }

  useEffect(() => {
    const userId = getUserId()
    console.log('[BadgeCenter] 🔍 User object:', user)
    console.log('[BadgeCenter] 📍 Extracted user ID:', userId)
    
    // ALWAYS show badges (from API or fallback)
    setHardModeBadgesLoading(true)
    
    if (userId) {
      console.log('[BadgeCenter] 🚀 Fetching hard-mode badges for user:', userId)
      axios.get(`/api/badges/hard-mode/${userId}`)
        .then(res => {
          console.log('[BadgeCenter] ✓ Hard-mode badges loaded:', res.data)
          // Normalize badge data from backend and enrich with HARD_MODE_BADGE_DEFINITIONS
          const normalizedBadges = (res.data.badges || []).map(badge => {
            // Find the matching definition to enrich missing fields
            const definition = HARD_MODE_BADGE_DEFINITIONS.find(def => 
              def.id === badge.badgeId || def.badgeId === badge.id || def.name === badge.name
            )
            
            return {
              ...badge,
              id: badge.badgeId || badge.id,
              badgeId: badge.badgeId || badge.id,
              name: badge.name || badge.badgeName || definition?.name,
              badgeName: badge.badgeName || badge.name || definition?.badgeName,
              iconName: badge.iconName || definition?.iconName || 'award',
              icon: badge.icon || definition?.icon || '✨',
              tier: normalizeTier(badge.tier || definition?.tier),
              visualStyle: badge.visualStyle || definition?.visualStyle,
              category: badge.category || definition?.category || 'engagement',
              description: badge.description || definition?.description || 'Elite badge',
              requirement: badge.requirement || definition?.requirement || 'Meet criteria',
              unlockedBy: badge.unlockedBy || definition?.unlockedBy,
              perks: badge.perks || definition?.perks || ['Elite status'],
              progress: badge.progress || definition?.progress || { current: 0, total: 100 },
              isUnlocked: badge.unlocked || badge.isUnlocked || false,
              status: badge.status || (badge.unlocked ? 'equipped' : 'locked'),
              evolvesTo: badge.evolvesTo || definition?.evolvesTo,
              isMaxLevel: badge.isMaxLevel || definition?.isMaxLevel || false
            }
          })
          console.log('[BadgeCenter] ✓ Normalized', normalizedBadges.length, 'badges')
          setHardModeBadges(normalizedBadges)
        })
        .catch(err => {
          console.error('[BadgeCenter] ❌ API Fetch failed:', err.response?.status, err.message)
          console.log('[BadgeCenter] ℹ️ Using fallback badges')
          setHardModeBadges(createFallbackBadges())
        })
        .finally(() => setHardModeBadgesLoading(false))
    } else {
      console.warn('[BadgeCenter] ⚠️ Cannot extract user ID. User object:', user)
      console.log('[BadgeCenter] ℹ️ Displaying all badges in locked state')
      setHardModeBadges(createFallbackBadges())
      setHardModeBadgesLoading(false)
    }
  }, [user])

  // ✅ Sync badges on mount to ensure isDev and role flags unlock badges immediately
  useEffect(() => {
    const userId = getUserId()
    if (userId) {
      axios.post(`/api/users/${userId}/sync-badges`)
        .then(res => {
          // Update parent component's user state with synced badges
          if (res.data && setUser) {
            setUser(res.data);
            console.log('[BadgeCenter] ✓ Badges synced and user state updated');
          }
        })
        .catch(err => console.log('[BadgeCenter] Badge sync completed or error:', err.message))
    }
  }, [user, setUser])

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
  

  // ✅ SYNC EVOLVING BADGES WITH USER DATA
  // Update progress for all evolving badges based on user stats
  console.log('\n📊 UPDATING EVOLVING BADGE PROGRESS:');
  
  // Safely update badge progress (with null checks)
  if (badgeCategories[0]?.badges) {
    // Streak Seeker - Based on loginStreak
    const streakValue = user?.loginStreak || 0;
    console.log(`  📈 Streak Seeker: User streak = ${streakValue} days`);
    if (badgeCategories[0].badges[0]) badgeCategories[0].badges[0].progress.current = Math.min(streakValue, badgeCategories[0].badges[0].progress.total); // Level 1 (7)
    if (badgeCategories[0].badges[1]) badgeCategories[0].badges[1].progress.current = Math.min(streakValue, badgeCategories[0].badges[1].progress.total); // Level 2 (30)
    if (badgeCategories[0].badges[2]) badgeCategories[0].badges[2].progress.current = Math.min(streakValue, badgeCategories[0].badges[2].progress.total); // Level 3 (100)
    
    // Voice of the Hub - Based on totalReplies
    const repliesValue = user?.totalReplies || 0;
    console.log(`  📈 Voice of the Hub: User replies = ${repliesValue}`);
    if (badgeCategories[0].badges[3]) badgeCategories[0].badges[3].progress.current = Math.min(repliesValue, badgeCategories[0].badges[3].progress.total); // Level 1 (100)
    if (badgeCategories[0].badges[4]) badgeCategories[0].badges[4].progress.current = Math.min(repliesValue, badgeCategories[0].badges[4].progress.total); // Level 2 (500)
    if (badgeCategories[0].badges[5]) badgeCategories[0].badges[5].progress.current = Math.min(repliesValue, badgeCategories[0].badges[5].progress.total); // Level 3 (1500)
    
    // Collab Master - Based on collabRoomsJoined (estimate from user stats)
    const collabRoomsValue = user?.collabRoomsJoined || user?.statsMap?.totalCollabRooms || 0;
    console.log(`  📈 Collab Master: User collab rooms = ${collabRoomsValue}`);
    if (badgeCategories[0].badges[6]) badgeCategories[0].badges[6].progress.current = Math.min(collabRoomsValue, badgeCategories[0].badges[6].progress.total); // Level 1 (10)
    if (badgeCategories[0].badges[7]) badgeCategories[0].badges[7].progress.current = Math.min(collabRoomsValue, badgeCategories[0].badges[7].progress.total); // Level 2 (25)
    if (badgeCategories[0].badges[8]) badgeCategories[0].badges[8].progress.current = Math.min(collabRoomsValue, badgeCategories[0].badges[8].progress.total); // Level 3 (50)
    
    // The Oracle - Based on correctPolls
    const pollWinsValue = user?.statsMap?.correctPolls || user?.pollWins || 0;
    console.log(`  📈 The Oracle: User correct polls = ${pollWinsValue}`);
    if (badgeCategories[0].badges[9]) badgeCategories[0].badges[9].progress.current = Math.min(pollWinsValue, badgeCategories[0].badges[9].progress.total); // Level 1 (5)
    if (badgeCategories[0].badges[10]) badgeCategories[0].badges[10].progress.current = Math.min(pollWinsValue, badgeCategories[0].badges[10].progress.total); // Level 2 (15)
    if (badgeCategories[0].badges[11]) badgeCategories[0].badges[11].progress.current = Math.min(pollWinsValue, badgeCategories[0].badges[11].progress.total); // Level 3 (50)
    
    console.log('✓ EVOLVING BADGE PROGRESS UPDATED\n');
    
    // ✅ AUTO-UNLOCK: Check if evolving badge criteria are met and unlock if needed
    console.log('🔓 CHECKING AUTO-UNLOCK FOR EVOLVING BADGES:');
    badgeCategories[0].badges.forEach(badge => {
      if (badge && !badge.isUnlocked && badge.progress?.current >= badge.progress?.total) {
        badge.isUnlocked = true;
        console.log(`  ✅ AUTO-UNLOCK TRIGGERED: ${badge.name} (${badge.progress.current}/${badge.progress.total})`);
      }
    });
    console.log('✓ AUTO-UNLOCK CHECK COMPLETE\n');
  } else {
    console.log('⚠️ Badge categories not yet initialized, skipping progress update');
  }

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

  const allPowerFiveBadges = powerFiveBadges.map(badge => ({ ...badge, category: 'Power Five', categoryColor: 'orange' }))
  
  // Simple tier normalization function for fallback badges
  const normalizeTierSimple = (tier) => {
    if (!tier) return 'Common'
    const tierMap = {
      'LEGENDARY': 'Legendary',
      'EPIC': 'Epic',
      'RARE': 'Rare',
      'COMMON': 'Common',
      'PENALTY': 'Penalty',
      'BASIC': 'Basic',
      'ADVANCED': 'Advanced',
      'ELITE': 'Elite',
      'UNCOMMON': 'Uncommon',
      'WARNING': 'Warning',
      'MINOR': 'Minor',
      'MAJOR': 'Major',
      'SEVERE': 'Severe',
      'PERMANENT': 'Permanent'
    }
    return tierMap[tier.toUpperCase()] || tier
  }
  
  // ✅ CONSOLIDATED: Merge Power-Five + Hard-Mode badges into single unified array
  // If hardModeBadges is empty (still loading), use HARD_MODE_BADGE_DEFINITIONS as fallback
  const hardModeBadgesOrFallback = hardModeBadges.length > 0 ? hardModeBadges : HARD_MODE_BADGE_DEFINITIONS.map(def => ({
    id: def.id || def.badgeId,
    badgeId: def.badgeId || def.id,
    name: def.name || def.badgeName,
    badgeName: def.badgeName || def.name,
    iconName: def.iconName || 'award',
    icon: def.icon,
    tier: normalizeTierSimple(def.tier),
    visualStyle: def.visualStyle,
    category: def.category || 'engagement',
    description: def.description || 'Elite badge',
    requirement: def.requirement || 'Meet criteria',
    unlockedBy: def.unlockedBy,
    perks: def.perks || ['Elite status'],
    progress: def.progress || { current: 0, total: 100 },
    isUnlocked: def.isUnlocked || false,
    isEquipped: def.isEquipped || false,
    status: 'locked',
    evolvesTo: def.evolvesTo,
    isMaxLevel: def.isMaxLevel || false
  }))
  
  const mergedBadges = [
    ...allPowerFiveBadges,
    ...hardModeBadgesOrFallback.map(badge => ({ 
      ...badge, 
      category: 'Elite', 
      categoryColor: 'purple',
      // Ensure hard-mode badges have all required fields
      icon: badge.icon || badge.name.charAt(0),
      tier: badge.tier || 'Rare',
      description: badge.description || badge.requirement || 'Elite badge'
    }))
  ]

  const allBadges = badgeCategories.flatMap(cat => cat.badges.map(badge => ({ ...badge, category: cat.name, categoryColor: cat.color })))
  const earnedBadges = allBadges.filter(badge => badge.isUnlocked)
  const evolvingBadges = allBadges.filter(badge => !badge.isUnlocked && badge.progress.current > 0)
  
  // ✅ CONSOLIDATED: Earned & Evolving from merged badges
  const mergedEarned = mergedBadges.filter(badge => badge.isUnlocked || badge.status === 'equipped')
  const mergedEvolving = mergedBadges.filter(badge => !badge.isUnlocked && badge.progress?.current > 0 && badge.status !== 'equipped')

  const tabs = [
    { id: 'all', label: 'All Badges', icon: '🏅' },
    ...(isModerator ? [{ id: 'mod-badge', label: 'Mod Badge', icon: '🛡️' }] : []),
    ...(hasModerationBadges ? [{ id: 'moderation-badges', label: 'Moderation Badges', icon: '🛡️' }] : []),
    ...(hasPenaltyBadges ? [{ id: 'penalty-badges', label: 'Penalty Badges', icon: '🚫' }] : [])
  ]

  const getBadgesForTab = () => {
    switch (activeTab) {
      case 'mod-badge':
        return isModerator ? [moderatorBadge] : []
      case 'moderation-badges':
        return hasModerationBadges ? moderationBadges.filter(badge => badge.isUnlocked) : []
      case 'penalty-badges':
        return hasPenaltyBadges ? penaltyBadges.filter(badge => badge.isUnlocked) : []
      default:
        return mergedBadges
    }
  }

  const getFilteredBadges = () => {
    const badges = getBadgesForTab()
    return badges
  }

  // Helper: Get badge series name from badge ID
  const getBadgeSeriesName = (badgeId) => {
    if (badgeId?.includes('streak-seeker')) return 'Streak Seeker'
    if (badgeId?.includes('collab-master')) return 'Collab Master'
    if (badgeId?.includes('voice-of-hub')) return 'Voice of the Hub'
    if (badgeId?.includes('the-oracle')) return 'The Oracle'
    return null
  }

  // Get current preview data for modal using universal config
  const getPreviewTierData = (badgeId) => {
    if (!selectedBadge || !previewLevel) return null
    
    const seriesName = getBadgeSeriesName(badgeId)
    if (!seriesName || !badgeLevelConfig[seriesName]) return null
    
    return badgeLevelConfig[seriesName][previewLevel]
  }

  // Get badge series config
  const getBadgeSeriesConfig = (badgeId) => {
    const seriesName = getBadgeSeriesName(badgeId)
    if (!seriesName || !badgeLevelConfig[seriesName]) return null
    return badgeLevelConfig[seriesName]
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

  // ✅ Get badge visual style colors (glow effects) for hard-mode badges
  const getBadgeVisualStyle = (visualStyle) => {
    const styles = {
      'gold-glow': 'text-yellow-300',
      'purple-shimmer': 'text-purple-300',
      'electric-blue': 'text-blue-300',
      'dark-moon-glow': 'text-slate-200',
      'green-aurora': 'text-green-300',
      'ruby-red': 'text-red-300',
      'emerald-shine': 'text-emerald-300',
      'molten-gold': 'text-yellow-400',
      'cobalt-steel': 'text-blue-400',
      'silver-gloss': 'text-gray-200',
      'animated-fire': 'text-orange-400 animate-pulse',
      'cyan-pulse': 'text-cyan-300 animate-pulse',
      'solar-flare': 'text-yellow-300 animate-pulse',
      'polished-chrome': 'text-gray-300',
      'amethyst-eye': 'text-violet-300',
      'white-marble': 'text-white',
      'bronze-oak': 'text-amber-600',
      'orange-neon': 'text-orange-400',
      'multicolor-prism': 'text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-purple-300 to-cyan-300',
      'red-pulsing-cross': 'text-red-500 animate-pulse'
    }
    return styles[visualStyle] || 'text-cyan-300'
  }

  // ✅ Handle hard-mode badge unlock
  const handleUnlockHardModeBadge = async (badge) => {
    try {
      const userId = getUserId()
      if (!userId) {
        alert('❌ Cannot unlock badge: User ID not available')
        return
      }
      
      const response = await axios.post(`/api/badges/hard-mode/${userId}/unlock/${badge.badgeId}`)
      console.log('[BadgeCenter] ✅ Badge unlocked:', response.data)
      
      // Update hard-mode badges
      setHardModeBadges(prev => prev.map(b => 
        b.badgeId === badge.badgeId ? { ...b, isEquipped: true, status: 'equipped' } : b
      ))
      
      alert(`🎉 ${response.data.badgeName} badge unlocked!`)
    } catch (error) {
      if (error.response?.status === 429) {
        const data = error.response.data
        console.log('[BadgeCenter] ⏳ Badge pending unlock - daily limit reached')
        setUnlockedCountdown(prev => ({
          ...prev,
          [badge.badgeId]: data.remainingTime
        }))
        const hoursRemaining = Math.floor(data.remainingTime / 3600000)
        alert(`⏳ Daily unlock limit reached. Badge waiting for tomorrow!\n${hoursRemaining} hours remaining`)
      } else {
        alert(`❌ Failed to unlock badge: ${error.response?.data?.message || error.message}`)
      }
    }
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
            className={`px-6 py-3 rounded-lg transition-all duration-200 font-medium backdrop-blur-xl border min-h-[44px] focus:ring-2 focus:ring-cyan-400/50 focus:outline-none hover:-translate-y-0.5 ${
              activeTab === tab.id
                ? 'bg-cyan-400/25 text-cyan-200 border-cyan-400/50 shadow-lg shadow-cyan-400/30 scale-105'
                : 'text-muted-foreground/70 border-white/15 bg-white/8 hover:bg-white/12 hover:border-white/20'
            }`}
            aria-pressed={activeTab === tab.id}
            aria-label={tab.label}
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
                      className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 min-h-[44px] focus:ring-2 focus:ring-red-400/50 focus:outline-none"
                      title="Remove from featured"
                      disabled={featuredBadgesLoading}
                      aria-label={`Remove ${badge.name} from featured badges`}
                    >
                      <span className="text-white text-sm font-bold">−</span>
                    </button>
                  )}
                  
                  {/* Icon */}
                  <div className={`flex justify-center mb-2 ${badge.tier === 'Legendary' || badge.tier === 'Elite' ? 'animate-pulse' : ''} ${badge.isPenaltyBadge ? 'opacity-80' : ''}`}>
                    {badge.iconName ? (
                      <LucideIcon 
                        iconName={badge.iconName}
                        className="w-8 h-8"
                      />
                    ) : (
                      <span className="text-3xl">{badge.icon}</span>
                    )}
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

      {/* ✅ CONSOLIDATED: Unified Badges Grid (Power-Five + Hard-Mode + All Categories) */}
      {(activeTab !== 'mod-badge' && activeTab !== 'moderation-badges' && activeTab !== 'penalty-badges') && (
        <div className="space-y-6">
          {/* Show info header for "All Badges" tab */}
          {activeTab === 'all' && (
            <div className="bg-gradient-to-r from-cyan-950/40 to-purple-950/40 border border-cyan-400/30 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">🏅</div>
                <div>
                  <h3 className="text-xl font-bold text-cyan-300 mb-2">All Badges ({mergedBadges.length} total)</h3>
                  <p className="text-sm text-gray-300">
                    All achievements and elite badges are displayed here. Power-Five badges are earned through key platform activities. Elite badges require rigorous criteria and have a daily unlock limit of 2 per 24 hours.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Badges Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {getFilteredBadges().map((badge) => {
            // Determine animation for hard-mode badges
            let tierAnimation = ''
            if ((badge.isUnlocked || badge.status === 'equipped') && (badge.category === 'Elite' || badge.badgeId)) {
              if (badge.tier === 'Legendary') tierAnimation = 'animate-[gold-shimmer_3s_ease-in-out_infinite]'
              else if (badge.tier === 'Epic') tierAnimation = 'animate-[purple-pulse_2.5s_ease-in-out_infinite]'
              else if (badge.tier === 'Rare') tierAnimation = 'animate-[blue-glow_2s_ease-in-out_infinite]'
              else if (badge.tier === 'Common') tierAnimation = 'animate-[silver-subtle_2s_ease-in-out_infinite]'
              else if (badge.tier === 'Penalty') tierAnimation = 'animate-[red-alert-pulse_1.5s_ease-in-out_infinite]'
            }

            // Determine card styling based on badge type and status
            let cardStyle = ''
            if (badge.category === 'Elite' || badge.badgeId) {
              // Hard-mode badge styling
              cardStyle = badge.status === 'equipped' 
                ? `border-cyan-400/80 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 shadow-lg shadow-cyan-400/40 ${tierAnimation}`
                : badge.status === 'pending-unlock'
                ? `border-yellow-400/60 bg-gradient-to-br from-yellow-900/30 to-orange-900/30 shadow-lg shadow-yellow-400/20`
                : badge.isUnlocked
                ? `border-purple-400/60 bg-gradient-to-br from-purple-900/30 to-blue-900/30 shadow-lg shadow-purple-400/20 ${tierAnimation}`
                : 'border-gray-500/40 opacity-60 bg-gray-900/20'
            } else {
              // Power-five badge styling
              cardStyle = badge.isUnlocked 
                ? `border-2 shadow-lg ${
                    badge.tier === 'Legendary' ? 'border-yellow-500/60 shadow-yellow-500/20 bg-gradient-to-br from-yellow-900/20 to-orange-900/20' :
                    badge.tier === 'Epic' ? 'border-purple-500/60 shadow-purple-500/20 bg-gradient-to-br from-purple-900/20 to-blue-900/20' :
                    badge.tier === 'Rare' ? 'border-blue-500/60 shadow-blue-500/20 bg-gradient-to-br from-blue-900/20 to-cyan-900/20' :
                    'border-cyan-500/40 shadow-cyan-500/10 bg-gradient-to-br from-cyan-900/10 to-slate-900/10'
                  }`
                : 'border-2 border-gray-700/40 opacity-50 bg-gray-900/20 hover:opacity-70'
            }

            return (
            <Card 
              key={badge.id || badge.badgeId} 
              className={`relative component-badge-card p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl cursor-pointer backdrop-blur-xl border-2 ${cardStyle}`}
              onClick={() => { setSelectedBadge(badge); setPreviewLevel(badge.evolvesTo ? 1 : null); }}
            >
              {/* Status badges for hard-mode */}
              {badge.category === 'Elite' && badge.status === 'pending-unlock' && (
                <div className="absolute -top-3 -right-3 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  ⏳ PENDING
                </div>
              )}
              {badge.category === 'Elite' && badge.status === 'equipped' && (
                <div className="absolute -top-3 -right-3 bg-cyan-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                  ✓ EQUIPPED
                </div>
              )}
              {badge.category === 'Elite' && badge.tier === 'Legendary' && badge.isUnlocked && badge.status !== 'equipped' && (
                <div className="absolute top-2 right-2 text-yellow-300 text-lg animate-pulse">⭐</div>
              )}
              {badge.category === 'Elite' && badge.tier === 'Epic' && badge.isUnlocked && badge.status !== 'equipped' && (
                <div className="absolute top-2 right-2 text-purple-300 text-lg animate-pulse">✨</div>
              )}
              
              {/* Evolving Badge Indicator */}
              {badge.evolvesTo && (
                <div className="absolute top-2 left-2 bg-blue-500/80 text-white text-xs font-bold px-2 py-1 rounded-full">
                  📈 Evolving
                </div>
              )}

              <div className="text-center space-y-3">
                <div className={`flex justify-center ${badge.evolvesTo ? 'evolving-halo' : ''} ${(badge.tier === 'Legendary' || badge.tier === 'Epic') && badge.isUnlocked ? 'animate-pulse' : ''}`}>
                  {badge.isUnlocked || badge.status === 'equipped' ? (
                    <LucideIcon 
                      iconName={badge.iconName || 'award'}
                      className={`w-12 h-12 relative z-10 ${
                        !badge.isUnlocked && badge.category !== 'Elite' ? 'opacity-40 grayscale' : 
                        badge.tier === 'Legendary' ? 'text-yellow-400' :
                        badge.tier === 'Epic' ? 'text-purple-400' :
                        badge.tier === 'Rare' ? 'text-blue-400' :
                        'text-gray-300'
                      }`}
                    />
                  ) : (
                    <XCircle className="w-12 h-12 text-gray-500" />
                  )}
                </div>
                <h3 className={`font-semibold text-lg ${!badge.isUnlocked ? 'text-gray-500' : 'text-white'}`}>
                  {badge.name || badge.badgeName}
                </h3>
                <Badge className={`${getTierColor(badge.tier)} px-3 py-1 rounded-full w-fit mx-auto`}>
                  {getTierStars(badge.tier)}
                </Badge>
                
                {/* Progress bar for unearned badges */}
                {!badge.isUnlocked && (
                  <div className="space-y-2 mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="font-semibold">Progress</span>
                      <span className="font-mono">{badge.progress?.current || 0}/{badge.progress?.total || 1}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden border border-gray-600">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 shadow-lg ${
                          badge.category === 'Elite' && badge.status === 'pending-unlock'
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-500/50'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-cyan-500/50'
                        }`}
                        style={{ width: `${Math.min(((badge.progress?.current || 0) / (badge.progress?.total || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Action buttons for hard-mode badges */}
                {badge.category === 'Elite' && badge.isUnlocked && badge.status !== 'equipped' && (
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnlockHardModeBadge(badge)
                    }}
                    className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold min-h-[40px]"
                  >
                    🔓 Equip Badge
                  </Button>
                )}

              </div>
            </Card>
            )
          })}
          </div>
        </div>
        )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-8 rounded-2xl shadow-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30">
            <div className="text-center space-y-4">
              <div className={`flex justify-center ${selectedBadge.evolvesTo ? 'evolving-halo' : ''} ${selectedBadge.tier === 'Legendary' || selectedBadge.tier === 'Epic' ? 'animate-pulse' : ''}`}>
                {selectedBadge.isUnlocked ? (
                  <LucideIcon 
                    iconName={selectedBadge.iconName || 'award'}
                    className={`w-16 h-16 ${
                      (() => {
                        // For evolving badges, use preview tier color based on previewLevel
                        if (previewLevel && selectedBadge.evolvesTo) {
                          const seriesName = getBadgeSeriesName(selectedBadge.badgeId)
                          const config = badgeLevelConfig[seriesName]?.[previewLevel]
                          if (config) {
                            // Convert tier color names to lucide icon colors
                            const tierColorMap = {
                              'Common': 'text-gray-300',
                              'Rare': 'text-blue-400',
                              'Epic': 'text-purple-400',
                              'Legendary': 'text-yellow-400'
                            }
                            return tierColorMap[config.rank] || 'text-gray-300'
                          }
                        }
                        // Default to current tier color
                        return selectedBadge.tier === 'Legendary' ? 'text-yellow-400' :
                               selectedBadge.tier === 'Epic' ? 'text-purple-400' :
                               selectedBadge.tier === 'Rare' ? 'text-blue-400' :
                               'text-gray-300'
                      })()
                    }`}
                  />
                ) : (
                  <XCircle className="w-16 h-16 text-gray-500" />
                )}
              </div>
              {(() => {
                // Compute the display tier based on previewLevel for evolving badges
                let displayTier = selectedBadge.tier
                let displayLevel = null
                
                if (previewLevel && selectedBadge.evolvesTo) {
                  const seriesName = getBadgeSeriesName(selectedBadge.badgeId)
                  const config = badgeLevelConfig[seriesName]?.[previewLevel]
                  if (config) {
                    displayTier = config.rank
                    displayLevel = previewLevel
                  }
                }
                
                return (
                  <>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedBadge.name}
                      {displayLevel && (
                        <span className="text-cyan-300 ml-2">(Lvl {displayLevel})</span>
                      )}
                    </h2>
                    <Badge className={`${getTierColor(displayTier)} px-4 py-2 text-sm mx-auto`}>
                      {getTierStars(displayTier)} {displayTier}
                    </Badge>
                  </>
                )
              })()}
              
              {/* Evolution Path - Comprehensive */}
              {(selectedBadge.evolvesTo || selectedBadge.isMaxLevel) && (
                <div className="w-full space-y-3 border-t-2 border-cyan-500/30 pt-3 mt-2">
                  <div className="text-xs font-bold text-center text-cyan-300 uppercase tracking-widest px-2 py-1 bg-cyan-500/10 rounded">
                    📈 Part of an Evolving Badge Series
                  </div>
                  
                  {/* Evolution Chain Display - Universal */}
                  <div className="space-y-1.5">
                    {(() => {
                      const seriesConfig = getBadgeSeriesConfig(selectedBadge.badgeId)
                      if (!seriesConfig) return null
                      
                      return (
                        <div className="space-y-1">
                          {/* Render all 3 levels for this badge series */}
                          {[1, 2, 3].map((level) => {
                            const levelConfig = seriesConfig[level]
                            const isActive = previewLevel === level
                            const starCount = levelConfig.stars
                            const star = '★'.repeat(starCount)
                            
                            return (
                              <div key={level}>
                                <button 
                                  onClick={() => setPreviewLevel(level)}
                                  className={`w-full text-xs font-bold p-2.5 rounded text-center transition-all cursor-pointer hover:shadow-lg ${
                                    isActive 
                                      ? `bg-${levelConfig.bgColor} border-2 ${levelConfig.borderColor} ${levelConfig.textColor} shadow-lg ${levelConfig.shadowColor}` 
                                      : 'bg-gray-900/20 border border-gray-700/40 text-gray-400 hover:border-gray-600/60'
                                  }`}>
                                  {star} Level {level}: {levelConfig.rank} • {levelConfig.req}
                                </button>
                                {level < 3 && <div className="text-center text-gray-600/60 text-lg">↓</div>}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}
              
              {/* Show preview content for evolving badges when a tier is selected */}
              {previewLevel && selectedBadge.evolvesTo && (
                <div>
                  {(() => {
                    const previewData = getPreviewTierData(selectedBadge.badgeId)
                    if (!previewData) return null
                    return (
                      <div className="space-y-3">
                        {/* Main Requirement Box */}
                        <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-lg p-4">
                          <div className="flex items-start space-x-2 mb-2">
                            <span className="text-lg">🎯</span>
                            <div className="flex-1">
                              <div className="font-bold text-cyan-300">How to Unlock Level {previewLevel}:</div>
                              <div className="text-sm text-cyan-200 mt-1">{previewData.desc}</div>
                            </div>
                          </div>
                          
                          {/* Tip section */}
                          <div className="mt-3 pt-3 border-t border-cyan-500/30 text-xs text-cyan-300">
                            <span className="font-semibold">💡 Tip: </span>{previewData.fullDesc}
                          </div>
                        </div>
                        
                        {/* Progress Information for preview */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-blue-300">Level {previewLevel} Target</span>
                            <span className="text-xs font-mono text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
                              0/{previewData.targetValue} {previewData.targetUnit}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden border border-gray-600">
                            <div 
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500 shadow-lg shadow-cyan-500/50"
                              style={{ width: '0%' }}
                            />
                          </div>
                          <div className="text-xs text-blue-300/70 mt-2">
                            {previewData.targetValue} total {previewData.targetUnit} needed
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
              
              {/* Show unlock requirement for locked badges - ENHANCED */}
              {!selectedBadge.isUnlocked && !previewLevel && (
                <div className="space-y-3">
                  {/* Main Requirement Box */}
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                    <div className="flex items-start space-x-2 mb-2">
                      <span className="text-lg">🔒</span>
                      <div className="flex-1">
                        <div className="font-bold text-red-300">How to Unlock:</div>
                        <div className="text-sm text-red-200 mt-1">{selectedBadge.requirement}</div>
                      </div>
                    </div>
                    
                    {/* Additional criteria info if available */}
                    {selectedBadge.unlockedBy && (
                      <div className="mt-3 pt-3 border-t border-red-500/30 text-xs text-red-300">
                        <span className="font-semibold">💡 Tip: </span>{selectedBadge.unlockedBy}
                      </div>
                    )}
                  </div>
                  
                  {/* Progress Information */}
                  {selectedBadge.progress && selectedBadge.progress.total > 1 && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-blue-300">Progress</span>
                        <span className="text-xs font-mono text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
                          {selectedBadge.progress.current}/{selectedBadge.progress.total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden border border-gray-600">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500 shadow-lg shadow-blue-500/50"
                          style={{ width: `${Math.min((selectedBadge.progress.current / selectedBadge.progress.total) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-blue-300/70 mt-2">
                        {selectedBadge.progress.total - selectedBadge.progress.current} more to go!
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Unlocked badge info */}
              {selectedBadge.isUnlocked && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-bold text-green-300">Unlocked!</div>
                      <div className="text-xs text-green-200">You've earned this badge</div>
                    </div>
                  </div>
                </div>
              )}
              
              <Button onClick={() => { setSelectedBadge(null); setPreviewLevel(null); }} className="w-full min-h-[44px]">
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
                  .map((badge) => {
                    const tierIconColor = {
                      'Legendary': 'text-yellow-400',
                      'Epic': 'text-purple-400',
                      'Rare': 'text-blue-400',
                      'Uncommon': 'text-green-400',
                      'Common': 'text-gray-400',
                      'Penalty': 'text-red-400'
                    }
                    return (
                      <button
                        key={badge.id}
                        onClick={() => handleSelectFeaturedBadge(badge)}
                        className="p-4 rounded-lg border-2 border-cyan-400/30 bg-cyan-950/20 hover:bg-cyan-950/40 hover:border-cyan-400/60 cursor-pointer transition-all transform hover:scale-105 min-h-[44px] flex flex-col items-center justify-center focus:ring-2 focus:ring-cyan-400/50 focus:outline-none"
                        aria-label={`Select ${badge.name} as featured badge`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          {badge.iconName ? (
                            <LucideIcon 
                              iconName={badge.iconName}
                              className={`w-10 h-10 ${tierIconColor[badge.tier] || 'text-gray-400'}`}
                            />
                          ) : (
                            <div className="text-4xl">{badge.icon}</div>
                          )}
                          <h3 className="text-sm font-semibold text-center text-cyan-300">{badge.name}</h3>
                          <Badge className={`${getTierColor(badge.tier)} text-xs`}>
                            {getTierStars(badge.tier)}
                          </Badge>
                        </div>
                      </button>
                    )
                  })}
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