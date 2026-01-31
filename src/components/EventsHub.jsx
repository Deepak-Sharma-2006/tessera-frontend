import { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/card.jsx';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { Input } from './ui/input.jsx';
import { Textarea } from './ui/textarea.jsx';
import { getEvents, createTeamPost, createEvent, trackEventRegistration } from "@/lib/api.js";
import { saveScoped, loadScoped, clearScoped } from '@/lib/session.js';
import LoadingSpinner from '@/components/animations/LoadingSpinner.jsx';

export default function EventsHub({ user, onNavigateToBeacon }) {
  // State for data from the API
  const [allEvents, setAllEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for UI interactions
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFindTeamModal, setShowFindTeamModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false); // ✅ NEW: Track event details modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [findTeamAction, setFindTeamAction] = useState(null);

  // State for the "Create Team Post" form
  const [teamPost, setTeamPost] = useState({
    extraSkills: [],
    newSkill: '',
    description: ''
  });

  // State for the "Create Event" modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamSizeError, setTeamSizeError] = useState(''); // ✅ NEW: Track team size validation error
  const [registeredEvents, setRegisteredEvents] = useState(new Set()); // ✅ NEW: Track registered event IDs
  const [newEvent, setNewEvent] = useState({
    title: '',
    category: 'Hackathon',
    date: '',
    time: '',
    dateTime: '', // ✅ NEW: Single datetime-local field
    description: '',
    requiredSkills: [],
    newSkill: '',
    maxTeamSize: '', // ✅ CHANGED: From 4 to empty string
    maxTeams: '', // ✅ NEW: Maximum teams limit (for team events)
    registrationLink: '', // ✅ CHANGED: From externalLink to registrationLink
    linkEndDate: '', // ✅ NEW: Registration deadline
    organizer: user?.name || 'Moderator',
  });

  // Logic: Only Campus Catalyst (COLLEGE_HEAD role) sees the button; Devs access via secret mode
  const isCatalyst = user?.role === 'COLLEGE_HEAD' || user?.badges?.includes('Campus Catalyst');
  const isDev = user?.isDev === true; // Explicitly check for true
  const isModerator = user?.role === 'COLLEGE_HEAD' || user?.isDev === true;

  // Debug: Log user data to verify isDev is being received
  useEffect(() => {
    console.log('[EventsHub] User data:', { userId: user?.id, isDev: user?.isDev, role: user?.role, isCatalyst, localIsDev: isDev, buttonVisible: (isCatalyst || isDev) });
  }, [user, isCatalyst, isDev]);
  const categoryOptions = [
    { id: 'Hackathon', label: 'Hackathon', icon: '💻' },
    { id: 'Fest', label: 'Fest', icon: '🎉' },
    { id: 'Competition', label: 'Competition', icon: '🏆' },
    { id: 'Workshop', label: 'Workshop', icon: '🛠️' },
    { id: 'Others', label: 'Others', icon: '📋' }
  ];

  // Fetch all events from the backend when the component first loads
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getEvents();
        // Merge server events with any locally saved pending events for the user
        const serverEvents = (response.data || []).map(event => ({
          ...event,
          maxTeamSize: event.maxParticipants // Normalize: ensure maxTeamSize is available
        }));
        const pending = loadScoped(user?.email, 'pendingEvents') || [];
        // Avoid duplicate by title+date heuristic
        const merged = [...pending, ...serverEvents.filter(se => !pending.some(pe => pe.title === se.title && pe.date === se.date))];
        setAllEvents(merged);

        // ✅ NEW: Initialize registeredEvents from backend hasRegistered field
        const registered = new Set();
        merged.forEach(event => {
          if (event.hasRegistered) {
            registered.add(event.id);
          }
        });
        setRegisteredEvents(registered);
      } catch (err) {
        setError('Could not fetch events. The server might be down.');
        console.error("Fetch Events Error:", err);
        // Load locally saved pending events as fallback
        const pending = loadScoped(user?.email, 'pendingEvents') || [];
        setAllEvents(pending);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Try to sync any pending local items (events/posts) to the server when app starts
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      // Sync pending events
      const pendingEvents = loadScoped(user?.email, 'pendingEvents') || [];
      if (pendingEvents.length) {
        const toKeep = [];
        for (const ev of pendingEvents) {
          try {
            const res = await createEvent(ev);
            // replace local with server response
            setAllEvents(prev => [res.data, ...prev.filter(p => p.id !== ev.id)]);
          } catch {
            // ignore
            toKeep.push(ev);
          }
        }
        if (toKeep.length !== pendingEvents.length) {
          if (toKeep.length === 0) clearScoped(user?.email, 'pendingEvents');
          else saveScoped(user?.email, 'pendingEvents', toKeep);
        }
      }

      // Sync pending team posts
      const pendingTeamPosts = loadScoped(user?.email, 'pendingTeamPosts') || [];
      if (pendingTeamPosts.length) {
        const keepPosts = [];
        for (const p of pendingTeamPosts) {
          try {
            await createTeamPost({ eventId: p.eventId, description: p.description, extraSkills: p.extraSkills });
            // on success, optionally notify or remove local copy
          } catch {
            // ignore
            keepPosts.push(p);
          }
        }
        if (keepPosts.length === 0) clearScoped(user?.email, 'pendingTeamPosts');
        else saveScoped(user?.email, 'pendingTeamPosts', keepPosts);
      }
    })();
  }, [user]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return allEvents;
    const formattedCategory = activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1, -1);
    return allEvents.filter(event => event.category === formattedCategory);
  }, [activeFilter, allEvents]);

  const filters = [
    { id: 'all', label: 'All Events', icon: '📅', count: allEvents.length },
    { id: 'hackathons', label: 'Hackathons', icon: '💻', count: allEvents.filter(e => e.category === 'Hackathon').length },
    { id: 'competitions', label: 'Competitions', icon: '🏆', count: allEvents.filter(e => e.category === 'Competition').length },
    { id: 'workshops', label: 'Workshops', icon: '🛠️', count: allEvents.filter(e => e.category === 'Workshop').length },
    { id: 'fests', label: 'Fests', icon: '🎉', count: allEvents.filter(e => e.category === 'Fest').length }
  ];

  const formatEventDate = (dateTimeString) => {
    // FIX 1: Only show 'TBD' if date is strictly null, undefined, or empty string
    if (!dateTimeString || dateTimeString.trim() === '') return 'TBD';
    try {
      const date = new Date(dateTimeString);
      // Check if the date is valid
      if (isNaN(date.getTime())) return 'TBD';
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) + ' ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (err) {
      return 'TBD';
    }
  };

  // ✅ NEW: Helper function to check if deadline is close (within 7 days)
  const isDeadlineClose = (linkEndDate) => {
    if (!linkEndDate) return false;
    try {
      const deadline = new Date(linkEndDate);
      const now = new Date();
      const daysUntilDeadline = (deadline - now) / (1000 * 60 * 60 * 24);
      return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
    } catch (err) {
      return false;
    }
  };

  // ✅ FIX 5: Helper function to ensure URLs have proper protocol
  const ensureProtocol = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const handleFindTeam = (event) => {
    setSelectedEvent(event);
    setShowFindTeamModal(true);
    setFindTeamAction(null);
  };

  const handleCreateTeamPost = async () => {
    if (!selectedEvent || !teamPost.description.trim()) return;
    // ✅ FIX #1: Ensure payload includes all required fields: content, requiredSkills, maxTeamSize
    const postData = {
      eventId: selectedEvent.id,
      content: teamPost.description,  // Description becomes content
      description: teamPost.description,  // Also include description for compatibility
      requiredSkills: [
        ...(selectedEvent.requiredSkills || []),
        ...(teamPost.extraSkills || [])
      ].filter(s => s),  // Merge event skills + extra skills, remove empty strings
      maxTeamSize: selectedEvent.maxParticipants || 4,
      title: `${user?.fullName || user?.name || 'Someone'}'s Team for ${selectedEvent.title}`  // Generate a title
    };
    try {
      await createTeamPost(postData);
      alert('🎉 Your team post has been created in Buddy Beacon! It will expire in 24 hours and auto-create a Collab Pod if you get applicants.');
      if (onNavigateToBeacon) onNavigateToBeacon(selectedEvent.id);
      setShowFindTeamModal(false);
      setTeamPost({ extraSkills: [], newSkill: '', description: '' });
    } catch {
      // ignore
      // Save pending team post locally to sync later
      const pending = loadScoped(user?.email, 'pendingTeamPosts') || [];
      const pendingPost = { id: `local-${Date.now()}`, eventId: selectedEvent.id, description: teamPost.description, extraSkills: teamPost.extraSkills, createdAt: new Date().toISOString(), author: { name: user?.name, id: user?.id } };
      pending.unshift(pendingPost);
      saveScoped(user?.email, 'pendingTeamPosts', pending);
      // Also show a friendly message and navigate to beacon
      setAllEvents(prev => prev);
      alert('Server unavailable. Your team post is saved locally and will sync when the server is reachable.');
      if (onNavigateToBeacon) onNavigateToBeacon(selectedEvent.id);
      setShowFindTeamModal(false);
      setTeamPost({ extraSkills: [], newSkill: '', description: '' });
    }
  };

  const handleBrowseTeams = () => {
    if (onNavigateToBeacon && selectedEvent) onNavigateToBeacon(selectedEvent.id);
    setShowFindTeamModal(false);
  };

  const handleCreateEventSubmit = async () => {
    // ✅ FIX 3: Validate maxTeamSize - now required and must be >= 1
    if (!newEvent.maxTeamSize || newEvent.maxTeamSize < 1 || !Number.isInteger(Number(newEvent.maxTeamSize))) {
      setTeamSizeError('Max Team Size is required and must be at least 1');
      return;
    }
    setTeamSizeError('');

    // ✅ NEW: Validate that if registrationLink exists, linkEndDate must also be provided
    if (newEvent.registrationLink && newEvent.registrationLink.trim() && !newEvent.linkEndDate) {
      alert('Please set a registration deadline when providing an external registration link.');
      return;
    }

    if (!newEvent.title || !newEvent.category || !newEvent.dateTime || !newEvent.description) {
      alert('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      // Transform form data to match backend schema
      // Backend expects: date, time, maxTeamSize (not startDate and maxParticipants)
      const dateTimeObj = new Date(newEvent.dateTime);
      const dateStr = dateTimeObj.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = dateTimeObj.toTimeString().split(' ')[0].substring(0, 5); // HH:mm

      const eventPayload = {
        title: newEvent.title,
        category: newEvent.category,
        date: dateStr,
        time: timeStr,
        description: newEvent.description,
        requiredSkills: newEvent.requiredSkills,
        maxTeamSize: Number(newEvent.maxTeamSize),
        maxTeams: newEvent.maxTeams ? Number(newEvent.maxTeams) : null,
        registrationLink: newEvent.registrationLink,
        linkEndDate: newEvent.linkEndDate,
        organizer: newEvent.organizer
      };
      const response = await createEvent(eventPayload);
      // Normalize response data to ensure consistent field names for frontend display
      const normalizedEvent = {
        ...response.data,
        maxTeamSize: response.data.maxParticipants, // Ensure maxTeamSize is available for rendering
        dateTime: response.data.startDate // Ensure dateTime field available for fallback
      };
      setAllEvents(prevEvents => [normalizedEvent, ...prevEvents]);
      setShowCreateModal(false);
      // Reset the form
      setNewEvent({
        title: '', category: 'Hackathon', date: '', time: '', dateTime: '', description: '',
        requiredSkills: [], newSkill: '', maxTeamSize: '', registrationLink: '', linkEndDate: '',
        organizer: user?.name || 'Moderator',
      });
    } catch {
      // ignore
      // Save event locally to pending list for this user
      const pending = loadScoped(user?.email, 'pendingEvents') || [];

      const dateTimeObj = new Date(newEvent.dateTime);
      const dateStr = dateTimeObj.toISOString().split('T')[0];
      const timeStr = dateTimeObj.toTimeString().split(' ')[0].substring(0, 5);

      const pendingEvent = {
        id: `local-${Date.now()}`,
        title: newEvent.title,
        category: newEvent.category,
        date: dateStr,
        time: timeStr,
        dateTime: newEvent.dateTime, // Keep for display
        startDate: newEvent.dateTime, // Normalize for display
        description: newEvent.description,
        requiredSkills: newEvent.requiredSkills,
        maxTeamSize: Number(newEvent.maxTeamSize),
        maxParticipants: Number(newEvent.maxTeamSize), // Normalize
        registrationLink: newEvent.registrationLink,
        linkEndDate: newEvent.linkEndDate,
        organizer: newEvent.organizer
      };
      pending.unshift(pendingEvent);
      saveScoped(user?.email, 'pendingEvents', pending);
      setAllEvents(prev => [pendingEvent, ...prev]);
      setShowCreateModal(false);
      alert('Server unavailable. Event saved locally and will sync when server is available.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEventSkill = () => {
    if (newEvent.newSkill.trim() && !newEvent.requiredSkills.includes(newEvent.newSkill.trim())) {
      setNewEvent(prev => ({ ...prev, requiredSkills: [...prev.requiredSkills, prev.newSkill.trim()], newSkill: '' }));
    }
  };

  const removeEventSkill = (skill) => {
    setNewEvent(prev => ({ ...prev, requiredSkills: prev.requiredSkills.filter(s => s !== skill) }));
  };

  const addTeamSkill = () => {
    if (teamPost.newSkill.trim() && !teamPost.extraSkills.includes(teamPost.newSkill.trim())) {
      setTeamPost(prev => ({ ...prev, extraSkills: [...prev.extraSkills, teamPost.newSkill.trim()], newSkill: '' }));
    }
  };

  const removeTeamSkill = (skillToRemove) => {
    setTeamPost(prev => ({ ...prev, extraSkills: prev.extraSkills.filter(skill => skill !== skillToRemove) }));
  };

  const renderEvents = () => {
    if (isLoading) return <div className="col-span-full flex justify-center p-8"><LoadingSpinner /></div>;
    if (error) return <div className="col-span-full text-center text-red-400 p-8">{error}</div>;
    if (filteredEvents.length === 0) return <div className="col-span-full text-center text-muted-foreground p-8">No events found.</div>;

    return filteredEvents.map((event) => {
      // ✅ UPDATED: Determine if this is a solo event and if has registration link
      // Check maxParticipants (from server) OR maxTeamSize (from local state)
      const maxSize = Number(event.maxParticipants || event.maxTeamSize);
      const isSolo = maxSize === 1;
      const hasLink = event.registrationLink && event.registrationLink.trim().length > 0;

      // Debug log to verify event data
      if (maxSize !== undefined && maxSize !== null) {
        console.log(`[EventCard] ${event.title}: maxParticipants=${event.maxParticipants}, maxTeamSize=${event.maxTeamSize}, isSolo=${isSolo}`);
      }

      // ✅ FIX 2 & 5: Handle details button click - open registration link (with protocol) OR show event details modal
      const handleDetailsClick = () => {
        if (hasLink) {
          // If link exists, open in new tab with proper protocol
          window.open(ensureProtocol(event.registrationLink), '_blank');
        } else {
          // If NO link, show event details modal
          setSelectedEvent(event);
          setShowEventDetailsModal(true);
        }
      };

      // ✅ NEW: Handle registration for solo events with external links
      const handleRegisterClick = async () => {
        try {
          // Track participation on backend
          const response = await trackEventRegistration(event.id);

          // Update local state to mark as registered
          setRegisteredEvents(prev => new Set([...prev, event.id]));

          // Update the event's participant count in local state
          if (response.data) {
            setAllEvents(prevEvents =>
              prevEvents.map(e => e.id === event.id ? response.data : e)
            );
          }

          // Open registration link in new tab
          window.open(ensureProtocol(event.registrationLink), '_blank');
        } catch (error) {
          console.error('Error tracking registration:', error);
          // Still open the link even if tracking fails
          window.open(ensureProtocol(event.registrationLink), '_blank');
        }
      };

      return (
        <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] rounded-2xl">
          <div className="p-6 space-y-4">
            <div className="flex-1">
              <h3 className="font-semibold text-xl mb-2 line-clamp-2">{event.title}</h3>
              <div className="flex gap-2 flex-wrap">
                <Badge>{event.category}</Badge>
                {/* FIX 2: Show Solo tag with green color for maxTeamSize === 1, Team tag for > 1 */}
                {isSolo ? (
                  <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">Solo</Badge>
                ) : (
                  <Badge variant="outline" className="border-blue-500 text-blue-600">Team</Badge>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-muted-foreground"><span role="img" aria-label="date">📅</span><span className="text-sm">{formatEventDate(event.startDate || event.dateTime)}</span></div>
              <div className="flex items-center space-x-2 text-muted-foreground"><span role="img" aria-label="team size">👥</span><span className="text-sm">Max team size: {event.maxParticipants || event.maxTeamSize || 'N/A'}</span></div>
              {/* ✅ NEW: Show max teams limit if specified */}
              {event.maxTeams && (
                <div className="flex items-center space-x-2 text-muted-foreground"><span role="img" aria-label="teams allowed">📊</span><span className="text-sm">Teams allowed: {event.maxTeams}</span></div>
              )}
              <div className="flex items-center space-x-2 text-muted-foreground"><span role="img" aria-label="organizer">🏢</span><span className="text-sm">By {event.organizer}</span></div>
              {/* ✅ FIX 3: Deadline relocated to metadata section */}
              {event.linkEndDate && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <span role="img" aria-label="deadline">⏰</span>
                  <span className="text-sm">Registration closes: {formatEventDate(event.linkEndDate)}</span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">{event.description}</p>
            <div className="space-y-2">
              <div className="text-sm font-medium">Required Skills</div>
              <div className="flex flex-wrap gap-2">
                {event.requiredSkills && event.requiredSkills.length > 0 ? (
                  <>
                    {event.requiredSkills.slice(0, 4).map((skill) => <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>)}
                    {event.requiredSkills.length > 4 && <Badge variant="outline" className="text-xs">+{event.requiredSkills.length - 4} more</Badge>}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">No specific skills required</span>
                )}
              </div>
            </div>
            {/* ✅ FIX 4: Participant/Team counts adapt to event type */}
            <div className="flex justify-between text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <div className="text-center"><div className="font-semibold text-blue-600">{event.participantsCount || 0}</div><div className="text-xs">Participants</div></div>
              {!isSolo && (
                <div className="text-center"><div className="font-semibold text-green-600">{event.teamsFormedCount || 0}</div><div className="text-xs">Teams</div></div>
              )}
            </div>

            <div className="space-y-2">
              {/* ✅ Solo + Link: Show "Register" button (or "Registered" if already registered). Hide "Find Team". */}
              {isSolo && hasLink && (
                <Button
                  onClick={handleRegisterClick}
                  disabled={registeredEvents.has(event.id)}
                  className={`w-full text-white ${registeredEvents.has(event.id)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    }`}
                >
                  {registeredEvents.has(event.id) ? '✅ Registered' : '📝 Register Solo'}
                </Button>
              )}

              {/* ✅ Solo + No Link: Show "Details". Hide "Find Team". */}
              {isSolo && !hasLink && (
                <Button
                  onClick={handleDetailsClick}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  📋 Details
                </Button>
              )}

              {/* ✅ Team: Show "Find Team" AND "Details". */}
              {!isSolo && (
                <>
                  <Button onClick={() => handleFindTeam(event)} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">🔍 Find Team</Button>
                  <Button
                    onClick={handleDetailsClick}
                    variant="outline"
                    className="w-full"
                  >
                    {hasLink ? '🔗 Registration Link' : '📋 Details'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      );
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">🎯 Events Hub</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Discover hackathons, competitions, workshops, and fests to showcase your skills</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 p-2 bg-muted/30 rounded-xl">
        {filters.map((filter) => (
          <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`px-6 py-3 rounded-lg transition-all duration-200 font-medium ${activeFilter === filter.id ? 'bg-primary text-primary-foreground shadow-md transform scale-105' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
            <div className="flex items-center space-x-2"><span>{filter.icon}</span><span>{filter.label}</span><Badge variant="outline" className="text-xs">{filter.count}</Badge></div>
          </button>
        ))}
      </div>
      {(isCatalyst || isDev) && (
        <div className="flex justify-end">
          <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-green-600 to-blue-600 hover:scale-105 transition-all">
            ✨ Create Event
          </Button>
        </div>
      )}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{renderEvents()}</div>

      {/* Find Team Modal */}
      {showFindTeamModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div><h3 className="text-2xl font-bold">Find Team</h3><p className="text-muted-foreground">{selectedEvent.title}</p></div>
              <Button variant="ghost" size="icon" onClick={() => setShowFindTeamModal(false)} className="rounded-full">✕</Button>
            </div>
            {!findTeamAction ? (
              <div className="space-y-4">
                <button onClick={() => setFindTeamAction('create')} className="w-full p-6 border-2 border-border rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all text-left group hover:shadow-md">
                  <div className="flex items-center space-x-4 mb-3"><span className="text-3xl">✨</span><span className="text-xl font-semibold">Create Team Post</span></div>
                  <p className="text-muted-foreground">Create a post in Buddy Beacon to attract teammates. Auto-fills event details.</p>
                </button>
                <button onClick={() => setFindTeamAction('browse')} className="w-full p-6 border-2 border-border rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all text-left group hover:shadow-md">
                  <div className="flex items-center space-x-4 mb-3"><span className="text-3xl">🔍</span><span className="text-xl font-semibold">Browse Teams</span></div>
                  <p className="text-muted-foreground">Browse existing team posts in Buddy Beacon for this event.</p>
                </button>
              </div>
            ) : findTeamAction === 'create' ? (
              <div className="space-y-6">
                <Button variant="outline" size="sm" onClick={() => setFindTeamAction(null)} className="rounded-full">← Back</Button>
                <div className="bg-blue-50/50 p-4 rounded-xl border"><h4 className="font-semibold mb-2">Auto-filled Event Details:</h4><div className="space-y-2 text-sm"><div><strong>Event:</strong> {selectedEvent.title}</div><div><strong>Max Team Size:</strong> {selectedEvent.maxParticipants || selectedEvent.maxTeamSize || 'Not specified'} members</div><div><strong>Required Skills:</strong> {selectedEvent.requiredSkills && selectedEvent.requiredSkills.length > 0 ? selectedEvent.requiredSkills.join(', ') : 'No specific skills required'}</div></div></div>
                <div className="bg-green-50/50 p-4 rounded-xl border"><h4 className="font-semibold mb-2">Your Profile Details (will be shown):</h4><div className="space-y-2 text-sm"><div><strong>Name:</strong> {user?.fullName || user?.name || 'Your Name'}</div><div><strong>Year:</strong> {user?.yearOfStudy || user?.year || 'Your Year'}</div><div><strong>Badges:</strong></div></div></div>
                <div><label className="block font-semibold mb-2">Additional Skills (Optional)</label><div className="flex flex-wrap gap-2 mb-2">{teamPost.extraSkills.map((skill) => (<Badge key={skill} variant="outline" className="cursor-pointer" onClick={() => removeTeamSkill(skill)}>{skill} ✕</Badge>))}</div><div className="flex space-x-2"><Input placeholder="Add a skill..." value={teamPost.newSkill} onChange={(e) => setTeamPost(prev => ({ ...prev, newSkill: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addTeamSkill()} /><Button variant="outline" onClick={addTeamSkill}>Add</Button></div></div>
                <div><label className="block font-semibold mb-2">Team Post Description *</label><Textarea placeholder="Describe your project idea..." value={teamPost.description} onChange={(e) => setTeamPost(prev => ({ ...prev, description: e.target.value }))} rows={4} /></div>
                <div className="bg-yellow-50/50 p-4 rounded-xl border"><p className="text-sm">⏰ <strong>Auto-Expiry:</strong> Your team post will expire in 24 hours and auto-create a Collab Pod if you receive applicants.</p></div>
                <div className="flex space-x-4"><Button onClick={handleCreateTeamPost} disabled={!teamPost.description.trim()} className="flex-1">🚀 Create Team Post</Button><Button variant="outline" onClick={() => setFindTeamAction(null)}>Cancel</Button></div>
              </div>
            ) : (
              <div className="space-y-6 text-center relative">
                <Button variant="outline" size="sm" onClick={() => setFindTeamAction(null)} className="rounded-full absolute top-0 left-0">← Back</Button>
                <div className="text-6xl pt-8">🔍</div>
                <h4 className="font-semibold text-lg">Browse Existing Teams</h4>
                <p className="text-muted-foreground">We'll take you to the Buddy Beacon to see all team posts for {selectedEvent.title}.</p>
                <Button onClick={handleBrowseTeams} className="w-full">🚀 Go to Buddy Beacon</Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ✅ NEW: Event Details Modal */}
      {showEventDetailsModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">{selectedEvent.title}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowEventDetailsModal(false)} className="rounded-full">✕</Button>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedEvent.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Category</h4>
                  <p className="text-muted-foreground">{selectedEvent.category}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Organizer</h4>
                  <p className="text-muted-foreground">{selectedEvent.organizer || 'Not specified'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Date</h4>
                  <p className="text-muted-foreground">{formatEventDate(selectedEvent.startDate || selectedEvent.dateTime)}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Max Team Size</h4>
                  <p className="text-muted-foreground">{selectedEvent.maxParticipants || selectedEvent.maxTeamSize || 'N/A'} members</p>
                </div>
              </div>
              {selectedEvent.requiredSkills && selectedEvent.requiredSkills.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.requiredSkills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowEventDetailsModal(false)}>Close</Button>
                {(selectedEvent.maxParticipants > 1 || selectedEvent.maxTeamSize > 1) && (
                  <Button onClick={() => { setShowEventDetailsModal(false); handleFindTeam(selectedEvent); }} className="bg-gradient-to-r from-blue-600 to-purple-600">🔍 Find Team</Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && isModerator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">Create New Event</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)} className="rounded-full">✕</Button>
            </div>
            <div className="space-y-6">
              <div><label className="block text-sm font-medium mb-1">Event Title *</label><Input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-2">Event Category *</label><div className="grid grid-cols-5 gap-2">{categoryOptions.map(cat => (<button key={cat.id} onClick={() => setNewEvent({ ...newEvent, category: cat.id })} className={`p-2 border rounded-lg flex flex-col items-center justify-center transition-colors ${newEvent.category === cat.id ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}><span className="text-2xl mb-1">{cat.icon}</span><span className="text-xs font-medium">{cat.label}</span></button>))}</div></div>
              <div>
                <label className="block text-sm font-medium mb-1">Event Start Date & Time *</label>
                <Input
                  type="datetime-local"
                  value={newEvent.dateTime}
                  onChange={(e) => setNewEvent({ ...newEvent, dateTime: e.target.value })}
                />
              </div>
              <div><label className="block text-sm font-medium mb-1">Description *</label><Textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} /></div>
              <div>
                <label className="block text-sm font-medium mb-1">Required Skills</label>
                <div className="flex flex-wrap gap-2 my-2">{newEvent.requiredSkills.map(skill => <Badge key={skill} variant="outline" className="cursor-pointer" onClick={() => removeEventSkill(skill)}>{skill} ✕</Badge>)}</div>
                <div className="flex space-x-2"><Input placeholder="Add a skill..." value={newEvent.newSkill} onChange={(e) => setNewEvent({ ...newEvent, newSkill: e.target.value })} onKeyDown={e => e.key === 'Enter' && addEventSkill()} /><Button variant="outline" onClick={addEventSkill}>Add</Button></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Max Team Size *</label>
                <style>{`
                  input[type=number]::-webkit-inner-spin-button,
                  input[type=number]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                  }
                  input[type=number] {
                    -moz-appearance: textfield;
                  }
                `}</style>
                <Input
                  type="number"
                  placeholder="e.g., 4"
                  value={newEvent.maxTeamSize}
                  onChange={(e) => {
                    // FIX 4: Allow free typing while focused - no auto-correction
                    const value = e.target.value;
                    setNewEvent({ ...newEvent, maxTeamSize: value });
                  }}
                  onBlur={(e) => {
                    // FIX 4: Validate only when user leaves the field (onBlur)
                    const value = e.target.value;
                    if (value && Number(value) >= 1) {
                      setTeamSizeError('');
                    } else if (value && Number(value) < 1) {
                      setTeamSizeError('Max Team Size must be at least 1');
                    }
                  }}
                  className={teamSizeError ? 'border-red-500' : ''}
                />
                {teamSizeError && <p className="text-red-500 text-sm mt-1">{teamSizeError}</p>}
              </div>

              {/* ✅ NEW: Max Teams Limit - Only show for team events (maxTeamSize > 1) */}
              {newEvent.maxTeamSize && Number(newEvent.maxTeamSize) > 1 && (
                <div><label className="block text-sm font-medium mb-1">Max Teams Limit (Optional)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 10 (leave empty for unlimited)"
                    value={newEvent.maxTeams}
                    onChange={(e) => {
                      // Allow free typing while focused - no validation
                      setNewEvent({ ...newEvent, maxTeams: e.target.value });
                    }}
                    onBlur={(e) => {
                      // Validate only when user leaves the field (onBlur)
                      const value = e.target.value;
                      if (value && Number(value) < 1) {
                        // Auto-correct invalid values
                        setNewEvent({ ...newEvent, maxTeams: '' });
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Maximum number of teams allowed for this event</p>
                </div>
              )}

              <div><label className="block text-sm font-medium mb-1">External Registration Link (Optional)</label><Input placeholder="https://example.com/register" value={newEvent.registrationLink} onChange={(e) => setNewEvent({ ...newEvent, registrationLink: e.target.value })} /></div>
              {/* ✅ NEW: Conditional Registration Deadline field - shows only when link exists */}
              {newEvent.registrationLink && newEvent.registrationLink.trim() && (
                <div>
                  <label className="block text-sm font-medium mb-1">Registration Deadline *</label>
                  <Input
                    type="datetime-local"
                    value={newEvent.linkEndDate}
                    onChange={(e) => setNewEvent({ ...newEvent, linkEndDate: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">⏰ Users must register by this date to participate</p>
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4"><Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button><Button onClick={handleCreateEventSubmit} disabled={isSubmitting || !!teamSizeError}>{isSubmitting ? 'Creating...' : '🚀 Create Event'}</Button></div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}