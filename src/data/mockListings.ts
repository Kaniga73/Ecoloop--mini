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

export const initialListings: WasteListing[] = [
  {
    id: "listing-steel-chennai-50",
    title: "Heavy Structural Steel Cut-Off Scrap - 10 Tons",
    category: "Scrap Metal",
    subcategory: "Structural Steel",
    description: "High-grade mild steel beams, I-channel cut-offs, and clean structural plates from fabrications. Stored in covered dry yard. Ideal for induction furnace smelting.",
    location: {
      city: "Chennai",
      stateOrCountry: "Tamil Nadu",
      industrialPark: "Ambattur Industrial Estate",
      coordinates: { lat: 13.0982, lng: 80.1624 }
    },
    images: [
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80"
    ],
    pricePerUnit: 28500,
    unit: "Ton",
    currency: "₹",
    totalQuantity: 5,
    originalQuantity: 10,
    soldQuantity: 5,
    remainingQuantity: 5,
    totalEstimatedValue: 285000,
    minPurchaseQuantity: 1,
    isPriceNegotiable: true,
    priceType: "Negotiable",
    condition: "Good",
    seller: {
      id: "user-seller-1",
      name: "Senthil Nathan",
      company: "Ambattur Engineering Fabricators",
      contactEmail: "senthil@ambatturfab.com",
      contactPhone: "+91 98410 77889",
      location: "Ambattur Industrial Estate, Chennai, Tamil Nadu",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
    purchaseHistory: [
      {
        id: "pur-hist-1",
        listingId: "listing-steel-chennai-50",
        productTitle: "Heavy Structural Steel Cut-Off Scrap - 10 Tons",
        category: "Scrap Metal",
        quantity: 5,
        unit: "Ton",
        amount: 142500,
        unitPrice: 28500,
        currency: "₹",
        status: "Completed",
        orderedDate: "2026-08-20",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
        seller: {
          id: "user-seller-1",
          name: "Senthil Nathan",
          company: "Ambattur Engineering Fabricators",
          email: "senthil@ambatturfab.com",
          phone: "+91 98410 77889",
          location: "Ambattur Industrial Estate, Chennai",
        },
        buyer: {
          id: "user-buyer-1",
          name: "Karthik Sundaram (Buyer A)",
          company: "TN Metal & Polymer Recyclers Pvt Ltd",
          email: "karthik@tnrecyclers.in",
          phone: "+91 98401 23456",
          location: "Guindy Industrial Estate, Chennai",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        }
      }
    ],
    interestedBuyers: [
      {
        id: "user-buyer-1",
        name: "Karthik Sundaram (Buyer A)",
        company: "TN Metal & Polymer Recyclers Pvt Ltd",
        email: "karthik@tnrecyclers.in",
        phone: "+91 98401 23456",
        location: "Guindy Industrial Estate, Chennai",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      },
      {
        id: "buyer-kovai-smelters",
        name: "Rajesh Sharma (Buyer B)",
        company: "Kovai Smelters & Refineries Ltd",
        email: "rajesh@kovaismelters.com",
        phone: "+91 94432 10987",
        location: "SIDCO Industrial Estate, Coimbatore, Tamil Nadu",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      },
      {
        id: "buyer-apex-scrap",
        name: "Deepak Patel (Buyer C)",
        company: "Apex Metal Trading Corp",
        email: "deepak@apexmetals.in",
        phone: "+91 98940 55432",
        location: "Ranipet Industrial Area, Ranipet, Tamil Nadu",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      }
    ],
    listedDate: "2026-08-18",
    viewCount: 142,
    status: "available",
  },
  {
    id: "listing-copper-hosur-20",
    title: "High Purity Bare Copper Scrap Wire (99.9% Millberry) - 15 Tons",
    category: "Scrap Metal",
    subcategory: "Copper Scrap",
    description: "Bright unalloyed copper wire scrap stripped from motor windings and heavy power cables. Free of insulation, grease, and moisture.",
    location: {
      city: "Hosur",
      stateOrCountry: "Tamil Nadu",
      industrialPark: "SIPCOT Phase II",
      coordinates: { lat: 12.7409, lng: 77.8253 }
    },
    images: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80"
    ],
    pricePerUnit: 740000,
    unit: "Ton",
    currency: "₹",
    totalQuantity: 15,
    originalQuantity: 15,
    soldQuantity: 0,
    remainingQuantity: 15,
    totalEstimatedValue: 11100000,
    minPurchaseQuantity: 1,
    isPriceNegotiable: false,
    priceType: "Fixed",
    condition: "Excellent",
    seller: {
      id: "seller-hosur-cables",
      name: "Venkatesh Rao",
      company: "Hosur Precision Conductors Ltd",
      contactEmail: "venkatesh@hosurconductors.com",
      contactPhone: "+91 98840 98765",
      location: "SIPCOT Phase II, Hosur, Tamil Nadu",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
    purchaseHistory: [],
    interestedBuyers: [
      {
        id: "user-buyer-1",
        name: "Karthik Sundaram (Buyer A)",
        company: "TN Metal & Polymer Recyclers Pvt Ltd",
        email: "karthik@tnrecyclers.in",
        phone: "+91 98401 23456",
        location: "Guindy Industrial Estate, Chennai",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      },
      {
        id: "buyer-kovai-smelters",
        name: "Rajesh Sharma (Buyer B)",
        company: "Kovai Smelters & Refineries Ltd",
        email: "rajesh@kovaismelters.com",
        phone: "+91 94432 10987",
        location: "SIDCO Industrial Estate, Coimbatore, Tamil Nadu",
      }
    ],
    listedDate: "2026-08-21",
    viewCount: 98,
    status: "available",
  }
];


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

