import { useState } from 'react'
import { Card } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Avatar } from '@/components/ui/avatar.jsx'
import { Input } from '@/components/ui/input.jsx'

const mockUsers = [
  {
    id: 1,
    name: 'Ananya Sharma',
    college: 'IIT Delhi',
    year: '4th Year',
    avatar: 'A',
    skills: ['React', 'Node.js', 'Python', 'Machine Learning', 'UI/UX'],
    badges: ['Mobile Expert', 'Startup Founder', 'Tech Lead'],
    bio: 'Passionate about building scalable web applications and exploring AI/ML technologies.',
    projects: 3,
    collaborations: 12,
    isOnline: true,
    lastSeen: 'Active now'
  },
  {
    id: 2,
    name: 'Rahul Gupta',
    college: 'BITS Pilani',
    year: '3rd Year',
    avatar: 'R',
    skills: ['Machine Learning', 'Python', 'TensorFlow', 'Data Science'],
    badges: ['AI Enthusiast', 'Team Lead', 'Research Scholar'],
    bio: 'AI researcher working on educational technology solutions.',
    projects: 5,
    collaborations: 8,
    isOnline: false,
    lastSeen: '2 hours ago'
  },
  {
    id: 3,
    name: 'Priya Patel',
    college: 'VIT Chennai',
    year: '2nd Year',
    avatar: 'P',
    skills: ['React', 'JavaScript', 'CSS', 'Figma', 'UI/UX'],
    badges: ['Frontend Explorer', 'UI/UX Designer', 'Creative Mind'],
    bio: 'Frontend developer with a passion for creating beautiful user experiences.',
    projects: 2,
    collaborations: 6,
    isOnline: true,
    lastSeen: 'Active now'
  },
  {
    id: 4,
    name: 'Kiran Joshi',
    college: 'IIT Bombay',
    year: '4th Year',
    avatar: 'K',
    skills: ['Blockchain', 'Solidity', 'Web3', 'Smart Contracts'],
    badges: ['Blockchain Expert', 'DeFi Pioneer', 'Full Stack'],
    bio: 'Blockchain developer building the future of decentralized applications.',
    projects: 7,
    collaborations: 15,
    isOnline: false,
    lastSeen: '1 day ago'
  },
  {
    id: 5,
    name: 'Sneha Singh',
    college: 'NIT Surat',
    year: '3rd Year',
    avatar: 'S',
    skills: ['Python', 'Django', 'PostgreSQL', 'AWS', 'DevOps'],
    badges: ['Backend Expert', 'Cloud Architect', 'System Designer'],
    bio: 'Backend engineer specializing in scalable cloud architectures.',
    projects: 4,
    collaborations: 10,
    isOnline: true,
    lastSeen: 'Active now'
  },
  {
    id: 6,
    name: 'Arjun Kumar',
    college: 'IIIT Hyderabad',
    year: '1st Year',
    avatar: 'A',
    skills: ['Java', 'Spring Boot', 'MySQL', 'Android'],
    badges: ['Java Expert', 'Mobile Dev', 'Quick Learner'],
    bio: 'Enthusiastic first-year student diving deep into software development.',
    projects: 1,
    collaborations: 3,
    isOnline: false,
    lastSeen: '5 hours ago'
  }
]

export default function Discovery({ user }) {
  const [users, setUsers] = useState(mockUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('All')
  const [selectedYearFilter, setSelectedYearFilter] = useState('All')
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState('All')
  const [viewMode, setViewMode] = useState('grid')

  // Extract unique values for filters
  const allSkills = Array.from(new Set(users.flatMap(user => user.skills)))
  const allYears = Array.from(new Set(users.map(user => user.year)))
  const allColleges = Array.from(new Set(users.map(user => user.college)))

  const skillFilters = ['All', ...allSkills]
  const yearFilters = ['All', ...allYears]
  const collegeFilters = ['All', ...allColleges]

  const getFilteredUsers = () => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          u.college.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesSkill = selectedSkillFilter === 'All' || u.skills.includes(selectedSkillFilter)
      const matchesYear = selectedYearFilter === 'All' || u.year === selectedYearFilter
      const matchesCollege = selectedCollegeFilter === 'All' || u.college === selectedCollegeFilter

      return matchesSearch && matchesSkill && matchesYear && matchesCollege
    })
  }

  const handleConnectUser = (userId) => {
    alert('Connection request sent! You can now chat with this user.')
  }

  const handleStartChat = (userId) => {
    const targetUser = users.find(u => u.id === userId)
    alert(`Starting chat with ${targetUser?.name}...`)
  }

  const resetFilters = () => {
    setSelectedSkillFilter('All')
    setSelectedYearFilter('All')
    setSelectedCollegeFilter('All')
    setSearchQuery('')
  }

  const filteredUsers = getFilteredUsers()

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🔍 Discovery</h2>
        <p className="text-muted-foreground">Find and connect with students across colleges</p>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto">
        <Input
          placeholder="Search by name, skills, or college..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-xl"
        />
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Filters</h3>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="rounded-xl"
            >
              🔄 Reset Filters
            </Button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                ⊞ Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                ☰ List
              </button>
            </div>
          </div>
        </div>

        {/* Filter Categories */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Skills Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Skills</label>
            <select
              value={selectedSkillFilter}
              onChange={(e) => setSelectedSkillFilter(e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-background"
            >
              {skillFilters.map((skill) => (
                <option key={skill} value={skill}>
                  {skill} {skill !== 'All' && `(${users.filter(u => u.skills.includes(skill)).length})`}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Year</label>
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-background"
            >
              {yearFilters.map((year) => (
                <option key={year} value={year}>
                  {year} {year !== 'All' && `(${users.filter(u => u.year === year).length})`}
                </option>
              ))}
            </select>
          </div>

          {/* College Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">College</label>
            <select
              value={selectedCollegeFilter}
              onChange={(e) => setSelectedCollegeFilter(e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-background"
            >
              {collegeFilters.map((college) => (
                <option key={college} value={college}>
                  {college} {college !== 'All' && `(${users.filter(u => u.college === college).length})`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedSkillFilter !== 'All' || selectedYearFilter !== 'All' || selectedCollegeFilter !== 'All' || searchQuery) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery('')}>
              Search: "{searchQuery}" ✕
            </Badge>
          )}
          {selectedSkillFilter !== 'All' && (
            <Badge variant="outline" className="cursor-pointer" onClick={() => setSelectedSkillFilter('All')}>
              Skill: {selectedSkillFilter} ✕
            </Badge>
          )}
          {selectedYearFilter !== 'All' && (
            <Badge variant="outline" className="cursor-pointer" onClick={() => setSelectedYearFilter('All')}>
              Year: {selectedYearFilter} ✕
            </Badge>
          )}
          {selectedCollegeFilter !== 'All' && (
            <Badge variant="outline" className="cursor-pointer" onClick={() => setSelectedCollegeFilter('All')}>
              College: {selectedCollegeFilter} ✕
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="text-center text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} students
      </div>

      {/* Users Display */}
      {viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((u) => (
            <Card key={u.id} className="p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              {/* User Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative">
                  <Avatar className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-medium text-lg">
                    {u.avatar}
                  </Avatar>
                  {u.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold">{u.name}</h3>
                  </div>
                  <div className="text-sm text-muted-foreground">{u.college}</div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{u.year}</span>
                    <span>•</span>
                    <span className={u.isOnline ? 'text-green-600' : 'text-gray-500'}>
                      {u.lastSeen}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{u.bio}</p>

              {/* Badges */}
              <div className="flex flex-wrap gap-1 mb-4">
                {u.badges.slice(0, 3).map((badge) => (
                  <Badge key={badge} className="text-xs bg-yellow-100 text-yellow-700">
                    {badge}
                  </Badge>
                ))}
              </div>

              {/* Skills */}
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">Skills</div>
                <div className="flex flex-wrap gap-1">
                  {u.skills.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {u.skills.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{u.skills.length - 4}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-between text-sm text-muted-foreground mb-4">
                <div className="text-center">
                  <div className="font-semibold text-blue-600">{u.projects}</div>
                  <div className="text-xs">Projects</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600">{u.collaborations}</div>
                  <div className="text-xs">Collabs</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={() => handleConnectUser(u.id)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  🤝 Connect
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleStartChat(u.id)}
                  className="w-full"
                >
                  💬 Start Chat
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((u) => (
            <Card key={u.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-medium">
                      {u.avatar}
                    </Avatar>
                    {u.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold">{u.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {u.year}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{u.college}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className={u.isOnline ? 'text-green-600' : 'text-gray-500'}>
                        {u.lastSeen}
                      </span>
                      <span>{u.projects} projects</span>
                      <span>{u.collaborations} collabs</span>
                    </div>
                    <div className="flex space-x-1 mt-2">
                      {u.skills.slice(0, 5).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {u.skills.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{u.skills.length - 5}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm"
                    onClick={() => handleConnectUser(u.id)}
                  >
                    🤝 Connect
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStartChat(u.id)}
                  >
                    💬 Chat
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="font-semibold text-lg mb-2">No students found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Try adjusting your filters or search query to find more students.
          </p>
          <Button 
            variant="outline" 
            onClick={resetFilters}
            className="mt-4"
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  )
}