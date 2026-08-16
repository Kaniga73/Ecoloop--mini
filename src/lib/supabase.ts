import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthSession, AuthUser, SignupPayload, UserProfile } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isLiveSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

export const supabase: SupabaseClient | null = isLiveSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'ecoloop-auth-token',
      },
    })
  : null;

// ============================================================================
// Robust Local Storage Persistence Layer for Supabase Simulation
// ============================================================================
const LOCAL_STORAGE_USERS_KEY = 'ecoloop_simulated_users';
const LOCAL_STORAGE_PROFILES_KEY = 'ecoloop_simulated_profiles';
const LOCAL_STORAGE_SESSION_KEY = 'ecoloop_simulated_session';
const LOCAL_STORAGE_RESET_TOKENS_KEY = 'ecoloop_simulated_reset_tokens';

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string; // Base64 encoded for simulation
  email_confirmed_at: string | null;
  created_at: string;
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
}

// Helper to get simulated stored users
function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
}

// Helper to get simulated stored profiles
export function getStoredProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredProfiles(profiles: UserProfile[]) {
  localStorage.setItem(LOCAL_STORAGE_PROFILES_KEY, JSON.stringify(profiles));
}

// Session management
export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    const nowInSeconds = Math.floor(Date.now() / 1000);
    // Check 7-day expiration
    if (session.expires_at && session.expires_at < nowInSeconds) {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  }
}

// Reset tokens
export function getStoredResetTokens(): Record<string, { email: string; expires: number }> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RESET_TOKENS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredResetToken(token: string, email: string) {
  const tokens = getStoredResetTokens();
  tokens[token] = {
    email,
    expires: Date.now() + 1000 * 60 * 60 * 2, // 2 hours
  };
  localStorage.setItem(LOCAL_STORAGE_RESET_TOKENS_KEY, JSON.stringify(tokens));
}

// Initial seed user if none exists (for quick preview/testing)
function ensureSeedUser() {
  const users = getStoredUsers();
  if (users.length === 0) {
    const demoId = 'usr_demo_ecoloop_01';
    const now = new Date().toISOString();
    const demoUser: StoredUser = {
      id: demoId,
      email: 'alex.rivera@example.com',
      passwordHash: btoa('EcoLoop#2026'),
      email_confirmed_at: now,
      created_at: now,
      user_metadata: {
        full_name: 'Alex Rivera',
        account_type: 'individual',
        phone: '+1 555-019-2834',
      },
      app_metadata: { provider: 'email' },
    };

    const demoProfile: UserProfile = {
      custom_id: 'IU001',
      auth_user_id: demoId,
      account_type: 'individual',
      full_name: 'Alex Rivera',
      email: 'alex.rivera@example.com',
      phone: '+1 555-019-2834',
      country: 'United States',
      state: 'California',
      city: 'San Francisco',
      pincode: '94107',
      created_at: now,
      updated_at: now,
    };

    saveStoredUsers([demoUser]);
    saveStoredProfiles([demoProfile]);
  }
}

// ============================================================================
// Service layer that works with either Live Supabase or Simulated Storage
// ============================================================================

export async function createProfileRecord(profile: UserProfile): Promise<{ error?: string }> {
  const tableName = profile.account_type === 'individual' ? 'individual_profiles' : 'business_profiles';
  try {
    const { custom_id, account_type, ...dbPayload } = profile;
    const { error } = await supabase.from(tableName).insert([dbPayload]);
    if (error) return { error: error.message };
    return { error: undefined };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function fetchProfileRecord(userId: string): Promise<UserProfile | null> {
  if (isLiveSupabaseConfigured && supabase) {
    try {
      // Check individual profiles first
      const { data: indData, error: indError } = await supabase
        .from('individual_profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .single();
        
      if (!indError && indData) {
        return indData as UserProfile;
      }

      // Check business profiles if not found
      const { data: busData, error: busError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (!busError && busData) {
        return busData as UserProfile;
      }
    } catch (err) {
      console.warn('Error fetching live Supabase profile:', err);
    }
  }

  // Fallback or Simulated
  const profiles = getStoredProfiles();
  return profiles.find((p) => p.auth_user_id === userId) || null;
}

