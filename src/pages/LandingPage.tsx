import React from 'react';
import { motion } from 'motion/react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LandingPageProps {
  onLogoutToast?: (msg: string) => void;
  onNavigateToAuth?: (view: 'login' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogoutToast, onNavigateToAuth }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    if (onLogoutToast) {
      onLogoutToast('You have been securely signed out.');
    }
    if (onNavigateToAuth) {
      onNavigateToAuth('login');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center min-h-[50vh]"
    >
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-slate-700 font-medium"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </motion.div>
  );
};
