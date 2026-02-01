import React, { useState, useEffect } from 'react'
import { Card } from './ui/card.jsx'
import { Button } from './ui/button.jsx'
import { Badge } from './ui/badge.jsx'
import { Avatar } from './ui/avatar.jsx'
import { Input } from './ui/input.jsx'
import { Textarea } from './ui/textarea.jsx'
import api from '@/lib/api.js'
import { formatDate, formatJoinedDate } from '@/utils/dateFormatter.js'
import LoadingSpinner from './animations/LoadingSpinner.jsx'
import XPProgressBar from './ui/XPProgressBar.jsx'
import useXpWs from '@/hooks/useXpWs.js'

export default function ProfilePage({ user, onBackToCampus, profileOwner: initialProfileOwner }) {
  const [isEditing, setIsEditing] = useState(false)
  const [profileOwner, setProfileOwner] = useState(initialProfileOwner || user)
  const [formData, setFormData] = useState({ ...(initialProfileOwner || user) })
  const [loading, setLoading] = useState(!initialProfileOwner)
  const [error, setError] = useState(null)
  const [showPublicProfile, setShowPublicProfile] = useState(false)
  const [isEditingBadges, setIsEditingBadges] = useState(false)
  const [selectedBadges, setSelectedBadges] = useState((initialProfileOwner || user)?.displayedBadges || [])
  const isOwnProfile = user?.id === profileOwner?.id

  // Fetch profile data if not provided or refresh it
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true)
        const profileId = initialProfileOwner?.id || user?.id
        if (profileId) {
          const res = await api.get(`/api/users/${profileId}`)
          let userData = res.data
          
          // 🎖️ SYNC BADGES: Ensure badges are properly assigned based on isDev and role flags
          try {
            const syncRes = await api.post(`/api/users/${profileId}/sync-badges`)
            userData = syncRes.data
            console.log("✅ Badges synced on profile load:", syncRes.data.badges)
          } catch (syncErr) {
            console.warn("⚠️ Badge sync failed (non-critical):", syncErr)
          }
          
          setProfileOwner(userData)
          setFormData(userData)
          setSelectedBadges(userData?.displayedBadges || [])
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err)
        // Use the provided profileOwner or user if fetch fails
        if (initialProfileOwner) {
          setProfileOwner(initialProfileOwner)
          setFormData(initialProfileOwner)
        } else if (user) {
          setProfileOwner(user)
          setFormData(user)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [initialProfileOwner?.id, user?.id])

  // Initialize form data when profileOwner changes
  useEffect(() => {
    setFormData({ ...profileOwner })
    setSelectedBadges(profileOwner?.displayedBadges || [])
  }, [profileOwner])

  // 📡 Real-time XP updates via WebSocket
  useXpWs({
    userId: profileOwner?.id,
    onXpUpdate: (updatedUser) => {
      console.log('📊 XP Update received:', updatedUser)
      setProfileOwner(prev => ({
        ...prev,
        level: updatedUser.level,
        xp: updatedUser.xp,
        totalXp: updatedUser.totalXp,
        xpMultiplier: updatedUser.xpMultiplier
      }))
    }
  })

  // Handle save displayed badges
  const handleSaveBadges = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post(`/api/users/${profileOwner.id}/displayed-badges`, { badges: selectedBadges })
      if (window.onProfileUpdate) {
        window.onProfileUpdate(res.data)
      }
      setProfileOwner(res.data)
      setIsEditingBadges(false)
      alert('Featured badges updated successfully!')
    } catch (err) {
      setError('Failed to update badges: ' + (err.response?.data?.error || err.message))
      console.error('Badge update error:', err)
    } finally {
      setLoading(false)
    }
  }

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

  // Handle save profile
  const handleSave = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.put(`/api/users/${profileOwner.id}/profile`, formData)
      // res.data is the complete updated User object
      if (window.onProfileUpdate) {
        window.onProfileUpdate(res.data)
      }
      setFormData(res.data)
      setIsEditing(false)
      alert('Profile updated successfully!')
    } catch (err) {
      setError('Failed to update profile: ' + (err.response?.data?.error || err.message))
      console.error('Profile update error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle endorse user
  const handleEndorse = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post(`/api/users/${profileOwner.id}/endorse`)
      // res.data is the complete updated User object with new endorsementCount
      if (window.onProfileUpdate) {
        window.onProfileUpdate(res.data)
      }
      alert(`✨ Endorsement added! They now have ${res.data.endorsementsCount} endorsements.`)
    } catch (err) {
      setError('Endorsement failed: ' + (err.response?.data?.error || err.message))
      console.error('Endorsement error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSkillChange = (index, value) => {
    const updatedSkills = [...(formData.skills || [])]
    updatedSkills[index] = value
    setFormData(prev => ({
      ...prev,
      skills: updatedSkills
    }))
  }

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...(prev.skills || []), '']
    }))
  }

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: (prev.skills || []).filter((_, i) => i !== index)
    }))
  }

  const badgeIcons = {
    'Skill Sage': '🧠',
    'Campus Catalyst': '📢',
    'Pod Pioneer': '🚀',
    'Bridge Builder': '🌉',
    'Founding Dev': '💻',
    'Profile Pioneer': '👤'
  }

  // Loading check: prevent UI from showing hardcoded defaults while fetching data
  if (loading && !profileOwner) {
    return <LoadingSpinner />
  }

  return (
    <>
      {/* Public Profile View */}
      {showPublicProfile && isOwnProfile ? (
        <div className="min-h-screen bg-gradient-to-br from-deep-obsidian via-deep-obsidian to-cyan-950/20">
          {/* Background accent elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-magenta-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-700">
            {/* Public Profile Card */}
            <Card className="border-cyan-400/40 backdrop-blur-xl bg-gradient-to-br from-cyan-950/30 via-deep-obsidian to-cyan-950/20 p-12 shadow-lg shadow-cyan-400/10 mb-8">
              <div className="flex items-center gap-8 mb-12">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-cyan-400 to-cyan-300 shadow-lg flex items-center justify-center text-deep-obsidian text-5xl font-bold border-2 border-cyan-400/60">
                  {profileOwner?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-white mb-4">{profileOwner?.fullName || 'Your Name'}</h2>
                  <div className="flex flex-wrap gap-3">
                    <Badge className="backdrop-blur-xl bg-cyan-400/20 text-cyan-200 border-cyan-400/40 px-4 py-2 text-sm font-semibold">
                      {profileOwner?.collegeName || 'College'}
                    </Badge>
                    <Badge className="backdrop-blur-xl bg-cyan-400/20 text-cyan-200 border-cyan-400/40 px-4 py-2 text-sm font-semibold">
                      {profileOwner?.yearOfStudy || 'Year'}
                    </Badge>
                    <Badge className="backdrop-blur-xl bg-cyan-400/20 text-cyan-200 border-cyan-400/40 px-4 py-2 text-sm font-semibold">
                      {profileOwner?.department || 'Department'}
                    </Badge>
                  </div>
                  {/* ✅ CRITICAL FIX: Dynamic Joined Date in Public Profile */}
                  {profileOwner?.createdAt && (
                    <p className="text-xs text-gray-300 font-semibold mt-4">
                      ✨ {formatJoinedDate(profileOwner.createdAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Public Badges Section */}
              {profileOwner?.displayedBadges && profileOwner.displayedBadges.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-cyan-300 mb-8">🏆 Featured Achievements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {profileOwner.displayedBadges.map((badge, idx) => (
                      <div key={idx} className="flex flex-col items-center group">
                        <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-cyan-300 rounded-3xl flex items-center justify-center text-5xl transition-all group-hover:scale-125 group-hover:shadow-2xl group-hover:shadow-cyan-400/50 border-2 border-cyan-400/60 shadow-lg">
                          {badgeIcons[badge] || '🏅'}
                        </div>
                        <span className="text-sm mt-4 font-bold text-center max-w-24 text-cyan-200 group-hover:text-cyan-100 transition line-clamp-2">
                          {badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!profileOwner?.displayedBadges || profileOwner.displayedBadges.length === 0) && (
                <div className="text-center py-16">
                  <p className="text-gray-400 text-lg">🎯 No featured badges yet</p>
                  <p className="text-gray-500 text-sm mt-2">Earn badges by completing achievements and feature them on your profile!</p>
                </div>
              )}
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setShowPublicProfile(false)}
                className="backdrop-blur-xl bg-cyan-400/20 text-cyan-200 border border-cyan-400/40 hover:bg-cyan-400/30 font-semibold px-8 py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-cyan-400/20"
              >
                ← Back to Full Profile
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Full Profile View */
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background accent elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-700">
        {/* Immersive XP Progress Bar - Always Visible */}
        <div className="mb-8">
          <XPProgressBar user={profileOwner} />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-6 py-4 rounded-xl backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Profile Header Section */}
        <div className="relative">
          {/* Gradient background for header */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-cyan-500/5 rounded-2xl blur-xl"></div>
          
          <Card className="relative border-cyan-500/30 bg-slate-900/50 backdrop-blur-xl p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* User Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-400 shadow-2xl flex items-center justify-center text-white text-4xl font-bold border-2 border-cyan-400/50">
                  {profileOwner?.fullName?.charAt(0) || 'U'}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="mb-4">
                  {isEditing ? (
                    <Input
                      className="text-3xl font-bold bg-slate-800/50 border-cyan-500/30 mb-2"
                      value={formData.fullName || ''}
                      onChange={(e) => handleFieldChange('fullName', e.target.value)}
                      placeholder="Enter full name"
                    />
                  ) : (
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      {profileOwner?.fullName || 'User Name'}
                    </h1>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-3 mb-4">
                  <Badge className="backdrop-blur-xl bg-cyan-400/20 text-cyan-200 border border-cyan-400/40 px-4 py-2 text-sm">
                    {profileOwner?.collegeName || 'College'} • {profileOwner?.yearOfStudy || 'Year'}
                  </Badge>
                  <Badge className="backdrop-blur-xl bg-cyan-400/20 text-cyan-200 border border-cyan-400/40 px-4 py-2 text-sm">
                    {profileOwner?.department || 'Department'}
                  </Badge>
                  {profileOwner?.role && (
                    <Badge className="backdrop-blur-xl bg-magenta-400/20 text-magenta-200 border border-magenta-400/40 px-4 py-2 text-sm">
                      {profileOwner.role}
                    </Badge>
                  )}
                </div>
                
                {/* ✅ CRITICAL FIX: Dynamic Joined Date */}
                {profileOwner?.createdAt && (
                  <p className="text-xs text-gray-400 font-semibold">
                    ✨ {formatJoinedDate(profileOwner.createdAt)}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {isOwnProfile ? (
                  <>
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleSave}
                          disabled={loading}
                          className="bg-gradient-to-r from-cyan-400/25 to-cyan-400/20 hover:from-cyan-400/35 hover:to-cyan-400/30 border border-cyan-400/40 text-cyan-200 font-semibold rounded-lg px-6 py-2 shadow-lg shadow-cyan-400/20 hover:-translate-y-1 duration-500"
                        >
                          {loading ? 'Saving...' : '✓ Save'}
                        </Button>
                        <Button
                          onClick={() => setIsEditing(false)}
                          variant="outline"
                          className="border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10 rounded-lg px-6 py-2"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => setIsEditing(true)}
                          className="bg-gradient-to-r from-cyan-400/25 to-cyan-400/20 hover:from-cyan-400/35 hover:to-cyan-400/30 border border-cyan-400/40 text-cyan-200 font-semibold rounded-lg px-6 py-2 shadow-lg shadow-cyan-400/20 hover:-translate-y-1 duration-500"
                        >
                          ✏️ Edit Profile
                        </Button>
                        <Button
                          onClick={() => setShowPublicProfile(true)}
                          className="bg-gradient-to-r from-cyan-400/25 to-cyan-400/20 hover:from-cyan-400/35 hover:to-cyan-400/30 border border-cyan-400/40 text-cyan-200 font-semibold rounded-lg px-6 py-2 shadow-lg shadow-cyan-400/20 hover:-translate-y-1 duration-500"
                        >
                          👁️ Public Profile
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleEndorse}
                      disabled={loading}
                      className="bg-gradient-to-r from-magenta-400/25 to-magenta-400/20 hover:from-magenta-400/35 hover:to-magenta-400/30 border border-magenta-400/40 text-magenta-200 font-semibold rounded-lg px-6 py-2 shadow-lg shadow-magenta-400/20 hover:-translate-y-1 duration-500"
                    >
                      {loading ? 'Endorsing...' : '🌟 Endorse'}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10 rounded-lg px-6 py-2"
                    >
                      👁️ Profile
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-cyan-400/30 backdrop-blur-xl bg-gradient-to-br from-cyan-950/20 to-deep-obsidian p-6 text-center hover:border-cyan-400/50 transition-all hover:shadow-lg hover:shadow-cyan-400/20">
            <p className="text-4xl font-bold text-cyan-300">15</p>
            <p className="text-sm text-muted-foreground/70 mt-3 font-medium">Collaborations</p>
          </Card>
          <Card className="border-cyan-400/30 backdrop-blur-xl bg-gradient-to-br from-cyan-950/20 to-deep-obsidian p-6 text-center hover:border-cyan-400/50 transition-all hover:shadow-lg hover:shadow-cyan-400/20">
            <p className="text-4xl font-bold text-cyan-300">8</p>
            <p className="text-sm text-muted-foreground/70 mt-3 font-medium">Projects</p>
          </Card>
          <Card className="border-magenta-400/30 backdrop-blur-xl bg-gradient-to-br from-magenta-950/20 to-deep-obsidian p-6 text-center hover:border-magenta-400/50 transition-all hover:shadow-lg hover:shadow-magenta-400/20">
            <p className="text-4xl font-bold text-magenta-300">{profileOwner?.endorsementsCount || 0}</p>
            <p className="text-sm text-muted-foreground/70 mt-3 font-medium">Endorsements</p>
          </Card>
          <Card className="border-cyan-400/30 backdrop-blur-xl bg-gradient-to-br from-cyan-950/20 to-deep-obsidian p-6 text-center hover:border-cyan-400/50 transition-all hover:shadow-lg hover:shadow-cyan-400/20">
            <p className="text-4xl font-bold text-cyan-300">{profileOwner?.badges?.length || 0}</p>
            <p className="text-sm text-gray-400 mt-3 font-medium">Achievements</p>
          </Card>
        </div>

        {/* Badges Showcase Section */}
        {isEditingBadges && isOwnProfile ? (
          <Card className="border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-slate-900/50 backdrop-blur-xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">🏆 Select Badges to Feature</h2>
              <p className="text-sm text-gray-400">Choose up to 3 badges ({selectedBadges.length}/3)</p>
            </div>
            
            {profileOwner?.badges && profileOwner.badges.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
                  {profileOwner.badges.map((badge, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col items-center group cursor-pointer p-4 rounded-lg transition-all ${
                        selectedBadges.includes(badge) 
                          ? 'bg-orange-500/30 border-2 border-orange-400' 
                          : 'bg-slate-800/30 border-2 border-slate-600/30 hover:border-orange-400/50'
                      }`}
                      onClick={() => toggleBadgeSelection(badge)}
                    >
                      <div className={`w-20 h-20 bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-500 shadow-xl rounded-3xl flex items-center justify-center text-4xl transition-all border-2 ${
                        selectedBadges.includes(badge)
                          ? 'border-orange-300 scale-110'
                          : 'border-orange-300/50'
                      }`}>
                        {badgeIcons[badge] || '🏅'}
                      </div>
                      <span className="text-xs mt-4 font-bold text-center max-w-20 text-gray-300 group-hover:text-orange-300 transition line-clamp-2">
                        {badge}
                      </span>
                      {selectedBadges.includes(badge) && (
                        <div className="mt-2 text-lg">✓</div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => {
                      setIsEditingBadges(false)
                      setSelectedBadges(profileOwner?.displayedBadges || [])
                    }}
                    variant="outline"
                    className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10 rounded-lg px-6 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveBadges}
                    disabled={loading}
                    className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold px-8 py-2 rounded-lg transition-all hover:shadow-lg"
                  >
                    {loading ? 'Saving...' : '✓ Save Featured Badges'}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-center py-8">No badges earned yet. Complete achievements to unlock badges!</p>
            )}
          </Card>
        ) : null}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Skills & Expertise */}
        <Card className="border-cyan-400/30 backdrop-blur-xl bg-gradient-to-br from-cyan-950/20 to-deep-obsidian p-8 shadow-lg shadow-cyan-400/10 hover:shadow-xl hover:shadow-cyan-400/15 transition-all">
          <h2 className="text-lg font-bold text-cyan-300 mb-6 flex items-center gap-2">
            💼 Skills & Expertise
          </h2>
          
          {/* Technical Skills */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-cyan-300 mb-4 uppercase tracking-widest">Technical Skills</h3>
            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <div className="w-full space-y-2">
                  {(formData.skills || []).map((skill, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={skill}
                        onChange={(e) => handleSkillChange(index, e.target.value)}
                        placeholder="Enter skill"
                        className="text-sm bg-cyan-950/20 border-cyan-400/30"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSkill(index)}
                        className="text-cyan-300 border-cyan-400/40 hover:bg-cyan-400/10"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addSkill} className="w-full text-xs border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10">
                    + Add Skill
                  </Button>
                </div>
              ) : (
                loading ? (
                  <p className="text-xs text-gray-400 italic">Loading skills...</p>
                ) : (profileOwner?.skills || []).length > 0 ? (
                  (profileOwner.skills).map((skill) => (
                    <Badge key={skill} className="backdrop-blur-xl bg-cyan-400/20 text-cyan-200 border border-cyan-400/40 font-semibold">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No skills added yet.</p>
                )
              )}
            </div>
          </div>

          {/* Interests */}
          <div>
            <h3 className="text-sm font-bold text-cyan-300 mb-4 uppercase tracking-widest">Interests & Passions</h3>
            <div className="flex flex-wrap gap-2">
              {(profileOwner?.excitingTags || []).length > 0 ? (
                (profileOwner.excitingTags).map((tag) => (
                  <Badge key={tag} className="backdrop-blur-xl bg-magenta-400/20 text-magenta-200 border border-magenta-400/40 font-semibold">
                    {tag}
                  </Badge>
                ))
              ) : loading ? (
                <p className="text-xs text-gray-400 italic">Loading interests...</p>
              ) : (
                <p className="text-xs text-gray-500">No interests added yet.</p>
              )}
            </div>
          </div>
        </Card>

        {/* Middle Column - Goals & Roles */}
        <Card className="border-magenta-400/30 backdrop-blur-xl bg-gradient-to-br from-magenta-950/20 to-deep-obsidian p-8 shadow-lg shadow-magenta-400/10 hover:shadow-xl hover:shadow-magenta-400/15 transition-all">
          <h2 className="text-lg font-bold text-magenta-300 mb-6 flex items-center gap-2">
            🎯 Mission & Goals
          </h2>
          
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-magenta-300 mb-3 uppercase tracking-widest">Your Goals</p>
              {isEditing ? (
                <Textarea
                  value={formData.goals || ''}
                  onChange={(e) => handleFieldChange('goals', e.target.value)}
                  placeholder="Describe your goals and aspirations..."
                  className="text-sm bg-magenta-950/20 border-magenta-400/30 resize-none"
                  rows={4}
                />
              ) : (
                <div className="backdrop-blur-xl bg-magenta-950/20 border border-magenta-400/30 rounded-lg p-4">
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {profileOwner?.goals || 'No goals defined yet. Share what you aspire to achieve!'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-magenta-300 mb-3 uppercase tracking-widest">Roles Open To</p>
              <div className="flex flex-wrap gap-2">
                {(profileOwner?.rolesOpenTo || []).length > 0 ? (
                  (profileOwner.rolesOpenTo).map((role, idx) => (
                    <Badge key={idx} className="backdrop-blur-xl bg-magenta-400/20 text-magenta-200 border border-magenta-400/40 font-semibold text-xs">
                      {role}
                    </Badge>
                  ))
                ) : loading ? (
                  <p className="text-xs text-gray-400 italic">Loading roles...</p>
                ) : (
                  <p className="text-xs text-gray-500">No roles specified yet.</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Right Column - Achievements & XP */}
        {/* Removed Progress & Achievements component */}
      </div>

      {/* Back Button */}
      {onBackToCampus && (
        <div className="flex justify-center pt-8">
          <Button
            onClick={onBackToCampus}
            className="flex items-center gap-2 backdrop-blur-xl bg-cyan-400/20 text-cyan-200 border border-cyan-400/40 hover:bg-cyan-400/30 font-semibold px-6 py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-cyan-400/20"
          >
            <span>←</span>
            <span>Back to Campus Hub</span>
          </Button>
        </div>
      )}
      </div>
    </div>
      )}
    </>
  )
}

