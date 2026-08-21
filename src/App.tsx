import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthView } from './types';
import { AuthLayout } from './components/auth/AuthLayout';
import { SigninPage } from './pages/SigninPage';
import { SignupPage } from './pages/SignupPage';
import { EmailVerificationPage } from './pages/EmailVerificationPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { LandingPage } from './pages/LandingPage';
import { SellPage } from './pages/SellPage.tsx';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { AnimatePresence } from 'motion/react';

function getInitialView(): AuthView {
  const path = window.location.pathname.replace(/^\/+/, '');
  if (path === 'signup') return 'signup';
  if (path === 'verify-email') return 'verify-email';
  if (path === 'sell') return 'sell';
  return 'login';
}

function MainAuthApp() {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState<AuthView>(getInitialView);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Update browser history when view changes
  const handleNavigate = useCallback((view: AuthView) => {
    setCurrentView(view);
    const newPath = view === 'login' ? '/' : `/${view}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Strict Routing Enforcer
  useEffect(() => {
    if (isAuthenticated) {
      if (currentView !== 'home' && currentView !== 'sell') {
        handleNavigate('home');
      }
    } else {
      if (currentView === 'home') {
        handleNavigate('login');
      }
    }
  }, [isAuthenticated, currentView, handleNavigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Initializing EcoLoop Auth...
          </p>
        </div>
      </div>
    );
  }

  // Authenticated app shell — rendered full-bleed, NOT wrapped in AuthLayout
  // (AuthLayout centers/caps its children for login-style cards, which
  // would otherwise box in the full marketplace page)
  if (isAuthenticated && (currentView === 'home' || currentView === 'sell')) {
    return (
      <>
        {currentView === 'home' && (
          <LandingPage
            key="home-view"
            onLogoutToast={(msg) => addToast(msg, 'info')}
            onNavigateToAuth={(v) => handleNavigate(v)}
          />
        )}
        {currentView === 'sell' && (
          <SellPage
            key="sell-view"
            onNavigate={(v) => handleNavigate(v)}
            onSuccessToast={(msg) => addToast(msg, 'success')}
          />
        )}
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  // Unauthenticated flows — centered auth card layout
  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {currentView === 'login' && (
          <SigninPage
            key="login-view"
            onNavigate={(v) => handleNavigate(v)}
            onSuccessToast={(msg) => addToast(msg, 'success')}
          />
        )}

        {currentView === 'signup' && (
          <SignupPage
            key="signup-view"
            onNavigate={(v) => handleNavigate(v)}
            onSuccessToast={(msg) => addToast(msg, 'success')}
          />
        )}

        {currentView === 'verify-email' && (
          <EmailVerificationPage
            key="verify-email-view"
            onNavigate={(v) => handleNavigate(v)}
            onSuccessToast={(msg) => addToast(msg, 'success')}
          />
        )}

        {currentView === 'forgot-password' && (
          <ForgotPasswordPage
            key="forgot-password-view"
            onNavigate={(v) => handleNavigate(v)}
            onSuccessToast={(msg) => addToast(msg, 'success')}
          />
        )}

        {currentView === 'reset-password' && (
          <ResetPasswordPage
            key="reset-password-view"
            onNavigate={(v) => handleNavigate(v)}
            onSuccessToast={(msg) => addToast(msg, 'success')}
          />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </AuthLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAuthApp />
    </AuthProvider>
  );
}