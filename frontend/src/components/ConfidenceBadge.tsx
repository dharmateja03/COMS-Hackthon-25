import React from 'react';

interface ConfidenceBadgeProps {
  level: 'low' | 'medium' | 'high';
}

export function ConfidenceBadge({
  level
}: ConfidenceBadgeProps) {
  const styles = {
    low: {
      text: 'text-red-400',
      glow: 'shadow-[0_0_12px_rgba(248,113,113,0.5)]'
    },
    medium: {
      text: 'text-orange-400',
      glow: 'shadow-[0_0_12px_rgba(251,146,60,0.5)]'
    },
    high: {
      text: 'text-teal-400',
      glow: 'shadow-[0_0_12px_rgba(20,184,166,0.5)]'
    }
  };
  const style = styles[level];
  return <span className={`px-3 py-1 rounded-full text-sm font-medium ${style.text} ${style.glow} bg-gray-900/50 border border-gray-800`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>;
}
