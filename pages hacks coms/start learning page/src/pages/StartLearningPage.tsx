import React, { useState } from 'react';
import { ArrowLeftIcon } from 'lucide-react';
import { PDFViewer } from '../components/PDFViewer';
import { ChatBox } from '../components/ChatBox';
import { VoiceBubble } from '../components/VoiceBubble';
export function StartLearningPage() {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isBubbleUserTalking, setIsBubbleUserTalking] = useState(true);
  const handleMicClick = () => {
    setIsVoiceMode(true);
    setIsBubbleUserTalking(true);
  };
  const handleBubbleClick = () => {
    setIsBubbleUserTalking(!isBubbleUserTalking);
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

      {/* Main Content - Two Column Layout */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Column - PDF Viewer (70%) */}
        <div className="w-[70%] border-r border-gray-700">
          <PDFViewer />
        </div>
        {/* Right Column - AI Chat (30%) */}
        <div className="w-[30%] relative">
          {!isVoiceMode ? <ChatBox onMicClick={handleMicClick} /> : <VoiceBubble isUserTalking={isBubbleUserTalking} onBubbleClick={handleBubbleClick} onExit={handleExitVoiceMode} />}
        </div>
      </div>
    </div>;
}