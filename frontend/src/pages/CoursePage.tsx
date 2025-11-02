import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../services/course';
import { uploadService } from '../services/upload';
import { quizService } from '../services/quiz';
import { aiService } from '../services/ai';
import { analyticsService, type CourseAnalytics } from '../services/analytics';
import type { Course, Upload, Quiz } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

type TabType = 'uploads' | 'testing' | 'learner' | 'analytics';

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('uploads');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Quiz state
  const [selectedUploadIds, setSelectedUploadIds] = useState<string[]>([]);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizConfidence, setQuizConfidence] = useState<Record<string, number>>({}); // 1-5 confidence level
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [quizStarted, setQuizStarted] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  // Learner tab state
  const [selectedMaterial, setSelectedMaterial] = useState<Upload | null>(null);
  const [materialFileUrl, setMaterialFileUrl] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Voice chat state
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  // Quiz timer
  useEffect(() => {
    if (quizStarted && timeRemaining > 0 && !quizResults) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitQuiz(); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizStarted, timeRemaining, quizResults]);

  // Load file URL when material is selected
  useEffect(() => {
    const loadFileUrl = async () => {
      if (selectedMaterial && courseId) {
        try {
          const url = await uploadService.getFileUrl(courseId, selectedMaterial.id);
          setMaterialFileUrl(url);
        } catch (error) {
          console.error('Failed to load file:', error);
        }
      } else {
        setMaterialFileUrl('');
      }
    };
    loadFileUrl();

    // Cleanup: revoke the blob URL when component unmounts or material changes
    return () => {
      if (materialFileUrl) {
        URL.revokeObjectURL(materialFileUrl);
      }
    };
  }, [selectedMaterial, courseId]);

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

  const handleUploadSelection = (uploadId: string, checked: boolean) => {
    if (checked) {
      setSelectedUploadIds([...selectedUploadIds, uploadId]);
    } else {
      setSelectedUploadIds(selectedUploadIds.filter(id => id !== uploadId));
    }
  };

  const handleGenerateQuiz = async () => {
    if (selectedUploadIds.length === 0 || !courseId) {
      alert('Please select at least one upload');
      return;
    }

    setGeneratingQuiz(true);
    try {
      const quiz = await quizService.generateQuiz(courseId, selectedUploadIds);
      setGeneratedQuiz(quiz);
      setQuizAnswers({});
      setQuizResults(null);
      setTimeRemaining(600);
      setQuizStarted(false);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      alert('Failed to generate quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: answerIndex
    });
  };

  const handleSubmitQuiz = async () => {
    if (!generatedQuiz) return;

    setSubmittingQuiz(true);
    try {
      const results = await quizService.submitQuiz(generatedQuiz.id, quizAnswers);
      setQuizResults(results);
      setQuizStarted(false);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      alert('Failed to submit quiz');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-select first ready material when entering learner tab
  useEffect(() => {
    if (activeTab === 'learner' && uploads.length > 0 && !selectedMaterial) {
      const firstReady = uploads.find(u => u.status === 'ready');
      if (firstReady) {
        setSelectedMaterial(firstReady);
      }
    }
  }, [activeTab, uploads, selectedMaterial]);

  // Load analytics when analytics tab is selected
  useEffect(() => {
    if (activeTab === 'analytics' && courseId) {
      loadAnalytics();
    }
  }, [activeTab, courseId]);

  const loadAnalytics = async () => {
    if (!courseId) return;

    setLoadingAnalytics(true);
    try {
      const data = await analyticsService.getCourseAnalytics(courseId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !courseId) return;

    const userMessage = chatInput.trim();
    setChatInput('');

    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    setSendingMessage(true);
    try {
      if (voiceModeEnabled) {
        // Use voice chat endpoint
        const response = await aiService.voiceChat({
          message: userMessage,
          course_id: courseId,
          upload_id: selectedMaterial?.id,
          emotion: 'encouraging'
        });

        // Add text response to chat
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: response.responseText
        }]);

        // Play audio response
        const audioUrl = URL.createObjectURL(response.audioBlob);
        const audio = new Audio(audioUrl);
        setAudioElement(audio);
        setIsPlayingAudio(true);

        audio.onended = () => {
          setIsPlayingAudio(false);
          URL.revokeObjectURL(audioUrl);
        };

        audio.play().catch(err => {
          console.error('Error playing audio:', err);
          setIsPlayingAudio(false);
        });
      } else {
        // Use text chat endpoint
        const response = await aiService.chat({
          message: userMessage,
          course_id: courseId,
          upload_id: selectedMaterial?.id
        });

        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: response.response
        }]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setSendingMessage(false);
    }
  };

  const startVoiceRecording = () => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      recognitionRef.current = null;
      alert('Voice recognition error. Please try again.');
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsRecording(false);
    }
  };

  const stopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlayingAudio(false);
    }
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
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('analytics')}
            >
              📊 Analytics
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
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 ${
                    uploading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}>
                    {uploading ? 'Uploading...' : '+ Upload File'}
                  </span>
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
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      Upload Your First File
                    </span>
                  </label>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploads.map((upload) => (
                  <Card key={upload.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{upload.file_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(upload.status)}`}>
                          {upload.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {upload.file_type.toUpperCase()}
                        </span>
                      </div>
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

            {!generatedQuiz ? (
              <div className="space-y-6">
                {/* Upload Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Materials for Quiz</CardTitle>
                    <CardDescription>
                      Choose the uploaded materials you want to be quizzed on (25 questions, 10 minutes)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {uploads.filter(u => u.status === 'ready').length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No ready materials. Please upload and process some materials first.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {uploads.filter(u => u.status === 'ready').map((upload) => (
                          <div key={upload.id} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-gray-50">
                            <input
                              type="checkbox"
                              id={`upload-${upload.id}`}
                              checked={selectedUploadIds.includes(upload.id)}
                              onChange={(e) => handleUploadSelection(upload.id, e.target.checked)}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor={`upload-${upload.id}`} className="flex-1 cursor-pointer">
                              <p className="font-medium text-gray-900">{upload.file_name}</p>
                              <p className="text-sm text-gray-500">
                                {upload.file_type.toUpperCase()} • {new Date(upload.created_at).toLocaleDateString()}
                              </p>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Generate Quiz Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleGenerateQuiz}
                    disabled={selectedUploadIds.length === 0 || generatingQuiz}
                    size="lg"
                  >
                    {generatingQuiz ? 'Generating Quiz with Gemini...' : `Generate Quiz (${selectedUploadIds.length} selected)`}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quiz Results */}
                {quizResults ? (
                  <div className="space-y-6">
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-3xl text-center">Quiz Complete! 🎉</CardTitle>
                        <CardDescription className="text-center text-lg">
                          Your Score: {quizResults.score}%
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center">
                        <div className="mb-6">
                          <div className="text-6xl font-bold text-blue-600 mb-2">
                            {quizResults.score}%
                          </div>
                          <p className="text-gray-600">
                            {quizResults.correct_count} out of {quizResults.total_questions} correct
                          </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                          <Button
                            onClick={() => setReviewMode(!reviewMode)}
                            size="lg"
                            variant={reviewMode ? "outline" : "default"}
                          >
                            {reviewMode ? '🔊 Stop Voice Review' : '🎧 Review with Voice'}
                          </Button>
                          <Button onClick={() => setGeneratedQuiz(null)} size="lg" variant="outline">
                            Generate New Quiz
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Detailed Results */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Review Your Answers</CardTitle>
                        <CardDescription>See explanations for each question</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {generatedQuiz?.questions.map((question, idx) => {
                          const userAnswer = quizAnswers[question.id];
                          const isCorrect = userAnswer === question.correct;

                          return (
                            <div
                              key={question.id}
                              className={`p-4 rounded-lg border-2 ${
                                isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <div className="flex items-start gap-3 mb-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center font-semibold">
                                  {idx + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 mb-3">{question.question}</p>

                                  <div className="space-y-2 mb-3">
                                    {question.options.map((option, optIdx) => {
                                      const isUserAnswer = userAnswer === optIdx;
                                      const isCorrectAnswer = optIdx === question.correct;

                                      return (
                                        <div
                                          key={optIdx}
                                          className={`p-2 rounded ${
                                            isCorrectAnswer
                                              ? 'bg-green-200 font-semibold'
                                              : isUserAnswer
                                              ? 'bg-red-200'
                                              : 'bg-white'
                                          }`}
                                        >
                                          {isCorrectAnswer && '✓ '}
                                          {isUserAnswer && !isCorrectAnswer && '✗ '}
                                          {option}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-3">
                                    <div className="flex justify-between items-start mb-1">
                                      <p className="text-sm font-semibold text-blue-900">Explanation:</p>
                                      {reviewMode && (
                                        <button
                                          onClick={async () => {
                                            try {
                                              const feedbackText = isCorrect
                                                ? `Correct! ${question.explanation}`
                                                : `Incorrect. The correct answer is: ${question.options[question.correct]}. ${question.explanation}`;

                                              const emotion = isCorrect ? 'congratulatory' : 'patient';
                                              const audioBlob = await aiService.textToSpeech(feedbackText, emotion);
                                              const audioUrl = URL.createObjectURL(audioBlob);
                                              const audio = new Audio(audioUrl);
                                              audio.play();
                                              audio.onended = () => URL.revokeObjectURL(audioUrl);
                                            } catch (error) {
                                              console.error('Error playing voice:', error);
                                            }
                                          }}
                                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                                        >
                                          🔊 Listen
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-sm text-blue-800">{question.explanation}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>
                ) : !quizStarted ? (
                  /* Quiz Start Screen */
                  <Card className="text-center py-12">
                    <CardHeader>
                      <CardTitle className="text-2xl">Ready to Start Your Quiz?</CardTitle>
                      <CardDescription className="text-lg mt-2">
                        {generatedQuiz?.questions.length} questions • 10 minutes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 max-w-md mx-auto">
                        <p className="text-sm text-yellow-800 font-medium">
                          ⏱️ The timer will start immediately when you click Start Quiz
                        </p>
                      </div>
                      <Button onClick={handleStartQuiz} size="lg" className="mt-4">
                        Start Quiz
                      </Button>
                      <div className="mt-4">
                        <Button variant="outline" onClick={() => setGeneratedQuiz(null)}>
                          Generate Different Quiz
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  /* Quiz Taking Interface */
                  <div className="space-y-6">
                    {/* Timer Bar */}
                    <Card className={`sticky top-4 z-10 ${timeRemaining < 60 ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'}`}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Time Remaining</p>
                            <p className={`text-3xl font-bold ${timeRemaining < 60 ? 'text-red-600' : 'text-blue-600'}`}>
                              {formatTime(timeRemaining)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-600">Progress</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {Object.keys(quizAnswers).length} / {generatedQuiz?.questions.length}
                            </p>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(Object.keys(quizAnswers).length / (generatedQuiz?.questions.length || 1)) * 100}%`
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Questions */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Answer All Questions</CardTitle>
                        <CardDescription>Select one answer for each question</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-8">
                        {generatedQuiz?.questions.map((question, idx) => (
                          <div key={question.id} className="pb-6 border-b last:border-b-0">
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                                {idx + 1}
                              </span>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 mb-4">{question.question}</p>
                                <div className="space-y-2">
                                  {question.options.map((option, optIdx) => (
                                    <label
                                      key={optIdx}
                                      className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                        quizAnswers[question.id] === optIdx
                                          ? 'border-blue-500 bg-blue-50'
                                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={`question-${question.id}`}
                                        value={optIdx}
                                        checked={quizAnswers[question.id] === optIdx}
                                        onChange={() => handleAnswerSelect(question.id, optIdx)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                      />
                                      <span className="ml-3 text-gray-700">{option}</span>
                                    </label>
                                  ))}
                                </div>

                                {/* Confidence Slider */}
                                {quizAnswers[question.id] !== undefined && (
                                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      How confident are you? {quizConfidence[question.id] ? `(${quizConfidence[question.id]}/5)` : ''}
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">Not Sure</span>
                                      <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        value={quizConfidence[question.id] || 3}
                                        onChange={(e) => setQuizConfidence(prev => ({
                                          ...prev,
                                          [question.id]: parseInt(e.target.value)
                                        }))}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                      />
                                      <span className="text-xs text-gray-500">Very Sure</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-center gap-4 pb-8">
                      <Button
                        onClick={handleSubmitQuiz}
                        disabled={submittingQuiz || Object.keys(quizAnswers).length === 0}
                        size="lg"
                        className="min-w-[200px]"
                      >
                        {submittingQuiz ? 'Submitting...' : 'Submit Quiz'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
                            setGeneratedQuiz(null);
                            setQuizStarted(false);
                          }
                        }}
                      >
                        Quit Quiz
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'learner' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Study Mode</h2>

              {/* Material Selector */}
              {uploads.filter(u => u.status === 'ready').length > 0 && (
                <select
                  value={selectedMaterial?.id || ''}
                  onChange={(e) => {
                    const upload = uploads.find(u => u.id === e.target.value);
                    setSelectedMaterial(upload || null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {uploads.filter(u => u.status === 'ready').map(upload => (
                    <option key={upload.id} value={upload.id}>
                      {upload.file_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {uploads.filter(u => u.status === 'ready').length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-gray-500 mb-4">
                    No materials available yet. Upload some PDFs or videos to get started!
                  </p>
                  <Button onClick={() => setActiveTab('uploads')}>Go to Uploads</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="flex gap-4 h-[calc(100vh-280px)]">
                {/* Material Viewer (80%) */}
                <div className="flex-1 bg-white rounded-lg border overflow-hidden">
                  {selectedMaterial && (
                    <>
                      {selectedMaterial.file_type === 'pdf' ? (
                        <div className="h-full flex flex-col">
                          <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700">
                              📄 {selectedMaterial.file_name}
                            </p>
                            <a
                              href={`http://localhost:8000/api/v1/courses/${selectedMaterial.course_id}/files/${selectedMaterial.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Open in new tab →
                            </a>
                          </div>
                          <div className="flex-1 bg-gray-50">
                            {materialFileUrl ? (
                              <iframe
                                src={materialFileUrl}
                                className="w-full h-full border-0"
                                title={selectedMaterial.file_name}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500">Loading file...</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : selectedMaterial.file_type === 'video' ? (
                        <div className="h-full flex flex-col">
                          <div className="bg-gray-100 px-4 py-2 border-b">
                            <p className="text-sm font-medium text-gray-700">
                              Video: {selectedMaterial.file_name}
                            </p>
                          </div>
                          <div className="flex-1 bg-black flex items-center justify-center">
                            <div className="text-center text-white p-8">
                              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <h3 className="text-lg font-medium mb-2">Video Processed</h3>
                              <p className="text-sm text-gray-300 mb-4">
                                Transcript and timestamps are available to the AI tutor
                              </p>
                              {selectedMaterial.video_duration_seconds && (
                                <p className="text-xs text-gray-400">
                                  Duration: {Math.floor(selectedMaterial.video_duration_seconds / 60)}m {selectedMaterial.video_duration_seconds % 60}s
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                {/* AI Chat (20%) */}
                <div className="w-80 bg-white rounded-lg border flex flex-col">
                  <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">AI Tutor</h3>
                        <p className="text-xs text-blue-100">Ask questions about your materials</p>
                      </div>
                      {/* Voice Mode Toggle */}
                      <button
                        onClick={() => setVoiceModeEnabled(!voiceModeEnabled)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          voiceModeEnabled
                            ? 'bg-white text-blue-600'
                            : 'bg-blue-700 text-white hover:bg-blue-800'
                        }`}
                        title="Toggle voice mode"
                      >
                        {voiceModeEnabled ? '🔊 Voice ON' : '🔈 Voice OFF'}
                      </button>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm mt-8">
                        <p className="mb-2">👋 Hi! I'm your AI tutor.</p>
                        <p>Ask me anything about your course materials!</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-lg px-4 py-2 ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                    {sendingMessage && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="border-t p-4">
                    {isPlayingAudio && (
                      <div className="mb-3 flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-1 h-4 bg-blue-600 rounded-full animate-pulse"></div>
                            <div className="w-1 h-6 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-1 h-4 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-sm text-blue-700 font-medium">Playing response...</span>
                        </div>
                        <button
                          onClick={stopAudio}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Stop
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {voiceModeEnabled && (
                        <>
                          {!isRecording ? (
                            <button
                              onClick={startVoiceRecording}
                              disabled={sendingMessage}
                              className="px-3 py-2 rounded-md text-white font-medium transition-colors bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
                              title="Click to speak"
                            >
                              🎤
                            </button>
                          ) : (
                            <button
                              onClick={stopVoiceRecording}
                              className="px-3 py-2 rounded-md text-white font-medium transition-colors bg-red-600 hover:bg-red-700 animate-pulse"
                              title="Stop recording"
                            >
                              ⏹️ Stop
                            </button>
                          )}
                        </>
                      )}
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !sendingMessage && handleSendMessage()}
                        placeholder={voiceModeEnabled ? "Speak or type..." : "Type your question..."}
                        disabled={sendingMessage || isRecording}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || sendingMessage || isRecording}
                        size="sm"
                      >
                        {voiceModeEnabled ? '🔊 Send' : 'Send'}
                      </Button>
                    </div>
                    {voiceModeEnabled && (
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Click the microphone to speak (click Stop to end recording), or type your message
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Analytics</h2>

            {loadingAnalytics ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : !analytics || analytics.total_attempts === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-gray-500 mb-4">
                    No quiz attempts yet. Take some quizzes to see your analytics!
                  </p>
                  <Button onClick={() => setActiveTab('testing')}>Go to Testing</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-blue-600">{analytics.average_score}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Attempts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-gray-900">{analytics.total_attempts}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Highest Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600">{analytics.highest_score}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Quizzes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-gray-900">{analytics.total_quizzes}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Chart */}
                {analytics.progress_over_time.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Progress Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.progress_over_time.map((point, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-32">
                              {new Date(point.date).toLocaleDateString()}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all"
                                style={{ width: `${point.score}%` }}
                              ></div>
                              <span className="absolute right-2 top-0 text-xs font-medium text-gray-700">
                                {point.score}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Topics Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600">⚠️ Areas to Improve</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analytics.weak_topics.length > 0 ? (
                        <ul className="space-y-2">
                          {analytics.weak_topics.map((topic, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              {topic}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm">Great job! No weak areas identified.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600">✅ Strong Areas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analytics.strong_topics.length > 0 ? (
                        <ul className="space-y-2">
                          {analytics.strong_topics.map((topic, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              {topic}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm">Take more quizzes to identify your strengths!</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Attempts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Quiz Attempts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.recent_attempts.map((attempt) => (
                        <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{new Date(attempt.completed_at).toLocaleString()}</p>
                            {attempt.time_taken_seconds && (
                              <p className="text-xs text-gray-600">Time: {Math.floor(attempt.time_taken_seconds / 60)}m {attempt.time_taken_seconds % 60}s</p>
                            )}
                          </div>
                          <div className={`text-2xl font-bold ${
                            attempt.score >= 80 ? 'text-green-600' :
                            attempt.score >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {attempt.score}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
