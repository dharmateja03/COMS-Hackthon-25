import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (authService.isAuthenticated()) {
          try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
          } catch (error: any) {
            console.error('Failed to load user:', error);
            // If it's a network error or server unavailable, don't clear auth
            // Only clear if it's actually an auth error (401)
            if (error.response?.status === 401 || error.response?.status === 403) {
              authService.logout();
            } else {
              // For network errors, just don't set the user but keep loading false
              // This allows the user to still navigate, but protected routes will redirect
              console.warn('Unable to verify user authentication, backend may be unavailable');
            }
          }
        }
      } catch (error) {
        console.error('Error during auth check:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    await authService.login({ email, password });
    const userData = await authService.getCurrentUser();
    setUser(userData);
  };

  const register = async (email: string, password: string) => {
    await authService.register({ email, password });
    const userData = await authService.getCurrentUser();
    setUser(userData);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
