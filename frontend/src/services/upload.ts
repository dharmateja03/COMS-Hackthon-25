import api from './api';
import { Upload } from '../types';

export const uploadService = {
  async getUploads(courseId: string): Promise<Upload[]> {
    const response = await api.get(`/courses/${courseId}/uploads`);
    return response.data;
  },

  async getUpload(uploadId: string): Promise<Upload> {
    const response = await api.get(`/uploads/${uploadId}`);
    return response.data;
  },

  async uploadFile(courseId: string, file: File): Promise<Upload> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/courses/${courseId}/uploads`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteUpload(uploadId: string): Promise<void> {
    await api.delete(`/uploads/${uploadId}`);
  }
};
