import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courseService } from '../services/course';
import type { Course } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await courseService.getCourses();
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await courseService.createCourse({
        name: newCourseName,
        description: newCourseDescription
      });
      setNewCourseName('');
      setNewCourseDescription('');
      setShowCreateModal(false);
      loadCourses();
    } catch (error) {
      console.error('Failed to create course:', error);
      alert('Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-bg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold gradient-text">Classroom AI</h1>
              <p className="text-sm text-gray-400">Welcome, {user?.email}</p>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-4xl font-bold gradient-text">My Courses</h2>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gradient-bg hover:shadow-glow-mixed transition-all duration-300"
          >
            + Create Course
          </Button>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <Card className="text-center py-12 bg-dark-card border-gray-700">
            <CardContent>
              <p className="text-gray-400 mb-4">No courses yet</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="gradient-bg hover:shadow-glow-mixed transition-all duration-300"
              >
                Create Your First Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="bg-dark-card border-gray-700 hover:border-cyan-400 hover:shadow-glow-mixed transition-all duration-300 cursor-pointer hover:-translate-y-1"
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-white hover:gradient-text transition-all duration-300">{course.name}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {course.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Created {new Date(course.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-dark-card border-gray-700">
            <CardHeader>
              <CardTitle className="gradient-text">Create New Course</CardTitle>
              <CardDescription className="text-gray-400">
                Add a new course to your dashboard
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateCourse}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="courseName" className="text-sm font-medium text-gray-300">
                    Course Name *
                  </label>
                  <Input
                    id="courseName"
                    placeholder="e.g., CS 101 - Intro to Programming"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    required
                    disabled={creating}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-cyan-400"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="courseDescription" className="text-sm font-medium text-gray-300">
                    Description (optional)
                  </label>
                  <Input
                    id="courseDescription"
                    placeholder="Brief description of the course"
                    value={newCourseDescription}
                    onChange={(e) => setNewCourseDescription(e.target.value)}
                    disabled={creating}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-cyan-400"
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-6 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="gradient-bg hover:shadow-glow-mixed transition-all duration-300"
                >
                  {creating ? 'Creating...' : 'Create Course'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
