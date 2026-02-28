# Badge As-Built Documentation
## Tessera React Frontend - Badge System

**Date**: February 17, 2026  
**Purpose**: Forensic documentation of badge implementation in React frontend  
**Framework**: React with Vite  
**Location**: `tessera-frontend` workspace

---

## 1. Badge Component Source

### 1.1 Core Badge Component

**File**: `src/components/ui/badge.jsx`  
**Export**: `Badge` (forwardRef component)

#### Component Signature
```jsx
const Badge = forwardRef(
  ({ 
    className, 
    variant = 'glass', 
    size = 'default', 
    interactive = false, 
    pulse = false, 
    dot = false, 
    earned = false, 
    level,      // Level indicator (1, 2, 3)
    children,   // Badge content
    ...props 
  }, ref) => { ... }
)
```

#### Props Interface
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | `'glass'` | Visual style (see variants below) |
| `size` | string | `'default'` | Size preset: sm, default, lg |
| `interactive` | boolean | `false` | Adds hover animations |
| `pulse` | boolean | `false` | Adds pulse animation |
| `dot` | boolean | `false` | Shows dot indicator |
| `earned` | boolean | `false` | Special styling for unlocked badges |
| `level` | number | undefined | Shows level badge (1-5 stars) |
| `className` | string | - | Additional CSS classes |

---

### 1.2 Badge Variants

**Implementation**: Tailwind CSS variants with glassmorphism

| Variant | Base Style | Use Case |
|---------|------------|----------|
| `default` | Solid primary with shadow | Primary actions |
| `glass` | Backdrop blur, white/8 bg, border | Default badge style |
| `secondary` | Light glass tint | Secondary badges |
| `outline` | Glass border only | Outline badges |
| `success` | Emerald glassmorphism | Success states |
| `warning` | Amber glassmorphism | Warning states |
| `destructive` | Red glassmorphism | Error/danger |
| `info` | Primary glassmorphism | Info badges |
| `gradient` | Subtle primary gradient | Special badges |
| `neon` | Cyan (cyber theme) / Primary (other themes) | Cyber theme only |

**Glassmorphism Formula**:
```css
backdrop-blur-xl
bg-{color}/10
border border-{color}/20
text-{color}-600 dark:text-{color}-400
hover:bg-{color}/15 hover:border-{color}/30
```

---

### 1.3 Size Presets

| Size | Classes | Text Size |
|------|---------|-----------|
| `sm` | `px-3 py-1.5 text-xs rounded-lg` | Extra small |
| `default` | `px-4 py-2 text-sm rounded-lg` | Standard |
| `lg` | `px-5 py-2.5 text-base rounded-lg` | Large |

---

### 1.4 Special Effects

#### Shimmer Effect
```jsx
<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
               -translate-x-full group-hover:translate-x-full transition-transform duration-700">
</div>
```
**Trigger**: On hover (via `group-hover`)  
**Duration**: 700ms  
**Effect**: Horizontal shimmer sweep

#### Level Indicator
```jsx
{level && (
  <div className="absolute -top-1 -right-1 w-5 h-5 
                  bg-gradient-to-r from-amber-400 to-orange-500 
                  text-white text-xs font-bold rounded-full 
                  flex items-center justify-center shadow-md">
    {level}
  </div>
)}
```
**Position**: Top-right corner  
**Style**: Amber-to-orange gradient pill  
**Content**: Numeric level (e.g., "1", "2", "3")

#### Dot Indicator
```jsx
{dot && (
  <div className="w-2.5 h-2.5 rounded-full mr-2 relative
                  bg-{variantColor}">
    {/* Pulse effect for dot */}
  </div>
)}
```
**Purpose**: Status indicator  
**Color**: Variant-dependent

---

## 2. BadgeCenter Component

**File**: `src/components/BadgeCenter.jsx`  
**Purpose**: Badge management and display center  
**Lines**: 2,131 (extensive implementation)

### 2.1 Badge Level Configuration

**Location**: Lines 76-250+ (badgeLevelConfig object)

#### Evolution System
Each badge has 3 tiers:
1. **Common** (Rank 1) - Gray, 1 star
2. **Rare/Epic** (Rank 2) - Blue/Purple, 3-4 stars
3. **Legendary** (Rank 3) - Gold, 5 stars

#### Example: Streak Seeker Badge
```javascript
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
    targetValue: 7,
    targetUnit: 'days'
  },
  2: { 
    level: 2,
    rank: 'Rare', 
    stars: 3, 
    color: '#3b82f6',  // Blue
    req: '30 days',
    targetValue: 30,
    targetUnit: 'days'
  },
  3: { 
    level: 3,
    rank: 'Legendary', 
    stars: 5, 
    color: '#f59e0b',  // Gold
    req: '100 days (Iron Streak)',
    targetValue: 100,
    targetUnit: 'days'
  }
}
```

#### Badge Series Documented
1. **Streak Seeker** - Login streak (7/30/100 days)
2. **Collab Master** - Room participation (10/25/50 rooms)
3. **Voice of the Hub** - Reply count (100/500/1500 replies)
4. **The Oracle** - Poll prediction wins (5/15/50 wins)

**Note**: Configuration continues beyond scanned 250 lines

---

### 2.2 Icon System

**Library**: Lucide React (`lucide-react`)

#### Icon Mapping Function
```jsx
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
  }
  return iconMap[iconName] || Trophy
}
```

#### Icon Renderer Component
```jsx
const LucideIcon = ({ iconName, className = 'w-6 h-6' }) => {
  const IconComponent = getIconComponent(iconName)
  return <IconComponent className={className} />
}
```

**Usage Example**:
```jsx
<LucideIcon iconName="flame" className="w-8 h-8 text-orange-500" />
```

---

### 2.3 Badge State Management

#### State Hook (In BadgeCenter)
```jsx
const [badges, setBadges] = useState([])
const [loading, setLoading] = useState(true)
```

**Not Shown in Scan**:
- Badge unlock logic
- Progress tracking
- Backend sync

---

### 2.4 WebSocket Integration

**Libraries**:
- `sockjs-client`
- `@stomp/stompjs`

**Expected Usage**:
- Connect to `/ws-studcollab` endpoint
- Subscribe to badge unlock notifications
- Real-time badge progress updates

**Status**: Import statements present, implementation beyond scan range

---

## 3. ProfilePage Badge Display

**File**: `src/components/ProfilePage.jsx`  
**Lines Scanned**: 1-250 of 791

### 3.1 Badge Icon Mapping (Profile)

```jsx
const badgeIcons = {
  'Skill Sage': '🧠',
  'Campus Catalyst': '📢',
  'Pod Pioneer': '🌱',
  'Bridge Builder': '🌉',
  'Founding Dev': '💻',
  'Profile Pioneer': '👤',
  'Spam Alert': '🚫',
  'skill-sage': '🧠',
  'campus-catalyst': '📢',
  'pod-pioneer': '🌱',
  // ... (continues)
}
```

**Note**: Uses EMOJI icons in ProfilePage, but Lucide icons in BadgeCenter

---

### 3.2 Badge Display Logic

#### Displayed Badges (Public Profile)
```jsx
const [selectedBadges, setSelectedBadges] = useState(
  profileOwner?.displayedBadges || []
)
```

**Limit**: 3 badges max for public display

#### Badge Selection Toggle
```jsx
const toggleBadgeSelection = (badge) => {
  setSelectedBadges(prev => {
    if (prev.includes(badge)) {
      return prev.filter(b => b !== badge)
    } else {
      if (prev.length >= 3) {
        alert('You can only display 3 badges on your public profile')
        return prev
      }
      return [...prev, badge]
    }
  })
}
```

**Validation**: Hard limit of 3 displayed badges

---

### 3.3 Badge Sync on Profile Load

```jsx
useEffect(() => {
  const fetchProfileData = async () => {
    // ... fetch profile
    
    // 🎖️ SYNC BADGES: Ensure badges match isDev and role flags
    try {
      const syncRes = await api.post(`/api/users/${profileId}/sync-badges`)
      userData = syncRes.data
      console.log("✅ Badges synced on profile load:", syncRes.data.badges)
    } catch (syncErr) {
      console.warn("⚠️ Badge sync failed (non-critical):", syncErr)
    }
    
    setProfileOwner(userData)
  }
  
  fetchProfileData()
}, [profileOwner?.id])
```

**Endpoint**: POST `/api/users/{userId}/sync-badges`  
**Purpose**: Auto-sync badges based on user attributes  
**Error Handling**: Non-critical - continues if sync fails

---

### 3.4 Save Displayed Badges

```jsx
const handleSaveBadges = async () => {
  setLoading(true)
  try {
    const res = await api.post(
      `/api/users/${profileOwner.id}/displayed-badges`, 
      { badges: selectedBadges }
    )
    if (window.onProfileUpdate) {
      window.onProfileUpdate(res.data)
    }
    setProfileOwner(res.data)
    setIsEditingBadges(false)
    alert('Featured badges updated successfully!')
  } catch (err) {
    setError('Failed to update badges: ' + err.message)
  } finally {
    setLoading(false)
  }
}
```

**Endpoint**: POST `/api/users/{userId}/displayed-badges`  
**Body**: `{ "badges": ["Badge1", "Badge2", "Badge3"] }`

---

## 4. Badge Unlock Logic (Frontend)

**Location**: BadgeCenter.jsx (beyond scanned lines)

### 4.1 Expected Implementation

Based on backend endpoints:
- **Fetch Badges**: GET `/api/badges/hard-mode/{userId}`
- **Unlock Badge**: POST `/api/badges/hard-mode/{userId}/unlock/{badgeId}`
- **Track Login**: POST `/api/badges/hard-mode/{userId}/track-login`
- **Track Reply**: POST `/api/badges/hard-mode/{userId}/track-reply`

### 4.2 Unlock State Determination

**Backend-Driven**:
- ✅ Unlock status retrieved from GET endpoint
- ✅ Progress calculated on backend
- ✅ Daily unlock limit (2/day) enforced by backend

**Frontend Role**:
- Display unlock status
- Show progress bars
- Handle unlock button clicks
- Display errors (429 Too Many Requests if limit exceeded)

---

## 5. Styling System

### 5.1 Color Palette

#### Rank Colors
| Rank | Color | Hex | Tailwind |
|------|-------|-----|----------|
| Common | Gray | #94a3b8 | gray-500 |
| Rare | Blue | #3b82f6 | blue-500 |
| Epic | Purple | #a855f7 | purple-500 |
| Legendary | Gold | #f59e0b | yellow-500 |

#### Badge Background Pattern
```
bg-{color}-500/70  (semi-transparent)
border-{color}-300  (lighter border)
text-{color}-50  (light text)
shadow-{color}-500/20  (subtle shadow)
```

---

### 5.2 Glassmorphism Theme

**Base Formula** (from badge.jsx):
```css
backdrop-blur-xl       /* Background blur */
bg-white/8            /* 8% white overlay */
border border-white/15 /* 15% white border */
text-foreground        /* Theme-aware text */
hover:bg-white/12      /* Hover state */
shadow-sm              /* Subtle shadow */
```

**Professional Aesthetic**:
- NO heavy gradients
- NO excessive glow
- SOBER saturation (80% max)
- Subtle animations (500ms duration)
- Minimal hover effects (-translate-y-1 only)

---

### 5.3 Theme Compatibility

#### Theme Hook
```jsx
import { useTheme } from '@/lib/theme.js'
const { theme } = useTheme()
```

#### Cyber Theme Special Case
```jsx
variant === 'neon' && (theme === 'cyber'
  ? 'bg-cyan-400/10 border-cyan-400/20 text-cyan-300'
  : 'bg-primary/10 border-primary/20 text-primary-solid'
)
```

**Neon Variant**: Only activates cyan colors in cyber theme

---

### 5.4 Animations

#### Shimmer Effect
- **Trigger**: `group-hover`
- **Duration**: 700ms
- **Easing**: `ease-out`
- **Transform**: `translateX(-100%)` to `translateX(100%)`

#### Pulse (Optional)
- **Class**: `animate-pulse`
- **Use**: For active/attention badges

#### Hover Lift
- **Class**: `hover:-translate-y-1`
- **Duration**: 500ms
- **Use**: Interactive badges only

---

## 6. Backend Dependency Mapping

### 6.1 Badge Endpoints Used

| Frontend Action | Backend Endpoint | Status |
|-----------------|------------------|--------|
| Fetch hard-mode badges | GET `/api/badges/hard-mode/{userId}` | ✅ EXISTS |
| Unlock badge | POST `/api/badges/hard-mode/{userId}/unlock/{badgeId}` | ✅ EXISTS |
| Check remaining unlocks | GET `/api/badges/hard-mode/{userId}/remaining-unlocks` | ✅ EXISTS |
| Track login | POST `/api/badges/hard-mode/{userId}/track-login` | ✅ EXISTS |
| Track reply | POST `/api/badges/hard-mode/{userId}/track-reply` | ✅ EXISTS |
| Sync badges | POST `/api/users/{userId}/sync-badges` | ⚠️ NOT FOUND (called in ProfilePage) |
| Update displayed badges | POST `/api/users/{userId}/displayed-badges` | ⚠️ NOT FOUND |

**Mismatch**: ProfilePage calls non-existent endpoints

---

### 6.2 Backend Endpoint Gaps

#### Missing in Backend (Called by Frontend)
1. **POST `/api/users/{userId}/sync-badges`**
   - Called in: ProfilePage.jsx line 73
   - Purpose: Auto-sync badges based on isDev/role
   - Status: ❌ NOT FOUND in backend scan

2. **POST `/api/users/{userId}/displayed-badges`**
   - Called in: ProfilePage.jsx handleSaveBadges()
   - Purpose: Save 3 featured badges for public profile
   - Status: ❌ NOT FOUND in backend scan

**Impact**: Frontend code will fail on these calls

---

## 7. Component Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `ui/badge.jsx` | Core badge component with variants | ✅ Fully scanned |
| `BadgeCenter.jsx` | Badge management UI, unlock logic | ⚠️ Partially scanned (250/2131 lines) |
| `ProfilePage.jsx` | Profile with badge selection | ⚠️ Partially scanned (250/791 lines) |
| `ui/PenaltyCountdownTimer.jsx` | Penalty expiry timer | Referenced, not scanned |

---

## 8. Icon Assets

### 8.1 Library Used
**Package**: `lucide-react`  
**Version**: Not specified  
**Total Icons**: 25+ documented in mapping

### 8.2 Icon vs Emoji Usage

**BadgeCenter**: Uses Lucide icons (SVG components)  
**ProfilePage**: Uses emoji Unicode characters  

**Inconsistency**: Same badge has different icons in different components

Example:
- BadgeCenter: `'flame'` → `<Flame />` (Lucide)
- ProfilePage: Not shown in scan, likely emoji '🔥'

---

## 9. Badge Categories (Inferred from Config)

| Category | Badges | Tracking Metric |
|----------|--------|-----------------|
| **Engagement** | Streak Seeker, Voice of the Hub | Login days, reply count |
| **Collaboration** | Collab Master, Bridge Builder | Rooms joined, connections made |
| **Knowledge** | The Oracle, Skill Sage | Poll accuracy, skill endorsements |
| **Leadership** | Campus Catalyst, Founding Dev | Role-based (backend-assigned) |
| **Penalties** | Spam Alert | Report count (auto-assigned) |

---

## 10. Critical Findings

### 10.1 Endpoint Mismatch
**Frontend calls missing backend endpoints**:
- `/api/users/{userId}/sync-badges` ❌
- `/api/users/{userId}/displayed-badges` ❌

**Impact**: Profile badge management will fail

---

### 10.2 Icon Inconsistency
**Lucide vs Emoji**:
- BadgeCenter uses Lucide (SVG)
- ProfilePage uses Emoji (Unicode)
- Same badge has different visual representation

---

### 10.3 Incomplete Scan
**BadgeCenter.jsx**: Only 250/2131 lines scanned  
**Missing**:
- Badge unlock UI logic
- Progress bars
- WebSocket listeners for real-time updates
- Full badge list (only 4 series documented)

---

### 10.4 Hard-Coded Data
**Badge Level Config**:
- All level data hard-coded in BadgeCenter.jsx
- NOT fetched from backend
- Risk: Frontend and backend config drift

**Recommendation**: Fetch badge metadata from backend

---

## 11. Implementation Status

| Feature | Status | Details |
|---------|--------|---------|
| Badge UI component | ✅ Complete | Fully styled with variants |
| Badge level system | ✅ Complete | 3-tier evolution (Common → Legendary) |
| Icon system | ✅ Complete | Lucide React integration |
| Profile badge display | ✅ Complete | 3-badge selection system |
| Badge unlock UI | ❓ Unknown | Beyond scan range |
| Progress tracking UI | ❓ Unknown | Beyond scan range |
| WebSocket sync | ⚠️ Partial | Imports present, logic not scanned |
| Backend integration | ⚠️ Broken | Calls non-existent endpoints |

---

## 12. Style Examples

### Example 1: Locked Badge (Gray)
```jsx
<Badge 
  variant="glass" 
  size="default"
  level={1}
  className="bg-gray-500/70 border-gray-300"
>
  <LucideIcon iconName="flame" className="w-5 h-5" />
  <span>Streak Seeker</span>
</Badge>
```

### Example 2: Unlocked Rare Badge (Blue)
```jsx
<Badge 
  variant="info" 
  size="lg"
  earned={true}
  level={2}
  interactive={true}
  className="bg-blue-500/70 border-blue-300 shadow-blue-500/20"
>
  <LucideIcon iconName="handshake" className="w-6 h-6" />
  <span>Collab Master II</span>
</Badge>
```

### Example 3: Legendary Badge (Gold)
```jsx
<Badge 
  variant="gradient" 
  size="lg"
  earned={true}
  level={3}
  pulse={true}
  className="bg-yellow-500/70 border-yellow-300 shadow-yellow-500/30"
>
  <LucideIcon iconName="trophy" className="w-6 h-6 text-amber-300" />
  <span>Legendary Streak</span>
</Badge>
```

---

## End of Badge As-Built Documentation
