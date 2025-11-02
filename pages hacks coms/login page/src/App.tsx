import React, { useState } from 'react';
import { ArrowLeftIcon, MailIcon, LockIcon, UserIcon } from 'lucide-react';
export function App() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  return <div className="w-full min-h-screen flex items-center justify-center" style={{
    backgroundColor: '#0a0a0f'
  }}>
      {/* Back to Home Button */}
      <button className="absolute top-6 left-6 p-2 rounded-lg bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition-colors">
        <ArrowLeftIcon className="w-5 h-5" />
      </button>
      {/* Main Card */}
      <div className="w-full max-w-md mx-4 p-8 rounded-2xl border shadow-2xl" style={{
      backgroundColor: '#1e293b',
      borderColor: '#374151',
      boxShadow: '0 0 40px rgba(6, 182, 212, 0.15), 0 0 80px rgba(236, 72, 153, 0.1)'
    }}>
        {/* Logo */}
        <h1 className="text-4xl font-bold text-center mb-8" style={{
        background: 'linear-gradient(to right, #06b6d4, #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
          Classroom AI
        </h1>
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          <button onClick={() => setActiveTab('signin')} className="flex-1 pb-3 text-lg font-medium transition-all relative">
            <span style={activeTab === 'signin' ? {
            background: 'linear-gradient(to right, #06b6d4, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          } : {
            color: '#9ca3af'
          }}>
              Sign In
            </span>
            {activeTab === 'signin' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{
            background: 'linear-gradient(to right, #06b6d4, #ec4899)'
          }} />}
          </button>
          <button onClick={() => setActiveTab('signup')} className="flex-1 pb-3 text-lg font-medium transition-all relative">
            <span style={activeTab === 'signup' ? {
            background: 'linear-gradient(to right, #06b6d4, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          } : {
            color: '#9ca3af'
          }}>
              Sign Up
            </span>
            {activeTab === 'signup' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{
            background: 'linear-gradient(to right, #06b6d4, #ec4899)'
          }} />}
          </button>
        </div>
        {/* Sign In Form */}
        {activeTab === 'signin' && <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" placeholder="Enter your email" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" placeholder="Enter your password" />
              </div>
            </div>
            <button className="w-full py-3 rounded-lg text-white font-semibold transition-all" style={{
          background: 'linear-gradient(to right, #06b6d4, #ec4899)',
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.3), 0 0 40px rgba(236, 72, 153, 0.2)'
        }} onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 0 30px rgba(6, 182, 212, 0.5), 0 0 60px rgba(236, 72, 153, 0.3)';
        }} onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.3), 0 0 40px rgba(236, 72, 153, 0.2)';
        }}>
              Sign In
            </button>
            <div className="text-center">
              <a href="#" className="text-sm" style={{
            color: '#06b6d4'
          }}>
                Forgot Password?
              </a>
            </div>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>
            <button className="w-full py-3 rounded-lg border border-gray-700 bg-gray-800 text-white font-medium hover:bg-gray-700 transition-all flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </div>}
        {/* Sign Up Form */}
        {activeTab === 'signup' && <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" placeholder="Enter your full name" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" placeholder="Enter your email" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" placeholder="Create a password" />
              </div>
            </div>
            <button className="w-full py-3 rounded-lg text-white font-semibold transition-all" style={{
          background: 'linear-gradient(to right, #06b6d4, #ec4899)',
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.3), 0 0 40px rgba(236, 72, 153, 0.2)'
        }} onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 0 30px rgba(6, 182, 212, 0.5), 0 0 60px rgba(236, 72, 153, 0.3)';
        }} onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.3), 0 0 40px rgba(236, 72, 153, 0.2)';
        }}>
              Create Account
            </button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>
            <button className="w-full py-3 rounded-lg border border-gray-700 bg-gray-800 text-white font-medium hover:bg-gray-700 transition-all flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </button>
          </div>}
      </div>
    </div>;
}