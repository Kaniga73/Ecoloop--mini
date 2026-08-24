import { WasteListing, Conversation, ChatMessage, UserProfile, DealOffer } from "../types";

export const currentUserProfiles: UserProfile[] = [
  {
    id: "user-buyer-1",
    name: "Karthik Sundaram",
    company: "TN Metal & Polymer Recyclers Pvt Ltd",
    role: "buyer",
    email: "karthik@tnrecyclers.in",
    location: "Guindy Industrial Estate, Chennai",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "user-seller-1",
    name: "Senthil Nathan",
    company: "Ambattur Engineering Fabricators",
    role: "seller",
    email: "senthil@ambatturfab.com",
    location: "Ambattur Industrial Estate, Chennai",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
];

export const initialListings: WasteListing[] = [];

export const initialConversations: Conversation[] = [];

export const initialMessages: Record<string, ChatMessage[]> = {};

export const initialDealOffers: Record<string, DealOffer[]> = {};

export const initialPurchases: any[] = [];

