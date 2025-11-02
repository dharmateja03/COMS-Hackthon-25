import { Link } from 'react-router-dom';
import { BookOpenIcon, MessageSquareIcon, TargetIcon } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              CortexIQ
            </div>

            {/* Auth Buttons */}
            <div className="flex gap-3">
              <Link to="/login">
                <button className="px-4 py-2 bg-[#1e293b] border border-gray-700 text-gray-300 rounded-lg hover:border-cyan-400 transition-colors">
                  Sign In
                </button>
              </Link>
              <Link to="/register">
                <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.5),0_0_20px_rgba(236,72,153,0.5)] transition-shadow">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Text Content */}
              <div className="text-center lg:text-left">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
                  Transform Your Learning
                </h1>
                <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0">
                  AI-powered study tools to help you master any subject. Upload
                  materials, chat with your notes, and test your knowledge.
                </p>
                <Link to="/register">
                  <button className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-pink-500 text-white text-lg font-semibold rounded-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.6),0_0_30px_rgba(236,72,153,0.6)] transition-shadow">
                    Get Started Free
                  </button>
                </Link>
              </div>

              {/* Right: Abstract Visual */}
              <div className="relative h-[400px] lg:h-[500px]">
                {/* Glowing graph visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Grid background */}
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Grid lines */}
                    {[...Array(8)].map((_, i) => (
                      <line key={`h-${i}`} x1="50" y1={50 + i * 50} x2="350" y2={50 + i * 50} stroke="#1e293b" strokeWidth="1" />
                    ))}
                    {[...Array(7)].map((_, i) => (
                      <line key={`v-${i}`} x1={50 + i * 50} y1="50" x2={50 + i * 50} y2="350" stroke="#1e293b" strokeWidth="1" />
                    ))}

                    {/* Glowing trajectory line */}
                    <path d="M 50 300 Q 100 280, 150 250 T 250 150 T 350 80" stroke="url(#lineGradient)" strokeWidth="3" fill="none" filter="url(#glow)" />

                    {/* Data points */}
                    <circle cx="50" cy="300" r="6" fill="#06b6d4" filter="url(#glow)" />
                    <circle cx="150" cy="250" r="6" fill="#06b6d4" filter="url(#glow)" />
                    <circle cx="250" cy="150" r="6" fill="#ec4899" filter="url(#glow)" />
                    <circle cx="350" cy="80" r="8" fill="#ec4899" filter="url(#glow)" />

                    {/* Floating particles */}
                    <circle cx="120" cy="200" r="2" fill="#06b6d4" opacity="0.6" />
                    <circle cx="280" cy="180" r="2" fill="#ec4899" opacity="0.6" />
                    <circle cx="200" cy="120" r="2" fill="#06b6d4" opacity="0.4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0a0a0f]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-white">How It Works</h2>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature Card 1 */}
              <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-8 hover:border-cyan-400 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-lg flex items-center justify-center mb-6">
                  <BookOpenIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Upload Your Materials</h3>
                <p className="text-gray-400">PDFs, lecture notes, any text file.</p>
              </div>

              {/* Feature Card 2 */}
              <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-8 hover:border-cyan-400 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-lg flex items-center justify-center mb-6">
                  <MessageSquareIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">AI-Powered Chat</h3>
                <p className="text-gray-400">Ask questions and get answers from your documents.</p>
              </div>

              {/* Feature Card 3 */}
              <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-8 hover:border-cyan-400 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-lg flex items-center justify-center mb-6">
                  <TargetIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Smart Quizzes</h3>
                <p className="text-gray-400">Test your knowledge and track your confidence.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
