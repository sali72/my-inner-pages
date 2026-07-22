import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { toast } from 'sonner';
import { emitAuthSessionChanged } from '@/utils/authSession';

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v0';

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  role: string;
  created_at?: string;
  login_count?: number;
  feedback_triggers?: Record<string, boolean>;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearSessionData() {
  localStorage.removeItem('chat_messages');
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);
  const authCheckVersionRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearSessionData();
      emitAuthSessionChanged(false);
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      checkAuthStatus();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const checkAuthStatus = async () => {
    const requestVersion = ++authCheckVersionRef.current;

    try {
      if (!mountedRef.current) return;
      const response = await fetch(`${API_URL}/auth/verify`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        if (!mountedRef.current || requestVersion !== authCheckVersionRef.current) return;

        const userData = await response.json();
        if (!mountedRef.current || requestVersion !== authCheckVersionRef.current) return;
        setUser({
          id: userData.id,
          email: userData.email,
          emailVerified: userData.is_verified || false,
          role: userData.role || 'user',
          created_at: userData.created_at,
          login_count: userData.login_count ?? 0,
          feedback_triggers: userData.feedback_triggers || {},
        });
        setIsAuthenticated(true);
      } else if (response.status === 401) {
        clearSessionData();
        emitAuthSessionChanged(false);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      if (!mountedRef.current || requestVersion !== authCheckVersionRef.current) return;
      // Network failures are common when a mobile tab resumes. Keep the
      // current session; a later focus/online event will verify it again.
    } finally {
      if (mountedRef.current && requestVersion === authCheckVersionRef.current) setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    authCheckVersionRef.current += 1;
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        toast.error('Too many login attempts — please wait a moment');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    const userData = data.user;

    emitAuthSessionChanged(true);

    setUser({
      id: userData.id,
      email: userData.email,
      emailVerified: userData.is_verified || false,
      role: userData.role || 'user',
      created_at: userData.created_at,
      login_count: userData.login_count ?? 0,
      feedback_triggers: userData.feedback_triggers || {},
    });
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(async (email: string, password: string, confirmPassword: string): Promise<void> => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        password, 
        confirm_password: confirmPassword 
      }),
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        toast.error('Too many registration attempts — please wait a moment');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }
  }, []);

  const verifyEmail = useCallback(async (token: string): Promise<void> => {
    const response = await fetch(`${API_URL}/auth/verify-email/${token}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Verification failed');
    }
  }, []);

  const resendVerification = useCallback(async (email: string): Promise<void> => {
    const response = await fetch(`${API_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        toast.error('Too many requests — please wait a moment');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to resend verification email');
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        toast.error('Too many password reset attempts — please wait a moment');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send reset email');
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Proceed with local cleanup even if the server request fails.
    }
    clearSessionData();
    emitAuthSessionChanged(false);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    resetPassword,
    verifyEmail,
    resendVerification,
  }), [user, isAuthenticated, isLoading, login, register, logout, resetPassword, verifyEmail, resendVerification]);

  return (
    <AuthContext.Provider value={value}>
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
