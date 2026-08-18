import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { EcoLoopLogo } from '../components/common/EcoLoopLogo';

interface SigninPageProps {
  onNavigate: (view: 'signup' | 'forgot-password' | 'verify-email') => void;
  onSuccessToast?: (msg: string) => void;
}

export const SigninPage: React.FC<SigninPageProps> = ({ onNavigate, onSuccessToast }) => {
  const { login, setPendingVerificationEmail } = useAuth();

  const [email, setEmail] = useState('');
    
  // States
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ email?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const errors: { email?: string } = {};

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }


    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || success) return; // Prevent multiple submissions

    setServerError(null);
    setNetworkError(null);

    if (!validate()) return;

    setLoading(true);

    try {
      const result = await login(email);

      if (result.success) {
        setSuccess(true);
        if (onSuccessToast) {
          onSuccessToast('Signed in successfully.');
        }
      } else {
        if (result.error?.includes('verify your email')) {
          setPendingVerificationEmail(email);
          onNavigate('verify-email');
        } else if (result.error?.toLowerCase().includes('network') || result.error?.toLowerCase().includes('fetch')) {
          setNetworkError('Network connectivity issue. Please check your connection and try again.');
        } else {
          setServerError(result.error || 'Invalid credentials.');
        }
      }
    } catch (err: any) {
      setNetworkError('A network error occurred. Please verify your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-[440px] mx-auto px-0 sm:px-2"
      id="login-page-container"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06)] p-5 sm:p-6">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <EcoLoopLogo size="md" />
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-sans">
            Welcome back
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Sign in to access your EcoLoop account
          </p>
        </div>

        {/* Invalid Credentials or Server Error */}
        {serverError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-3.5 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-[13px]"
            role="alert"
            id="login-error-banner"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{serverError}</p>
            </div>
          </motion.div>
        )}

        {/* Network Error */}
        {networkError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-3.5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-[13px]"
            role="alert"
            id="login-network-banner"
          >
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Connection Issue</p>
              <p className="mt-0.5 text-[13px] text-amber-700">{networkError}</p>
            </div>
          </motion.div>
        )}

        {/* Success Alert */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-3.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-[13px] font-medium"
            id="login-success-banner"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Authenticated successfully. Initializing session...</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate id="login-form">
          {/* Email field */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-[12px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                disabled={loading || success}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) {
                    setValidationErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border transition-all duration-200 outline-none ${
                  validationErrors.email
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/10'
                    : 'border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              />
            </div>
            {validationErrors.email && (
              <p className="text-[12px] text-rose-600 mt-1 font-medium" id="email-validation-error">
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-1.5">
            <button
              type="submit"
              id="login-submit-button"
              disabled={loading || success}
              className="w-48 py-2 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[13px] font-semibold rounded-xl shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-3 focus:ring-emerald-600/30 disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Signing in...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Bottom Switch */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-[13px] text-slate-600">
            Don't have an account?{' '}
            <button
              type="button"
              id="goto-signup-button"
              onClick={() => onNavigate('signup')}
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors focus:outline-none ml-1 cursor-pointer"
            >
              Create account
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};
