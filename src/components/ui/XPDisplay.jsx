import { useState } from 'react';
import api from '@/lib/api.js';

export default function XPDisplay({ user, onUserUpdate }) {
  const [devClicks, setDevClicks] = useState(0);

  const handleDevSecret = async () => {
    setDevClicks(prev => prev + 1);
    if (devClicks + 1 >= 5) {
      try {
        // Activate dev mode for this user
        const response = await api.post(`/api/users/${user?.id || user?._id}/activate-dev`);
        
        // Update user state in parent component
        if (onUserUpdate && response.data?.user) {
          onUserUpdate(response.data.user);
        }
        
        alert("Founding Dev Badge Unlocked. Welcome, Architect. Create Event button now visible in Events Hub!");
        setDevClicks(0);
      } catch (error) {
        console.error("Failed to activate dev mode:", error);
        alert("Error activating dev mode. Try again.");
      }
    }
  };

  return (
    <div className="fixed top-6 right-6 z-30" onClick={handleDevSecret} style={{ cursor: 'pointer', userSelect: 'none' }}>
      <div className="glass rounded-xl px-4 py-2 shadow-glass hover:shadow-glass-lg transition-all duration-300 hover-lift windows1992:rounded-none windows1992:border-2 windows1992:border-outset">
        <div className="flex items-center space-x-3">
          <div className="text-center">
            <div className="text-xs text-muted-foreground windows1992:text-primary">LVL</div>
            <div className="text-lg font-bold gradient-text windows1992:text-primary windows1992:text-sm">{user?.level || 12}</div>
          </div>
          <div className="w-px h-8 bg-border windows1992:bg-primary"></div>
          <div className="text-center min-w-0">
            <div className="text-xs text-muted-foreground windows1992:text-primary">XP</div>
            <div className="text-sm font-medium text-foreground windows1992:text-xs">
              {user?.xp || 2847}/{user?.totalXP || 3000}
            </div>
            {/* XP Progress bar */}
            <div className="w-16 h-1 bg-muted rounded-full mt-1 overflow-hidden windows1992:rounded-none windows1992:border windows1992:border-inset">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-700 windows1992:bg-primary windows1992:rounded-none"
                style={{ width: `${((user?.xp || 2847) / (user?.totalXP || 3000)) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}