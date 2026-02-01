import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from './ui/card.jsx';
import { Badge } from './ui/badge.jsx';
import CampusOverview from './campus/CampusOverview.jsx';
import CampusFeed from './campus/CampusFeed.jsx';
import BuddyBeacon from './campus/BuddyBeacon.jsx';
import CollabPodsPage from './campus/CollabPodsPage.jsx';
import CollabPodPage from './campus/CollabPodPage.jsx';
import LoadingSpinner from './animations/LoadingSpinner.jsx';
import { useTheme } from '../lib/theme.js';

export default function CampusHub({
  user,
  initialView = 'overview',
  activeFilter = null,
  eventId = null,
  onCreateCollabPod,
  onEnterCollabPod
}) {
  const { theme } = useTheme();
  const { podId: urlPodId } = useParams();
  const [activeView, setActiveView] = useState(initialView);
  const [selectedPodId, setSelectedPodId] = useState(null);
  const [campusFeedFilter, setCampusFeedFilter] = useState(activeFilter || 'ASK_HELP');
  const campusFeedRef = useRef(null); // Ref to trigger feed refresh from pod deletion

  // ✅ FIX FOR RACE CONDITION: Check if user profile data is fully loaded
  // If user exists but collegeName is missing, show loading spinner
  if (user && !user.collegeName) {
    console.warn('⏳ User profile incomplete - waiting for collegeName to be populated');
    return <LoadingSpinner />;
  }

  // Update view when initialView prop changes
  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  // Update feed filter when activeFilter prop changes
  useEffect(() => {
    if (activeFilter) {
      setCampusFeedFilter(activeFilter);
    }
  }, [activeFilter]);

  // ✅ Handle URL-based pod selection (e.g., /campus/collab-pods/:podId)
  useEffect(() => {
    if (urlPodId) {
      setActiveView('pods');
      setSelectedPodId(urlPodId);
    }
  }, [urlPodId]);

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '🏛️',
      description: 'Campus stats and activity'
    },
    {
      id: 'feed',
      label: 'Campus Feed',
      icon: '💬',
      description: 'Ask, help, polls & collaboration'
    },
    {
      id: 'beacon',
      label: 'Buddy Beacon',
      icon: '🔍',
      description: 'Find teammates and collaborators'
    },
    {
      id: 'pods',
      label: 'Collab Pods',
      icon: '🚀',
      description: 'Active collaboration spaces'
    }
  ];

  const getNavItemStyles = (itemId) => {
    const isActive = activeView === itemId;

    if (theme === 'windows1992') {
      return `
        group relative flex items-center space-x-3 px-6 py-4 rounded-none border-2 transition-all duration-500 cursor-pointer overflow-hidden
        ${isActive
          ? 'bg-primary text-primary-foreground border-inset shadow-inset scale-105'
          : 'text-muted-foreground hover:text-foreground glass hover:border-primary border-outset hover:bg-muted button-win95'
        }
        press-effect
      `;
    }

    // Modern theme - enhanced active state with color tint, increased opacity, and glow
    return `
      group relative flex items-center space-x-3 px-6 py-4 rounded-lg transition-all duration-500 cursor-pointer overflow-hidden backdrop-blur-xl border
      ${isActive
        ? theme === 'cyber'
          ? 'bg-cyan-400/25 text-cyan-200 border-cyan-400/50 shadow-lg shadow-cyan-400/30 scale-105'
          : 'bg-primary/25 text-primary-solid border-primary/50 shadow-lg shadow-primary/30 scale-105'
        : theme === 'cyber'
          ? 'text-muted-foreground/70 border-white/10 hover:bg-white/5 hover:border-white/20 hover:shadow-sm'
          : 'text-muted-foreground/70 border-white/10 hover:bg-white/5 hover:border-white/20 hover:shadow-sm'
      }
      press-effect
    `;
  };

  return (
    <div className="space-y-8 py-6">

      {/* Navigation */}
      <div className="flex flex-wrap gap-4 justify-center px-2">
        {navItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={getNavItemStyles(item.id)}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Button background shimmer (not in windows1992) */}
            {theme !== 'windows1992' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            )}

            <span className={`text-2xl transition-all duration-500 ${theme === 'windows1992' ? 'text-sm' : 'group-hover:scale-110'} relative z-10`}>
              {theme === 'windows1992' ?
                ({ overview: '📋', feed: '💬', beacon: '🔍', pods: '🚀' }[item.id] || item.icon) :
                item.icon
              }
            </span>
            <div className="flex-1 text-left relative z-10">
              <div className={`font-semibold tracking-wide ${theme === 'windows1992' ? 'text-xs font-bold' : 'text-sm'}`}>
                {theme === 'windows1992' ? item.label.toUpperCase() : item.label}
              </div>
              <div className={`text-xs opacity-60 transition-opacity ${theme === 'windows1992' ? 'text-xs' : ''}`}>
                {theme === 'windows1992' ? item.description.toUpperCase() : item.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="animate-in slide-up">
        {activeView === 'overview' && <CampusOverview user={user} />}
        {activeView === 'feed' && <CampusFeed user={user} ref={campusFeedRef} initialFilter={campusFeedFilter} />}
        {/* Pass the eventId down to the BuddyBeacon component */}
        {activeView === 'beacon' && <BuddyBeacon user={user} eventId={eventId} />}
        {activeView === 'pods' && !selectedPodId && (
          <CollabPodsPage
            user={user}
            onCreateCollabPod={onCreateCollabPod}
            onEnterCollabPod={(podId) => {
              setSelectedPodId(podId);
              if (onEnterCollabPod) onEnterCollabPod(podId);
            }}
            onRefreshPosts={() => {
              // Trigger refresh in CampusFeed when a pod is deleted
              if (campusFeedRef.current?.triggerRefresh) {
                campusFeedRef.current.triggerRefresh();
              }
            }}
          />
        )}
        {selectedPodId && (
          <CollabPodPage user={user} podId={selectedPodId} onBack={() => setSelectedPodId(null)} />
        )}
      </div>
    </div>
  );
}