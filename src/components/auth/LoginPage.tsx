import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
export interface LoginPageProps {
  isDark: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigateToRegister: () => void;
  onForgotPassword: () => void;
  onBack?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  isDark,
  onLogin,
  onNavigateToRegister,
  onForgotPassword,
  onBack,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br bg-page-gradient flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className={`mb-4 text-sm ${
              isDark ? 'text-slate-400 hover:text-slate-300' : 'text-amber-600 hover:text-amber-700'
            } transition-colors flex items-center gap-1`}
          >
            ← Back to landing
          </button>
        )}
        
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-serif font-bold text-accent mb-2`}>
            My Inner Pages
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-amber-600'}`}>
            Your personal journaling sanctuary
          </p>
        </div>

        {/* Login Card */}
        <div className={`bg-surface rounded-xl shadow-2xl border border-default p-8`}>
          <h2 className={`text-2xl font-serif font-bold text-accent mb-6`}>
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-amber-800'} mb-2`}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDark ? 'text-slate-500' : 'text-amber-400'
                }`} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${
                    isDark
                      ? 'border-slate-600 bg-slate-700 text-slate-200 placeholder-slate-500 focus:border-slate-500'
                      : 'border-amber-200 bg-white text-amber-900 placeholder-amber-300 focus:border-amber-400'
                  } focus:outline-none focus:ring-2 ${
                    isDark ? 'focus:ring-slate-400' : 'focus:ring-amber-300'
                  } transition-all`}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-amber-800'} mb-2`}
              >
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDark ? 'text-slate-500' : 'text-amber-400'
                }`} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border-2 ${
                    isDark
                      ? 'border-slate-600 bg-slate-700 text-slate-200 placeholder-slate-500 focus:border-slate-500'
                      : 'border-amber-200 bg-white text-amber-900 placeholder-amber-300 focus:border-amber-400'
                  } focus:outline-none focus:ring-2 ${
                    isDark ? 'focus:ring-slate-400' : 'focus:ring-amber-300'
                  } transition-all`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    isDark ? 'text-slate-500 hover:text-slate-400' : 'text-amber-400 hover:text-amber-600'
                  } transition-colors`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`p-3 rounded-lg ${
                isDark ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                  {error}
                </p>
              </div>
            )}

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onForgotPassword}
                className={`text-sm ${
                  isDark ? 'text-slate-400 hover:text-slate-300' : 'text-amber-600 hover:text-amber-700'
                } transition-colors`}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                isDark
                  ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500'
                  : 'bg-amber-500 text-white hover:bg-amber-600 disabled:bg-amber-200 disabled:text-amber-400'
              } ${isLoading ? 'cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Don't have an account?{' '}
              <button
                onClick={onNavigateToRegister}
                className={`font-medium ${
                  isDark ? 'text-slate-300 hover:text-slate-200' : 'text-amber-600 hover:text-amber-700'
                } transition-colors`}
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
