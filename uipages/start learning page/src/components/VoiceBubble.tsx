import React from 'react';
import { PauseIcon, XIcon } from 'lucide-react';
interface VoiceBubbleProps {
  isUserTalking: boolean;
  onBubbleClick: () => void;
  onExit: () => void;
}
export function VoiceBubble({
  isUserTalking,
  onBubbleClick,
  onExit
}: VoiceBubbleProps) {
  return <div className="h-full bg-[#1e293b] relative flex items-center justify-center">
      {/* Exit Button */}
      <button onClick={onExit} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors z-10">
        <XIcon className="w-5 h-5" />
      </button>
      {/* Animated Bubble with Ripples */}
      <div className="relative">
        {/* Ripple Effects */}
        <div className={`absolute inset-0 rounded-full animate-ping ${isUserTalking ? 'bg-[#06b6d4]/20' : 'bg-[#ec4899]/20'}`} style={{
        animationDuration: '2s'
      }} />
        <div className={`absolute inset-0 rounded-full animate-ping ${isUserTalking ? 'bg-[#06b6d4]/10' : 'bg-[#ec4899]/10'}`} style={{
        animationDuration: '3s',
        animationDelay: '0.5s'
      }} />
        {/* Main Bubble */}
        <button onClick={onBubbleClick} className={`relative w-32 h-32 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 animate-bounce ${isUserTalking ? 'bg-[#06b6d4]/30 shadow-[0_0_40px_rgba(6,182,212,0.5)]' : 'bg-[#ec4899]/30 shadow-[0_0_40px_rgba(236,72,153,0.5)]'}`} style={{
        animationDuration: '2s'
      }}>
          <PauseIcon className={`w-12 h-12 ${isUserTalking ? 'text-[#06b6d4]' : 'text-[#ec4899]'}`} />
        </button>
      </div>
      {/* Status Text */}
      <div className="absolute bottom-8 text-center">
        <p className="text-sm text-gray-400">
          {isUserTalking ? 'Listening...' : 'AI Speaking...'}
        </p>
      </div>
    </div>;
}
export default VoiceBubble;