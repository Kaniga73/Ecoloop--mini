import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthContextType, AuthSession, AuthUser, SignupPayload, UserProfile } from '../types';
import { supabase, fetchProfileRecord, createProfileRecord } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(() => {
    return sessionStorage.getItem('ecoloop_pending_verify_email') || null;
  });

  const updatePendingEmail = useCallback((email: string | null) => {
    setPendingVerificationEmail(email);
    if (email) {
      sessionStorage.setItem('ecoloop_pending_verify_email', email);
    } else {
      sessionStorage.removeItem('ecoloop_pending_verify_email');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        setLoading(true);
        if (!supabase) throw new Error('Supabase client not initialized');
        
        const { data: { session: sbSession }, error } = await supabase.auth.getSession();
        if (error) console.error('Supabase getSession error:', error);
        
        if (sbSession && mounted) {
          const authUser: AuthUser = {
            id: sbSession.user.id,
            email: sbSession.user.email || '',
            email_confirmed_at: sbSession.user.email_confirmed_at || null,
            user_metadata: sbSession.user.user_metadata || {},
            app_metadata: sbSession.user.app_metadata || {},
            created_at: sbSession.user.created_at,
          };
          const mappedSession: AuthSession = {
            access_token: sbSession.access_token,
            refresh_token: sbSession.refresh_token,
            expires_at: sbSession.expires_at || Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
            expires_in: sbSession.expires_in || 3600,
            token_type: sbSession.token_type,
            user: authUser,
          };
          setSession(mappedSession);
          setUser(authUser);

          const prof = await fetchProfileRecord(authUser.id);
          if (prof && mounted) setProfile(prof);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sbSession) => {
        if (!mounted) return;
        if (sbSession) {
          const authUser: AuthUser = {
            id: sbSession.user.id,
            email: sbSession.user.email || '',
            email_confirmed_at: sbSession.user.email_confirmed_at || null,
            user_metadata: sbSession.user.user_metadata || {},
            app_metadata: sbSession.user.app_metadata || {},
            created_at: sbSession.user.created_at,
          };
          const mappedSession: AuthSession = {
            access_token: sbSession.access_token,
            refresh_token: sbSession.refresh_token,
            expires_at: sbSession.expires_at || Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
            expires_in: sbSession.expires_in || 3600,
            token_type: sbSession.token_type,
            user: authUser,
          };
          setSession(mappedSession);
          setUser(authUser);
          const prof = await fetchProfileRecord(authUser.id);
          setProfile(prof);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const signup = useCallback(async (data: SignupPayload): Promise<{ success: boolean; error?: string; requiresEmailVerification?: boolean }> => {
    try {
      if (!supabase) throw new Error('Database not connected');
      
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: data.email.trim(),
        options: {
          data: {
            full_name: data.full_name,
            account_type: data.account_type,
            phone: data.phone,
            country: data.country,
            state: data.state,
            city: data.city,
            pincode: data.pincode,
            ...(data.account_type === 'business' ? {
              business_name: data.business_name,
              business_type: data.business_type,
              business_category: data.business_category,
            } : {}),
          },
        },
      });

      if (authError) return { success: false, error: authError.message };

      updatePendingEmail(data.email.trim());
      return { success: true, requiresEmailVerification: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred during signup.' };
    }
  }, [updatePendingEmail]);

  const login = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!supabase) throw new Error('Database not connected');
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });

      if (error) return { success: false, error: error.message };

      updatePendingEmail(email.trim());
      return { success: false, error: 'verify your email' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid email.' };
    }
  }, [updatePendingEmail]);

  const logout = useCallback(async () => {
    try {
      if (supabase) await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, _token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!supabase) throw new Error('Database not connected');
      
            let { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: _token,
        type: 'magiclink',
      });
      
      if (error && error.message.toLowerCase().includes('token')) {
         const signupRes = await supabase.auth.verifyOtp({
           email: email.trim(),
           token: _token,
           type: 'signup',
         });
         data = signupRes.data;
         error = signupRes.error;
      }
      
      if (error) return { success: false, error: error.message };
      
      if (data && data.user) {
        const prof = await fetchProfileRecord(data.user.id);
        if (!prof && data.user.user_metadata?.account_type) {
           const meta = data.user.user_metadata;
           const newProfile = {
             auth_user_id: data.user.id,
             account_type: meta.account_type,
             full_name: meta.full_name,
             email: data.user.email,
             phone: meta.phone,
             country: meta.country,
             state: meta.state,
             city: meta.city,
             pincode: meta.pincode,
             ...(meta.account_type === 'business' ? {
               business_name: meta.business_name,
               business_type: meta.business_type,
               business_category: meta.business_category,
             } : {}),
           };
           const res = await createProfileRecord(newProfile as any);
           if (res.error) console.error('PROFILE INSERT ERROR:', res.error);
           setProfile(newProfile as any);
        }
      }

      updatePendingEmail(null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verification failed. Code may be expired.' };
    }
  }, [updatePendingEmail]);

  const resendVerificationEmail = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!supabase) throw new Error('Database not connected');
      // For Passwordless OTPs, resending the code is literally just calling signInWithOtp again!
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to resend email.' };
    }
  }, []);
  
  // Stubs for removed password functionality to prevent typescript errors in other files
  const sendPasswordResetEmail = useCallback(async () => { return { success: false } }, []);
  const updatePassword = useCallback(async () => { return { success: false } }, []);

  const refreshSession = useCallback(async () => {
    try {
      if (!supabase) return;
      const { data: { session: sbSession } } = await supabase.auth.refreshSession();
      if (sbSession) {
        const authUser: AuthUser = {
          id: sbSession.user.id,
          email: sbSession.user.email || '',
          email_confirmed_at: sbSession.user.email_confirmed_at || null,
          user_metadata: sbSession.user.user_metadata || {},
          app_metadata: sbSession.user.app_metadata || {},
          created_at: sbSession.user.created_at,
        };
        const mappedSession: AuthSession = {
          access_token: sbSession.access_token,
          refresh_token: sbSession.refresh_token,
          expires_at: sbSession.expires_at || Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
          expires_in: sbSession.expires_in || 3600,
          token_type: sbSession.token_type,
          user: authUser,
        };
        setSession(mappedSession);
        setUser(authUser);
      }
    } catch (err) {
      console.error('refreshSession error:', err);
    }
  }, []);

  const isAuthenticated = Boolean(user && session);
  const isEmailVerified = Boolean(user?.email_confirmed_at);

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isAuthenticated,
    isEmailVerified,
    pendingVerificationEmail,
    isSupabaseConfigured: Boolean(supabase),
    login,
    signup,
    logout,
    sendPasswordResetEmail,
    updatePassword,
    resendVerificationEmail,
    setPendingVerificationEmail: updatePendingEmail,
    verifyEmailOtp,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
