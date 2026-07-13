import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react';
export interface RegisterPageProps {
  isDark: boolean;
  onRegister: (email: string, password: string, confirmPassword: string) => Promise<void>;
  onNavigateToLogin: () => void;
  onBack?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  isDark,
  onRegister,
  onNavigateToLogin,
  onBack,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Password strength indicator
  const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    if (!pwd) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { 
      strength, 
      label: 'Weak', 
      color: isDark ? 'bg-red-700' : 'bg-red-400' 
    };
    if (strength <= 3) return { 
      strength, 
      label: 'Medium', 
      color: isDark ? 'bg-yellow-600' : 'bg-yellow-400' 
    };
    return { 
      strength, 
      label: 'Strong', 
      color: isDark ? 'bg-green-600' : 'bg-green-400' 
    };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await onRegister(email.toLowerCase().trim(), password, confirmPassword);
      setRegistrationSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state - no email verification needed
  if (registrationSuccess) {
    return (
      <div className={`min-h-screen bg-gradient-to-br bg-page-gradient flex items-center justify-center p-4`}>
        <div className="w-full max-w-md">
          <div className={`bg-surface rounded-xl shadow-2xl border border-default p-8 text-center`}>
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${
              isDark ? 'bg-green-900/30' : 'bg-green-100'
            } flex items-center justify-center`}>
              <CheckCircle className={`w-10 h-10 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            
            <h2 className={`text-2xl font-serif font-bold text-accent mb-3`}>
              Account Created!
            </h2>
            
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-2`}>
              Your account has been successfully created:
            </p>
            
            <p className={`text-base font-medium text-accent mb-6`}>
              {email}
            </p>
            
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-slate-700/50' : 'bg-amber-50'
            } mb-6`}>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                You can now login with your email and password to start journaling.
              </p>
            </div>
            
            <button
              onClick={onNavigateToLogin}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                isDark
                  ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            Begin your journaling journey
          </p>
        </div>

        {/* Register Card */}
        <div className={`bg-surface rounded-xl shadow-2xl border border-default p-8`}>
          <h2 className={`text-2xl font-serif font-bold text-accent mb-6`}>
            Create Account
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
                  placeholder="At least 8 characters"
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
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < passwordStrength.strength
                            ? passwordStrength.color
                            : isDark ? 'bg-slate-700' : 'bg-amber-100'
                        } transition-all`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Password strength: <span className="font-medium">{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-amber-800'} mb-2`}
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDark ? 'text-slate-500' : 'text-amber-400'
                }`} />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    isDark ? 'text-slate-500 hover:text-slate-400' : 'text-amber-400 hover:text-amber-600'
                  } transition-colors`}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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

            {/* Terms and Conditions */}
            <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-amber-50'}`}>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                By creating an account, you agree to our{' '}
                <button type="button" className={`${isDark ? 'text-slate-300' : 'text-amber-700'} hover:underline`}>
                  Terms of Service
                </button>{' '}
                and{' '}
                <button type="button" className={`${isDark ? 'text-slate-300' : 'text-amber-700'} hover:underline`}>
                  Privacy Policy
                </button>
              </p>
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
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Already have an account?{' '}
              <button
                onClick={onNavigateToLogin}
                className={`font-medium ${
                  isDark ? 'text-slate-300 hover:text-slate-200' : 'text-amber-600 hover:text-amber-700'
                } transition-colors`}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
