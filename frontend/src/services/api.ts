const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');

  // List of endpoints that don't require authentication
  const publicEndpoints = ['/auth/login', '/auth/register'];
  const isPublicEndpoint = publicEndpoints.some(endpoint => url.startsWith(endpoint));

  // Only check for token on protected endpoints
  if (!token && !isPublicEndpoint) {
    console.error('No authentication token found. Redirecting to login...');
    window.location.href = '/login';
    throw new ApiError(401, 'No authentication token');
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Debug log for development
  console.log(`API Request: ${options.method || 'GET'} ${API_URL}${url}`);
  console.log(`Token present: ${token ? 'Yes (length: ' + token.length + ')' : 'No'}`);

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));

    // If 401 on a protected endpoint, token is invalid or expired - redirect to login
    if (response.status === 401 && !isPublicEndpoint) {
      console.error('Authentication failed. Clearing token and redirecting to login...');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    throw new ApiError(response.status, error.detail || 'Request failed');
  }

  return response;
}

export const api = {
  // Get PDF URL with auth token
  getPdfUrl: (courseId: string, uploadId: string) => {
    const token = localStorage.getItem('token');
    return `${API_URL}/courses/${courseId}/files/${uploadId}?token=${token}`;
  },

  // Fetch PDF as blob for iframe display
  fetchPdfBlob: async (courseId: string, uploadId: string) => {
    const response = await fetchWithAuth(`/courses/${courseId}/files/${uploadId}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  // Auth
  login: async (email: string, password: string) => {
    const response = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  register: async (email: string, password: string) => {
    const response = await fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  getMe: async () => {
    const response = await fetchWithAuth('/auth/me');
    return response.json();
  },

  // Courses
  getCourses: async () => {
    const response = await fetchWithAuth('/courses');
    return response.json();
  },

  getCourse: async (courseId: string) => {
    const response = await fetchWithAuth(`/courses/${courseId}`);
    return response.json();
  },

  createCourse: async (name: string, description?: string) => {
    const response = await fetchWithAuth('/courses', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    return response.json();
  },

  updateCourse: async (courseId: string, name: string, description?: string) => {
    const response = await fetchWithAuth(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description }),
    });
    return response.json();
  },

  deleteCourse: async (courseId: string) => {
    await fetchWithAuth(`/courses/${courseId}`, {
      method: 'DELETE',
    });
  },

  // Uploads
  getUploads: async (courseId: string) => {
    const response = await fetchWithAuth(`/courses/${courseId}/uploads`);
    return response.json();
  },

  uploadFile: async (courseId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetchWithAuth(`/courses/${courseId}/uploads`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  getUpload: async (uploadId: string) => {
    const response = await fetchWithAuth(`/uploads/${uploadId}`);
    return response.json();
  },

  deleteUpload: async (uploadId: string) => {
    await fetchWithAuth(`/uploads/${uploadId}`, {
      method: 'DELETE',
    });
  },

  // Quiz
  generateQuiz: async (uploadIds: string[], numQuestions: number = 25) => {
    const response = await fetchWithAuth('/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({ upload_ids: uploadIds, num_questions: numQuestions }),
    });
    return response.json();
  },

  submitQuiz: async (quizId: string, answers: Array<{ question_id: string; selected_answer: number }>) => {
    const response = await fetchWithAuth(`/quiz/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    return response.json();
  },

  getQuizResults: async (quizId: string) => {
    const response = await fetchWithAuth(`/quiz/${quizId}/results`);
    return response.json();
  },

  getQuizHistory: async () => {
    const response = await fetchWithAuth('/quiz/history');
    return response.json();
  },

  // AI Chat
  chat: async (message: string, courseId: string, uploadId?: string) => {
    const response = await fetchWithAuth('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, course_id: courseId, upload_id: uploadId }),
    });
    return response.json();
  },

  // Voice Chat (returns audio)
  voiceChat: async (message: string, courseId: string, uploadId?: string, emotion: string = 'encouraging') => {
    const response = await fetchWithAuth('/ai/voice-chat', {
      method: 'POST',
      body: JSON.stringify({ message, course_id: courseId, upload_id: uploadId, emotion }),
    });

    // Get response text from header (base64 encoded)
    const responseTextB64 = response.headers.get('X-Response-Text');
    const responseText = responseTextB64 ? atob(responseTextB64) : '';

    // Get audio blob
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    return {
      text: responseText,
      audioUrl: audioUrl,
      emotion: response.headers.get('X-Emotion') || emotion,
    };
  },

  // Analytics
  getCourseAnalytics: async (courseId: string) => {
    const response = await fetchWithAuth(`/analytics/courses/${courseId}/analytics`);
    return response.json();
  },

  getStudentPerformance: async () => {
    const response = await fetchWithAuth('/analytics/performance');
    return response.json();
  },

  getStudyRecommendations: async () => {
    const response = await fetchWithAuth('/analytics/study-recommendations');
    return response.json();
  },

  // AI Platforms Integration
  getAIPlatformCapabilities: async () => {
    const response = await fetchWithAuth('/ai-platforms/capabilities');
    return response.json();
  },

  generateHybridQuiz: async (courseId: string, uploadIds: string[], numQuestions: number = 20, useDigitalOcean: boolean = true, useSnowflake: boolean = true) => {
    const response = await fetchWithAuth('/ai-platforms/hybrid-quiz', {
      method: 'POST',
      body: JSON.stringify({
        course_id: courseId,
        upload_ids: uploadIds,
        num_questions: numQuestions,
        use_digitalocean: useDigitalOcean,
        use_snowflake: useSnowflake,
      }),
    });
    return response.json();
  },

  getIntelligentStudyPlan: async (courseId: string) => {
    const response = await fetchWithAuth('/ai-platforms/intelligent-study-plan', {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId }),
    });
    return response.json();
  },

  getPlatformStats: async () => {
    const response = await fetchWithAuth('/ai-platforms/platform-stats');
    return response.json();
  },
};
