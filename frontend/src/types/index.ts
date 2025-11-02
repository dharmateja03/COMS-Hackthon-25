export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Course {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  standard_course_code?: string;
  created_at: string;
}

export interface CourseCreate {
  name: string;
  description?: string;
  standard_course_code?: string;
}

export interface StandardCourse {
  code: string;
  name: string;
  display: string;
}

export interface Upload {
  id: string;
  course_id: string;
  file_name: string;
  file_type: 'pdf' | 'video';
  status: 'processing' | 'ready' | 'failed';
  created_at: string;
  text_content?: string;
  transcript?: string;
  timestamps?: any[];
  summary?: string;
  video_duration_seconds?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  upload_ids: string[];
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizGenerateRequest {
  upload_ids: string[];
  num_questions?: number;
}

export interface Answer {
  question_id: string;
  selected_answer: number;
}

export interface QuizSubmitRequest {
  answers: Answer[];
}

export interface QuestionResult {
  question_id: string;
  question: string;
  options: string[];
  selected_answer: number;
  correct_answer: number;
  is_correct: boolean;
  explanation: string;
}

export interface QuizResults {
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  results: QuestionResult[];
  completed_at: string;
}

export interface ChatRequest {
  message: string;
  course_id: string;
  upload_id?: string;
}

export interface ChatResponse {
  message: string;
  response: string;
}

export interface CourseAnalytics {
  course_id: string;
  course_name: string;
  total_quizzes: number;
  total_attempts: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  recent_attempts: any[];
  weak_topics: string[];
  strong_topics: string[];
  progress_over_time: Array<{ date: string; score: number }>;
}
