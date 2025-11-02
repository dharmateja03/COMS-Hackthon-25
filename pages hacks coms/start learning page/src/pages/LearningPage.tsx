import React, { useState } from 'react';
import { ArrowLeftIcon, MicIcon, XIcon, SendIcon } from 'lucide-react';
export function LearningPage() {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isUserTalking, setIsUserTalking] = useState(true);
  const handleMicClick = () => {
    if (!isVoiceMode) {
      setIsVoiceMode(true);
      setIsUserTalking(true);
    } else {
      setIsUserTalking(!isUserTalking);
    }
  };
  const handleExitVoiceMode = () => {
    setIsVoiceMode(false);
  };
  return <div className="w-full min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeftIcon className="w-5 h-5 text-gray-400" />
        </button>
        <h1 className="text-lg font-semibold">lecture-1.pdf</h1>
        <div className="w-9"></div>
      </header>
      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Column - PDF Viewer (80%) */}
        <div className="w-4/5 p-4">
          <div className="w-full h-full bg-[#1e293b] rounded-lg flex items-center justify-center border border-gray-700">
            <div className="text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-400">PDF Viewer</p>
            </div>
          </div>
        </div>
        {/* Right Column - AI Chat (20%) */}
        <div className="w-1/5 p-4 pl-0 relative">
          {!isVoiceMode /* State 1: Chat Box */ ? <div className="w-full h-full bg-[#1e293b] rounded-lg border border-gray-700 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-700">
                <h2 className="font-semibold bg-gradient-to-r from-[#06b6d4] to-[#ec4899] bg-clip-text text-transparent">
                  AI Assistant
                </h2>
              </div>
              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-sm text-gray-300">
                    Hi! I am here to help you understand this material. Ask me
                    anything!
                  </p>
                </div>
                <div className="bg-[#06b6d4]/20 rounded-lg p-3 ml-4">
                  <p className="text-sm text-gray-300">
                    Can you explain the main concept?
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-sm text-gray-300">
                    Of course! The main concept is...
                  </p>
                </div>
              </div>
              {/* Input Area */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <input type="text" placeholder="Ask a question..." className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/50 text-white placeholder-gray-500" />
                  <button onClick={handleMicClick} className="p-2 bg-gradient-to-r from-[#06b6d4] to-[#ec4899] rounded-lg hover:opacity-90 transition-opacity">
                    <MicIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div> /* State 2: Voice Mode */ : <div className="w-full h-full bg-[#1e293b] rounded-lg border border-gray-700 flex items-center justify-center relative">
              {/* Exit Button */}
              <button onClick={handleExitVoiceMode} className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg transition-colors z-10">
                <XIcon className="w-5 h-5 text-gray-400" />
              </button>
              {/* Animated Bubble */}
              <button onClick={handleMicClick} className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 animate-bounce ${isUserTalking ? 'bg-[#06b6d4]/30 shadow-[0_0_30px_rgba(6,182,212,0.5)]' : 'bg-[#ec4899]/30 shadow-[0_0_30px_rgba(236,72,153,0.5)]'}`}>
                <MicIcon className={`w-12 h-12 ${isUserTalking ? 'text-[#06b6d4]' : 'text-[#ec4899]'}`} />
              </button>
            </div>}
        </div>
      </div>
    </div>;
}