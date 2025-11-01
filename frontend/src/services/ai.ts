import api from './api';

export interface ChatRequest {
  message: string;
  course_id: string;
  upload_id?: string;
}

export interface ChatResponse {
  message: string;
  response: string;
}

export const aiService = {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await api.post('/ai/chat', request);
    return response.data;
  },

  async search(courseId: string, query: string): Promise<any[]> {
    const response = await api.post('/ai/search', {
      course_id: courseId,
      query
    });
    return response.data;
  }
};
