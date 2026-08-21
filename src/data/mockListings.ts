import { WasteListing, Conversation, ChatMessage, UserProfile } from "../types";

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


export const initialConversations: Conversation[] = [
  {
    id: "conv-1",
    listingId: "listing-steel-chennai-50",
    listingTitle: "Mixed Heavy Steel Scrap - 50 Tons",
    listingImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    listingPrice: "₹28,500 / Ton",
    buyer: {
      id: "user-buyer-1",
      name: "Karthik Sundaram",
      company: "TN Metal & Polymer Recyclers Pvt Ltd",
    },
    seller: {
      id: "user-seller-1",
      name: "Senthil Nathan",
      company: "Ambattur Engineering Fabricators",
    },
    lastMessage: "Inquiry regarding pickup logistics from Ambattur yard.",
    lastMessageTime: "10:45 AM",
    unreadCount: 0,
  },
];

export const initialMessages: Record<string, ChatMessage[]> = {
  "conv-1": [
    {
      id: "msg-1",
      conversationId: "conv-1",
      senderId: "user-buyer-1",
      senderName: "Karthik Sundaram",
      senderRole: "buyer",
      text: "Vanakkam Senthil sir, we want to inspect the 50-ton steel scrap lot at Ambattur. Can we send our trailer tomorrow morning?",
      timestamp: "10:30 AM",
    },
    {
      id: "msg-2",
      conversationId: "conv-1",
      senderId: "user-seller-1",
      senderName: "Senthil Nathan",
      senderRole: "seller",
      text: "Vanakkam Karthik. Yes, our yard is open from 8:30 AM. Certified 60T weighbridge is ready at Gate 2.",
      timestamp: "10:38 AM",
    },
  ],
};

export const initialPurchases = [
  {
    id: "pur-1",
    productTitle: "Bright Bare Copper Wire Scrap (99.9% Milberry) - 2 Tons",
    category: "Scrap Metal",
    quantity: 2,
    unit: "Ton",
    amount: 1480000,
    unitPrice: 740000,
    currency: "₹",
    status: "Completed" as const,
    orderedDate: "2026-08-10",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80",
    seller: {
      id: "seller-hosur-cables",
      name: "Venkatesh Rao",
      company: "Hosur Precision Conductors Ltd",
      email: "venkatesh@hosurconductors.com",
      phone: "+91 98840 98765",
      location: "SIPCOT Phase II, Hosur, Tamil Nadu",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
    buyer: {
      id: "user-buyer-1",
      name: "Karthik Sundaram",
      company: "TN Metal & Polymer Recyclers Pvt Ltd",
      email: "karthik@tnrecyclers.in",
      phone: "+91 98401 23456",
      location: "Guindy Industrial Estate, Chennai, Tamil Nadu",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  },
  {
    id: "pur-2",
    productTitle: "Baled Clear PET Plastic Flakes - 5 Tons",
    category: "Industrial Plastics",
    quantity: 5,
    unit: "Ton",
    amount: 190000,
    unitPrice: 38000,
    currency: "₹",
    status: "Shipped" as const,
    orderedDate: "2026-08-14",
    image: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400&auto=format&fit=crop&q=80",
    seller: {
      id: "seller-tpr-plastics",
      name: "Anand Kumar",
      company: "Kongu Eco Polymers",
      email: "anand@kongueco.com",
      phone: "+91 97890 45678",
      location: "SIPCOT Complex, Tiruppur, Tamil Nadu",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
    buyer: {
      id: "user-buyer-1",
      name: "Karthik Sundaram",
      company: "TN Metal & Polymer Recyclers Pvt Ltd",
      email: "karthik@tnrecyclers.in",
      phone: "+91 98401 23456",
      location: "Guindy Industrial Estate, Chennai, Tamil Nadu",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  },
];

