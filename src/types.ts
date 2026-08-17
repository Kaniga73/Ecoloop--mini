export type AccountType = 'individual' | 'business';

export interface BaseProfile {
  id?: string;
  name?: string;
  company?: string;
  role?: string;
  avatar?: string;
  location?: string;
  custom_id?: string;
  auth_user_id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IndividualProfile extends BaseProfile {
  account_type?: 'individual';
}

export interface BusinessProfile extends BaseProfile {
  account_type?: 'business';
  business_name?: string;
  business_type?: string;
  business_category?: string;
}

export type UserProfile = IndividualProfile | BusinessProfile;

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  user_metadata: {
    full_name?: string;
    account_type?: AccountType;
    phone?: string;
    [key: string]: any;
  };
  app_metadata: Record<string, any>;
  created_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp in seconds
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

export interface IndividualSignupData {
  account_type: 'individual';
  full_name: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  agreed_terms: boolean;
  agreed_privacy: boolean;
}

export interface BusinessSignupData {
  account_type: 'business';
  full_name: string;
  email: string;
  phone: string;
  business_name: string;
  business_type: string;
  business_category: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  agreed_terms: boolean;
  agreed_privacy: boolean;
}

export type SignupPayload = IndividualSignupData | BusinessSignupData;

export interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  session: AuthSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  pendingVerificationEmail: string | null;
  isSupabaseConfigured: boolean;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupPayload) => Promise<{ success: boolean; error?: string; requiresEmailVerification?: boolean }>;
  logout: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  setPendingVerificationEmail: (email: string | null) => void;
  refreshSession: () => Promise<void>;
}

export type AuthView = 
  | 'login'
  | 'signup'
  | 'verify-email'
  | 'forgot-password'
  | 'reset-password'
  | 'home';

export interface WasteListingLocation {
  city: string;
  stateOrCountry: string;
  industrialPark?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface WasteSellerInfo {
  id: string;
  name: string;
  company: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  avatar?: string;
}

export interface WasteListing {
  id: string;
  title: string;
  category: string;
  location: WasteListingLocation;
  images: string[];
  pricePerUnit: number;
  unit: string;
  currency: string;
  totalQuantity: number;
  totalEstimatedValue: number;
  minPurchaseQuantity: number;
  isPriceNegotiable: boolean;
  description: string;
  seller: WasteSellerInfo;
  listedDate: string;
  viewCount: number;
  status: 'available' | 'reserved' | 'sold';
}

export interface Conversation {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  listingPrice: string;
  buyer: {
    id: string;
    name: string;
    company: string;
  };
  seller: {
    id: string;
    name: string;
    company: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'seller';
  text: string;
  timestamp: string;
}
