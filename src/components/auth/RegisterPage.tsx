import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react';
export interface RegisterPageProps {
  onRegister: (email: string, password: string, confirmPassword: string) => Promise<void>;
  onNavigateToLogin: () => void;
  onBack?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
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
      color: 'bg-red-500',
    };
    if (strength <= 3) return {
      strength,
      label: 'Medium',
      color: 'bg-yellow-500',
    };
    return {
      strength,
      label: 'Strong',
      color: 'bg-green-500',
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

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-xl shadow-2xl border border-default p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-tint flex items-center justify-center">
              <Mail className="w-10 h-10 text-accent-tint-text" />
            </div>

            <h2 className="text-2xl font-serif font-bold text-accent mb-3">
              Check Your Email
            </h2>

            <p className="text-sm text-secondary mb-2">
              Account created for:
            </p>

            <p className="text-base font-medium text-accent mb-6">
              {email}
            </p>

            <div className="p-4 rounded-lg bg-surface border border-subtle mb-6">
              <p className="text-sm text-secondary">
                We've sent a verification link to your email.
                Please verify your email address before logging in.
              </p>
            </div>

            <button
              onClick={onNavigateToLogin}
              className="btn-primary w-full py-3 px-4 rounded-lg font-medium transition-all"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 text-sm text-secondary hover:text-primary transition-colors flex items-center gap-1"
          >
            ← Back to landing
          </button>
        )}

        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-accent mb-2">
            My Inner Pages
          </h1>
          <p className="text-sm text-secondary">
            Begin your journaling journey
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-surface rounded-xl shadow-2xl border border-default p-8">
          <h2 className="text-2xl font-serif font-bold text-accent mb-6">
            Create Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-secondary mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-tertiary" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field w-full pl-10 pr-4 py-3"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-secondary mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-tertiary" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="input-field w-full pl-10 pr-12 py-3"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-tertiary hover:text-secondary transition-colors"
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
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < passwordStrength.strength
                            ? passwordStrength.color
                            : 'bg-surface-hover'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-secondary">
                    Password strength: <span className="font-medium">{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-secondary mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-tertiary" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="input-field w-full pl-10 pr-12 py-3"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-tertiary hover:text-secondary transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-500">
                  {error}
                </p>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="p-3 rounded-lg bg-surface border border-subtle">
              <p className="text-xs text-secondary">
                By creating an account, you agree to our{' '}
                <button type="button" className="text-accent hover:underline">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button type="button" className="text-accent hover:underline">
                  Privacy Policy
                </button>
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="text-sm text-secondary">
              Already have an account?{' '}
              <button
                onClick={onNavigateToLogin}
                className="font-medium text-accent hover:underline transition-colors"
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
