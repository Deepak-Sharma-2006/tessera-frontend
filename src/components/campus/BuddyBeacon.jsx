import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Avatar } from '@/components/ui/avatar.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { useTheme } from '@/lib/theme.js';
import {
    getBuddyBeaconFeed,
    getMyBeaconPosts,
    getAppliedPosts,
    acceptApplication,
    rejectApplication,
    deleteMyPost
} from '@/lib/api.js';
import { loadScoped, saveScoped } from '@/lib/session.js';
import LoadingSpinner from '@/components/animations/LoadingSpinner';
import api from '@/lib/api.js';

export default function BuddyBeacon({ user }) {
    const { theme } = useTheme();

    // State for data from the API
    const [posts, setPosts] = useState([]);
    const [myPosts, setMyPosts] = useState([]);
    const [appliedPosts, setAppliedPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eventName, setEventName] = useState('');

    // State for UI interactions
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [applicationData, setApplicationData] = useState({
        message: '',
        relevantSkills: [],
        newSkill: ''
    });
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [rejectionData, setRejectionData] = useState({ applicationId: '', postId: '', reason: '', note: '' });
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger for refreshing data

    // Tabs: All, My Posts, Applied Posts (rightmost)
    const filters = [
        { id: 'all', label: 'All Posts', count: posts.length },
        { id: 'my-posts', label: 'My Posts', count: myPosts.length },
        { id: 'applied-posts', label: 'Applied Posts', count: appliedPosts.length }
    ];

    useEffect(() => {
        const fetchFeed = async () => {
            setIsLoading(true);
            try {
                const feedRes = await getBuddyBeaconFeed();
                console.log("API Response:", feedRes.data); // Debugging API response
                console.log("Post Map Debug:", feedRes.data.map(postMap => postMap.post)); // Debugging post structure
                setPosts(feedRes.data.map(postMap => ({
                    id: postMap.post.id || postMap.post.postId,
                    title: postMap.post.title || postMap.post.eventName,
                    description: postMap.post.description,
                    requiredSkills: postMap.post.requiredSkills,
                    createdAt: postMap.post.createdAt,
                    author: postMap.post.author,
                    authorId: postMap.post.authorId, // ✅ Add authorId for creator check
                    teamSize: postMap.post.teamSize,
                    currentMembers: postMap.post.currentTeamMembers,
                    hasApplied: postMap.hasApplied,
                    status: postMap.status,
                    hoursElapsed: postMap.hoursElapsed
                })));
                const myRes = await getMyBeaconPosts();
                let my = myRes.data || [];
                const appliedRes = await getAppliedPosts();
                let applied = appliedRes.data || [];

                // Merge any locally pending team posts for this user (created while offline)
                const pending = loadScoped(user?.email, 'pendingTeamPosts') || [];
                if (pending.length) {
                    // add pending to posts and myPosts
                    const pendingMap = pending.map(p => ({ post: p, hasApplied: false, hostId: p.author?.id || user?.id, hoursElapsed: 0 }));
                    setPosts(prev => [...pendingMap, ...prev]);
                    my = [...pending, ...my];
                }

                setMyPosts(my);
                setAppliedPosts(applied);
            } catch (err) {
                setError('Could not fetch posts.');
                // Load pending posts from local storage as fallback
                const pending = loadScoped(user?.email, 'pendingTeamPosts') || [];
                if (pending.length) {
                    const pendingMap = pending.map(p => ({ post: p, hasApplied: false, hostId: p.author?.id || user?.id, hoursElapsed: 0 }));
                    setPosts(pendingMap);
                    setMyPosts(pending);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchFeed();
    }, []);

    useEffect(() => {
        const fetchFeed = async () => {
            setIsLoading(true);
            try {
                const feedRes = await getBuddyBeaconFeed();
                setPosts(feedRes.data);
                const myRes = await getMyBeaconPosts();
                setMyPosts(myRes.data);
            } catch (err) {
                setError('Could not fetch posts.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFeed();
    }, [refreshTrigger]);

    const filteredPosts = useMemo(() => {
        // NOTE: Your full filtering logic should be here
        return posts.filter(post => {
            if (!searchQuery.trim()) return true;
            const lowercasedQuery = searchQuery.toLowerCase();
            return (
                post.eventName?.toLowerCase().includes(lowercasedQuery) ||
                post.description?.toLowerCase().includes(lowercasedQuery) ||
                post.requiredSkills?.some(skill => skill.toLowerCase().includes(lowercasedQuery))
            );
        });
    }, [posts, activeFilter, searchQuery, user]);

    // Helper to get post lifecycle state
    const getPostState = (createdAt) => {
        if (!createdAt) return 'active';
        const hours = (Date.now() - new Date(createdAt).getTime()) / 36e5;
        if (hours < 20) return 'active';
        if (hours < 24) return 'review';
        return 'expired';
    };

    // Updated Post Card rendering
    // Backend-driven post card rendering
    const renderPostCard = (postMap, isHostView = false) => {
        const post = postMap.post || postMap;
        const hasApplied = postMap.hasApplied;
        const hoursElapsed = postMap.hoursElapsed;
        const status = postMap.status;
        const authorId = post.authorId; // ✅ Use authorId from post
        const isOwnPost = authorId === user?.id; // ✅ Compare with authorId
        const currentTeamSize = post.currentTeamMembers?.length || post.currentMembers?.length || 1;
        const applicants = post.applicants || post.applicantObjects || [];

        // ✅ FIX #3: Button logic - show Apply button only for non-creators
        // TESTING: Allow self-application for testing
        let buttonLabel = 'Apply';
        let buttonDisabled = false;
        let showButton = true; // Default to show button

        if (isOwnPost) {
            // Creator of the post - don't show Apply button
            showButton = false;
        } else if (hasApplied) {
            buttonLabel = 'Applied';
            buttonDisabled = true;
        } else if (hoursElapsed >= 20 && hoursElapsed < 24) {
            buttonLabel = 'Reviewing';
            buttonDisabled = true;
        }

        return (
            <Card key={post.id} variant="glass" className="transition-all duration-500 hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Avatar src={post.author?.profilePic} alt={post.author?.name} />
                            <div>
                                <h3 className="text-sm font-semibold text-foreground tracking-tight">{post.author?.name}</h3>
                                <p className="text-xs text-muted-foreground/70">{post.author?.college}</p>
                            </div>
                        </div>
                        <Badge variant={theme === 'cyber' ? 'info' : 'secondary'} size="sm">Team Request</Badge>
                    </div>
                    
                    <div>
                        <h2 className="text-lg font-bold text-foreground tracking-tight">{post.title || post.eventName || 'Team Request'}</h2>
                        <p className="text-sm text-muted-foreground/80 mt-2 leading-relaxed">{post.description}</p>
                    </div>
                    
                    <div>
                        <h4 className="text-xs font-semibold text-foreground/90 mb-2 tracking-wide">Required Skills:</h4>
                        <div className="flex flex-wrap gap-2">
                            {post.requiredSkills && post.requiredSkills.length > 0 ? (
                                post.requiredSkills.map((skill, index) => (
                                    <Badge key={index} variant="secondary" size="sm">
                                        {skill}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground/60">No specific skills required</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-muted-foreground/70 py-3 border-t border-white/10">
                        <p>
                            {hoursElapsed < 24 ? `${24 - hoursElapsed} hours remaining` : 'Expired'}
                        </p>
                        <p>
                            {currentTeamSize}/{post.maxTeamSize || post.teamSize || 4} spots filled
                        </p>
                    </div>

                    {/* Applicants Section - Show only for post creator */}
                    {isOwnPost && applicants.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                            <h4 className="text-sm font-bold text-foreground tracking-tight">Received Applications ({applicants.length})</h4>
                            <div className="space-y-3">
                                {applicants.map((applicant) => {
                                    const appStatus = applicant.status || 'PENDING';
                                    const isAvailable = applicant.isAvailable !== false;
                                    const statusVariant = {
                                        'PENDING': 'warning',
                                        'ACCEPTED': 'success',
                                        'REJECTED': 'destructive'
                                    }[appStatus] || 'secondary';

                                    return (
                                        <div
                                            key={applicant.applicantId || applicant._id}
                                            className={`flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-lg transition-all duration-300 hover:bg-white/8 ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                        >
                                            <div className="flex items-center flex-1 min-w-0">
                                                <Avatar src={applicant.profile?.profilePic} alt={applicant.profile?.name} className="w-9 h-9" />
                                                <div className="ml-3 flex-1 min-w-0">
                                                    <p className="font-semibold text-xs text-foreground truncate">{applicant.profile?.name || applicant.name || 'Unknown'}</p>
                                                    <p className="text-xs text-muted-foreground/60">
                                                        Year: {applicant.profile?.yearOfStudy || applicant.profile?.year || 'N/A'}
                                                    </p>
                                                    {applicant.message && (
                                                        <p className="text-xs text-muted-foreground/70 mt-1 italic line-clamp-1">"{applicant.message}"</p>
                                                    )}
                                                    {applicant.profile?.skills && applicant.profile.skills.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {applicant.profile.skills.slice(0, 2).map((skill, idx) => (
                                                                <Badge key={idx} variant="secondary" size="sm" className="text-xs">
                                                                    {skill}
                                                                </Badge>
                                                            ))}
                                                            {applicant.profile.skills.length > 2 && (
                                                                <span className="text-xs text-muted-foreground/60">+{applicant.profile.skills.length - 2}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-3 flex-shrink-0">
                                                <Badge variant={statusVariant} size="sm">
                                                    {appStatus}
                                                </Badge>
                                                {appStatus === 'PENDING' && !isAvailable && (
                                                    <Badge variant="secondary" size="sm" className="cursor-not-allowed">
                                                        Unavailable
                                                    </Badge>
                                                )}
                                                {appStatus === 'PENDING' && isAvailable && (
                                                    <>
                                                        <Button
                                                            onClick={() => handleAccept(applicant._id || applicant.applicantId, post.id)}
                                                            variant="default"
                                                            size="sm"
                                                            className="text-xs rounded-md px-2 py-0.5 h-auto"
                                                        >
                                                            ✓ Accept
                                                        </Button>
                                                        <Button
                                                            onClick={() => openRejectionModal(applicant._id || applicant.applicantId, post.id)}
                                                            variant="destructive"
                                                            size="sm"
                                                            className="text-xs rounded-md px-2 py-0.5 h-auto"
                                                        >
                                                            ✕ Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {showButton && !isOwnPost && (
                        <Button
                            onClick={() => {
                                if (!buttonDisabled) {
                                    handleApplyToTeam(post);
                                }
                            }}
                            disabled={buttonDisabled}
                            variant="default"
                            className="w-full mt-4 rounded-lg"
                        >
                            {buttonLabel}
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    };

    // Accept/Reject handlers
    const handleAccept = async (applicationId, postId) => {
        try {
            await acceptApplication(applicationId, postId);
            alert('User invited to Collab Pod!');
            // Refresh myPosts after accepting
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            alert('Error accepting applicant.');
        }
    };
    const openRejectionModal = (applicationId, postId) => {
        setRejectionData({ applicationId, postId, reason: '', note: '' });
        setShowRejectionModal(true);
    };
    const handleReject = async () => {
        try {
            await rejectApplication(rejectionData.applicationId, rejectionData.postId, rejectionData.reason, rejectionData.note);
            setShowRejectionModal(false);
            alert('Applicant rejected.');
            // Refresh myPosts after rejecting
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            alert('Error rejecting applicant.');
        }
    };
    const handleDeletePost = async (postId) => {
        try {
            await deleteMyPost(postId);
            alert('Post deleted.');
            // Optionally refresh myPosts
        } catch (err) {
            alert('Error deleting post.');
        }
    };

    // Function to begin apply flow: open modal for message input
    const handleApplyToTeam = (post) => {
        setSelectedPost(post);
        setApplicationData({ message: '', relevantSkills: [], newSkill: '' });
        setShowApplicationModal(true);
    };

    const MAX_MESSAGE_LENGTH = 300;

    const addSkill = () => {
        const val = (applicationData.newSkill || '').trim();
        if (!val) return;
        if ((applicationData.relevantSkills || []).includes(val)) {
            setApplicationData(prev => ({ ...prev, newSkill: '' }));
            return;
        }
        setApplicationData(prev => ({ ...prev, relevantSkills: [...(prev.relevantSkills || []), val], newSkill: '' }));
    };

    const removeSkill = (skill) => {
        setApplicationData(prev => ({ ...prev, relevantSkills: (prev.relevantSkills || []).filter(s => s !== skill) }));
    };

    const handleSubmitApplication = async () => {
        if (!selectedPost) return;

        // ✅ FIX #3: Prevent creator from applying
        // TESTING: BYPASSED - Allow self-application for testing
        // if (selectedPost.hostId === user?.id || selectedPost.authorId === user?.id) {
        //     alert('❌ You cannot apply to your own post');
        //     return;
        // }

        const msg = (applicationData.message || '').trim();
        if (!msg || msg.length > MAX_MESSAGE_LENGTH) return;
        try {
            const token = localStorage.getItem('token');
            const res = await api.post(`/api/beacon/apply/${selectedPost.id}`,
                { message: msg },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            // Update UI
            setShowApplicationModal(false);
            setAppliedPosts(prev => [...prev, { applicationId: res.data.id, post: selectedPost, applicationStatus: res.data.status }]);
            setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, hasApplied: true } : p));
            setSelectedPost(null);
            setApplicationData({ message: '', relevantSkills: [], newSkill: '' });
            alert('Application Submitted Successfully!');
        } catch (err) {
            console.error('Error applying to team:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to apply to the team. Please try again later.';
            alert(`❌ ${errorMsg}`);
        }
    };

    const renderAppliedPosts = () => {
        return appliedPosts.map(postMap => renderPostCard(postMap));
    };

    const renderTabs = () => {
        switch (activeFilter) {
            case 'my-posts':
                return myPosts.map(postMap => renderPostCard(postMap));
            case 'applied-posts':
                return renderAppliedPosts();
            default:
                return filteredPosts.map(postMap => renderPostCard(postMap));
        }
    };

    const renderPosts = () => {
        if (isLoading) {
            return <div className="flex justify-center p-12"><LoadingSpinner /></div>;
        }
        if (error) {
            return <div className="text-center text-red-400 p-12">{error}</div>;
        }
        if (filteredPosts.length === 0) {
            return (
                <Card className="text-center py-12">
                    <CardContent>
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold mb-2">No Posts Found</h3>
                        <p className="text-muted-foreground">
                            {'No posts match your search criteria.'}
                        </p>
                    </CardContent>
                </Card>
            );
        }
        return filteredPosts.map((post) => renderPostCard(post, false));
    };

    return (
        <div className="space-y-8">
            {/* Standardized Pill Tabs - Buddy Beacon */}
            <div className="flex justify-center gap-4 mb-8">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => {
                            setActiveFilter(filter.id);
                            // ✅ NEW: Refresh data when opening "my-posts" tab (for latest availability status)
                            if (filter.id === 'my-posts') {
                                setRefreshTrigger(prev => prev + 1);
                            }
                        }}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-500 border ${activeFilter === filter.id
                            ? theme === 'cyber'
                              ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40 shadow-md shadow-cyan-400/20 backdrop-blur-xl'
                              : 'bg-primary/20 text-primary-solid border-primary/40 shadow-md shadow-primary/20 backdrop-blur-xl'
                            : 'bg-white/5 text-muted-foreground/70 border-white/10 hover:border-white/20 hover:text-muted-foreground/90 hover:bg-white/8'
                            }`}
                    >
                        {filter.label} <span className="ml-2 inline-block bg-white/10 text-xs px-2 py-1 rounded-md text-muted-foreground/80 font-semibold">{filter.count}</span>
                    </button>
                ))}
            </div>
            <div className="space-y-6">{
                (() => {
                    if (isLoading) {
                        return <div className="flex justify-center p-12"><LoadingSpinner /></div>;
                    }
                    if (error) {
                        return <div className="text-center text-red-400 p-12">{error}</div>;
                    }
                    if (activeFilter === 'applied-posts') {
                        if (!appliedPosts.length) return <div>No applied posts found.</div>;
                        return (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {appliedPosts.map((item, idx) => {
                                    const key = item.applicationId || item.post?.id || `applied-${idx}`;
                                    return (
                                        <li key={key} style={{ border: '1px solid #eee', margin: 8, padding: 12, borderRadius: 8 }}>
                                            <div><b>{item.post?.title || item.post?.content || 'Untitled Post'}</b></div>
                                            <div>Status: <span>{item.applicationStatus}</span></div>
                                        </li>
                                    );
                                })}
                            </ul>
                        );
                    }
                    if (activeFilter === 'my-posts') {
                        if (!myPosts.length) return <div>No posts found.</div>;
                        return myPosts.map((p) => {
                            // Merge applicants into post for display
                            const postWithApplicants = {
                                post: { ...p.post, applicants: p.applicants || [] },
                                hasApplied: false,
                                hostId: p.post?.authorId || user?.id,
                                hoursElapsed: 0,
                                status: 'ACTIVE'
                            };
                            return renderPostCard(postWithApplicants, true);
                        });
                    }
                    if (filteredPosts.length === 0) {
                        return (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h3 className="text-xl font-semibold mb-2">No Posts Found</h3>
                                    <p className="text-muted-foreground">
                                        {'No posts match your search criteria.'}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    }
                    return filteredPosts.map((post) => renderPostCard(post, false));
                })()
            }</div>
            {showApplicationModal && selectedPost && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto variant='glass' p-8 rounded-lg shadow-lg">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight">Apply to Team</h3>
                                <p className="text-muted-foreground/70 text-sm mt-1">{selectedPost.eventName}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowApplicationModal(false)} className="rounded-lg">✕</Button>
                        </div>
                        <div className="space-y-6">
                            <div className={theme === 'cyber' ? 'bg-cyan-400/10 border border-cyan-400/20 p-4 rounded-lg' : 'bg-primary/10 border border-primary/20 p-4 rounded-lg'}>
                                <h4 className={theme === 'cyber' ? 'font-semibold text-cyan-300 mb-2' : 'font-semibold text-primary-solid mb-2'}>Team Details:</h4>
                                <div className="space-y-1 text-sm text-muted-foreground/80">
                                    {/* ✅ FIX #2: Show complete post data */}
                                    <div><strong>Team:</strong> {selectedPost?.title || selectedPost?.eventName || 'Team Request'}</div>
                                    <div><strong>Leader:</strong> {selectedPost?.author?.name || selectedPost?.authorName || 'Unknown'}</div>
                                    <div><strong>Description:</strong> {selectedPost?.description || 'No description'}</div>
                                    <div><strong>Current Size:</strong> {(selectedPost?.applicants?.length || selectedPost?.currentTeamMembers?.length || 0) + 1}/{selectedPost?.maxTeamSize || selectedPost?.teamSize || 4} members</div>
                                    <div><strong>Skills Needed:</strong> {
                                        Array.isArray(selectedPost?.requiredSkills) && selectedPost.requiredSkills.length > 0
                                            ? selectedPost.requiredSkills.join(', ')
                                            : 'No specific skills required'
                                    }</div>
                                </div>
                            </div>
                            <div>
                                <label className="block font-semibold mb-3 text-foreground tracking-wide">Your Relevant Skills</label>
                                <div className="space-y-3">
                                    {applicationData.relevantSkills.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {applicationData.relevantSkills.map((skill) => (
                                                <Badge key={skill} variant="secondary" className="cursor-pointer hover:bg-red-500/20 transition-colors duration-300" onClick={() => removeSkill(skill)}>
                                                    {skill} ✕
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex space-x-2">
                                        <Input placeholder="Add a skill..." value={applicationData.newSkill} onChange={(e) => setApplicationData(prev => ({ ...prev, newSkill: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addSkill()} />
                                        <Button variant="secondary" onClick={addSkill} className="rounded-lg">Add</Button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block font-semibold mb-3 text-foreground tracking-wide">Why do you want to join this team? *</label>
                                <Textarea placeholder="Tell them about your experience..." value={applicationData.message} onChange={(e) => setApplicationData(prev => ({ ...prev, message: e.target.value }))} rows={4} />
                                <div className="text-sm text-right mt-1 text-muted-foreground/60" style={{ color: (applicationData.message || '').length > MAX_MESSAGE_LENGTH ? '#f59e0b' : undefined }}>
                                    {(applicationData.message || '').length}/{MAX_MESSAGE_LENGTH}
                                </div>
                            </div>
                            <div className="flex space-x-4">
                                <Button onClick={handleSubmitApplication} disabled={!applicationData.message.trim() || (applicationData.message || '').length > MAX_MESSAGE_LENGTH} variant="default" className="flex-1 py-3 rounded-lg">
                                    🚀 Submit Application
                                </Button>
                                <Button variant="ghost" onClick={() => setShowApplicationModal(false)} className="py-3 rounded-lg border border-white/20">Cancel</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
            {showRejectionModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <Card className="max-w-md w-full p-8 variant='glass' rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold tracking-tight mb-6">Reject Applicant</h3>
                        <div className="mb-6">
                            <label className="block font-semibold mb-3 text-foreground/90">Reason</label>
                            <select value={rejectionData.reason} onChange={e => setRejectionData(prev => ({ ...prev, reason: e.target.value }))} className="w-full backdrop-blur-xl bg-white/8 border border-white/15 text-foreground p-2 rounded-lg hover:bg-white/12 hover:border-white/20 focus:bg-white/12 focus:border-white/30 transition-all duration-500">
                                <option value="">Select reason...</option>
                                <option value="NOT_A_GOOD_FIT">Skill mismatch</option>
                                <option value="TEAM_FULL">Team full</option>
                                <option value="LATE_APPLICATION">Late application</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="mb-6">
                            <label className="block font-semibold mb-3 text-foreground/90">Custom Note (optional)</label>
                            <Textarea value={rejectionData.note} onChange={e => setRejectionData(prev => ({ ...prev, note: e.target.value }))} rows={3} />
                        </div>
                        <div className="flex gap-4">
                            <Button onClick={handleReject} disabled={!rejectionData.reason} variant="default" className="flex-1 rounded-lg">Reject</Button>
                            <Button variant="ghost" onClick={() => setShowRejectionModal(false)} className="flex-1 rounded-lg border border-white/20">Cancel</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}