import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, RefreshCw, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { EcoLoopLogo } from '../components/common/EcoLoopLogo';

interface EmailVerificationPageProps {
  onNavigate: (view: 'login' | 'signup') => void;
  onSuccessToast?: (msg: string) => void;
}

export const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({
  onNavigate,
  onSuccessToast,
}) => {
  const {
    pendingVerificationEmail,
    setPendingVerificationEmail,
    resendVerificationEmail,
    verifyEmailOtp,
  } = useAuth();

  const [email, setEmail] = useState<string>(
    pendingVerificationEmail || 'alex.rivera@example.com'
  );
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState(email);

  // States
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Manual code input
  const [code, setCode] = useState('');

  // Handle resend countdown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setStatusMessage(null);

    try {
      const res = await resendVerificationEmail(email);
      if (res.success) {
        setResendCooldown(60);
        setStatusMessage({
          type: 'success',
          text: `A fresh verification link and security code have been sent to ${email}.`,
        });
        if (onSuccessToast) onSuccessToast('Verification email resent successfully.');
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Failed to resend verification email. Please try again.',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Network error while requesting verification link.',
      });
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (tokenToUse?: string) => {
    const token = tokenToUse || code;
    if (!token) {
      setStatusMessage({ type: 'error', text: 'Please enter the 6-digit code.' });
      setVerifying(false);
      return;
    }
    setVerifying(true);
    setStatusMessage(null);

    try {
      const res = await verifyEmailOtp(email, token);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Email verified successfully! You can now log in to your EcoLoop account.',
        });
        if (onSuccessToast) onSuccessToast('Email verified successfully!');
        setTimeout(() => {
          onNavigate('login');
        }, 1200);
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'The verification link or code is invalid or has expired.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Verification failed. Please request a new link.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveEditedEmail = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedEmail.trim())) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid email address.',
      });
      return;
    }
    setEmail(editedEmail.trim());
    setPendingVerificationEmail(editedEmail.trim());
    setIsEditingEmail(false);
    setStatusMessage({
      type: 'info',
      text: `Updated email to ${editedEmail.trim()}. Click Resend to dispatch verification link.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-[480px] mx-auto px-0 sm:px-2"
      id="verify-email-container"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06)] p-5 xs:p-6 sm:p-8">
        {/* Header Icon */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="flex justify-center mb-3">
            <EcoLoopLogo size="sm" />
          </div>

          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50 flex items-center justify-center">
            <Mail className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Space_Grotesk',sans-serif]">
            Check your inbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-1.5 leading-relaxed">
            We've sent a verification link to confirm your EcoLoop account.
          </p>
        </div>

        {/* Display and Edit Email Box */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
          {isEditingEmail ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Change Verification Email
              </label>
              <input
                type="email"
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
                placeholder="new.email@example.com"
                className="w-full px-3.5 py-2 bg-white text-slate-900 text-sm rounded-lg border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 outline-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditedEmail(email);
                    setIsEditingEmail(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedEmail}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Update Email
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Target Email Address
                </span>
                <p className="text-sm font-semibold text-slate-900 truncate mt-0.5" id="verification-target-email">
                  {email}
                </p>
              </div>
              <button
                type="button"
                id="change-verification-email-btn"
                onClick={() => setIsEditingEmail(true)}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold px-2.5 py-1 rounded-md hover:bg-emerald-50 transition-colors shrink-0 cursor-pointer"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-5 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs sm:text-sm ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-teal-50 border-teal-200 text-teal-900'
            }`}
            role="alert"
            id="verification-status-banner"
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{statusMessage.text}</div>
          </motion.div>
        )}

        {/* OTP Entry */}
        <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-white">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
            Enter Verification Code
          </label>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                maxLength={8}
                placeholder="Enter OTP code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 text-sm font-medium rounded-lg border border-slate-300 focus:bg-white focus:border-emerald-600 outline-none transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => handleVerifyOtp(code)}
              disabled={verifying || code.trim().length === 0}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Verify
            </button>
          </div>
        </div>

        {/* Resend actions */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            id="resend-verification-email-btn"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
            {resendCooldown > 0 ? (
              <span>Resend in {resendCooldown}s</span>
            ) : (
              <span>Resend verification email</span>
            )}
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            id="back-to-login-from-verify-btn"
            onClick={() => onNavigate('login')}
            className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to login</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('signup')}
            className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Create another account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
