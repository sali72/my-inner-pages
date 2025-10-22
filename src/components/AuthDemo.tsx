import React, { useState } from 'react';
import { ThemeType } from '@/types';
import { THEMES } from '@constants/themes';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { EmailVerificationPage } from './EmailVerificationPage';

/**
 * AuthDemo - A visual showcase of all authentication components
 * This component is for demonstration purposes only.
 * 
 * To preview the auth components:
 * 1. Import this component in your App.tsx
 * 2. Render <AuthDemo /> instead of the main app
 * 3. Use the theme selector and page selector to preview different states
 */

type DemoPage = 'login' | 'register' | 'forgot-password' | 'verify-email-success' | 'verify-email-error' | 'verify-email-expired';

export const AuthDemo: React.FC = () => {
  const [theme, setTheme] = useState<ThemeType>('vintage');
  const [currentPage, setCurrentPage] = useState<DemoPage>('login');

  const handleDemoAction = async (message: string) => {
    console.log('Demo action:', message);
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return (
          <LoginPage
            theme={theme}
            onLogin={async (email, password) => {
              await handleDemoAction(`Login: ${email}`);
              alert(`Demo: Would log in with ${email}`);
            }}
            onNavigateToRegister={() => setCurrentPage('register')}
            onForgotPassword={() => setCurrentPage('forgot-password')}
          />
        );

      case 'register':
        return (
          <RegisterPage
            theme={theme}
            onRegister={async (email, password, confirmPassword) => {
              await handleDemoAction(`Register: ${email}`);
              // Component will show success state automatically
            }}
            onNavigateToLogin={() => setCurrentPage('login')}
          />
        );

      case 'forgot-password':
        return (
          <ForgotPasswordPage
            theme={theme}
            onResetPassword={async (email) => {
              await handleDemoAction(`Reset password for: ${email}`);
              // Component will show success state automatically
            }}
            onNavigateToLogin={() => setCurrentPage('login')}
          />
        );

      case 'verify-email-success':
        return (
          <EmailVerificationPage
            theme={theme}
            verificationToken="valid-token"
            onVerifyEmail={async (token) => {
              await handleDemoAction(`Verify token: ${token}`);
              // Success - no error thrown
            }}
            onResendVerification={async (email) => {
              await handleDemoAction(`Resend verification: ${email}`);
            }}
            onNavigateToLogin={() => setCurrentPage('login')}
          />
        );

      case 'verify-email-error':
        return (
          <EmailVerificationPage
            theme={theme}
            verificationToken="invalid"
            onVerifyEmail={async (token) => {
              await handleDemoAction(`Verify token: ${token}`);
              throw new Error('Invalid verification token');
            }}
            onResendVerification={async (email) => {
              await handleDemoAction(`Resend verification: ${email}`);
            }}
            onNavigateToLogin={() => setCurrentPage('login')}
          />
        );

      case 'verify-email-expired':
        return (
          <EmailVerificationPage
            theme={theme}
            verificationToken="expired"
            onVerifyEmail={async (token) => {
              await handleDemoAction(`Verify token: ${token}`);
              throw new Error('Verification link has expired');
            }}
            onResendVerification={async (email) => {
              await handleDemoAction(`Resend verification: ${email}`);
            }}
            onNavigateToLogin={() => setCurrentPage('login')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Demo Controls - Floating Panel */}
      <div className="fixed top-4 right-4 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 p-4 max-w-xs">
        <h3 className="text-lg font-serif font-bold text-slate-800 dark:text-slate-200 mb-3">
          🎨 Auth Demo Controls
        </h3>

        {/* Theme Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Theme
          </label>
          <div className="flex gap-2">
            {(['vintage', 'minimal', 'dark'] as ThemeType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                  theme === t
                    ? t === 'vintage'
                      ? 'bg-amber-500 text-white'
                      : t === 'minimal'
                      ? 'bg-slate-500 text-white'
                      : 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Page Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Page
          </label>
          <div className="space-y-1">
            {[
              { value: 'login', label: '🔐 Login' },
              { value: 'register', label: '✍️ Register' },
              { value: 'forgot-password', label: '🔑 Forgot Password' },
              { value: 'verify-email-success', label: '✅ Email Verify (Success)' },
              { value: 'verify-email-error', label: '❌ Email Verify (Error)' },
              { value: 'verify-email-expired', label: '⏰ Email Verify (Expired)' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setCurrentPage(value as DemoPage)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  currentPage === value
                    ? 'bg-blue-500 text-white font-medium'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This is a demo environment. Form submissions will show alerts instead of actual authentication.
          </p>
        </div>
      </div>

      {/* Render Selected Page */}
      {renderPage()}
    </div>
  );
};
