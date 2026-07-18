import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
export interface ForgotPasswordPageProps {
  onResetPassword: (email: string) => Promise<void>;
  onNavigateToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onResetPassword,
  onNavigateToLogin,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await onResetPassword(email.toLowerCase().trim());
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (resetSent) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-xl shadow-2xl border border-default p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>

            <h2 className="text-2xl font-serif font-bold text-accent mb-3">
              Check Your Email
            </h2>

            <p className="text-sm text-secondary mb-2">
              We've sent password reset instructions to:
            </p>

            <p className="text-base font-medium text-accent mb-6">
              {email}
            </p>

            <div className="p-4 rounded-lg bg-surface border border-subtle mb-6">
              <p className="text-sm text-secondary">
                Please click the reset link in your email to create a new password.
                The link will expire in 1 hour.
              </p>
            </div>

            <button
              onClick={onNavigateToLogin}
              className="btn-primary w-full py-3 px-4 rounded-lg font-medium transition-all"
            >
              Back to Login
            </button>

            <p className="text-xs text-tertiary mt-4">
              Didn't receive the email?{' '}
              <button
                onClick={() => setResetSent(false)}
                className="text-accent hover:underline"
              >
                Try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-accent mb-2">
            My Inner Pages
          </h1>
          <p className="text-sm text-secondary">
            Reset your password
          </p>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-surface rounded-xl shadow-2xl border border-default p-8">
          {/* Back Button */}
          <button
            onClick={onNavigateToLogin}
            className="flex items-center gap-2 mb-6 text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to login</span>
          </button>

          <h2 className="text-2xl font-serif font-bold text-accent mb-3">
            Forgot Password?
          </h2>

          <p className="text-sm text-secondary mb-6">
            No worries! Enter your email address and we'll send you instructions to reset your password.
          </p>

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
                  autoFocus
                />
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
