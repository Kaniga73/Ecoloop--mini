import React, { useState, useMemo } from "react";
import { SidebarFilter } from "../components/common/SidebarFilter";
import { ListingCard } from "../components/common/ListingCard";
import { Header } from "../components/common/Header";
import { ListingDetailPage } from "./ListingDetailPage";
import { DashboardPage } from "./DashboardPage";
import { ListWasteModal } from "../components/common/ListWasteModal";
import { MakeOfferModal } from "../components/common/MakeOfferModal";
import { SellPage } from "./SellPage";
import { MessagesPage } from "./MessagesPage";
import { PurchaseRecord } from "../components/common/DashboardView";
import { currentUserProfiles, initialConversations, initialMessages, initialDealOffers } from "../data/mockListings";
import { WasteListing, UserProfile, AuthView, PartyDetails, Conversation, ChatMessage, DealOffer } from "../types";
import { useAuth } from "../hooks/useAuth";
import { Search } from "lucide-react";
import { fetchActiveListings, deleteWasteListing, updateWasteListing } from "../lib/listingsService";

interface LandingPageProps {
  onLogoutToast?: (msg: string) => void;
  onNavigateToAuth?: (view: AuthView) => void;
  listings?: WasteListing[];
  isLoadingListings?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLogoutToast,
  onNavigateToAuth,
  listings: propListings,
  isLoadingListings = false,
}) => {
  const { logout, profile, user } = useAuth();

  // State management — purchases start empty [] by default until buyer purchases real items
  const [allListings, setAllListings] = useState<WasteListing[]>(propListings || []);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(isLoadingListings);

  // Chat & Negotiations state
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(initialMessages);
  const [dealOffersMap, setDealOffersMap] = useState<Record<string, DealOffer[]>>(initialDealOffers);
  const [activeConversationId, setActiveConversationId] = useState<string | null>("conv-1");

  const fetchAndSetListings = () => {
    setIsLoading(true);
    fetchActiveListings().then(fetchedListings => {
      setAllListings(fetchedListings || []);
    }).finally(() => {
      setIsLoading(false);
    });
  };

  React.useEffect(() => {
    if (!propListings) {
      fetchAndSetListings();
    }
  }, [propListings]);

  // Seller Action: Mark as Sold Handler
  const handleMarkAsSold = (
    listing: WasteListing,
    buyer: PartyDetails,
    quantity: number,
    pricePerUnit: number
  ) => {
    const newPurchase: PurchaseRecord = {
      id: `pur-${Date.now()}`,
      listingId: listing.id,
      productTitle: listing.title,
      category: listing.category,
      quantity,
      unit: listing.unit || "kg",
      amount: quantity * pricePerUnit,
      unitPrice: pricePerUnit,
      currency: listing.currency || "₹",
      status: "Completed",
      orderedDate: new Date().toISOString().split("T")[0],
      image: listing.images[0],
      seller: {
        id: listing.seller.id,
        name: listing.seller.name,
        company: listing.seller.company,
        email: listing.seller.contactEmail || `${listing.seller.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        phone: listing.seller.contactPhone || "+91 98401 00000",
        location: listing.seller.location || `${listing.location.city}, ${listing.location.stateOrCountry}`,
        avatar: listing.seller.avatar,
      },
      buyer: buyer,
    };

    setPurchases((prev) => [newPurchase, ...prev]);

    setAllListings((prev) =>
      prev.map((item) => {
        if (item.id === listing.id) {
          const originalQuantity = item.originalQuantity ?? item.totalQuantity ?? 0;
          const currentSold = item.soldQuantity ?? 0;
          const soldQuantity = currentSold + quantity;
          const remainingQuantity = Math.max(0, originalQuantity - soldQuantity);
          const status = remainingQuantity <= 0 ? "sold" : item.status;
          const purchaseHistory = [...(item.purchaseHistory || []), newPurchase];
          return {
            ...item,
            originalQuantity,
            soldQuantity,
            remainingQuantity,
            totalQuantity: remainingQuantity,
            status,
            purchaseHistory,
            buyer: buyer,
          };
        }
        return item;
      })
    );
  };

  const [activeTab, setActiveTab] = useState<"marketplace" | "dashboard" | "messages" | "list-waste">("marketplace");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minQuantity, setMinQuantity] = useState<string>("");
  const [maxQuantity, setMaxQuantity] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "quantity">("newest");
  const [selectedListing, setSelectedListing] = useState<WasteListing | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentUserIndex, setCurrentUserIndex] = useState<number>(0);

  // List Waste Modal state
  const [isListWasteModalOpen, setIsListWasteModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<WasteListing | null>(null);

  // Make Offer Modal state
  const [isMakeOfferModalOpen, setIsMakeOfferModalOpen] = useState(false);
  const [offerListing, setOfferListing] = useState<WasteListing | null>(null);

  // Active user representation (fallback to mock profiles if custom DB profile missing)
  const activeUser: UserProfile = useMemo(() => {
    if (profile) {
      return {
        id: profile.auth_user_id || user?.id || "user-1",
        name: profile.full_name || user?.email?.split("@")[0] || "EcoLoop User",
        company: (profile as any).business_name || "EcoLoop Partner",
        role: (profile as any).account_type || "individual",
        email: profile.email || user?.email || "",
        location: `${profile.city || "Chennai"}, ${profile.state || "Tamil Nadu"}`,
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      };
    }
    return currentUserProfiles[currentUserIndex] || currentUserProfiles[0];
  }, [profile, user, currentUserIndex]);

  const handleSwitchUser = () => {
    setCurrentUserIndex((prev) => (prev + 1) % currentUserProfiles.length);
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (onLogoutToast) onLogoutToast("Signed out successfully.");
      if (onNavigateToAuth) onNavigateToAuth("login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setSelectedCategory("All Categories");
    setSearchQuery("");
    setLocationQuery("");
    setMinPrice("");
    setMaxPrice("");
    setMinQuantity("");
    setMaxQuantity("");
    setSortBy("newest");
  };

  // Listing CRUD actions (Sell / List Waste)
  const handleOpenListWaste = () => {
    setEditingListing(null);
    setIsListWasteModalOpen(true);
  };

  const handleEditListing = (listing: WasteListing) => {
    setEditingListing(listing);
    // Don't open the modal, we'll render SellPage instead
  };

  const handleDeleteListing = async (listing: WasteListing) => {
    if (window.confirm(`Are you sure you want to delete "${listing.title}"?`)) {
      // Optimistically remove from UI
      setAllListings((prev) => prev.filter((item) => item.id !== listing.id));
      
      const result = await deleteWasteListing(listing.id);
      if (result.error) {
        alert(`Failed to delete listing: ${result.error}`);
      }
    }
  };

  const handleSubmitListing = async (listingData: Partial<WasteListing>) => {
    if (listingData.id) {
      // Update in local state
      setAllListings((prev) =>
        prev.map((item) => (item.id === listingData.id ? ({ ...item, ...listingData } as WasteListing) : item))
      );
      
      const updateData = {
        title: listingData.title,
        category: listingData.category,
        description: listingData.description,
        quantity: listingData.totalQuantity,
        unit: listingData.unit,
        price: listingData.pricePerUnit,
        currency: listingData.currency,
        condition: listingData.condition,
        location_city: listingData.location?.city,
      };
      const result = await updateWasteListing(listingData.id, updateData);
      if (result.error) {
        alert(`Failed to update listing: ${result.error}`);
      }
    } else {
      const newListing: WasteListing = {
        id: `listing-${Date.now()}`,
        title: listingData.title || "New Industrial Waste Listing",
        category: listingData.category || "Scrap Metal",
        location: listingData.location || { city: "Chennai", stateOrCountry: "Tamil Nadu" },
        images: listingData.images && listingData.images.length > 0
          ? listingData.images
          : ["https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80"],
        pricePerUnit: listingData.pricePerUnit || 1000,
        unit: listingData.unit || "Ton",
        currency: listingData.currency || "₹",
        totalQuantity: listingData.totalQuantity || 10,
        totalEstimatedValue: (listingData.pricePerUnit || 1000) * (listingData.totalQuantity || 10),
        minPurchaseQuantity: listingData.minPurchaseQuantity || 1,
        isPriceNegotiable: listingData.isPriceNegotiable ?? true,
        description: listingData.description || "",
        seller: listingData.seller || {
          id: activeUser.id || "user-seller-1",
          name: activeUser.name || "Seller",
          company: activeUser.company || "EcoLoop Partner",
        },
        listedDate: "Today",
        viewCount: 1,
        status: "available",
      };
      setAllListings((prev) => [newListing, ...prev]);
    }
  };

  // Chat & Messaging Handlers
  const handleStartChat = (listing: WasteListing) => {
    let existing = conversations.find((c) => c.listingId === listing.id);
    let convId = existing?.id;

    if (!existing) {
      convId = `conv-${Date.now()}`;
      const newConv: Conversation = {
        id: convId,
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listing.images[0],
        listingPrice: `${listing.currency}${listing.pricePerUnit.toLocaleString("en-IN")} / ${listing.unit}`,
        buyer: {
          id: activeUser.id,
          name: activeUser.name,
          company: activeUser.company,
        },
        seller: {
          id: listing.seller.id,
          name: listing.seller.name,
          company: listing.seller.company,
        },
        lastMessage: "Inquiry regarding waste listing specifications.",
        lastMessageTime: "Just now",
        unreadCount: 0,
      };

      setConversations((prev) => [newConv, ...prev]);
      setMessagesMap((prev) => ({
        ...prev,
        [convId]: [
          {
            id: `msg-${Date.now()}`,
            conversationId: convId,
            senderId: activeUser.id,
            senderName: activeUser.name,
            senderRole: (activeUser.role || "buyer") as any,
            text: `Hello ${listing.seller.name}, I am interested in purchasing ${listing.title}.`,
            timestamp: "Just now",
          },
        ],
      }));
    }

    setActiveConversationId(convId);
    setSelectedListing(null);
    setActiveTab("messages");
  };

  const handleSendMessage = (conversationId: string, text: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: activeUser.id,
      senderName: activeUser.name,
      senderRole: (activeUser.role || "buyer") as any,
      text,
      timestamp: timeStr,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage: text, lastMessageTime: timeStr }
          : c
      )
    );
  };

  const handleAcceptOffer = (offer: DealOffer) => {
    // 1. Update deal offer status to Accepted
    setDealOffersMap((prev) => {
      const next = { ...prev };
      for (const key in next) {
        next[key] = next[key].map((o) => (o.id === offer.id ? { ...o, status: "Accepted" } : o));
      }
      return next;
    });

    // 2. Find target listing and apply sale updates
    const targetListing = allListings.find((l) => l.id === offer.listingId || l.title === offer.listingTitle);
    if (targetListing) {
      const convMatch = conversations.find((c) => c.listingId === targetListing.id || (dealOffersMap[c.id] || []).some((o) => o.id === offer.id));
      const buyerParty: PartyDetails = {
        id: offer.buyerId,
        name: offer.buyerName || convMatch?.buyer.name || "Karthik Sundaram",
        company: convMatch?.buyer.company || "TN Metal & Polymer Recyclers Pvt Ltd",
        email: "karthik@tnrecyclers.in",
        phone: "+91 98401 23456",
        location: "Guindy Industrial Estate, Chennai, Tamil Nadu",
      };
      handleMarkAsSold(targetListing, buyerParty, offer.quantity, offer.offeredPricePerUnit);
    }

    // 3. Post system message into active chat
    if (activeConversationId) {
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        conversationId: activeConversationId,
        senderId: "system",
        senderName: "EcoLoop System",
        senderRole: "system",
        text: `Deal Accepted! ${offer.quantity} ${offer.unit}s purchased for ${offer.currency}${offer.totalAmount.toLocaleString("en-IN")}. Inventory updated and order logged.`,
        timestamp: timeStr,
      };

      setMessagesMap((prev) => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), sysMsg],
      }));
    }
  };

  const handleRejectOffer = (offer: DealOffer) => {
    setDealOffersMap((prev) => {
      const next = { ...prev };
      for (const key in next) {
        next[key] = next[key].map((o) => (o.id === offer.id ? { ...o, status: "Rejected" } : o));
      }
      return next;
    });

    if (activeConversationId) {
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        conversationId: activeConversationId,
        senderId: "system",
        senderName: "EcoLoop System",
        senderRole: "system",
        text: `Offer of ${offer.currency}${offer.offeredPricePerUnit}/${offer.unit} declined by user.`,
        timestamp: timeStr,
      };

      setMessagesMap((prev) => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), sysMsg],
      }));
    }
  };

  // Delete Conversation / Chat History Handler
  const handleDeleteConversation = (conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setMessagesMap((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
    setDealOffersMap((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
    setActiveConversationId((prev) => {
      if (prev === conversationId) {
        const remaining = conversations.filter((c) => c.id !== conversationId);
        return remaining.length > 0 ? remaining[0].id : null;
      }
      return prev;
    });
  };

  // Buyer Purchasing / Make Offer flow
  const handleOpenMakeOffer = (listing: WasteListing) => {
    setOfferListing(listing);
    setIsMakeOfferModalOpen(true);
  };

  const handleSubmitOffer = (
    listing: WasteListing,
    quantity: number,
    pricePerUnit: number,
    notes?: string,
    incoterm?: string
  ) => {
    // 1. Ensure conversation thread exists for this listing
    let existingConv = conversations.find((c) => c.listingId === listing.id);
    let convId = existingConv?.id;

    if (!existingConv) {
      convId = `conv-${Date.now()}`;
      existingConv = {
        id: convId,
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listing.images[0] || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
        listingPrice: `${listing.currency || "₹"}${listing.pricePerUnit.toLocaleString("en-IN")} / ${listing.unit}`,
        buyer: {
          id: activeUser.id,
          name: activeUser.name,
          company: activeUser.company,
        },
        seller: {
          id: listing.seller.id,
          name: listing.seller.name,
          company: listing.seller.company,
        },
        lastMessage: "Submitted deal offer.",
        lastMessageTime: "Just now",
        unreadCount: 0,
      };
      setConversations((prev) => [existingConv!, ...prev]);
    }

    const offerId = `offer-${Date.now()}`;
    const newOffer: DealOffer = {
      id: offerId,
      listingId: listing.id,
      listingTitle: listing.title,
      buyerId: activeUser.id,
      buyerName: activeUser.name,
      sellerId: listing.seller.id,
      sellerName: listing.seller.name,
      offeredPricePerUnit: pricePerUnit,
      quantity,
      unit: listing.unit || "Ton",
      totalAmount: quantity * pricePerUnit,
      currency: listing.currency || "₹",
      status: "Pending",
      createdAt: new Date().toISOString(),
      incoterm: incoterm || "EXW (Ex Works)",
      notes: notes || "",
    };

    // Store in dealOffersMap
    setDealOffersMap((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newOffer],
    }));

    // Transmit offer as embedded message in chat thread matching exact production design
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const offerMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: convId,
      senderId: activeUser.id,
      senderName: activeUser.name,
      senderRole: (activeUser.role || "buyer") as any,
      text: "I have officially submitted a formal offer via EcoLoop Deal Shield below:",
      timestamp: timeStr,
      offerId: offerId,
      offer: newOffer,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), offerMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastMessage: `Formal offer submitted: ${quantity} ${listing.unit || "Ton"}s at ${listing.currency || "₹"}${pricePerUnit}/${listing.unit || "Ton"}`,
              lastMessageTime: timeStr,
            }
          : c
      )
    );

    // Close modal, reset selected listing, select active conversation thread, and switch to Messages tab immediately
    setIsMakeOfferModalOpen(false);
    setSelectedListing(null);
    setActiveConversationId(convId);
    setActiveTab("messages");
  };

  // Filtered & Sorted listings for Marketplace
  const filteredListings = useMemo(() => {
    let result = [...allListings];

    if (selectedCategory !== "All Categories") {
      result = result.filter(
        (item) => item.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.location.city.toLowerCase().includes(query)
      );
    }

    if (locationQuery.trim()) {
      const locQuery = locationQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.location.city.toLowerCase().includes(locQuery) ||
          item.location.stateOrCountry.toLowerCase().includes(locQuery) ||
          (item.location.industrialPark && item.location.industrialPark.toLowerCase().includes(locQuery))
      );
    }

    if (minPrice.trim() !== "" && !isNaN(Number(minPrice))) {
      result = result.filter((item) => item.pricePerUnit >= Number(minPrice));
    }

    if (maxPrice.trim() !== "" && !isNaN(Number(maxPrice))) {
      result = result.filter((item) => item.pricePerUnit <= Number(maxPrice));
    }

    if (minQuantity.trim() !== "" && !isNaN(Number(minQuantity))) {
      result = result.filter((item) => item.totalQuantity >= Number(minQuantity));
    }

    if (maxQuantity.trim() !== "" && !isNaN(Number(maxQuantity))) {
      result = result.filter((item) => item.totalQuantity <= Number(maxQuantity));
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
    } else if (sortBy === "quantity") {
      result.sort((a, b) => b.totalQuantity - a.totalQuantity);
    }

    return result;
  }, [allListings, selectedCategory, searchQuery, locationQuery, minPrice, maxPrice, minQuantity, maxQuantity, sortBy]);

  // If a listing is selected, render ListingDetailPage
  if (selectedListing) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] w-full">
        <Header
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setSelectedListing(null);
            setActiveTab(tab);
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onNavigateToSell={() => onNavigateToAuth?.('sell')}
          currentUser={activeUser}
          onSwitchUser={handleSwitchUser}
          unreadCount={1}
          onLogout={handleLogout}
        />
        <ListingDetailPage
          listing={selectedListing}
          onBack={() => setSelectedListing(null)}
          onStartChat={handleStartChat}
          onOpenMakeOffer={handleOpenMakeOffer}
          isFavorite={favorites.has(selectedListing.id)}
          onToggleFavorite={(id) => handleToggleFavorite(id)}
          currentUser={activeUser}
        />
        {/* ListWasteModal temporarily removed */}
        <MakeOfferModal
          isOpen={isMakeOfferModalOpen}
          onClose={() => setIsMakeOfferModalOpen(false)}
          onSubmitOffer={handleSubmitOffer}
          listing={offerListing}
          currentUser={activeUser}
        />
      </div>
    );
  }

  // If editing a listing, render the SellPage in edit mode
  if (editingListing) {
    return (
      <SellPage 
        initialListing={editingListing} 
        onNavigate={() => {
          setEditingListing(null);
          if (!propListings) {
            fetchAndSetListings();
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] w-full flex flex-col">
      {/* Sticky Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onNavigateToSell={() => onNavigateToAuth?.('sell')}
        currentUser={activeUser}
        onSwitchUser={handleSwitchUser}
        unreadCount={1}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main id="landing-page" className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-6 space-y-6">
        {activeTab === "dashboard" ? (
          <DashboardPage
            listings={allListings}
            currentUser={activeUser}
            onOpenListing={(listing) => setSelectedListing(listing)}
            onNavigateToMessages={() => setActiveTab("messages")}
            onViewContract={(offer) => alert(`View contract for ${offer.listingTitle}`)}
            purchases={purchases}
            onDeleteListing={handleDeleteListing}
            onEditListing={handleEditListing}
            favorites={favorites}
            onToggleFavorite={(id) => handleToggleFavorite(id)}
            onOpenMakeOffer={handleOpenMakeOffer}
            onExploreMarketplace={() => setActiveTab("marketplace")}
            onMarkAsSold={handleMarkAsSold}
          />
        ) : activeTab === "messages" ? (
          <MessagesPage
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => setActiveConversationId(id)}
            messages={messagesMap}
            onSendMessage={handleSendMessage}
            dealOffers={dealOffersMap}
            onAcceptOffer={handleAcceptOffer}
            onRejectOffer={handleRejectOffer}
            onOpenMakeOffer={handleOpenMakeOffer}
            onOpenListingSpecs={(listingId) => {
              const match = allListings.find((l) => l.id === listingId);
              if (match) setSelectedListing(match);
            }}
            onDeleteConversation={handleDeleteConversation}
            listings={allListings}
            currentUser={activeUser}
          />
        ) : (
          /* Marketplace View */
          <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
            {/* Left Sidebar Filter */}
            <SidebarFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              locationQuery={locationQuery}
              onLocationChange={setLocationQuery}
              minPrice={minPrice}
              onMinPriceChange={setMinPrice}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              minQuantity={minQuantity}
              onMinQuantityChange={setMinQuantity}
              maxQuantity={maxQuantity}
              onMaxQuantityChange={setMaxQuantity}
              onResetFilters={handleResetFilters}
            />

            {/* Listings Grid Area */}
            <div className="flex-1 min-w-0 w-full space-y-4">
              {/* Top Control Bar */}
              <div className="bg-white rounded-2xl border border-neutral-200/90 px-5 py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs sm:text-sm text-neutral-600 shrink-0">
                  Showing{" "}
                  <strong className="text-neutral-900 font-bold">
                    {filteredListings.length}
                  </strong>{" "}
                  waste listings in Tamil Nadu
                  {selectedCategory !== "All Categories" && (
                    <span className="ml-1 text-emerald-800 font-medium">
                      • {selectedCategory}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-500">Sort:</span>
                    <select
                      id="sort-listings-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="quantity">Largest Quantity</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Listings Cards Grid */}
              {isLoading ? (
                <div className="p-16 text-center text-neutral-400">
                  <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium">Loading marketplace listings...</p>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">
                    No matching waste listings found
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Try changing your category filter or clearing your location search.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                  {filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onSelect={(item) => setSelectedListing(item)}
                      isFavorite={favorites.has(listing.id)}
                      onToggleFavorite={(id, e) => handleToggleFavorite(id, e)}
                      onStartChat={(item) => handleStartChat(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <MakeOfferModal
        isOpen={isMakeOfferModalOpen}
        onClose={() => setIsMakeOfferModalOpen(false)}
        onSubmitOffer={handleSubmitOffer}
        listing={offerListing}
        currentUser={activeUser}
      />
    </div>
  );
};