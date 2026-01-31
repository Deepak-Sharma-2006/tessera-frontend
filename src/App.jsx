import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ThemeContext, VALID_THEMES, THEME_STORAGE_KEY } from '@/lib/theme.js';

// --- Main Components ---
import EventsHub from '@/components/EventsHub.jsx';
import CampusHub from '@/components/CampusHub.jsx';
import InterHub from '@/components/InterHub.jsx';
import BadgeCenter from '@/components/BadgeCenter.jsx';
import InboxPage from '@/components/InboxPage.jsx';
import ProfilePage from '@/components/ProfilePage.jsx';
import Navigation from '@/components/Navigation.jsx';
import LoginFlow from '@/components/LoginFlow.jsx';
import BuddyBeacon from '@/components/campus/BuddyBeacon.jsx';
import PostCommentsPage from '@/components/campus/PostCommentsPage.jsx';
import Logout from '@/pages/Logout.jsx';

// --- Other Components ---
import LoadingSpinner from '@/components/animations/LoadingSpinner.jsx';
import { saveUser, loadUser } from '@/lib/session.js';
import ThemeBackground from '@/components/backgrounds/ThemeBackground.jsx';
import XPDisplay from '@/components/ui/XPDisplay.jsx';
import PodView from '@/components/PodView.jsx';

// --- 1. MOVED OUTSIDE: Profile Setup Handler ---
const ProfileSetupHandler = ({ setAppUser, setInitialLoginFlowState }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const userId = searchParams.get('userId');
    // We need the token here too for authenticated requests
    const token = localStorage.getItem('token');

    if (userId) {
      fetch(`http://localhost:8080/api/users/${userId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
        .then(res => {
          if (!res.ok) throw new Error("Could not fetch user profile after login.");
          return res.json();
        })
        .then(user => {
          setAppUser(user);
          setInitialLoginFlowState({ step: 'step1', data: user });
          navigate('/');
        })
        .catch(err => {
          console.error("Error fetching user:", err);
          setError(err.message);
          navigate('/login-failed');
        });
    }
  }, [searchParams, setAppUser, setInitialLoginFlowState, navigate]);

  if (error) return <div>Error: {error}</div>;
  return <LoadingSpinner />;
};

// --- 2. MOVED OUTSIDE: Authenticated App Logic ---
const AuthenticatedApp = ({ user, setUser }) => {
  const [currentView, setCurrentView] = useState('campus');
  const [viewContext, setViewContext] = useState(null);
  const location = useLocation();
  const isFirstMount = useRef(true);

  // Set initial view from navigation state (only from comment pages or pod views)
  // Fresh page loads should always go to overview
  useEffect(() => {
    // Check if this is a navigation with state from our app (not a refresh)
    const hasIntentionalState = location.state?.from === 'comment' || location.state?.from === 'pod';

    if (isFirstMount.current) {
      // First mount after page load - always go to campus overview unless explicitly navigated
      isFirstMount.current = false;
      if (!hasIntentionalState) {
        setCurrentView('campus');
        setViewContext(null);
      } else {
        setCurrentView(location.state.view);
        if (location.state?.viewContext) {
          setViewContext(location.state.viewContext);
        }
      }
    } else {
      // Subsequent navigations - use the state if available
      if (hasIntentionalState) {
        setCurrentView(location.state.view);
        if (location.state?.viewContext) {
          setViewContext(location.state.viewContext);
        }
      }
    }
  }, [location]);

  const handleViewChange = (newView) => {
    setCurrentView(newView);
    // When changing views via tab click, reset context to show default view
    if (newView === 'inter') {
      setViewContext({ initialView: 'feed' });
    } else if (newView === 'campus') {
      setViewContext(null);
    }
  }

  const handleNavigateToBeacon = (eventId) => {
    // ✅ FIX: Navigate to campus view with beacon sub-view (maintains layout)
    setCurrentView('campus');
    setViewContext({ initialView: 'beacon', eventId: eventId });
  };

  return (
    <>
      <Navigation user={user} setUser={setUser} currentView={currentView} onViewChange={handleViewChange} />
      <XPDisplay user={user} />
      <main className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {currentView === 'campus' && <CampusHub user={user} eventId={viewContext?.eventId} initialView={viewContext?.initialView || 'overview'} activeFilter={viewContext?.activeFilter} />}
          {currentView === 'events' && <EventsHub user={user} onNavigateToBeacon={handleNavigateToBeacon} />}
          {currentView === 'inter' && <InterHub user={user} initialView={viewContext?.initialView || 'feed'} />}
          {currentView === 'inbox' && <InboxPage user={user} />}
          {currentView === 'badges' && <BadgeCenter user={user} />}
          {currentView === 'profile' && <ProfilePage user={user} />}
          {currentView === 'buddybeacon' && <BuddyBeacon eventId={viewContext?.eventId} />}
        </div>
      </main>
    </>
  );
};

// --- 3. Protected Route Wrapper ---
const ProtectedRoute = ({ user, isVerifying, isProfileComplete, children, loginProps }) => {
  // CRITICAL: While verifying the token with the backend, show loading spinner
  // This prevents rendering protected content with an invalid token
  if (isVerifying) {
    return <LoadingSpinner />;
  }

  // Once verified, check if user is authenticated and profile is complete
  if (user && isProfileComplete) {
    return children;
  }

  // Not authenticated - redirect to login
  return <LoginFlow {...loginProps} />;
};

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true); // CRITICAL: Start in verifying state
  const [theme, setThemeState] = useState('light');
  const [initialLoginFlowState, setInitialLoginFlowState] = useState({ step: 'login', data: null });

  // Load theme
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme && VALID_THEMES.includes(savedTheme)) setThemeState(savedTheme);
  }, []);

  // Update theme
  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleLoginComplete = async (finalUserData) => {
    try {
      // ✅ CRITICAL: Fetch complete user data from backend to ensure all profile fields are present
      const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
      if (token) {
        const res = await fetch('http://localhost:8080/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          const completeUserData = await res.json();
          console.log("✅ Complete user data fetched:", completeUserData);
          setUser(completeUserData);
          saveUser(completeUserData);
          return;
        }
      }
      
      // Fallback: use provided data if API call fails
      setUser(finalUserData);
      saveUser(finalUserData);
    } catch (err) {
      console.error("Error fetching complete user data:", err);
      // Fallback: use provided data
      setUser(finalUserData);
      saveUser(finalUserData);
    }
  };

  // ✅ CRITICAL FIX: Session Verification on App Mount
  // This endpoint validates the token with the backend BEFORE rendering protected routes
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');

        // If no token, skip backend verification and go straight to login
        if (!token) {
          setUser(null);
          setIsVerifying(false);
          return;
        }

        // Attempt to verify the token with the backend
        const res = await fetch('http://localhost:8080/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          // ✅ Token is valid
          const serverUser = await res.json();
          setUser(serverUser);
          saveUser(serverUser);
          console.log('✅ Session verified - Token is valid');
        } else if (res.status === 401 || res.status === 403) {
          // ❌ Token is invalid or expired (401/403)
          console.warn('❌ Session verification failed - Invalid or expired token');
          localStorage.removeItem('token');
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user');
          localStorage.removeItem('studcollab_user');
          setUser(null);
        } else {
          // Other error - try to use cached user
          console.warn(`Session verification failed with status ${res.status}`);
          const stored = loadUser();
          setUser(stored || null);
        }
      } catch (err) {
        console.error('Session verification error:', err);
        // Network error or parsing error - fall back to cached user
        const stored = loadUser();
        setUser(stored || null);
      } finally {
        // Done verifying - now safe to render protected routes
        setIsVerifying(false);
      }
    })();
  }, []);

  const isProfileComplete = user && user.profileCompleted === true;

  const loginProps = {
    onComplete: handleLoginComplete,
    initialFlowState: initialLoginFlowState,
    user: user
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      <div className={`${theme}`}>
        <ThemeBackground theme={theme} />
        <Router>
          <Routes>
            <Route path="/" element={
              isVerifying ? <LoadingSpinner /> : (user && isProfileComplete ? <Navigate to="/campus" /> : <Navigate to="/login" />)
            } />

            <Route path="/login" element={
              isVerifying ? <LoadingSpinner /> : (!user ? <LoginFlow {...loginProps} /> : <Navigate to="/campus" />)
            } />

            <Route path="/logout" element={<Logout />} />

            <Route path="/profile-setup" element={<ProfileSetupHandler setAppUser={setUser} setInitialLoginFlowState={setInitialLoginFlowState} />} />
            <Route path="/login-failed" element={<div><h1>Login Failed</h1><p>Please try again.</p></div>} />

            {/* Pod Chat - Accessible from both Campus and Global hubs */}
            <Route path="/pod/:podId" element={
              <ProtectedRoute user={user} isVerifying={isVerifying} isProfileComplete={isProfileComplete} loginProps={loginProps}>
                <PodView user={user} setUser={setUser} />
              </ProtectedRoute>
            } />

            <Route path="/campus" element={
              <ProtectedRoute user={user} isVerifying={isVerifying} isProfileComplete={isProfileComplete} loginProps={loginProps}>
                <AuthenticatedApp user={user} setUser={setUser} />
              </ProtectedRoute>
            } />

            <Route path="/campus/collab-pods/:podId" element={
              <ProtectedRoute user={user} isVerifying={isVerifying} isProfileComplete={isProfileComplete} loginProps={loginProps}>
                <AuthenticatedApp user={user} setUser={setUser} />
              </ProtectedRoute>
            } />

            <Route path="/post/:postId/comments" element={
              <ProtectedRoute user={user} isVerifying={isVerifying} isProfileComplete={isProfileComplete} loginProps={loginProps}>
                <>
                  <Navigation user={user} setUser={setUser} currentView={'campus'} onViewChange={() => { }} />
                  <XPDisplay user={user} />
                  <main className="pb-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <PostCommentsPage user={user} />
                    </div>
                  </main>
                </>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </div>
    </ThemeContext.Provider>
  );
}