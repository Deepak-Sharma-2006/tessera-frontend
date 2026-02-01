import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Avatar } from '@/components/ui/avatar.jsx';
import api from '@/lib/api.js';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { useTheme } from '@/lib/theme.js';
import { useNavigate } from 'react-router-dom';

// Custom hook to fetch and manage posts (supports server-side filtering via ?type=) with refresh
const usePostsWithRefresh = (activeFilter, refreshTrigger) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true
    const fetchPosts = async () => {
      setLoading(true)
      try {
        let url = '/api/posts/campus'
        if (activeFilter && activeFilter !== 'all') url += `?type=${activeFilter}`
        const response = await api.get(url)
        if (!mounted) return
        // Ensure only CAMPUS category posts are shown (prevent leakage from INTER)
        const filteredPosts = (response.data || []).filter(post => post.category === 'CAMPUS' || !post.category);
        setPosts(filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      } catch (err) {
        if (!mounted) return
        setError(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchPosts()
    return () => { mounted = false }
  }, [activeFilter, refreshTrigger])

  return { posts, setPosts, loading, error };
};

// Post type definitions and UI labels/icons
const RESTRICTED_POST_TYPES = [
  { id: 'ASK_HELP', label: '🔴 Ask for Help', icon: '❓', color: 'text-red-400' },
  { id: 'OFFER_HELP', label: '🟢 SOS Offer Help', icon: '🆘', color: 'text-green-400' },
  { id: 'POLL', label: '🔵 Poll', icon: '📊', color: 'text-blue-400' },
  { id: 'LOOKING_FOR', label: '🟣 Looking For...', icon: '👀', color: 'text-violet-400' },
];

export default forwardRef(function CampusFeed({ user, initialFilter = 'ASK_HELP' }, ref) {
  // Get current user ID from user prop (passed from parent component)
  const currentUserId = user?.id || "placeholder-user-id";
  const { theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { posts, setPosts, loading, error } = usePostsWithRefresh(activeFilter, refreshTrigger);
  const [counts, setCounts] = useState(null);

  // Update filter when initialFilter prop changes
  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  // Expose a method to parent components to trigger refresh (when pods are deleted)
  useImperativeHandle(ref, () => ({
    triggerRefresh: () => {
      console.log('🔄 CampusFeed: Refreshing posts after pod deletion');
      setRefreshTrigger(prev => prev + 1);
    }
  }), []);

  // Handler for silently removing stale posts from feed
  const handlePostGone = (postId) => {
    setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
  };
  useEffect(() => {
    let mounted = true
    const fetchCounts = async () => {
      try {
        // Get both counts and pods to calculate correct LOOKING_FOR count
        const countsRes = await api.get('/api/posts/campus/counts')
        const podsRes = await api.get('/pods?scope=CAMPUS')

        if (!mounted) return

        const countData = countsRes.data || {}
        const podData = podsRes.data || []

        // Count ACTIVE pods instead of posts to avoid mismatch from deleted pods
        const activeLookingForPods = podData.filter(p => p.status === 'ACTIVE').length

        const countObj = {
          ASK_HELP: countData.ASK_HELP || 0,
          OFFER_HELP: countData.OFFER_HELP || 0,
          POLL: countData.POLL || 0,
          LOOKING_FOR: activeLookingForPods  // Use active pod count instead of post count
        }
        setCounts(countObj)
      } catch (e) {
        // ignore - fall back to post counts if fetch fails
        try {
          const res = await api.get('/api/posts/campus')
          if (!mounted) return
          const data = res.data || []
          const countObj = {
            ASK_HELP: data.filter(p => p.type === 'ASK_HELP').length,
            OFFER_HELP: data.filter(p => p.type === 'OFFER_HELP').length,
            POLL: data.filter(p => p.type === 'POLL').length,
            LOOKING_FOR: data.filter(p => p.type === 'LOOKING_FOR').length
          }
          setCounts(countObj)
        } catch (e2) {
          // ignore
        }
      }
    }
    fetchCounts()
    return () => { mounted = false }
  }, [refreshTrigger])

  const navigate = useNavigate();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState(null);

  // Handler to join a LOOKING_FOR pod
  const handleJoinPod = async (post) => {
    if (!post.linkedPodId) {
      alert('This pod is being prepared. Please try again shortly.');
      return;
    }

    try {
      // First, verify the pod still exists
      const podResponse = await api.get(`/pods/${post.linkedPodId}`);
      const pod = podResponse.data;

      // Call enhanced join endpoint with cooldown checking
      await api.post(`/pods/${post.linkedPodId}/join-enhanced`, {
        userId: currentUserId
      });

      // Navigate to the pod
      navigate(`/campus/collab-pods/${post.linkedPodId}`);
    } catch (error) {
      // Check for cooldown error
      if (error.response?.status === 429) {
        const minutesRemaining = error.response.data?.minutesRemaining || 15;
        alert(`You are on cooldown. Please wait ${minutesRemaining} more minute(s) before rejoin this pod.`);
        return;
      }
      if (error.response && error.response.status === 404) {
        // Pod was deleted; silently remove the stale post from feed
        handlePostGone(post.id);
        alert('This pod has been deleted.');
      } else if (error.response && error.response.status === 400 && error.response.data.message?.includes('full')) {
        alert('This pod is full. Cannot join.');
      } else {
        console.error('Error joining pod:', error);
        alert('Failed to join pod. Please try again.');
      }
    }
  };

  const [newPost, setNewPost] = useState({ title: '', content: '', podName: '' });
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Form helper functions for polls
  const handlePollOptionChange = (index, value) => {
    const updatedOptions = [...pollOptions];
    updatedOptions[index] = value;
    setPollOptions(updatedOptions);
  };
  const addPollOption = () => {
    if (pollOptions.length < 5) setPollOptions([...pollOptions, '']);
  };
  const removePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  // Function to create any type of post
  const handleCreatePost = async () => {
    console.log("🚀 Initiating Post Creation...");

    // 1. ROBUST & CLEAN TOKEN RETRIEVAL
    let rawToken = localStorage.getItem('jwt_token') || localStorage.getItem('token');

    // Fallback: Check user object
    if (!rawToken) {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          rawToken = userObj.token || userObj.jwt;
        }
      } catch (e) { }
    }

    if (!selectedPostType || !newPost.title.trim()) {
      alert('Please select a post type and fill in the title.');
      return;
    }

    // ✅ Validate podName is provided for LOOKING_FOR posts
    if (selectedPostType === 'LOOKING_FOR' && !newPost.podName.trim()) {
      alert('Please enter a Pod Name for Looking For posts.');
      return;
    }

    try {
      // 1. MAP UI LABELS TO BACKEND ENUMS
      // The backend expects UPPERCASE_UNDERSCORE format
      const typeMapping = {
        'Ask for Help': 'ASK_HELP',
        'Offer Help': 'OFFER_HELP',
        'Poll': 'POLL',
        'Looking For...': 'LOOKING_FOR'
      };

      // Determine the correct endpoint based on post type
      // LOOKING_FOR posts are sent to /social endpoint (backend handles type conversion)
      // POLL, ASK_HELP, OFFER_HELP are also sent to /social
      // TEAM_FINDING posts go to /team-finding endpoint
      const isLookingForOrSocialPost = ['POLL', 'ASK_HELP', 'OFFER_HELP', 'LOOKING_FOR'].includes(selectedPostType);
      const endpoint = isLookingForOrSocialPost ? '/api/posts/social' : '/api/posts/team-finding';

      // 2. CONSTRUCT CLEAN PAYLOAD
      const cleanPayload = {
        title: newPost.title,
        content: newPost.content,
        // Use the mapped value, or fallback to the original if not found
        type: typeMapping[selectedPostType] || selectedPostType.toUpperCase().replace(/ /g, '_'),
        category: 'CAMPUS',
        // ✅ Backend now extracts authorId from JWT token via @AuthenticationPrincipal
        // Do not include authorId in payload
        likes: [],
        comments: [],
        createdAt: new Date().toISOString()
      };

      // ✅ Add podName for LOOKING_FOR posts
      if (selectedPostType === 'LOOKING_FOR' && newPost.podName) {
        cleanPayload.podName = newPost.podName;
      }

      // Add poll options if this is a poll
      if (selectedPostType === 'POLL') {
        cleanPayload.pollOptions = pollOptions.filter(opt => opt.trim() !== '').map(opt => ({ text: opt }));
        if (cleanPayload.pollOptions.length < 2) {
          alert('A poll must have at least two options.');
          return;
        }
      }

      // Debug: Log what we're about to send
      console.log('📦 PAYLOAD DEBUG:', cleanPayload); // Verify in console!
      console.log('🔐 Token will be attached by global interceptor');

      // 3. SEND CLEAN PAYLOAD
      // ✅ Use api.post ONLY - rely on global interceptor for headers
      const response = await api.post(endpoint, cleanPayload);

      console.log('✅ Post created successfully:', response.data);

      // Success: Close modal, reset form, and refresh feed
      setShowCreatePost(false);
      setSelectedPostType(null);
      setNewPost({ title: '', content: '', podName: '' });
      setPollOptions(['', '']);

      // Auto-switch to the tab matching the newly created post type
      const createdPostType = typeMapping[selectedPostType] || selectedPostType.toUpperCase().replace(/ /g, '_');
      switch (createdPostType) {
        case 'ASK_HELP':
          setActiveFilter('ASK_HELP');
          break;
        case 'OFFER_HELP':
          setActiveFilter('OFFER_HELP');
          break;
        case 'POLL':
          setActiveFilter('POLL');
          break;
        case 'LOOKING_FOR':
          setActiveFilter('LOOKING_FOR');
          break;
        default:
          break;
      }

      setRefreshTrigger(prev => prev + 1); // Trigger refresh

      alert('Post created successfully!');

    } catch (err) {
      console.error('❌ Failed to create post:', err);
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);

      if (err.response?.status === 401) {
        alert('Not authenticated. Please log in again.');
      } else if (err.response?.status === 403) {
        alert('You do not have permission to create this post.');
      } else {
        alert('Failed to create post. Please try again.');
      }
    }
  };

  // Function to handle voting
  const handleVote = async (postId, optionId) => {
    try {
      const response = await api.put(`/api/posts/${postId}/vote/${optionId}`);
      const updatedPost = response.data;
      // Carefully merge the response with existing post data to preserve pollOptions structure
      setPosts(currentPosts => currentPosts.map(p =>
        p.id === postId ? {
          ...p,
          ...updatedPost,
          pollOptions: updatedPost.pollOptions || p.pollOptions
        } : p
      ));
    } catch (err) {
      console.error('Failed to vote:', err);
      alert('Failed to cast vote.');
    }
  };

  const filters = [
    { id: 'ASK_HELP', label: 'Ask for Help', count: (counts && counts.ASK_HELP) ? counts.ASK_HELP : posts.filter(p => p.postType === 'ASK_HELP').length },
    { id: 'OFFER_HELP', label: 'Offer Help', count: (counts && counts.OFFER_HELP) ? counts.OFFER_HELP : posts.filter(p => p.postType === 'OFFER_HELP').length },
    { id: 'POLL', label: 'Polls', count: (counts && counts.POLL) ? counts.POLL : posts.filter(p => p.postType === 'POLL').length },
    { id: 'LOOKING_FOR', label: 'Looking For', count: (counts && counts.LOOKING_FOR) ? counts.LOOKING_FOR : posts.filter(p => p.postType === 'LOOKING_FOR').length },
  ];

  const getFilteredPosts = () => {
    if (activeFilter === 'all') return posts;
    return posts.filter(post => {
      if (activeFilter === 'POLL' && post.pollOptions && post.pollOptions.length > 0) {
        return true;
      }
      return post.postType === activeFilter;
    });
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Could not load feed.</div>;

  return (
    <div className="space-y-8">
      {/* --- Create Post Button --- */}
      <div className="flex justify-center mb-4">
        <Button onClick={() => setShowCreatePost(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl shadow-lg">✨ Create Post</Button>
      </div>
      {/* --- Standardized Pill Tabs --- */}
      <div className="flex justify-center gap-4 mb-8">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${activeFilter === filter.id
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
              }`}
          >
            {filter.label} <span className="ml-2 inline-block bg-slate-800/60 text-xs px-2 py-1 rounded-full">{filter.count}</span>
          </button>
        ))}
      </div>
      {/* --- Posts Display --- */}
      <div className="space-y-6">
        {getFilteredPosts().map((post) => {
          const typeInfo = RESTRICTED_POST_TYPES.find(t => t.id === post.postType) || {};
          const pollOptions = post.pollOptions || [];
          const totalVotes = post.postType === 'POLL'
            ? pollOptions.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0)
            : 0;

          // Check if current user has already voted in this poll
          let userHasVoted = false;
          if (post.postType === 'POLL' && pollOptions.length > 0) {
            userHasVoted = pollOptions.some(opt => Array.isArray(opt.votes) && opt.votes.includes(currentUserId));
          }

          return (
            <Card key={post.id} className="bg-slate-800/20 border-slate-700 text-white backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12 bg-slate-600">U</Avatar>
                    <div>
                      <div className="font-semibold">{post.authorName || 'Anonymous User'}</div>
                      <div className="text-sm text-slate-400">
                        {new Date(post.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`border-slate-600 bg-slate-700/50 font-semibold ${typeInfo.color || ''}`}>{typeInfo.icon} {typeInfo.label || 'Post'}</Badge>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-xl">{post.title}</h3>
                  {post.content && <p className="text-slate-300">{post.content}</p>}

                  {/* Poll Rendering Logic */}
                  {post.postType === 'POLL' && post.pollOptions && Array.isArray(post.pollOptions) && post.pollOptions.length > 0 && (
                    <div className="space-y-3 pt-2">
                      {post.pollOptions.map((option, index) => {
                        const voteCount = option.votes?.length || 0;
                        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                        return (
                          <button
                            key={option.id || index}
                            onClick={() => {
                              if (!userHasVoted) handleVote(post.id, option.id || index);
                            }}
                            className={`w-full relative p-3 rounded-lg border border-slate-700 text-left bg-slate-900/30 transition-colors ${userHasVoted ? 'opacity-70 cursor-not-allowed pointer-events-none' : 'hover:bg-slate-800/50'}`}
                            disabled={userHasVoted}
                          >
                            <div
                              className="absolute left-0 top-0 bottom-0 bg-blue-500/30 rounded-lg transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                            <div className="flex justify-between items-center relative z-10">
                              <span className="font-medium text-slate-100">{option.text}</span>
                              <span className="text-sm font-bold text-slate-300">{voteCount}</span>
                            </div>
                          </button>
                        );
                      })}
                      <div className="text-sm text-slate-400 text-right pr-2">Total votes: {totalVotes}</div>

                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-700">
                  {post.postType === 'LOOKING_FOR' ? (
                    <div className="text-slate-400">&nbsp;</div>
                  ) : post.postType === 'POLL' ? (
                    <div className="text-slate-400">Total votes: {post.pollOptions?.reduce((s, o) => s + (o.votes?.length || 0), 0)}</div>
                  ) : (
                    <div />
                  )}

                  {post.postType === 'LOOKING_FOR' ? (
                    (() => {
                      const isOwner = post.authorId === currentUserId;
                      const isMember = post.podMembers?.includes(currentUserId);
                      if (isOwner || isMember) {
                        return (
                          <Button onClick={() => post.linkedPodId && navigate(`/campus/collab-pods/${post.linkedPodId}`)} className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">Open Pod</Button>
                        );
                      } else {
                        return (
                          <Button onClick={() => handleJoinPod(post)} className="bg-gradient-to-r from-green-600 to-teal-600 text-white">Join</Button>
                        );
                      }
                    })()
                  ) : post.postType === 'POLL' ? (
                    <div />
                  ) : (
                    <Button onClick={() => navigate(`/post/${post.id}/comments`, { state: { from: '/campus', sourceView: 'campus', sourceContext: 'campus-feed', sourceFilter: activeFilter } })} variant="outline" size="sm" className="bg-slate-700/50 border-slate-600 hover:bg-slate-700">Reply</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* --- Create Post Modal --- */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full p-8 shadow-2xl bg-slate-900/80 border-slate-700 text-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Create New Post</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreatePost(false)} className="hover:bg-slate-700">✕</Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2 text-slate-300">Post Type *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {RESTRICTED_POST_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedPostType(type.id)}
                      className={`p-4 border-2 rounded-xl text-center transition-colors ${selectedPostType === type.id ? 'border-blue-500 bg-blue-500/20' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'}`}
                    >
                      <div className="text-2xl">{type.icon}</div>
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-2 text-slate-300">Title *</label>
                <Input placeholder="What's the title?" value={newPost.title} onChange={(e) => setNewPost(p => ({ ...p, title: e.target.value }))} className="bg-slate-800/50 border-slate-700 focus:ring-blue-500" />
              </div>

              {selectedPostType === 'LOOKING_FOR' && (
                <div>
                  <label className="block font-semibold mb-2 text-slate-300">Pod Name * <span className="text-xs text-slate-400">(The name for the collaboration pod)</span></label>
                  <Input placeholder="e.g., 'UI/UX Design Team'" value={newPost.podName} onChange={(e) => setNewPost(p => ({ ...p, podName: e.target.value }))} className="bg-slate-800/50 border-slate-700 focus:ring-blue-500" />
                </div>
              )}

              <div>
                <label className="block font-semibold mb-2 text-slate-300">Content / Description</label>
                <Textarea placeholder="What are the details?" value={newPost.content} onChange={(e) => setNewPost(p => ({ ...p, content: e.target.value }))} className="bg-slate-800/50 border-slate-700 focus:ring-blue-500" />
              </div>

              {selectedPostType === 'POLL' && (
                <div>
                  <label className="block font-semibold mb-2 text-slate-300">Poll Options *</label>
                  <div className="space-y-2">
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input placeholder={`Option ${index + 1}`} value={option} onChange={(e) => handlePollOptionChange(index, e.target.value)} className="bg-slate-800/50 border-slate-700 focus:ring-blue-500" />
                        {pollOptions.length > 2 && <Button variant="ghost" size="sm" onClick={() => removePollOption(index)} className="hover:bg-slate-700">✕</Button>}
                      </div>
                    ))}
                    {pollOptions.length < 5 && <Button variant="outline" size="sm" onClick={addPollOption} className="border-slate-700 bg-slate-800/50 hover:bg-slate-700">+ Add Option</Button>}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={() => setShowCreatePost(false)} className="hover:bg-slate-700">Cancel</Button>
                <Button onClick={handleCreatePost} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">Create Post</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
})