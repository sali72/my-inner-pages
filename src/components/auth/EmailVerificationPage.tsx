import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Mail, Loader } from 'lucide-react';
export interface EmailVerificationPageProps {
  verificationToken?: string;
  onVerifyEmail: (token: string) => Promise<void>;
  onResendVerification: (email: string) => Promise<void>;
  onNavigateToLogin: () => void;
}

type VerificationStatus = 'verifying' | 'success' | 'error' | 'expired';

export const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({
  verificationToken,
  onVerifyEmail,
  onResendVerification,
  onNavigateToLogin,
}) => {
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (verificationToken) {
      verifyEmail(verificationToken);
    }
  }, [verificationToken]);

  const verifyEmail = async (token: string) => {
    setStatus('verifying');
    try {
      await onVerifyEmail(token);
      setStatus('success');
    } catch (err: any) {
      if (err.message?.includes('expired')) {
        setStatus('expired');
      } else {
        setStatus('error');
      }
    }
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsResending(true);
    try {
      await onResendVerification(email);
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-tint flex items-center justify-center">
              <Loader className="w-10 h-10 text-accent-tint-text animate-spin" />
            </div>

            <h2 className="text-2xl font-serif font-bold text-accent mb-3">
              Verifying Your Email
            </h2>

            <p className="text-sm text-secondary">
              Please wait while we verify your email address...
            </p>
          </>
        );

      case 'success':
        return (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>

            <h2 className="text-2xl font-serif font-bold text-accent mb-3">
              Email Verified!
            </h2>

            <p className="text-sm text-secondary mb-6">
              Your email has been successfully verified. You can now log in to your account.
            </p>

            <button
              onClick={onNavigateToLogin}
              className="btn-primary w-full py-3 px-4 rounded-lg font-medium transition-all"
            >
              Go to Login
            </button>
          </>
        );

      case 'expired':
        return (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-orange-500" />
            </div>

            <h2 className="text-2xl font-serif font-bold text-accent mb-3">
              Link Expired
            </h2>

            <p className="text-sm text-secondary mb-6">
              This verification link has expired. Please request a new verification email.
            </p>

            {resendSuccess ? (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
                <p className="text-sm text-green-500">
                  Verification email sent! Check your inbox.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResendVerification} className="space-y-4">
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
                      disabled={isResending}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm text-red-500">
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isResending}
                  className="btn-primary w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      <span>Resend Verification</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <button
              onClick={onNavigateToLogin}
              className="w-full mt-4 py-2 text-sm text-secondary hover:text-primary transition-colors"
            >
              Back to Login
            </button>
          </>
        );

      case 'error':
      default:
        return (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>

            <h2 className="text-2xl font-serif font-bold text-accent mb-3">
              Verification Failed
            </h2>

            <p className="text-sm text-secondary mb-6">
              We couldn't verify your email address. The link may be invalid or has already been used.
            </p>

            <div className="space-y-3">
              <button
                onClick={onNavigateToLogin}
                className="btn-primary w-full py-3 px-4 rounded-lg font-medium transition-all"
              >
                Go to Login
              </button>

              <p className="text-xs text-center text-tertiary">
                Need help?{' '}
                <button className="text-accent hover:underline">
                  Contact support
                </button>
              </p>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-accent mb-2">
            My Inner Pages
          </h1>
          <p className="text-sm text-secondary">
            Email verification
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-surface rounded-xl shadow-2xl border border-default p-8 text-center">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
