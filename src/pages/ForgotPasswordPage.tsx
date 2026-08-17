import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { EcoLoopLogo } from '../components/common/EcoLoopLogo';
import { AuthView } from '../types';

interface ForgotPasswordPageProps {
  onNavigate: (view: AuthView) => void;
  onSuccessToast?: (msg: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate, onSuccessToast }) => {
  const { sendPasswordResetEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await sendPasswordResetEmail(email.trim());
      if (res.success) {
        setSuccess(true);
        if (onSuccessToast) onSuccessToast('Password reset instructions sent to your email.');
      } else {
        setError(res.error || 'Failed to send password reset email.');
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
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
      className="w-full max-w-[460px] mx-auto px-0 sm:px-2"
      id="forgot-password-page-container"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06)] p-4 sm:p-5">
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <EcoLoopLogo size="lg" />
          </div>
          <h1 className="text-sm font-bold text-slate-900 tracking-normal font-sans">
            Forgot Password
          </h1>
          <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
            Enter your account email to receive a password reset link.
          </p>
        </div>

        {error && (
          <div className="mb-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-[13px]">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-medium text-emerald-900">
              Reset instructions sent to <strong className="font-bold">{email}</strong>.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Return to Sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[13px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign in</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
