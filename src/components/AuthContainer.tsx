import React, { useState } from 'react';
import { ThemeType } from '@/types';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { EmailVerificationPage } from './EmailVerificationPage';

export type AuthView = 'login' | 'register' | 'forgot-password' | 'verify-email';

export interface AuthContainerProps {
  theme: ThemeType;
  onAuthSuccess: () => void;
  initialView?: AuthView;
  verificationToken?: string;
}

/**
 * AuthContainer manages the authentication flow
 * It handles navigation between login, register, forgot password, and email verification pages
 */
export const AuthContainer: React.FC<AuthContainerProps> = ({
  theme,
  onAuthSuccess,
  initialView = 'login',
  verificationToken,
}) => {
  const [currentView, setCurrentView] = useState<AuthView>(
    verificationToken ? 'verify-email' : initialView
  );
  
  const { login, register, resetPassword } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    onAuthSuccess();
  };

  const handleRegister = async (email: string, password: string, confirmPassword: string) => {
    await register(email, password, confirmPassword);
  };

  const handleVerifyEmail = async (_token: string) => {
    // Email verification not implemented
  };

  const handleResendVerification = async (_email: string) => {
    // Email verification not implemented
  };

  const handleResetPassword = async (email: string) => {
    await resetPassword(email);
  };

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginPage
            theme={theme}
            onLogin={handleLogin}
            onNavigateToRegister={() => setCurrentView('register')}
            onForgotPassword={() => setCurrentView('forgot-password')}
          />
        );

      case 'register':
        return (
          <RegisterPage
            theme={theme}
            onRegister={handleRegister}
            onNavigateToLogin={() => setCurrentView('login')}
          />
        );

      case 'forgot-password':
        return (
          <ForgotPasswordPage
            theme={theme}
            onResetPassword={handleResetPassword}
            onNavigateToLogin={() => setCurrentView('login')}
          />
        );

      case 'verify-email':
        return (
          <EmailVerificationPage
            theme={theme}
            verificationToken={verificationToken}
            onVerifyEmail={handleVerifyEmail}
            onResendVerification={handleResendVerification}
            onNavigateToLogin={() => setCurrentView('login')}
          />
        );

      default:
        return null;
    }
  };

  return <>{renderView()}</>;
};
