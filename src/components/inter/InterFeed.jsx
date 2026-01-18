import React, { useState, lazy } from 'react'
import { Card } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Avatar } from '@/components/ui/avatar.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Input } from '@/components/ui/input.jsx'

export default function InterFeed({ user, onNavigateToRoom, onCreateCollabRoom }) {
  const HelpChatWrapper = lazy(() => import('@/components/ui/HelpChatSection.jsx'))
  const mockPosts = [
    {
      id: 1,
      type: 'Discussion',
      title: 'Cross-platform mobile development: React Native vs Flutter?',
      content: 'Working on a startup idea and need to decide between React Native and Flutter. What are your experiences with performance, developer experience, and community support?',
      author: {
        name: 'Ananya Sharma',
        college: 'IIT Delhi',
        avatar: 'A',
        year: '4th Year',
        badges: ['Mobile Expert', 'Startup Founder', 'Tech Lead'],
        skills: ['React Native', 'Flutter', 'Mobile Dev']
      },
      skillTags: ['React Native', 'Flutter', 'Mobile Dev', 'Startup'],
      upvotes: 45,
      comments: [
        {
          id: 1,
          author: { name: 'Rahul Patel', avatar: 'R', college: 'BITS Pilani' },
          content: 'I\'ve used both extensively. React Native has better community support, but Flutter has superior performance.',
          upvotes: 12,
          timestamp: '2 hours ago'
        },
        {
          id: 2,
          author: { name: 'Demo User', avatar: 'D', college: 'Your College' },
          content: 'For startups, I\'d recommend React Native due to faster development and easier hiring of React developers.',
          upvotes: 8,
          timestamp: '1 hour ago'
        }
      ],
      shares: 8,
      timestamp: '3 hours ago',
      isOwnPost: false,
      userCommented: true
    },
    {
      id: 2,
      type: 'Collab',
      title: 'Building an AI-powered education platform',
      content: 'Looking for passionate developers to build the next generation learning platform. Need expertise in ML, backend, and frontend. This could be the project that changes education!',
      author: {
        name: 'Rahul Gupta',
        college: 'BITS Pilani',
        avatar: 'R',
        year: '3rd Year',
        badges: ['AI Enthusiast', 'Team Lead', 'Innovator'],
        skills: ['Machine Learning', 'Python', 'React']
      },
      skillTags: ['Machine Learning', 'Python', 'React', 'Education Tech'],
      upvotes: 67,
      shares: 15,
      timestamp: '5 hours ago',
      isOwnPost: false,
      hasCollabRoom: true,
      collabRoomId: 'ai-edu-platform-2024',
      roomMembers: 8,
      userCommented: false
    },
    {
      id: 3,
      type: 'Poll',
      title: 'Which programming language should I learn next?',
      content: 'I\'m a frontend developer looking to expand my skillset. What would give me the best opportunities?',
      author: {
        name: 'Priya Patel',
        college: 'VIT Chennai',
        avatar: 'P',
        year: '2nd Year',
        badges: ['Frontend Explorer', 'UI/UX Designer', 'React Expert'],
        skills: ['React', 'JavaScript', 'CSS']
      },
      skillTags: ['Programming', 'Career', 'Learning'],
      upvotes: 32,
      shares: 5,
      timestamp: '1 day ago',
      isOwnPost: false,
      pollOptions: [
        { option: 'Python', votes: 24, voted: false },
        { option: 'Go', votes: 12, voted: false },
        { option: 'Rust', votes: 8, voted: false },
        { option: 'Java', votes: 18, voted: false }
      ],
      totalVotes: 62,
      hasVoted: false,
      votedOption: null,
      pollEndsAt: '2024-02-01',
      userCommented: false
    },
    {
      id: 4,
      type: 'Discussion',
      title: 'Best practices for remote team collaboration?',
      content: 'Managing a cross-college project team. What tools and practices work best for keeping everyone aligned and productive?',
      author: {
        name: user?.fullName || user?.name || 'Demo User',
        college: user?.collegeName || 'Your College',
        avatar: user?.fullName?.charAt(0) || user?.name?.charAt(0) || 'D',
        year: user?.yearOfStudy || '3rd Year',
        badges: user?.badges?.slice(0, 3) || ['Collaborator', 'Project Manager', 'Team Lead'],
        skills: user?.skills?.slice(0, 3) || ['Project Management', 'Team Building', 'Communication']
      },
      skillTags: ['Project Management', 'Remote Work', 'Team Building'],
      upvotes: 28,
      comments: [
        {
          id: 1,
          author: { name: 'Demo User', avatar: 'D', college: 'Your College' },
          content: 'Great responses everyone! I\'ve started implementing some of these practices with my team.',
          upvotes: 5,
          timestamp: '1 day ago'
        }
      ],
      shares: 3,
      timestamp: '2 days ago',
      isOwnPost: true,
      userCommented: true
    },
    {
      id: 5,
      type: 'Discussion',
      title: 'How to handle technical debt in large projects?',
      content: 'Our codebase has grown significantly and we\'re facing technical debt issues. How do you balance feature development with code maintenance?',
      author: {
        name: 'Kiran Joshi',
        college: 'IIT Bombay',
        avatar: 'K',
        year: '4th Year',
        badges: ['Technical Lead', 'Code Quality', 'Architecture Expert'],
        skills: ['Software Architecture', 'Code Review', 'System Design']
      },
      skillTags: ['Software Engineering', 'Technical Debt', 'Code Quality'],
      upvotes: 41,
      comments: [
        {
          id: 1,
          author: { name: 'Demo User', avatar: 'D', college: 'Your College' },
          content: 'We use a dedicated "tech debt sprint" every quarter to address accumulated issues. Works well for us!',
          upvotes: 12,
          timestamp: '2 days ago'
        }
      ],
      shares: 7,
      timestamp: '3 days ago',
      isOwnPost: false,
      userCommented: true
    }
  ]

  const [posts, setPosts] = useState(mockPosts)
  const [activeFilter, setActiveFilter] = useState('discussion')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [selectedPostType, setSelectedPostType] = useState('')
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    skillTags: [],
    newTag: '',
    pollOptions: ['', '']
  })
  const [newComment, setNewComment] = useState({})

  const filters = [
    { id: 'discussion', label: 'Discussion', icon: '🧠' },
    { id: 'poll', label: 'Poll', icon: '📊' },
    { id: 'collab', label: 'Collab', icon: '🤝' },
    { id: 'your-comments', label: 'Your Comments', icon: '💬' }
  ]

  const postTypes = [
    { id: 'Discussion', label: '🧠 Discussion', description: 'Start meaningful conversations across colleges' },
    { id: 'Poll', label: '📊 Poll', description: 'Create interactive, single-answer polls' },
    { id: 'Collab', label: '🤝 Collab', description: 'Post a collaboration opportunity (auto-creates room)' }
  ]

  const getFilteredPosts = () => {
    switch (activeFilter) {
      case 'discussion':
        return posts.filter(post => post.type === 'Discussion')
      case 'poll':
        return posts.filter(post => post.type === 'Poll')
      case 'collab':
        return posts.filter(post => post.type === 'Collab')
      case 'your-comments':
        return posts.filter(post => post.userCommented)
      default:
        return posts
    }
  }

  const getPostTypeColor = (type) => {
    const colors = {
      'Discussion': 'bg-blue-100 text-blue-700 border-blue-200',
      'Collab': 'bg-green-100 text-green-700 border-green-200',
      'Poll': 'bg-purple-100 text-purple-700 border-purple-200'
    }
    return colors[type] || 'bg-gray-100 text-gray-600'
  }

  const getPostTypeIcon = (type) => {
    const icons = {
      'Discussion': '🧠',
      'Collab': '🤝',
      'Poll': '📊'
    }
    return icons[type] || '📝'
  }

  const handleCreatePost = () => {
    if (selectedPostType && newPost.title && newPost.content) {
      const post = {
        id: Date.now(),
        type: selectedPostType,
        title: newPost.title,
        content: newPost.content,
        skillTags: newPost.skillTags,
        author: {
          name: user?.fullName || user?.name || 'You',
          college: user?.collegeName || 'Your College',
          avatar: user?.fullName?.charAt(0) || user?.name?.charAt(0) || 'Y',
          year: user?.yearOfStudy || '3rd Year',
          badges: user?.badges?.slice(0, 3) || ['New Member', 'Collaborator', 'Contributor'],
          skills: user?.skills?.slice(0, 3) || ['Learning', 'Growing', 'Exploring']
        },
        upvotes: 0,
        comments: selectedPostType === 'Discussion' ? [] : undefined,
        shares: 0,
        timestamp: 'Just now',
        isOwnPost: true,
        hasCollabRoom: selectedPostType === 'Collab',
        collabRoomId: selectedPostType === 'Collab' ? `room-${Date.now()}` : undefined,
        roomMembers: selectedPostType === 'Collab' ? 1 : undefined,
        pollOptions: selectedPostType === 'Poll' ? newPost.pollOptions.filter(opt => opt.trim()).map(opt => ({ option: opt, votes: 0, voted: false })) : undefined,
        totalVotes: selectedPostType === 'Poll' ? 0 : undefined,
        hasVoted: false,
        votedOption: null,
        pollEndsAt: selectedPostType === 'Poll' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
        userCommented: false
      }

      setPosts([post, ...posts])
      setShowCreatePost(false)
      setSelectedPostType('')
      setNewPost({ title: '', content: '', skillTags: [], newTag: '', pollOptions: ['', ''] })

      // Show notification for Collab posts and create room
      if (selectedPostType === 'Collab') {
        setTimeout(() => {
          if (onCreateCollabRoom) {
            onCreateCollabRoom(post)
          }
          alert('🎉 Your collaboration post has automatically created a Collab Room! Check the Collab Rooms section.')
        }, 1000)
      }
    }
  }

  const handleAddComment = (postId) => {
    const commentText = newComment[postId]?.trim()
    if (!commentText) return

    const post = posts.find(p => p.id === postId)
    if (!post || !post.comments) return

    const comment = {
      id: Date.now(),
      author: {
        name: user?.fullName || user?.name || 'You',
        avatar: user?.fullName?.charAt(0) || user?.name?.charAt(0) || 'Y',
        college: user?.collegeName || 'Your College'
      },
      content: commentText,
      upvotes: 0,
      timestamp: 'Just now'
    }

    setPosts(posts.map(p =>
      p.id === postId
        ? { ...p, comments: [...(p.comments || []), comment], userCommented: true }
        : p
    ))

    setNewComment(prev => ({ ...prev, [postId]: '' }))
  }

  const addSkillTag = () => {
    if (newPost.newTag.trim() && !newPost.skillTags.includes(newPost.newTag.trim())) {
      setNewPost(prev => ({
        ...prev,
        skillTags: [...prev.skillTags, prev.newTag.trim()],
        newTag: ''
      }))
    }
  }

  const removeSkillTag = (tagToRemove) => {
    setNewPost(prev => ({
      ...prev,
      skillTags: prev.skillTags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addPollOption = () => {
    if (newPost.pollOptions.length < 5) {
      setNewPost(prev => ({
        ...prev,
        pollOptions: [...prev.pollOptions, '']
      }))
    }
  }

  const updatePollOption = (index, value) => {
    setNewPost(prev => ({
      ...prev,
      pollOptions: prev.pollOptions.map((opt, i) => i === index ? value : opt)
    }))
  }

  const removePollOption = (index) => {
    if (newPost.pollOptions.length > 2) {
      setNewPost(prev => ({
        ...prev,
        pollOptions: prev.pollOptions.filter((_, i) => i !== index)
      }))
    }
  }

  const handleEnterCollabRoom = (postId) => {
    const post = posts.find(p => p.id === postId)
    if (post?.collabRoomId && onNavigateToRoom) {
      onNavigateToRoom(post.collabRoomId)
    }
  }

  const handleVotePoll = (postId, optionIndex) => {
    setPosts(posts.map(post => {
      if (post.id === postId && post.pollOptions && !post.hasVoted) {
        const updatedOptions = post.pollOptions.map((opt, index) =>
          index === optionIndex
            ? { ...opt, votes: opt.votes + 1, voted: true }
            : { ...opt, voted: false }
        )
        return {
          ...post,
          pollOptions: updatedOptions,
          hasVoted: true,
          votedOption: post.pollOptions[optionIndex].option,
          totalVotes: (post.totalVotes || 0) + 1
        }
      }
      return post
    }))
  }

  const vote = (postId) => {
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, upvotes: post.upvotes + 1 }
        : post
    ))
  }

  const voteComment = (postId, commentId) => {
    setPosts(posts.map(post => {
      if (post.id === postId && post.comments) {
        return {
          ...post,
          comments: post.comments.map(comment =>
            comment.id === commentId
              ? { ...comment, upvotes: comment.upvotes + 1 }
              : comment
          )
        }
      }
      return post
    }))
  }

  return (
    <div className="intercollege-pillar space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
          Inter-College Feed
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Connect, collaborate, and share across college boundaries
        </p>
      </div>

      {/* Filter Tabs - Only 3 types + Your Comments */}
      <div className="flex flex-wrap justify-center gap-2 p-2 bg-muted/30 rounded-xl">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-6 py-3 rounded-lg transition-all duration-200 font-medium ${activeFilter === filter.id
                ? 'bg-primary text-primary-foreground shadow-md transform scale-105'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
          >
            <div className="flex items-center space-x-2">
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Create Post Button */}
      {activeFilter !== 'your-comments' && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowCreatePost(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            size="lg"
          >
            ✨ Create Post
          </Button>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="intercollege-create-post-modal fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">Create Inter-College Post</h3>
              <Button variant="outline" size="sm" onClick={() => setShowCreatePost(false)} className="rounded-full">
                ✕
              </Button>
            </div>

            {!selectedPostType ? (
              <div className="space-y-6">
                <p className="text-muted-foreground text-lg text-center">What type of post do you want to create?</p>
                <div className="space-y-4">
                  {postTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedPostType(type.id)}
                      className="w-full p-6 border-2 border-border rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all text-left group hover:shadow-md"
                    >
                      <div className="flex items-center space-x-4 mb-3">
                        <span className="text-3xl">{type.label}</span>
                      </div>
                      <p className="text-muted-foreground">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPostType('')}
                    className="rounded-full"
                  >
                    ← Back
                  </Button>
                  <Badge className={`${getPostTypeColor(selectedPostType)} px-4 py-2 rounded-full text-sm`}>
                    {getPostTypeIcon(selectedPostType)} {selectedPostType}
                  </Badge>
                </div>

                <div>
                  <label className="block font-semibold mb-3 text-lg">Title</label>
                  <Input
                    placeholder={`Enter your ${selectedPostType.toLowerCase()} title...`}
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="rounded-xl p-4 text-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-3 text-lg">Description</label>
                  <Textarea
                    placeholder={`Describe your ${selectedPostType.toLowerCase()}...`}
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={4}
                    className="rounded-xl p-4"
                  />
                </div>

                {/* Poll Options */}
                {selectedPostType === 'Poll' && (
                  <div>
                    <label className="block font-semibold mb-3 text-lg">Poll Options</label>
                    <div className="space-y-3">
                      {newPost.pollOptions.map((option, index) => (
                        <div key={index} className="flex space-x-2">
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => updatePollOption(index, e.target.value)}
                            className="rounded-xl"
                          />
                          {newPost.pollOptions.length > 2 && (
                            <Button variant="outline" size="sm" onClick={() => removePollOption(index)} className="rounded-xl">
                              ✕
                            </Button>
                          )}
                        </div>
                      ))}
                      {newPost.pollOptions.length < 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addPollOption}
                          className="rounded-xl"
                        >
                          + Add Option
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Skill Tags */}
                <div>
                  <label className="block font-semibold mb-3 text-lg">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {newPost.skillTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-destructive/10 hover:text-destructive px-3 py-1 rounded-full"
                        onClick={() => removeSkillTag(tag)}
                      >
                        {tag} ✕
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newPost.newTag}
                      onChange={(e) => setNewPost({ ...newPost, newTag: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addSkillTag()}
                      className="rounded-xl"
                    />
                    <Button variant="outline" size="sm" onClick={addSkillTag} className="rounded-xl">
                      Add
                    </Button>
                  </div>
                </div>

                {/* Special info for Collab posts */}
                {selectedPostType === 'Collab' && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <p className="text-green-800">
                      🚀 <strong>Auto Collab Room:</strong> Your collaboration post will automatically create a Collab Room for team communication.
                    </p>
                  </div>
                )}

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-blue-800">
                    🌐 <strong>Inter-College Reach:</strong> Your post will be visible to students across all connected colleges.
                  </p>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={handleCreatePost}
                    disabled={!newPost.title || !newPost.content || (selectedPostType === 'Poll' && newPost.pollOptions.filter(opt => opt.trim()).length < 2)}
                    className="flex-1 py-3 rounded-xl"
                  >
                    📝 Create {selectedPostType}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreatePost(false)} className="py-3 rounded-xl">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-8">
        {getFilteredPosts().map((post) => (
          <Card key={post.id} className={`component-intercollege-post p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] rounded-2xl border-l-4 ${post.type === 'Discussion' ? 'border-l-blue-500' : post.type === 'Collab' ? 'border-l-green-500' : 'border-l-purple-500'}`}>
            {/* Post Header with Enhanced Metadata */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-medium text-lg">
                  {post.author.avatar}
                </Avatar>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-semibold text-lg">{post.author.name}</span>
                    <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full">
                      🏛️ {post.author.college}
                    </Badge>
                    <Badge variant="outline" className="text-sm px-2 py-1 rounded-full">
                      {post.author.year}
                    </Badge>
                  </div>

                  {/* Enhanced metadata: 3 Badges + 3 Skills */}
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm text-muted-foreground">Badges:</span>
                    {post.author.badges.slice(0, 3).map((badge) => (
                      <Badge key={badge} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        {badge}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Skills:</span>
                    {post.author.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs px-2 py-1 rounded-full">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <span className="text-sm text-muted-foreground">{post.timestamp}</span>
                </div>
              </div>
              <Badge className={`${getPostTypeColor(post.type)} px-4 py-2 rounded-full text-sm font-medium`}>
                {getPostTypeIcon(post.type)} {post.type}
              </Badge>
            </div>

            {/* Post Content */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3 leading-relaxed">{post.title}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">{post.content}</p>

              {/* Tags */}
              {post.skillTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.skillTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-sm px-3 py-1 rounded-full opacity-70">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Poll Component */}
            {post.type === 'Poll' && post.pollOptions && (
              <div className="component-intercollege-poll mb-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
                <div className="space-y-4">
                  {post.pollOptions.map((option, index) => {
                    const percentage = post.totalVotes && post.totalVotes > 0 ? (option.votes / post.totalVotes) * 100 : 0

                    return (
                      <div key={index} className="relative">
                        <button
                          onClick={() => !post.hasVoted && handleVotePoll(post.id, index)}
                          disabled={post.hasVoted}
                          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${post.hasVoted
                              ? option.voted
                                ? 'border-purple-500 bg-purple-100 text-purple-800'
                                : 'border-gray-200 bg-gray-50'
                              : 'border-purple-200 hover:border-purple-400 hover:bg-purple-50'
                            }`}
                        >
                          <div className="flex justify-between items-center relative z-10">
                            <span className="font-medium">{option.option}</span>
                            <span className="text-sm text-muted-foreground">
                              {option.votes} votes ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </button>
                        {post.hasVoted && (
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-purple-200 rounded-xl transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        )}
                      </div>
                    )
                  })}
                  <div className="text-sm text-muted-foreground text-center">
                    Total votes: {post.totalVotes || 0} • Poll ends: {post.pollEndsAt}
                  </div>
                </div>
              </div>
            )}

            {/* Collab Room Access */}
            {post.type === 'Collab' && post.hasCollabRoom && (
              <div className="component-intercollege-collab mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">🚀 Collaboration Room Available</h4>
                    <p className="text-green-700 text-sm mb-3">
                      Join {post.roomMembers} other members in the dedicated collaboration space
                    </p>
                    <div className="flex items-center space-x-4">
                      <Badge className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                        {post.roomMembers} Members Active
                      </Badge>
                      <Badge variant="outline" className="text-sm">
                        Room ID: {post.collabRoomId}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleEnterCollabRoom(post.id)}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl"
                  >
                    🏠 Enter Room
                  </Button>
                </div>
              </div>
            )}

            {/* Post Actions and Engagement */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => vote(post.id)}
                    className="flex items-center space-x-2 text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    <span>👍</span>
                    <span className="font-medium">{post.upvotes}</span>
                  </button>
                  {post.comments && (
                    <button className="flex items-center space-x-2 text-muted-foreground hover:text-green-600 transition-colors">
                      <span>💬</span>
                      <span className="font-medium">{post.comments.length}</span>
                    </button>
                  )}
                  <button className="flex items-center space-x-2 text-muted-foreground hover:text-purple-600 transition-colors">
                    <span>🔗</span>
                    <span className="font-medium">{post.shares}</span>
                  </button>
                </div>
                {post.isOwnPost && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    Your Post
                  </Badge>
                )}
              </div>

              {/* Comments Section */}
              {post.comments && (
                <div className="space-y-4">
                  {/* If post.postType indicates Ask/Offer help, render HelpChatSection (real-time) */}
                  {(post.postType === 'ASK_HELP' || post.postType === 'OFFER_HELP') ? (
                    // eslint-disable-next-line react/jsx-pascal-case
                    <div>
                      {/* HelpChatSection expects server-backed comments and websocket subscription */}
                      {/* Provide initial comments (if any) and postId. */}
                      {typeof window !== 'undefined' && (
                        // lazy-load component to avoid SSR issues
                        <React.Suspense fallback={<div>Loading chat...</div>}>
                          <HelpChatWrapper post={post} user={user} />
                        </React.Suspense>
                      )}
                    </div>
                  ) : (
                    <div>
                      {post.comments.slice(0, 2).map((comment) => (
                        <div key={comment.id} className="bg-muted/30 p-4 rounded-xl">
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 text-white text-sm">
                              {comment.author.avatar}
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-medium text-sm">{comment.author.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {comment.author.college}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{comment.content}</p>
                              <button
                                onClick={() => voteComment(post.id, comment.id)}
                                className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-blue-600 transition-colors"
                              >
                                <span>👍</span>
                                <span>{comment.upvotes}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add Comment */}
                      <div className="flex space-x-3">
                        <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
                          {user?.fullName?.charAt(0) || user?.name?.charAt(0) || 'Y'}
                        </Avatar>
                        <div className="flex-1 flex space-x-2">
                          <Input
                            placeholder="Add a thoughtful comment..."
                            value={newComment[post.id] || ''}
                            onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                            className="rounded-xl"
                          />
                          <Button
                            onClick={() => handleAddComment(post.id)}
                            size="sm"
                            className="rounded-xl"
                          >
                            Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}