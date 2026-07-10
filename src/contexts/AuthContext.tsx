import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v0';

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearSessionData() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('chat_messages');
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await fetch(`${API_URL}/auth/verify`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser({
            id: userData.id,
            email: userData.email,
            emailVerified: userData.is_verified || false,
            role: userData.role || 'user',
          });
          setIsAuthenticated(true);
        } else {
          clearSessionData();
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearSessionData();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }
    
    const data = await response.json();
    const token = data.access_token;
    const userData = data.user;
    
    localStorage.setItem('authToken', token);
    
    const newUser = {
      id: userData.id,
      email: userData.email,
      emailVerified: userData.is_verified || false,
      role: userData.role || 'user',
    };
    
    setUser(newUser);
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
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send reset email');
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    clearSessionData();
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
  }), [user, isAuthenticated, isLoading, login, register, logout, resetPassword]);

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
