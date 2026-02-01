import { useState, useEffect } from 'react';
import api from '@/lib/api.js';
import DiscoveryMesh from '../ui/DiscoveryMesh.jsx';
import LoadingSpinner from '@/components/animations/LoadingSpinner.jsx';

/**
 * Discovery Page Component
 * Wrapper for the Global Discovery Mesh
 * 
 * The new DiscoveryMesh component handles API calls and data fetching directly.
 * This component serves as the page container.
 */
export default function Discovery({ user }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Page is ready when user data is loaded
    if (user?.id) {
      setLoading(false);
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 animate-in fade-in duration-1000">
      <DiscoveryMesh user={user} />
    </div>
  );
}
