import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../services/course';
import { uploadService } from '../services/upload';
import { Course, Upload } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

type TabType = 'uploads' | 'testing' | 'learner';

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('uploads');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      const [courseData, uploadsData] = await Promise.all([
        courseService.getCourse(courseId!),
        uploadService.getUploads(courseId!)
      ]);
      setCourse(courseData);
      setUploads(uploadsData);
    } catch (error) {
      console.error('Failed to load course:', error);
      alert('Failed to load course');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !courseId) return;

    setUploading(true);
    setUploadProgress('Uploading file...');

    try {
      await uploadService.uploadFile(courseId, file);
      setUploadProgress('Processing file... This may take a moment.');

      // Poll for upload completion
      setTimeout(async () => {
        await loadCourseData();
        setUploadProgress('');
        setUploading(false);
      }, 3000);

    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file');
      setUploading(false);
      setUploadProgress('');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      processing: 'bg-yellow-100 text-yellow-800',
      ready: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.processing;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                ← Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">{course?.name}</h1>
              <p className="text-sm text-gray-600">{course?.description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'uploads'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('uploads')}
            >
              Uploads
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'testing'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('testing')}
            >
              Testing
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'learner'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('learner')}
            >
              Learner
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'uploads' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Course Materials</h2>
              <div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.mp4,.avi,.mov,.mkv,.webm"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label htmlFor="file-upload">
                  <Button as="span" disabled={uploading}>
                    {uploading ? 'Uploading...' : '+ Upload File'}
                  </Button>
                </label>
              </div>
            </div>

            {uploadProgress && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-800">{uploadProgress}</p>
              </div>
            )}

            {uploads.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-gray-500 mb-4">No materials uploaded yet</p>
                  <label htmlFor="file-upload">
                    <Button as="span">
                      Upload Your First File
                    </Button>
                  </label>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploads.map((upload) => (
                  <Card key={upload.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{upload.file_name}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(upload.status)}`}>
                            {upload.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {upload.file_type.toUpperCase()}
                          </span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Uploaded {new Date(upload.created_at).toLocaleDateString()}
                      </p>
                      {upload.file_type === 'video' && upload.video_duration_seconds && (
                        <p className="text-sm text-gray-500 mt-1">
                          Duration: {Math.floor(upload.video_duration_seconds / 60)}m {upload.video_duration_seconds % 60}s
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'testing' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quiz & Testing</h2>
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-gray-500 mb-4">
                  Select uploads and generate quizzes to test your knowledge
                </p>
                <Button disabled>Coming Soon</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'learner' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Study Mode</h2>
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-gray-500 mb-4">
                  View materials and chat with AI tutor
                </p>
                <Button disabled>Coming Soon</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
