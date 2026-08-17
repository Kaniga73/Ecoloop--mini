import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { EcoLoopLogo } from '../components/common/EcoLoopLogo';
import { AuthView } from '../types';

interface ResetPasswordPageProps {
  onNavigate: (view: AuthView) => void;
  onSuccessToast?: (msg: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate, onSuccessToast }) => {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || loading) return;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await updatePassword(newPassword);
      if (res.success) {
        setSuccess(true);
        if (onSuccessToast) onSuccessToast('Password updated successfully.');
      } else {
        setError(res.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setError('An unexpected error occurred.');
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
      id="reset-password-page-container"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06)] p-4 sm:p-5">
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <EcoLoopLogo size="lg" />
          </div>
          <h1 className="text-sm font-bold text-slate-900 tracking-normal font-sans">
            Set New Password
          </h1>
          <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
            Please enter your new password below.
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
              Your password has been updated. You can now sign in with your new password.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Sign in now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[13px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
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
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Update Password</span>
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
