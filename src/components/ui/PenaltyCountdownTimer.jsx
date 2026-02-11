import React, { useState, useEffect } from 'react';

export default function PenaltyCountdownTimer({ targetDate, onExpired, centered = false }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const target = new Date(targetDate);
      const now = new Date();
      const difference = target - now;

      if (difference <= 0) {
        setIsExpired(true);
        if (onExpired) onExpired();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${hours}h ${minutes}m`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpired]);

  if (isExpired) {
    return null;
  }

  if (centered) {
    return (
      <div className="text-red-400 text-sm font-bold font-mono">
        {timeLeft}
      </div>
    );
  }

  return (
    <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-red-600 to-red-700 text-yellow-300 text-xs font-bold rounded-full border-2 border-yellow-400/70 shadow-lg shadow-red-600/60 backdrop-blur-xl animate-pulse">
      {timeLeft}
    </div>
  );
}
