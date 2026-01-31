import React, { useEffect } from 'react';

export default function XPProgressBar({ user }) {
  useEffect(() => {
    console.log('🎨 [XPProgressBar] Component rendered/updated with user:', user)
    if (user) {
      console.log('   - Level:', user.level)
      console.log('   - XP:', user.xp)
      console.log('   - Total XP:', user.totalXp)
      console.log('   - Multiplier:', user.xpMultiplier)
    }
  }, [user])

  const progress = user?.xp ? (user.xp / 100) * 100 : 0;
  const nextLevelXp = 100 - (user?.xp || 0);

  return (
    <div className="w-full bg-gradient-to-br from-[#0a0a14] to-[#0f0f1e] border border-cyan-500/20 rounded-3xl p-6 shadow-2xl space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Level Badge */}
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-cyan-400 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <span className="text-2xl font-black italic text-white">L{user?.level || 0}</span>
          </div>
          
          {/* Status Text */}
          <div>
            <h2 className="text-white font-bold tracking-widest text-sm uppercase">Synergy Status</h2>
            <p className="text-cyan-400 text-[10px] font-bold">
              BONUS: {(user?.xpMultiplier || 1).toFixed(1)}x XP
            </p>
          </div>
        </div>

        {/* XP Counter */}
        <div className="text-right">
          <span className="text-xs text-gray-500 font-mono">TOTAL: {user?.totalXp || 0}</span>
          <div className="text-xl font-black text-white">
            {user?.xp || 0}
            <span className="text-gray-700">/100</span>
          </div>
        </div>
      </div>

      {/* The Immersive Progress Bar */}
      <div className="relative h-6 w-full bg-black/50 rounded-full border border-white/5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-700 via-cyan-500 to-indigo-500 relative transition-all duration-300"
          style={{ width: `${progress}%` }}
        >
          {/* Animated Glow Tip */}
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/20 shadow-[0_0_20px_#22d3ee] animate-pulse" />
        </div>
      </div>

      {/* Level Labels */}
      <div className="flex justify-between text-[9px] text-gray-600 font-bold uppercase tracking-tighter">
        <span>The Initiate</span>
        <span className="text-cyan-800">{nextLevelXp} XP to next level</span>
        <span>Campus Legend</span>
      </div>
    </div>
  );
}
