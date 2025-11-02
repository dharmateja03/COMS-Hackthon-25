import React from 'react';
import { MicIcon } from 'lucide-react';
interface ChatBoxProps {
  onMicClick: () => void;
}
export function ChatBox({
  onMicClick
}: ChatBoxProps) {
  return <div className="w-full h-full bg-[#1e293b] flex flex-col">
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
            Hi! I am here to help you understand this material. Ask me anything!
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
          <button onClick={onMicClick} className="p-2 bg-gradient-to-r from-[#06b6d4] to-[#ec4899] rounded-lg hover:opacity-90 transition-opacity">
            <MicIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>;
}
export default ChatBox;
