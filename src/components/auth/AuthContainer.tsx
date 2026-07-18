import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { EmailVerificationPage } from './EmailVerificationPage';

export type AuthView = 'login' | 'register' | 'forgot-password' | 'verify-email';

export interface AuthContainerProps {
  onAuthSuccess: () => void;
  onBack?: () => void;
  initialView?: AuthView;
  verificationToken?: string;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({
  onAuthSuccess,
  onBack,
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

  const handleVerifyEmail = async (_token: string) => {};

  const handleResendVerification = async (_email: string) => {};

  const handleResetPassword = async (email: string) => {
    await resetPassword(email);
  };

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginPage
            onLogin={handleLogin}
            onNavigateToRegister={() => setCurrentView('register')}
            onForgotPassword={() => setCurrentView('forgot-password')}
            onBack={onBack}
          />
        );

      case 'register':
        return (
          <RegisterPage
            onRegister={handleRegister}
            onNavigateToLogin={() => setCurrentView('login')}
            onBack={onBack}
          />
        );

      case 'forgot-password':
        return (
          <ForgotPasswordPage
            onResetPassword={handleResetPassword}
            onNavigateToLogin={() => setCurrentView('login')}
          />
        );

      case 'verify-email':
        return (
          <EmailVerificationPage
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
