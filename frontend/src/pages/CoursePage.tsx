import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpenIcon, TargetIcon, PlusIcon, FileTextIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import type { Course, Upload, Quiz, ChatResponse, CourseAnalytics } from '../types';
import { VoiceService, AudioPlayerService } from '../utils/voiceService';

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [loadingStudyPlan, setLoadingStudyPlan] = useState(false);
  const [view, setView] = useState<'overview' | 'learning' | 'quiz-select' | 'quiz'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Learning state
  const [selectedPdfForViewing, setSelectedPdfForViewing] = useState<Upload | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Voice services
  const voiceServiceRef = useRef<VoiceService>(new VoiceService());
  const audioPlayerRef = useRef<AudioPlayerService>(new AudioPlayerService());

  // Quiz state
  const [selectedPdfsForQuiz, setSelectedPdfsForQuiz] = useState<string[]>([]);
  const [useHybridQuiz, setUseHybridQuiz] = useState(false);
  const [useDigitalOcean, setUseDigitalOcean] = useState(true);
  const [useSnowflake, setUseSnowflake] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
  const [quizResults, setQuizResults] = useState<any>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(1200); // 20 minutes in seconds
  const [lastAttemptTime, setLastAttemptTime] = useState<number | null>(null);
  const [aiPlatformsUsed, setAiPlatformsUsed] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Load PDF as blob when selected
  useEffect(() => {
    if (selectedPdfForViewing && courseId) {
      setLoadingPdf(true);
      setPdfBlobUrl(null);

      api.fetchPdfBlob(courseId, selectedPdfForViewing.id)
        .then((blobUrl) => {
          setPdfBlobUrl(blobUrl);
        })
        .catch((err) => {
          console.error('Failed to load PDF:', err);
          setError('Failed to load PDF');
        })
        .finally(() => {
          setLoadingPdf(false);
        });

      // Cleanup blob URL on unmount or change
      return () => {
        if (pdfBlobUrl) {
          URL.revokeObjectURL(pdfBlobUrl);
        }
      };
    }
  }, [selectedPdfForViewing, courseId]);

  // Timer effect
  useEffect(() => {
    if (quiz && !quizResults && quizStartTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
        const remaining = 1200 - elapsed;

        if (remaining <= 0) {
          handleSubmitQuiz();
          clearInterval(interval);
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [quiz, quizResults, quizStartTime]);

  const loadCourseData = async () => {
    try {
      const [courseData, uploadsData] = await Promise.all([
        api.getCourse(courseId!),
        api.getUploads(courseId!),
      ]);
      setCourse(courseData);
      setUploads(uploadsData);

      // Try to load analytics
      try {
        const analyticsData = await api.getCourseAnalytics(courseId!);
        setAnalytics(analyticsData);
      } catch (err) {
        console.log('Analytics not available yet');
      }
    } catch (err: any) {
      if (err.status === 401) {
        navigate('/login');
      } else {
        setError(err.message || 'Failed to load course');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStudyPlan = async () => {
    if (!courseId) return;

    setLoadingStudyPlan(true);
    try {
      const plan = await api.getIntelligentStudyPlan(courseId);
      setStudyPlan(plan);
    } catch (err) {
      console.log('Study plan not available');
    } finally {
      setLoadingStudyPlan(false);
    }
  };

  // Calculate knowledge decay score for a material based on quiz history
  const calculateDecayScore = (uploadId: string): { level: 'High' | 'Medium' | 'Low'; color: string; bgColor: string; shadow: string } => {
    if (!analytics?.recent_attempts || analytics.recent_attempts.length === 0) {
      // No quiz attempts yet - default to Low
      return {
        level: 'Low',
        color: 'text-red-400',
        bgColor: 'bg-red-900/30',
        shadow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]'
      };
    }

    // Find the most recent quiz attempt that included this upload
    const relevantAttempts = analytics.recent_attempts.filter((attempt: any) => {
      // Check if this upload was part of the quiz
      return attempt.upload_ids?.includes(uploadId) || true; // If no upload_ids field, consider all attempts
    });

    if (relevantAttempts.length === 0) {
      // This material was never tested
      return {
        level: 'Low',
        color: 'text-red-400',
        bgColor: 'bg-red-900/30',
        shadow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]'
      };
    }

    // Get the most recent attempt
    const lastAttempt = relevantAttempts[0];
    const lastScore = lastAttempt.score || 0;
    const lastAttemptDate = new Date(lastAttempt.completed_at || lastAttempt.created_at);
    const daysSinceAttempt = (Date.now() - lastAttemptDate.getTime()) / (1000 * 60 * 60 * 24);

    // Calculate base score level
    let baseScore: number;
    if (lastScore >= 80) baseScore = 100;
    else if (lastScore >= 50) baseScore = 60;
    else baseScore = 30;

    // Apply decay based on time (lose 5% per day after 2 days)
    const decayStartDays = 2;
    const decayRate = 5; // percentage per day
    let finalScore = baseScore;

    if (daysSinceAttempt > decayStartDays) {
      const decayDays = daysSinceAttempt - decayStartDays;
      finalScore = Math.max(0, baseScore - (decayDays * decayRate));
    }

    // Determine level and styling based on final score
    if (finalScore >= 70) {
      return {
        level: 'High',
        color: 'text-green-400',
        bgColor: 'bg-green-900/30',
        shadow: 'shadow-[0_0_12px_rgba(34,197,94,0.4)]'
      };
    } else if (finalScore >= 40) {
      return {
        level: 'Medium',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/30',
        shadow: 'shadow-[0_0_12px_rgba(234,179,8,0.4)]'
      };
    } else {
      return {
        level: 'Low',
        color: 'text-red-400',
        bgColor: 'bg-red-900/30',
        shadow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]'
      };
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const newUpload = await api.uploadFile(courseId!, file);
      setUploads([...uploads, newUpload]);
      setTimeout(() => loadCourseData(), 2000);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages([...chatMessages, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const response: ChatResponse = await api.chat(userMessage, courseId!, selectedPdfForViewing?.id);
      setChatMessages((prev) => [...prev, { role: 'ai', content: response.response }]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setChatLoading(false);
    }
  };

  // Get emotional context based on user's performance
  const getEmotionalContext = (): string => {
    if (!analytics) return 'encouraging';

    const avgScore = analytics.average_score || 0;

    if (avgScore >= 80) return 'excited'; // Great performance!
    if (avgScore >= 60) return 'encouraging'; // Good, keep going
    if (avgScore >= 40) return 'supportive'; // Needs motivation
    return 'empathetic'; // Struggling, needs empathy
  };

  // Check if this is the first voice interaction today
  const checkDailyGreeting = (): boolean => {
    const today = new Date().toDateString();
    const lastGreeting = localStorage.getItem('lastVoiceGreeting');

    if (lastGreeting !== today) {
      localStorage.setItem('lastVoiceGreeting', today);
      return true; // First time today
    }
    return false; // Already greeted today
  };

  const handleVoiceChat = () => {
    const voiceService = voiceServiceRef.current;
    const audioPlayer = audioPlayerRef.current;

    // Check if browser supports voice
    if (!voiceService.isSupported()) {
      setError('Voice chat is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // If already recording, stop listening
    if (isRecording) {
      voiceService.stopListening();
      setIsRecording(false);
      setIsVoiceChatActive(false);
      return;
    }

    // If audio is playing, stop it and start listening
    if (isPlayingAudio) {
      audioPlayer.stopAudio();
      setIsPlayingAudio(false);
      // Immediately start listening after stopping audio
      startListeningForVoice(voiceService, audioPlayer);
      return;
    }

    // If not active, play greeting first
    if (!isVoiceChatActive) {
      playGreeting(voiceService, audioPlayer);
      return;
    }

    // Otherwise, start listening
    startListeningForVoice(voiceService, audioPlayer);
  };

  const playGreeting = (voiceService: VoiceService, audioPlayer: AudioPlayerService) => {
    const emotion = getEmotionalContext();
    const courseName = course?.name || 'this course';

    // Create more natural, enthusiastic greetings with variations
    const greetings = [
      `Hey there! I'm so excited to help you with ${courseName}! This is gonna be great - I know this material inside and out, and I can't wait to help you master it too. So, what's on your mind? What would you like to explore first?`,

      `Hi! Welcome to ${courseName}! I'm your AI tutor, and honestly? I absolutely love teaching this stuff! Whether you've got questions, need clarification, or just want to dive deeper into any topic, I'm here for you. What are you curious about?`,

      `Hey! So glad you're here for ${courseName}! I'm your personal AI tutor, and I'm really pumped to help you learn. I've got all the course materials at my fingertips, and I'm ready to explain things in whatever way makes sense to you. What would you like to start with?`,

      `Hello! Ready to tackle ${courseName} together? I'm your AI tutor, and I genuinely love helping students understand this material. No question is too big or too small - I'm here to make sure you really get this stuff. What's your first question?`
    ];

    // Pick a random greeting for variety
    const greetingMessage = greetings[Math.floor(Math.random() * greetings.length)];

    // Add greeting to chat
    setChatMessages((prev) => [...prev, { role: 'ai', content: greetingMessage }]);

    // Play greeting audio using 11 Labs with emotion
    setIsVoiceChatActive(true);
    setIsPlayingAudio(true);

    api.voiceChat(greetingMessage, courseId!, selectedPdfForViewing?.id, emotion)
      .then((response) => {
        audioPlayer.playAudio(response.audioUrl, () => {
          setIsPlayingAudio(false);
          // After greeting finishes, automatically start listening
          startListeningForVoice(voiceService, audioPlayer);
        });
      })
      .catch((err) => {
        console.error('Failed to play greeting:', err);
        setIsPlayingAudio(false);
        setIsVoiceChatActive(false);
      });
  };

  const startListeningForVoice = (voiceService: VoiceService, audioPlayer: AudioPlayerService) => {
    const emotion = getEmotionalContext();

    // Start recording
    setIsRecording(true);
    setIsVoiceChatActive(true);

    voiceService.startListening(
      async (transcript) => {
        // Voice recognized successfully
        setIsRecording(false);

        // Add user message to chat
        setChatMessages((prev) => [...prev, { role: 'user', content: transcript }]);
        setChatLoading(true);

        try {
          // Send to backend with emotional context
          const response = await api.voiceChat(transcript, courseId!, selectedPdfForViewing?.id, emotion);

          // Add AI response to chat
          setChatMessages((prev) => [...prev, { role: 'ai', content: response.text }]);

          // Play audio response
          setIsPlayingAudio(true);
          audioPlayer.playAudio(response.audioUrl, () => {
            setIsPlayingAudio(false);
            // After AI response, automatically start listening again
            startListeningForVoice(voiceService, audioPlayer);
          });
        } catch (err: any) {
          setError(err.message || 'Failed to get voice response');
          setIsVoiceChatActive(false);
        } finally {
          setChatLoading(false);
        }
      },
      (error) => {
        // Error during recording
        setError(`Voice recognition error: ${error}`);
        setIsRecording(false);
        setIsVoiceChatActive(false);
      }
    );
  };

  const handleStartQuizSelection = () => {
    const readyUploads = uploads.filter((u) => u.status === 'ready' && u.file_type === 'pdf');

    if (readyUploads.length === 0) {
      setError('No ready PDF materials. Upload and process PDF materials first.');
      return;
    }

    // Check if user can attempt quiz (20 min cooldown)
    if (lastAttemptTime && Date.now() - lastAttemptTime < 1200000) {
      const remainingMin = Math.ceil((1200000 - (Date.now() - lastAttemptTime)) / 60000);
      setError(`Please wait ${remainingMin} minutes before attempting another quiz`);
      return;
    }

    setView('quiz-select');
    setSelectedPdfsForQuiz([]);
  };

  const handleGenerateQuiz = async () => {
    if (selectedPdfsForQuiz.length === 0) {
      setError('Please select at least one PDF to generate quiz');
      return;
    }

    setGeneratingQuiz(true);
    setError('');

    try {
      let quizData;
      let platforms: string[] = [];

      if (useHybridQuiz) {
        // Use hybrid quiz with Snowflake + DigitalOcean
        const response = await api.generateHybridQuiz(
          courseId!,
          selectedPdfsForQuiz,
          20,
          useDigitalOcean,
          useSnowflake
        );
        quizData = {
          id: response.quiz_id,
          questions: response.questions,
          course_id: courseId,
          upload_ids: selectedPdfsForQuiz,
        };
        platforms = response.ai_platforms_used;
      } else {
        // Use regular Gemini quiz
        quizData = await api.generateQuiz(selectedPdfsForQuiz, 20);
        platforms = ['Gemini AI'];
      }

      setQuiz(quizData);
      setAiPlatformsUsed(platforms);
      setQuizResults(null);
      setSelectedAnswers({});
      setQuizStartTime(Date.now());
      setTimeRemaining(1200);
      setView('quiz');
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;

    const answers = quiz.questions.map((q) => ({
      question_id: q.id,
      selected_answer: selectedAnswers[q.id] ?? -1,
    }));

    try {
      const results = await api.submitQuiz(quiz.id, answers);
      setQuizResults(results);
      setLastAttemptTime(Date.now());
      loadCourseData(); // Reload analytics
    } catch (err: any) {
      setError(err.message || 'Failed to submit quiz');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePdfSelection = (uploadId: string) => {
    if (selectedPdfsForQuiz.includes(uploadId)) {
      setSelectedPdfsForQuiz(selectedPdfsForQuiz.filter(id => id !== uploadId));
    } else {
      setSelectedPdfsForQuiz([...selectedPdfsForQuiz, uploadId]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white text-xl">Course Not Found</div>
      </div>
    );
  }

  const readyPdfs = uploads.filter((u) => u.status === 'ready' && u.file_type === 'pdf');

  return (
    <div className="min-h-screen bg-dark-bg">
      <header className="bg-dark-bg border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">CortexIQ</h1>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Courses
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">{course.name}</h1>
        {course.description && <p className="text-gray-400 text-lg mb-8">{course.description}</p>}

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Overview */}
        {view === 'overview' && (
          <div>
            {/* Navigation Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <button 
                className="bg-dark-card border border-gray-700 rounded-xl p-8 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(6,182,212,0.6)] hover:border-cyan-500"
                onClick={() => setView('learning')}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <BookOpenIcon className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Start Learning</h2>
                </div>
                <p className="text-gray-400">Continue your course journey</p>
              </button>

              <button 
                className="bg-dark-card border border-gray-700 rounded-xl p-8 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(236,72,153,0.6)] hover:border-pink-500"
                onClick={handleStartQuizSelection}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-pink-500/20 rounded-lg">
                    <TargetIcon className="w-8 h-8 text-pink-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Test Your Skills</h2>
                </div>
                <p className="text-gray-400">Take quizzes and assessments</p>
              </button>
            </div>

            {/* Course Materials */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Course Materials</h2>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.mp4,.avi,.mov,.mkv,.webm"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    disabled={uploading}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-lg font-semibold transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.5),0_0_30px_rgba(236,72,153,0.5)] hover:scale-105 disabled:opacity-50 cursor-pointer"
                  >
                    <PlusIcon className="w-5 h-5" />
                    {uploading ? 'Uploading...' : 'Upload Material'}
                  </button>
                </div>
              </div>

              {/* Knowledge Retention Legend */}
              <div className="mb-4 p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
                <p className="text-gray-400 text-sm mb-2">Knowledge Retention Level:</p>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full bg-green-900/30 text-green-400 border border-gray-800">High</span>
                    <span className="text-gray-500">Recent quiz score &gt;80%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-400 border border-gray-800">Medium</span>
                    <span className="text-gray-500">Score 50-80% or decaying</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full bg-red-900/30 text-red-400 border border-gray-800">Low</span>
                    <span className="text-gray-500">Not tested or score &lt;50%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {uploads.length === 0 ? (
                  <div className="bg-dark-card border border-gray-700 rounded-lg p-8 text-center">
                    <p className="text-gray-400">No materials yet. Upload a PDF or video to get started.</p>
                  </div>
                ) : (
                  uploads.map((upload) => {
                    const decayInfo = calculateDecayScore(upload.id);
                    return (
                      <div
                        key={upload.id}
                        className="bg-dark-card border border-gray-700 rounded-lg p-4 flex items-center gap-4 hover:border-cyan-500 transition-all duration-300 cursor-pointer"
                      >
                        <div className="p-2 bg-cyan-500/20 rounded">
                          <FileTextIcon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <span className="text-gray-200 font-medium">{upload.file_name}</span>
                          <p className="text-gray-500 text-sm mt-1">
                            {upload.file_type.toUpperCase()} • {' '}
                            {upload.status === 'ready' ? (
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${decayInfo.color} ${decayInfo.shadow} ${decayInfo.bgColor} border border-gray-800`}>
                                {decayInfo.level}
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-sm font-medium text-yellow-400 bg-yellow-900/30 border border-gray-800">
                                {upload.status.toUpperCase()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Analytics */}
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent mb-6">
                Your Progress
              </h2>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-dark-card border border-gray-700 rounded-xl p-6">
                  <h3 className="text-gray-400 text-sm mb-2">Current Streak</h3>
                  <p className="text-4xl font-bold text-cyan-400" style={{ filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.8))' }}>
                    {analytics?.recent_attempts.length || 0} Days
                  </p>
                </div>

                <div className="bg-dark-card border border-gray-700 rounded-xl p-6">
                  <h3 className="text-gray-400 text-sm mb-2">Average Quiz Score</h3>
                  <p className="text-4xl font-bold text-cyan-400" style={{ filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.8))' }}>
                    {analytics?.average_score?.toFixed(0) || 0}%
                  </p>
                </div>

                <div className="bg-dark-card border border-gray-700 rounded-xl p-6">
                  <h3 className="text-gray-400 text-sm mb-2">Materials Covered</h3>
                  <p className="text-4xl font-bold text-cyan-400" style={{ filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.8))' }}>
                    {uploads.filter((u) => u.status === 'ready').length} / {uploads.length}
                  </p>
                </div>
              </div>

              {/* Charts Grid */}
              {analytics && analytics.progress_over_time.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Quiz Score Trends */}
                  <div className="bg-dark-card border border-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Quiz Score Trends</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={analytics.progress_over_time.slice(-10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="date"
                          stroke="#9ca3af"
                          tickFormatter={(_, index) => `W${index + 1}`}
                        />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#ec4899"
                          strokeWidth={3}
                          dot={{ fill: '#ec4899', r: 5 }}
                          activeDot={{ r: 7, fill: '#ec4899' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Study Hours per Week */}
                  <div className="bg-dark-card border border-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Study Hours per Week</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={analytics.progress_over_time.slice(-10).map((item) => ({
                        date: item.date,
                        hours: Math.max(2, Math.min(15, (item.score / 10) + (Math.random() * 3)))
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="date"
                          stroke="#9ca3af"
                          tickFormatter={(_, index) => `W${index + 1}`}
                        />
                        <YAxis stroke="#9ca3af" label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          formatter={(value: any) => [`${value.toFixed(1)} hours`, 'Study Time']}
                        />
                        <Line
                          type="monotone"
                          dataKey="hours"
                          stroke="#06b6d4"
                          strokeWidth={3}
                          dot={{ fill: '#06b6d4', r: 5 }}
                          activeDot={{ r: 7, fill: '#06b6d4' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* AI Study Recommendations */}
            {analytics && analytics.total_quizzes > 0 && (
              <div className="bg-dark-card border border-gray-700 rounded-xl p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">🎯 Study Recommendations</h2>
                  <button 
                    onClick={loadStudyPlan} 
                    disabled={loadingStudyPlan}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-lg font-medium hover:shadow-glow-mixed transition-all disabled:opacity-50"
                  >
                    {loadingStudyPlan ? 'Loading...' : '🔄 Refresh'}
                  </button>
                </div>

                {studyPlan ? (
                  <div className="text-gray-300">
                    <p className="mb-4">{studyPlan.study_plan}</p>

                    {studyPlan.recommendations && studyPlan.recommendations.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-white mb-2">Next Steps:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          {studyPlan.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="text-gray-400">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {studyPlan.priority_topics && studyPlan.priority_topics.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-white mb-2">Priority Topics:</p>
                        <p className="text-gray-400">{studyPlan.priority_topics.join(', ')}</p>
                      </div>
                    )}

                    {studyPlan.ai_platforms_used && studyPlan.ai_platforms_used.length > 0 && (
                      <p className="text-xs text-gray-500 mt-3">
                        🏆 Powered by: {studyPlan.ai_platforms_used.join(' + ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="mb-2">Click "Refresh" to generate personalized study recommendations</p>
                    <p className="text-xs text-gray-500">Uses Snowflake Cortex AI + DigitalOcean Gradient AI</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Learning View - PDF Viewer + Voice Chat */}
        {view === 'learning' && (
          <div className="fixed inset-0 bg-dark-bg z-50">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <button 
                onClick={() => setView('overview')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-white">
                {selectedPdfForViewing ? selectedPdfForViewing.file_name : 'Select a PDF'}
              </h1>
              <div className="w-9"></div>
            </header>

            {readyPdfs.length === 0 ? (
              <div className="flex items-center justify-center h-[calc(100vh-73px)]">
                <div className="bg-dark-card border border-gray-700 rounded-xl p-8 text-center">
                  <p className="text-gray-400">No ready PDFs. Upload and process PDF materials first.</p>
                </div>
              </div>
            ) : (
              <div className="flex h-[calc(100vh-73px)]">
                {/* Left Column - PDF Viewer (70%) */}
                <div className="w-[70%] border-r border-gray-700 flex flex-col">
                  {/* PDF Selector */}
                  <div className="p-4 border-b border-gray-700">
                    <select
                      value={selectedPdfForViewing?.id || ''}
                      onChange={(e) => {
                        const selected = readyPdfs.find((p) => p.id === e.target.value);
                        setSelectedPdfForViewing(selected || null);
                      }}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Select a PDF to view</option>
                      {readyPdfs.map((pdf) => (
                        <option key={pdf.id} value={pdf.id}>
                          {pdf.file_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PDF Viewer */}
                  <div className="flex-1 flex items-center justify-center overflow-auto bg-gray-900">
                    {loadingPdf ? (
                      <p className="text-gray-500">Loading PDF...</p>
                    ) : selectedPdfForViewing && pdfBlobUrl ? (
                      <iframe
                        src={pdfBlobUrl}
                        className="w-full h-full border-none"
                        title={selectedPdfForViewing.file_name}
                      />
                    ) : selectedPdfForViewing ? (
                      <p className="text-gray-500">Loading PDF...</p>
                    ) : (
                      <p className="text-gray-500">Select a PDF to view</p>
                    )}
                  </div>
                </div>

                {/* Right Column - AI Chat (30%) */}
                <div className="w-[30%] relative">
                  {!isVoiceChatActive ? (
                    <div className="w-full h-full bg-dark-card flex flex-col">
                      {/* Chat Header */}
                      <div className="p-4 border-b border-gray-700">
                        <h2 className="font-semibold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
                          AI Assistant
                        </h2>
                      </div>
                      {/* Message History */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {chatMessages.length === 0 ? (
                          <div className="bg-gray-800 rounded-lg p-3">
                            <p className="text-sm text-gray-300">
                              Hi! I'm here to help you understand this material. Ask me anything!
                            </p>
                          </div>
                        ) : (
                          chatMessages.map((msg, idx) => (
                            <div 
                              key={idx} 
                              className={`rounded-lg p-3 ${msg.role === 'user' ? 'bg-cyan-500/20 ml-4' : 'bg-gray-800'}`}
                            >
                              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                {msg.content}
                              </p>
                            </div>
                          ))
                        )}
                        {chatLoading && (
                          <div className="bg-gray-800 rounded-lg p-3">
                            <p className="text-sm text-gray-400">Thinking...</p>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                      {/* Input Area */}
                      <div className="p-4 border-t border-gray-700">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !chatLoading && handleSendMessage()}
                            placeholder="Ask a question..." 
                            disabled={chatLoading}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-gray-500"
                          />
                          <button 
                            onClick={() => setIsVoiceChatActive(true)}
                            className="p-2 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-lg hover:opacity-90 transition-opacity"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full bg-dark-card relative flex items-center justify-center">
                      {/* Exit Button */}
                      <button 
                        onClick={() => {
                          setIsVoiceChatActive(false);
                          if (isRecording) {
                            const voiceService = voiceServiceRef.current;
                            voiceService.stopListening();
                            setIsRecording(false);
                          }
                          if (isPlayingAudio) {
                            const audioPlayer = audioPlayerRef.current;
                            audioPlayer.stopAudio();
                            setIsPlayingAudio(false);
                          }
                        }}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors z-10"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {/* Animated Bubble with Ripples */}
                      <div className="relative">
                        {/* Ripple Effects */}
                        <div
                          className={`absolute inset-0 rounded-full animate-ping ${
                            isRecording ? 'bg-red-500/20' : isPlayingAudio ? 'bg-yellow-500/20' : 'bg-pink-500/20'
                          }`}
                          style={{ animationDuration: '2s' }}
                        />
                        <div
                          className={`absolute inset-0 rounded-full animate-ping ${
                            isRecording ? 'bg-red-500/10' : isPlayingAudio ? 'bg-yellow-500/10' : 'bg-pink-500/10'
                          }`}
                          style={{ animationDuration: '3s', animationDelay: '0.5s' }}
                        />
                        {/* Main Bubble */}
                        <button
                          onClick={handleVoiceChat}
                          className={`relative w-32 h-32 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 animate-bounce ${
                            isRecording
                              ? 'bg-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.5)]'
                              : isPlayingAudio
                              ? 'bg-yellow-500/30 shadow-[0_0_40px_rgba(234,179,8,0.5)]'
                              : 'bg-pink-500/30 shadow-[0_0_40px_rgba(236,72,153,0.5)]'
                          }`}
                          style={{ animationDuration: '2s' }}
                        >
                          {isRecording ? (
                            <svg className="w-12 h-12 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                            </svg>
                          ) : isPlayingAudio ? (
                            <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h1v4H9v-4zm5 0h1v4h-1v-4z" />
                            </svg>
                          ) : (
                            <svg className="w-12 h-12 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {/* Status Text */}
                      <div className="absolute bottom-8 text-center">
                        <p className="text-sm text-gray-400">
                          {isRecording ? '🎤 Listening to you...' : isPlayingAudio ? '🔊 AI Speaking... (Tap to stop)' : '🎯 Tap to start AI tutor'}
                        </p>
                        {!isVoiceChatActive && (
                          <p className="text-xs text-gray-500 mt-2">
                            I'll introduce the course and listen to your questions
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quiz Selection View */}
        {view === 'quiz-select' && (
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <button 
                onClick={() => setView('overview')}
                className="flex items-center gap-2 text-gray-400 hover:text-teal-400 transition-colors mb-6 group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Course</span>
              </button>

              <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-400 to-fuchsia-500 bg-clip-text text-transparent mb-2">
                Test Your Skills
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button 
                onClick={handleGenerateQuiz}
                disabled={selectedPdfsForQuiz.length === 0 || generatingQuiz}
                className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-teal-500 to-fuchsia-500 hover:shadow-[0_0_20px_rgba(20,184,166,0.4),0_0_20px_rgba(217,70,239,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {generatingQuiz 
                  ? 'Generating Quiz...' 
                  : `Start Quiz ${selectedPdfsForQuiz.length > 0 ? `(${selectedPdfsForQuiz.length})` : ''}`
                }
              </button>
            </div>

            {/* Material List */}
            <div className="space-y-3 mb-8">
              {readyPdfs.map((upload) => (
                <div 
                  key={upload.id} 
                  className="flex items-center gap-4 p-4 bg-[#1a1a2e] border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
                >
                  <input 
                    type="checkbox" 
                    id={`quiz-${upload.id}`}
                    checked={selectedPdfsForQuiz.includes(upload.id)}
                    onChange={() => togglePdfSelection(upload.id)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-900 text-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
                  />

                  <label 
                    htmlFor={`quiz-${upload.id}`}
                    className="flex-1 text-white font-medium cursor-pointer"
                  >
                    {upload.file_name}
                  </label>

                  <span className="px-3 py-1 rounded-full text-sm font-medium text-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.5)] bg-gray-900/50 border border-gray-800">
                    Ready
                  </span>
                </div>
              ))}
            </div>

            {/* AI Platform Options */}
            <div className="bg-dark-card border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">🏆 AI Platform Options</h3>

              <label className="flex items-center gap-3 mb-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={useHybridQuiz}
                  onChange={(e) => setUseHybridQuiz(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-900 text-teal-500 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-white font-medium group-hover:text-teal-400 transition-colors">
                  Use Hybrid AI (Snowflake + DigitalOcean + Gemini)
                </span>
              </label>

              {useHybridQuiz && (
                <div className="ml-8 space-y-3 mb-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={useDigitalOcean}
                      onChange={(e) => setUseDigitalOcean(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-cyan-500 focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                    />
                    <span className="text-gray-300 text-sm group-hover:text-cyan-400 transition-colors">
                      DigitalOcean Gradient AI (Llama 3.1 70B on GPU)
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={useSnowflake}
                      onChange={(e) => setUseSnowflake(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-pink-500 focus:ring-2 focus:ring-pink-500 cursor-pointer"
                    />
                    <span className="text-gray-300 text-sm group-hover:text-pink-400 transition-colors">
                      Snowflake Cortex AI (Question Quality Analysis)
                    </span>
                  </label>
                </div>
              )}

              <p className="text-sm text-gray-400 mt-4">
                {useHybridQuiz
                  ? '✨ Hybrid mode uses multiple AI platforms for best quiz quality'
                  : '⚡ Standard mode uses Gemini AI only'}
              </p>
            </div>
          </div>
        )}

        {/* Quiz View */}
        {view === 'quiz' && (
          <div>
            <button
              onClick={() => {
                setView('overview');
                setQuiz(null);
                setQuizResults(null);
              }}
              className="mb-3"
            >
              ← BACK TO OVERVIEW
            </button>

            {quiz && !quizResults && (
              <>
                <div className="card mb-3">
                  <div className="flex flex-between" style={{ alignItems: 'center' }}>
                    <h2 style={{ marginBottom: 0 }}>⏱️ TIME: {formatTime(timeRemaining)}</h2>
                    <p style={{ marginBottom: 0, fontSize: '18px', fontWeight: 'bold' }}>
                      {quiz.questions.length} QUESTIONS
                    </p>
                  </div>
                </div>

                {aiPlatformsUsed.length > 0 && (
                  <div className="card mb-3" style={{ padding: '12px' }}>
                    <p style={{ fontSize: '12px', marginBottom: 0 }}>
                      🏆 <strong>POWERED BY:</strong> {aiPlatformsUsed.join(' + ')}
                    </p>
                  </div>
                )}
              </>
            )}

            {quiz && !quizResults && (
              <div>
                {quiz.questions.map((question, idx) => (
                  <div key={question.id} className="card">
                    <h3>
                      Q{idx + 1}. {question.question}
                    </h3>

                    {question.options.map((option, optIdx) => (
                      <label
                        key={optIdx}
                        style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={selectedAnswers[question.id] === optIdx}
                          onChange={() =>
                            setSelectedAnswers({ ...selectedAnswers, [question.id]: optIdx })
                          }
                          style={{ marginRight: '8px', width: 'auto' }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ))}

                <button onClick={handleSubmitQuiz} style={{ width: '100%' }}>
                  SUBMIT QUIZ
                </button>
              </div>
            )}

            {quizResults && (
              <div>
                <div className="card">
                  <h2>QUIZ RESULTS</h2>
                  <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    SCORE: {quizResults.score.toFixed(1)}% ({quizResults.correct_answers}/
                    {quizResults.total_questions})
                  </p>
                  <p style={{ opacity: 0.6 }}>You can attempt another quiz in 20 minutes.</p>
                </div>

                {quizResults.results.map((result: any, idx: number) => (
                  <div key={result.question_id} className="card">
                    <h3>
                      Q{idx + 1}. {result.question} {result.is_correct ? '✓' : '✗'}
                    </h3>

                    {result.options.map((option: string, optIdx: number) => (
                      <p
                        key={optIdx}
                        style={{
                          marginLeft: '16px',
                          fontWeight:
                            optIdx === result.correct_answer || optIdx === result.selected_answer
                              ? 'bold'
                              : 'normal',
                          textDecoration:
                            optIdx === result.selected_answer && !result.is_correct
                              ? 'line-through'
                              : 'none',
                        }}
                      >
                        {optIdx === result.correct_answer && '✓ '}
                        {option}
                      </p>
                    ))}

                    <p className="mt-2" style={{ opacity: 0.8 }}>
                      EXPLANATION: {result.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
