import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { ThemeContext, VALID_THEMES, THEME_STORAGE_KEY } from '@/lib/theme.js';

// --- Main Components ---
import EventsHub from '@/components/EventsHub.jsx';
import CampusHub from '@/components/CampusHub.jsx';
import InterHub from '@/components/InterHub.jsx';
import BadgeCenter from '@/components/BadgeCenter.jsx';
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

  const handleNavigateToBeacon = (eventId) => {
    setViewContext({ eventId: eventId });
    setCurrentView('buddybeacon');
  };

  return (
    <>
      <Navigation user={user} setUser={setUser} currentView={currentView} onViewChange={setCurrentView} />
      <main className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {currentView === 'campus' && <CampusHub user={user} eventId={viewContext?.eventId} initialView={viewContext?.initialView || 'overview'} />}
          {currentView === 'events' && <EventsHub user={user} onNavigateToBeacon={handleNavigateToBeacon} />}
          {currentView === 'inter' && <InterHub user={user} />}
          {currentView === 'badges' && <BadgeCenter user={user} />}
          {currentView === 'profile' && <ProfilePage user={user} />}
          {currentView === 'buddybeacon' && <BuddyBeacon eventId={viewContext?.eventId} />}
        </div>
      </main>
    </>
  );
};

// --- 3. Protected Route Wrapper ---
const ProtectedRoute = ({ user, loading, isProfileComplete, children, loginProps }) => {
  if (loading) return <LoadingSpinner />;

  if (user && isProfileComplete) {
    return children;
  }

  return <LoginFlow {...loginProps} />;
};

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [authLoading, setAuthLoading] = useState(true);
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

  const handleLoginComplete = (finalUserData) => {
    setUser(finalUserData);
    saveUser(finalUserData);
  };

  // ✅ FIXED: Session Restoration with Bearer Token
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');

        // If no token, don't bother hitting the server, just stop loading
        if (!token) {
          setAuthLoading(false);
          return;
        }

        const res = await fetch('http://localhost:8080/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`, // <--- CRITICAL FIX HERE
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const serverUser = await res.json();
          console.log('[App.jsx] User fetched from /api/auth/me:', serverUser);
          setUser(serverUser);
          saveUser(serverUser);
        } else {
          // Token invalid or expired
          const stored = loadUser();
          if (stored) setUser(stored);
        }
      } catch {
        // ignore
        const stored = loadUser();
        if (stored) setUser(stored);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const isProfileComplete = !!user;

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
              authLoading ? <LoadingSpinner /> : (user && isProfileComplete ? <Navigate to="/campus" /> : <Navigate to="/login" />)
            } />

            <Route path="/login" element={
              authLoading ? <LoadingSpinner /> : (!user ? <LoginFlow {...loginProps} /> : <Navigate to="/campus" />)
            } />

            <Route path="/logout" element={<Logout />} />

            <Route path="/profile-setup" element={<ProfileSetupHandler setAppUser={setUser} setInitialLoginFlowState={setInitialLoginFlowState} />} />
            <Route path="/login-failed" element={<div><h1>Login Failed</h1><p>Please try again.</p></div>} />

            <Route path="/campus" element={
              <ProtectedRoute user={user} loading={authLoading} isProfileComplete={isProfileComplete} loginProps={loginProps}>
                <AuthenticatedApp user={user} setUser={setUser} />
              </ProtectedRoute>
            } />

            <Route path="/campus/collab-pods/:podId" element={
              <ProtectedRoute user={user} loading={authLoading} isProfileComplete={isProfileComplete} loginProps={loginProps}>
                <AuthenticatedApp user={user} setUser={setUser} />
              </ProtectedRoute>
            } />

            <Route path="/post/:postId/comments" element={
              <ProtectedRoute user={user} loading={authLoading} isProfileComplete={isProfileComplete} loginProps={loginProps}>
                <>
                  <Navigation user={user} setUser={setUser} currentView={'campus'} onViewChange={() => { }} />
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