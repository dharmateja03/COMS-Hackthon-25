import { PlusIcon, LogOutIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
  userEmail?: string;
  onCreateCourse: () => void;
}

export function DashboardHeader({ userEmail, onCreateCourse }: DashboardHeaderProps) {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="bg-dark-bg border-b border-gray-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white">Classroom AI</h1>
          <p className="text-sm text-gray-400">Welcome, {userEmail || 'user@email.com'}</p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onCreateCourse}
            className="gradient-bg text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:shadow-glow-mixed transition-all duration-300 hover:scale-105"
          >
            <PlusIcon className="w-5 h-5" />
            Create Course
          </button>
          <button 
            onClick={handleSignOut}
            className="bg-dark-card text-gray-300 px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-700 transition-all duration-300 border border-gray-700 hover:border-gray-600"
          >
            <LogOutIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
