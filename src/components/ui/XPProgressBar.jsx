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
    <div className="w-full backdrop-blur-xl bg-gradient-to-br from-cyan-950/30 via-deep-obsidian to-cyan-950/20 border border-cyan-400/40 rounded-3xl p-6 shadow-lg shadow-cyan-400/10 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Level Badge */}
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-400/40">
            <span className="text-2xl font-black italic text-deep-obsidian">L{user?.level || 0}</span>
          </div>
          
          {/* Status Text */}
          <div>
            <h2 className="text-white font-bold tracking-widest text-sm uppercase">Synergy Status</h2>
            <p className="text-cyan-300 text-[10px] font-bold">
              BONUS: {(user?.xpMultiplier || 1).toFixed(1)}x XP
            </p>
          </div>
        </div>

        {/* XP Counter */}
        <div className="text-right">
          <span className="text-xs text-muted-foreground/70 font-mono">TOTAL: {user?.totalXp || 0}</span>
          <div className="text-xl font-black text-cyan-300">
            {user?.xp || 0}
            <span className="text-muted-foreground/50">/100</span>
          </div>
        </div>
      </div>

      {/* The Immersive Progress Bar */}
      <div className="relative h-6 w-full bg-cyan-950/30 rounded-full border border-cyan-400/30 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-400 relative transition-all duration-300"
          style={{ width: `${progress}%` }}
        >
          {/* Animated Glow Tip */}
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/20 shadow-[0_0_20px_#00e4e4] animate-pulse" />
        </div>
      </div>

      {/* Level Labels */}
      <div className="flex justify-between text-[9px] text-muted-foreground/70 font-bold uppercase tracking-tighter">
        <span>The Initiate</span>
        <span className="text-cyan-400">{nextLevelXp} XP to next level</span>
        <span>Campus Legend</span>
      </div>
    </div>
  );
}
