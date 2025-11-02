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

export interface VoiceChatRequest {
  message: string;
  course_id: string;
  upload_id?: string;
  emotion?: 'neutral' | 'encouraging' | 'excited' | 'patient' | 'serious' | 'congratulatory';
}

export interface VoiceChatResponse {
  audioBlob: Blob;
  responseText: string;
  emotion: string;
}

export const aiService = {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await api.post('/ai/chat', request);
    return response.data;
  },

  async voiceChat(request: VoiceChatRequest): Promise<VoiceChatResponse> {
    const response = await api.post('/ai/voice-chat', request, {
      responseType: 'blob'
    });

    // Extract text from headers (base64 encoded to avoid header issues)
    const responseTextB64 = response.headers['x-response-text'] || '';
    const emotion = response.headers['x-emotion'] || 'neutral';

    // Decode base64 response text
    let responseText = '';
    try {
      responseText = atob(responseTextB64);
    } catch (e) {
      console.error('Error decoding response text:', e);
      responseText = 'Response received';
    }

    return {
      audioBlob: response.data,
      responseText,
      emotion
    };
  },

  async textToSpeech(text: string, emotion: string = 'neutral'): Promise<Blob> {
    const response = await api.post('/ai/text-to-speech', {
      text,
      emotion
    }, {
      responseType: 'blob'
    });
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
