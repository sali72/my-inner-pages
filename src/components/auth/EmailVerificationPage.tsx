import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Mail, Loader } from 'lucide-react';
export interface EmailVerificationPageProps {
  isDark: boolean;
  verificationToken?: string;
  onVerifyEmail: (token: string) => Promise<void>;
  onResendVerification: (email: string) => Promise<void>;
  onNavigateToLogin: () => void;
}

type VerificationStatus = 'verifying' | 'success' | 'error' | 'expired';

export const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({
  isDark,
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
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${
              isDark ? 'bg-blue-900/30' : 'bg-blue-100'
            } flex items-center justify-center`}>
              <Loader className={`w-10 h-10 ${isDark ? 'text-blue-400' : 'text-blue-600'} animate-spin`} />
            </div>
            
            <h2 className={`text-2xl font-serif font-bold text-accent mb-3`}>
              Verifying Your Email
            </h2>
            
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Please wait while we verify your email address...
            </p>
          </>
        );

      case 'success':
        return (
          <>
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${
              isDark ? 'bg-green-900/30' : 'bg-green-100'
            } flex items-center justify-center`}>
              <CheckCircle className={`w-10 h-10 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            
            <h2 className={`text-2xl font-serif font-bold text-accent mb-3`}>
              Email Verified!
            </h2>
            
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-6`}>
              Your email has been successfully verified. You can now log in to your account.
            </p>
            
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
          </>
        );

      case 'expired':
        return (
          <>
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${
              isDark ? 'bg-orange-900/30' : 'bg-orange-100'
            } flex items-center justify-center`}>
              <XCircle className={`w-10 h-10 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
            
            <h2 className={`text-2xl font-serif font-bold text-accent mb-3`}>
              Link Expired
            </h2>
            
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-6`}>
              This verification link has expired. Please request a new verification email.
            </p>
            
            {resendSuccess ? (
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'
              } mb-4`}>
                <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                  Verification email sent! Check your inbox.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResendVerification} className="space-y-4">
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
                      disabled={isResending}
                    />
                  </div>
                </div>

                {error && (
                  <div className={`p-3 rounded-lg ${
                    isDark ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isResending}
                  className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                    isDark
                      ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500'
                      : 'bg-amber-500 text-white hover:bg-amber-600 disabled:bg-amber-200 disabled:text-amber-400'
                  } ${isResending ? 'cursor-not-allowed' : ''}`}
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
              className={`w-full mt-4 py-2 text-sm ${
                isDark ? 'text-slate-400 hover:text-slate-300' : 'text-amber-600 hover:text-amber-700'
              } transition-colors`}
            >
              Back to Login
            </button>
          </>
        );

      case 'error':
      default:
        return (
          <>
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${
              isDark ? 'bg-red-900/30' : 'bg-red-100'
            } flex items-center justify-center`}>
              <XCircle className={`w-10 h-10 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            </div>
            
            <h2 className={`text-2xl font-serif font-bold text-accent mb-3`}>
              Verification Failed
            </h2>
            
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-6`}>
              We couldn't verify your email address. The link may be invalid or has already been used.
            </p>
            
            <div className="space-y-3">
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
              
              <p className={`text-xs text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Need help?{' '}
                <button className={`${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-amber-600 hover:text-amber-700'}`}>
                  Contact support
                </button>
              </p>
            </div>
          </>
        );
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br bg-page-gradient flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-serif font-bold text-accent mb-2`}>
            My Inner Pages
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-amber-600'}`}>
            Email verification
          </p>
        </div>

        {/* Verification Card */}
        <div className={`bg-surface rounded-xl shadow-2xl border border-default p-8 text-center`}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
