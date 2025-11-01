import api from './api';
import type { Course } from '../types';

export const courseService = {
  async getCourses(): Promise<Course[]> {
    const response = await api.get('/courses');
    return response.data;
  },

  async getCourse(id: string): Promise<Course> {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  async createCourse(data: { name: string; description?: string }): Promise<Course> {
    const response = await api.post('/courses', data);
    return response.data;
  },

  async updateCourse(id: string, data: { name?: string; description?: string }): Promise<Course> {
    const response = await api.put(`/courses/${id}`, data);
    return response.data;
  },

  async deleteCourse(id: string): Promise<void> {
    await api.delete(`/courses/${id}`);
  }
};
