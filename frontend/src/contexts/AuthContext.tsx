import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { toast } from 'sonner';
import { emitAuthSessionChanged } from '@/utils/authSession';
import { authService } from '@/services/authService';

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

function mapUser(data: { id: string; email: string; is_verified?: boolean; role?: string; created_at?: string; login_count?: number; feedback_triggers?: Record<string, boolean> }): User {
  return {
    id: data.id,
    email: data.email,
    emailVerified: data.is_verified || false,
    role: data.role || 'user',
    created_at: data.created_at,
    login_count: data.login_count ?? 0,
    feedback_triggers: data.feedback_triggers || {},
  };
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
      const userData = await authService.checkStatus();

      if (userData) {
        if (!mountedRef.current || requestVersion !== authCheckVersionRef.current) return;
        setUser(mapUser(userData));
        setIsAuthenticated(true);
      } else {
        clearSessionData();
        emitAuthSessionChanged(false);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      if (!mountedRef.current || requestVersion !== authCheckVersionRef.current) return;
    } finally {
      if (mountedRef.current && requestVersion === authCheckVersionRef.current) setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    authCheckVersionRef.current += 1;
    const data = await authService.login(email, password).catch((err) => {
      if (err.message?.includes('429')) {
        toast.error('Too many login attempts — please wait a moment');
      }
      throw err;
    });

    emitAuthSessionChanged(true);
    setUser(mapUser(data.user));
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(async (email: string, password: string, confirmPassword: string): Promise<void> => {
    await authService.register(email, password, confirmPassword).catch((err) => {
      if (err.message?.includes('429')) {
        toast.error('Too many registration attempts — please wait a moment');
      }
      throw err;
    });
  }, []);

  const verifyEmail = useCallback(async (token: string): Promise<void> => {
    await authService.verifyEmail(token);
  }, []);

  const resendVerification = useCallback(async (email: string): Promise<void> => {
    await authService.resendVerification(email).catch((err) => {
      if (err.message?.includes('429')) {
        toast.error('Too many requests — please wait a moment');
      }
      throw err;
    });
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    await authService.resetPassword(email).catch((err) => {
      if (err.message?.includes('429')) {
        toast.error('Too many password reset attempts — please wait a moment');
      }
      throw err;
    });
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authService.logout();
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
