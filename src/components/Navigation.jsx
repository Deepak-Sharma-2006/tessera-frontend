import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Avatar } from '@/components/ui/avatar.jsx'
import { Badge } from '@/components/ui/badge.jsx'

export default function Navigation({ currentView, onViewChange, user }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState(null)
  const profileMenuRef = useRef(null)

  const navItems = [
    {
      id: 'events',
      label: 'Events',
      icon: '🎯',
      description: 'Hackathons, competitions & workshops',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      id: 'campus',
      label: 'Campus',
      icon: '🏛️',
      description: 'Your campus community',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'inter',
      label: 'Global Hub',
      icon: '🌐',
      description: 'Cross-college collaboration',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: '📬',
      description: 'Notifications & messages',
      gradient: 'from-green-500 to-teal-500'
    },
    {
      id: 'badges',
      label: 'Badges',
      icon: '🏅',
      description: 'Achievements & recognition',
      gradient: 'from-yellow-500 to-orange-500'
    },
  ]

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavItemClick = (itemId) => {
    onViewChange(itemId)
    setIsMobileMenuOpen(false)
  }

  const getNavItemStyles = (itemId) => {
    const isActive = currentView === itemId
    const item = navItems.find(nav => nav.id === itemId)

    // Cyber Neon Theme - Professional Sober-Neon aesthetic
    return `
      group relative flex items-center space-x-2 px-6 py-2.5 rounded-lg transition-all duration-500 cursor-pointer overflow-hidden backdrop-blur-xl border font-semibold text-sm tracking-wide
      ${isActive
        ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40 shadow-lg shadow-cyan-400/20'
        : 'bg-white/8 text-foreground/70 border-white/15 hover:bg-cyan-400/10 hover:text-cyan-300 hover:border-cyan-400/30 hover:shadow-md'
      }
      hover:-translate-y-1 transition-transform duration-500
    `
  }

  return (
    <>
      <nav className="sticky top-0 z-50 w-full">
        {/* Enhanced navigation bar with strong visual separation */}
        <div className="backdrop-blur-2xl bg-gradient-to-r from-cyan-950/40 via-deep-obsidian/50 to-cyan-950/40 border-b-2 border-cyan-400/30 shadow-lg shadow-cyan-400/10 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-18">
              {/* Enhanced Logo */}
              <div className="flex items-center space-x-4 group cursor-pointer hover-lift" onClick={() => onViewChange('campus')}>
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg hover:shadow-neon">
                    <span className="text-white font-bold text-xl">T</span>

                    {/* Logo glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-xl"></div>
                  </div>

                  {/* Floating particles around logo */}
                  <div className="absolute -inset-2">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60 animate-bounce"
                        style={{
                          left: `${20 + i * 15}%`,
                          top: `${20 + (i % 2) * 60}%`,
                          animationDelay: `${i * 0.3}s`,
                          animationDuration: '2s'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="hidden sm:block">
                  <h1 className="text-2xl font-bold gradient-text cyber:glow-text">
                    Tessera
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Next-Gen Student Platform
                  </p>
                </div>
              </div>

              {/* Desktop Navigation with enhanced effects */}
              <div className="hidden md:flex items-center space-x-3">
                {navItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative group"
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <button
                      onClick={() => handleNavItemClick(item.id)}
                      className={getNavItemStyles(item.id)}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Button background shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                      <span className="text-xl transition-all duration-300 relative z-10 group-hover:scale-110">
                        {item.icon}
                      </span>
                      <span className="font-semibold relative z-10 text-sm tracking-wide">
                        {item.label}
                      </span>

                      {/* Active indicator */}
                      {currentView === item.id && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      )}
                    </button>

                    {/* Enhanced tooltip */}
                    {hoveredItem === item.id && (
                      <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 scale-in">
                        <div className="glass-strong rounded-xl px-4 py-3 shadow-glass-lg text-sm whitespace-nowrap">
                          <div className="font-semibold text-foreground">{item.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{item.description}</div>

                          {/* Tooltip arrow */}
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-card"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-4">
                {/* Enhanced Profile Section */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-3 px-4 py-2 rounded-lg backdrop-blur-xl bg-white/8 border border-white/15 hover:bg-white/12 hover:border-white/25 hover:shadow-md transition-all duration-500 hover:-translate-y-1 group relative overflow-hidden"
                  >
                    {/* Button shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                    <Avatar
                      className="w-10 h-10 bg-gradient-to-br from-primary via-purple-500 to-pink-500 text-white font-medium shadow-md transition-all duration-300 relative z-10"
                      status="online"
                    >
                      {user?.fullName?.charAt(0) || user?.name?.charAt(0) || 'U'}
                    </Avatar>

                    <div className="hidden sm:block text-left relative z-10">
                      <div className="font-semibold text-foreground text-sm tracking-wide">
                        {user?.fullName || user?.name || 'User'}
                      </div>
                      <div className="text-xs text-muted-foreground/70">
                        {`${user?.collegeName || 'College'} • Level ${user?.level || 12}`}
                      </div>
                    </div>

                    <div className="text-muted-foreground/70 transition-transform duration-300 group-hover:rotate-180 relative z-10">
                      ⌄
                    </div>
                  </button>

                  {/* Enhanced Profile Dropdown */}
                  {showProfileMenu && (
                    <div className="absolute right-0 top-full mt-2 w-96 backdrop-blur-xl rounded-lg border border-white/15 bg-white/8 shadow-lg overflow-hidden scale-in z-50">
                      {/* Header */}
                      <div className="p-6 bg-gradient-to-br from-primary/20 via-purple-600/20 to-pink-600/10 border-b border-glass-border relative overflow-hidden">
                        {/* Header background pattern */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 25% 25%, currentColor 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                          }}></div>
                        </div>

                        <div className="flex items-center space-x-4 relative z-10">
                          <Avatar
                            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 text-white font-medium text-2xl shadow-xl hover:shadow-neon transition-all duration-300"
                            status="online"
                          >
                            {user?.fullName?.charAt(0) || user?.name?.charAt(0) || 'U'}
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-bold text-xl text-foreground gradient-text">
                              {user?.fullName || user?.name || 'User'}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {`${user?.collegeName || 'College'} • ${user?.year || '3rd Year'}`}
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                                <span className="text-xs text-green-600 font-semibold">
                                  Online
                                </span>
                              </div>
                              <div className="text-xs text-primary font-semibold">
                                Level {user?.level || 12}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>



                      {/* Enhanced Quick Actions */}
                      <div className="p-4 space-y-2">
                        {[
                          { icon: '👤', label: 'View Profile', action: 'profile' }
                        ].map((item, index) => (
                          <Button
                            key={item.action}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onViewChange(item.action)
                              setShowProfileMenu(false)
                            }}
                            className="w-full justify-start glass hover:shadow-glass-lg transition-all duration-300 hover-lift press-effect group relative overflow-hidden"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            {/* Button shimmer */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                            <span className="mr-3 text-lg transition-transform duration-300 group-hover:scale-125 relative z-10">
                              {item.icon}
                            </span>
                            <span className="relative z-10">{item.label}</span>
                          </Button>
                        ))}

                        <Button
                          key="logout"
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            // 1. Stop the browser's default refresh/submit action
                            e.preventDefault();
                            e.stopPropagation();

                            console.log("🎯 FOUND IT! Nuclear Logout Executed.");

                            // 2. Clear Data
                            localStorage.clear();
                            sessionStorage.clear();

                            // 3. Force Redirect
                            window.location.href = "/login";
                          }}
                          className="w-full justify-start glass hover:shadow-glass-lg transition-all duration-300 hover-lift press-effect group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                          <span className="mr-3 text-lg relative z-10">🚪</span>
                          <span className="relative z-10">Log Out</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-3 rounded-2xl glass hover:shadow-glass-lg transition-all duration-300 hover-lift press-effect group"
                  >
                    <div className="space-y-1.5">
                      <div className={`w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
                      <div className={`w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
                      <div className={`w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile navigation menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass-strong rounded-b-2xl border-t-0 shadow-glass-lg scale-in">
            <div className="px-4 py-6 space-y-3">
              {navItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleNavItemClick(item.id)}
                  className={`w-full flex items-center space-x-4 px-6 py-4 rounded-xl transition-all duration-300 text-left group hover-lift press-effect relative overflow-hidden ${currentView === item.id
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                    : 'text-foreground hover:bg-glass-bg border-transparent'
                    }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Button shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                  <span className="text-2xl transition-transform duration-300 group-hover:scale-125 relative z-10">
                    {item.icon}
                  </span>
                  <div className="flex-1 relative z-10">
                    <div className="font-semibold">
                      {item.label}
                    </div>
                    <div className={`text-xs mt-1 ${currentView === item.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {item.description}
                    </div>
                  </div>
                  {currentView === item.id && (
                    <div className="text-xl animate-bounce relative z-10">
                      ✨
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}