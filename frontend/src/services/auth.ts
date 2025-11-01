import api from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export const authService = {
  async login(data: LoginData): Promise<string> {
    const response = await api.post('/auth/login', data);
    const token = response.data.access_token;
    localStorage.setItem('token', token);
    return token;
  },

  async register(data: RegisterData): Promise<string> {
    const response = await api.post('/auth/register', data);
    const token = response.data.access_token;
    localStorage.setItem('token', token);
    return token;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
