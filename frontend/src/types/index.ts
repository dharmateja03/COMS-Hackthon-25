export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Upload {
  id: string;
  course_id: string;
  file_name: string;
  file_path: string;
  file_type: 'pdf' | 'video';
  storage_url?: string;
  file_size_mb?: number;
  status: 'processing' | 'ready' | 'failed';
  text_content?: string;
  transcript?: string;
  video_duration_seconds?: number;
  timestamps?: Timestamp[];
  summary?: string;
  created_at: string;
  processed_at?: string;
}

export interface Timestamp {
  time_seconds: number;
  time_display: string;
  topic: string;
  description?: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  upload_ids: string[];
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: Answer[];
  score: number;
  completed_at: string;
}

export interface Answer {
  question_id: string;
  selected_answer: number;
}

export interface StudySession {
  id: string;
  course_id: string;
  upload_id: string;
  user_id: string;
  duration_minutes?: number;
  started_at: string;
  ended_at?: string;
}

export interface TimeBlock {
  id: string;
  course_id: string;
  days: string[];
  start_time: string;
  end_time: string;
}

export interface ConfidenceScore {
  id: string;
  upload_id: string;
  user_id: string;
  score: number;
  last_reviewed?: string;
  last_updated: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
