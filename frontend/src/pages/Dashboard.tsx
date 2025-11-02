import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Course, User, StandardCourse } from '../types';
import { DashboardHeader } from '../components/DashboardHeader';
import { CourseCard } from '../components/CourseCard';

export default function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [courseSuggestions, setCourseSuggestions] = useState<StandardCourse[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesData, userData] = await Promise.all([
        api.getCourses(),
        api.getMe(),
      ]);
      setCourses(coursesData);
      setUser(userData);
    } catch (err: any) {
      if (err.status === 401) {
        navigate('/login');
      } else {
        setError(err.message || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCourseNameChange = async (value: string) => {
    setNewCourseName(value);
    setSelectedCourseCode(undefined);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (value.trim().length < 2) {
      setCourseSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);

    // Debounce API call
    debounceTimer.current = setTimeout(async () => {
      try {
        const suggestions = await api.searchCourses(value, 10);
        setCourseSuggestions(suggestions);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Failed to fetch course suggestions:', err);
        setCourseSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
  };

  const handleSelectCourse = (course: StandardCourse) => {
    setNewCourseName(course.display);
    setSelectedCourseCode(course.code);
    setShowSuggestions(false);
    setCourseSuggestions([]);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      await api.createCourse(newCourseName, newCourseDescription, selectedCourseCode);
      setNewCourseName('');
      setNewCourseDescription('');
      setSelectedCourseCode(undefined);
      setShowCreateForm(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <DashboardHeader 
        userEmail={user?.email} 
        onCreateCourse={() => setShowCreateForm(!showCreateForm)}
      />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-4xl font-bold gradient-text mb-8">My Courses</h2>

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showCreateForm && (
          <div className="bg-dark-card border border-gray-700 rounded-xl p-6 mb-8">
            <h3 className="text-2xl font-semibold text-white mb-6">Create New Course</h3>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="relative">
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Course Name
                  {selectedCourseCode && (
                    <span className="ml-2 text-xs text-cyan-400">
                      ✓ Standard course selected: {selectedCourseCode}
                    </span>
                  )}
                </label>
                <input
                  id="name"
                  type="text"
                  value={newCourseName}
                  onChange={(e) => handleCourseNameChange(e.target.value)}
                  onFocus={() => courseSuggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  required
                  autoFocus
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Start typing: CSCI, GCIS, Machine Learning..."
                />

                {/* Autocomplete Dropdown */}
                {showSuggestions && courseSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {loadingSuggestions && (
                      <div className="px-4 py-2 text-gray-400 text-sm">Loading...</div>
                    )}
                    {courseSuggestions.map((course) => (
                      <button
                        key={course.code}
                        type="button"
                        onClick={() => handleSelectCourse(course)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                      >
                        <div className="font-medium text-white">{course.code}</div>
                        <div className="text-sm text-gray-400">{course.name}</div>
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  💡 Type to search standard courses or enter your own custom name
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newCourseDescription}
                  onChange={(e) => setNewCourseDescription(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  placeholder="Enter course description"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="submit" 
                  disabled={creating}
                  className="gradient-bg text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-glow-mixed transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Course'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-800 text-gray-300 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-700 transition-all border border-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="bg-dark-card border border-gray-700 rounded-xl p-12 text-center">
            <h3 className="text-2xl font-semibold text-white mb-3">No Courses Yet</h3>
            <p className="text-gray-400 mb-6">Create your first course to get started</p>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="gradient-bg text-white px-6 py-3 rounded-lg font-medium hover:shadow-glow-mixed transition-all"
            >
              Create Your First Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                title={course.name}
                description={course.description || 'No description'}
                dateCreated={new Date(course.created_at).toLocaleDateString()}
                onClick={() => navigate(`/course/${course.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
