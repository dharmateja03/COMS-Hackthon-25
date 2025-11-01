import api from './api';
import type { Quiz, QuizAttempt } from '../types';

export const quizService = {
  async generateQuiz(courseId: string, uploadIds: string[]): Promise<Quiz> {
    const response = await api.post('/quiz/generate', {
      upload_ids: uploadIds,
      num_questions: 25
    });
    return response.data;
  },

  async submitQuiz(quizId: string, answers: Record<string, number>): Promise<QuizAttempt> {
    // Convert answers object to array format expected by backend
    const answersArray = Object.entries(answers).map(([question_id, selected_answer]) => ({
      question_id,
      selected_answer
    }));

    const response = await api.post(`/quiz/${quizId}/submit`, {
      answers: answersArray
    });
    return response.data;
  },

  async getQuizResults(quizId: string): Promise<QuizAttempt> {
    const response = await api.get(`/quiz/${quizId}/results`);
    return response.data;
  },

  async getQuizHistory(): Promise<QuizAttempt[]> {
    const response = await api.get('/quiz/history');
    return response.data;
  }
};
