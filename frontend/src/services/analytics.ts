import api from './api';

export interface QuizAttemptSummary {
  id: string;
  quiz_id: string;
  score: number;
  time_taken_seconds?: number;
  completed_at: string;
  weak_topics: string[];
  strong_topics: string[];
}

export interface CourseAnalytics {
  course_id: string;
  course_name: string;
  total_quizzes: number;
  total_attempts: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  recent_attempts: QuizAttemptSummary[];
  weak_topics: string[];
  strong_topics: string[];
  progress_over_time: Array<{date: string; score: number}>;
}

export interface StudentPerformance {
  overall_average: number;
  total_quizzes_taken: number;
  total_study_time_hours: number;
  weak_areas: string[];
  strong_areas: string[];
  recommended_topics: string[];
  recent_trend: 'improving' | 'declining' | 'stable';
}

export const analyticsService = {
  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    const response = await api.get(`/analytics/courses/${courseId}/analytics`);
    return response.data;
  },

  async getStudentPerformance(): Promise<StudentPerformance> {
    const response = await api.get('/analytics/performance');
    return response.data;
  }
};
