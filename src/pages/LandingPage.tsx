import React, { useState, useMemo } from "react";
import { SidebarFilter } from "../components/common/SidebarFilter";
import { ListingCard } from "../components/common/ListingCard";
import { Header } from "../components/common/Header";
import { ListingDetailPage } from "./ListingDetailPage";
import { DashboardPage } from "./DashboardPage";
import { ListWasteModal } from "../components/common/ListWasteModal";
import { MakeOfferModal } from "../components/common/MakeOfferModal";
import { InstantBuyModal } from "../components/common/InstantBuyModal";
import { SellPage } from "./SellPage";
import { MessagesPage } from "./MessagesPage";
import { NotificationsPage } from "./NotificationsPage";
import { PurchaseRecord } from "../components/common/DashboardView";
import { currentUserProfiles, initialConversations, initialMessages, initialDealOffers } from "../data/mockListings";
import { WasteListing, UserProfile, AuthView, PartyDetails, Conversation, ChatMessage, DealOffer } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useCommunication } from "../context/CommunicationContext";
import { Search } from "lucide-react";
import { fetchActiveListings, deleteWasteListing, updateWasteListing, toUUID, savePurchaseRecord, getStoredPurchases } from "../lib/listingsService";
import { supabase, isLiveSupabaseConfigured } from "../lib/supabase";

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
  const { 
    unreadMessageCount, 
    unreadNotificationCount, 
    startConversation, 
    setActiveConversationId,
    sendMessage,
    sendOffer,
    acceptOffer,
    rejectOffer,
    deleteConversation
  } = useCommunication();

  // State management — purchases loaded from storage / real purchases
  const [allListings, setAllListings] = useState<WasteListing[]>(propListings || []);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    try {
      return getStoredPurchases() || [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(isLoadingListings);

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

    // 1. Cross-tab listing sync via BroadcastChannel
    let broadcast: BroadcastChannel | null = null;
    let purBroadcast: BroadcastChannel | null = null;
    try {
      broadcast = new BroadcastChannel('ecoloop_listings_sync');
      broadcast.onmessage = () => {
        fetchAndSetListings();
      };
      purBroadcast = new BroadcastChannel('ecoloop_purchases_sync');
      purBroadcast.onmessage = () => {
        setPurchases(getStoredPurchases() || []);
      };
    } catch {
      // ignore
    }

    // 2. Storage event listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes('listings')) {
        fetchAndSetListings();
      }
      if (e.key && e.key.includes('purchases')) {
        setPurchases(getStoredPurchases() || []);
      }
    };
    // 3. Focus / Visibility listener
    const handleFocus = () => {
      fetchAndSetListings();
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    // 4. Supabase Realtime Subscription for listings
    let channel: any = null;
    if (isLiveSupabaseConfigured && supabase) {
      try {
        channel = supabase.channel('marketplace-listings-sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
            fetchAndSetListings();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'waste_listings' }, () => {
            fetchAndSetListings();
          })
          .subscribe();
      } catch (err) {
        console.warn("Realtime listing channel error:", err);
      }
    }

    // 5. Periodic sync fallback for cross-browser synchronization
    const syncInterval = setInterval(() => {
      fetchActiveListings().then(fetchedListings => {
        if (fetchedListings && fetchedListings.length > 0) {
          setAllListings(prev => {
            if (prev.length !== fetchedListings.length) return fetchedListings;
            const prevKeys = prev.map(p => `${p.id}-${p.remainingQuantity}`).sort().join(',');
            const nextKeys = fetchedListings.map(p => `${p.id}-${p.remainingQuantity}`).sort().join(',');
            if (prevKeys !== nextKeys) return fetchedListings;
            return prev;
          });
        }
      }).catch(() => {});
    }, 2500);

    return () => {
      if (broadcast) broadcast.close();
      if (purBroadcast) purBroadcast.close();
      clearInterval(syncInterval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      if (channel && supabase) supabase.removeChannel(channel);
    };
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

    savePurchaseRecord(newPurchase);
    setPurchases((prev) => [newPurchase, ...prev.filter(p => p.id !== newPurchase.id)]);

    setAllListings((prev) =>
      prev.map((item) => {
        if (item.id === listing.id) {
          const originalQuantity = item.originalQuantity ?? item.totalQuantity ?? 0;
          const currentSold = item.soldQuantity ?? 0;
          const soldQuantity = currentSold + quantity;
          const remainingQuantity = Math.max(0, originalQuantity - soldQuantity);
          const status = remainingQuantity <= 0 ? "sold" : item.status;
          const purchaseHistory = [...(item.purchaseHistory || []), newPurchase];

          updateWasteListing(listing.id, {
            status,
            remaining_quantity: remainingQuantity,
            remainingQuantity: remainingQuantity,
            total_quantity: remainingQuantity,
            totalQuantity: remainingQuantity,
            sold_quantity: soldQuantity,
            soldQuantity: soldQuantity,
            originalQuantity,
          }).catch((err) => console.error("Error updating sold status:", err));

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

  const [activeTab, setActiveTab] = useState<"marketplace" | "dashboard" | "messages" | "list-waste" | "notifications">("marketplace");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["All Categories"]);
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

  const handleToggleCategory = (cat: string) => {
    if (cat === "All Categories") {
      setSelectedCategories(["All Categories"]);
      return;
    }
    setSelectedCategories((prev) => {
      const withoutAll = prev.filter((c) => c !== "All Categories");
      const exists = withoutAll.includes(cat);
      const next = exists ? withoutAll.filter((c) => c !== cat) : [...withoutAll, cat];
      return next.length === 0 ? ["All Categories"] : next;
    });
  };

  // List Waste Modal state
  const [isListWasteModalOpen, setIsListWasteModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<WasteListing | null>(null);

  // Make Offer Modal state
  const [isMakeOfferModalOpen, setIsMakeOfferModalOpen] = useState(false);
  const [offerListing, setOfferListing] = useState<WasteListing | null>(null);

  // Instant Buy Modal state
  const [isInstantBuyModalOpen, setIsInstantBuyModalOpen] = useState(false);
  const [buyListing, setBuyListing] = useState<WasteListing | null>(null);

  // Active user representation (fallback to mock profiles if custom DB profile missing)
  const activeUser: UserProfile = useMemo(() => {
    const fullName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split("@")[0] : "User");
    const companyName = (profile as any)?.business_name || (profile as any)?.company || user?.user_metadata?.business_name || fullName;
    if (profile || user) {
      return {
        id: profile?.auth_user_id || user?.id || "user-1",
        name: fullName,
        company: companyName,
        role: (profile as any)?.account_type || user?.user_metadata?.account_type || "individual",
        email: profile?.email || user?.email || "",
        location: `${profile?.city || "Chennai"}, ${profile?.state || "Tamil Nadu"}`,
        avatar: profile?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
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
    setSelectedCategories(["All Categories"]);
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
          id: activeUser.id || "seller-1",
          name: activeUser.name || "Seller",
          company: activeUser.company || "",
        },
        listedDate: "Today",
        viewCount: 1,
        status: "available",
      };
      setAllListings((prev) => [newListing, ...prev]);
    }
  };

  // Chat & Messaging Handlers
  const handleStartChat = async (listing: WasteListing) => {
    await startConversation(listing, activeUser.id, activeUser.name, activeUser.company, `Hello ${listing.seller.name}, I am interested in inquiring about ${listing.title}.`);
    setSelectedListing(null);
    setActiveTab("messages");
  };

  const handleAcceptOffer = (offer: DealOffer) => {
    acceptOffer(offer);
    const targetListing = allListings.find((l) => l.id === offer.listingId || l.title === offer.listingTitle);
    if (targetListing) {
      const buyerParty: PartyDetails = {
        id: offer.buyerId,
        name: offer.buyerName,
        company: "Buyer Company",
        email: "buyer@example.com",
        phone: "+91 00000 00000",
        location: "Unknown",
      };
      handleMarkAsSold(targetListing, buyerParty, offer.quantity, offer.offeredPricePerUnit);
    }
  };

  const handleRejectOffer = (offer: DealOffer) => {
    rejectOffer(offer);
  };

  const handleDeleteConversation = (conversationId: string) => {
    deleteConversation(conversationId);
  };

  // Buyer Purchasing / Make Offer flow
  const handleOpenMakeOffer = (listing: WasteListing) => {
    setOfferListing(listing);
    setIsMakeOfferModalOpen(true);
  };

  const handleOpenBuyModal = (listing: WasteListing) => {
    setBuyListing(listing);
    setIsInstantBuyModalOpen(true);
  };

  const handleConfirmDirectPurchase = async (
    listing: WasteListing,
    quantity: number,
    unitPrice: number,
    deliveryNotes?: string
  ) => {
    const buyerParty: PartyDetails = {
      id: activeUser.id,
      name: activeUser.name,
      company: activeUser.company || activeUser.name,
      email: activeUser.email || "buyer@example.com",
      phone: "+91 00000 00000",
      location: activeUser.location,
    };

    handleMarkAsSold(listing, buyerParty, quantity, unitPrice);

    const convId = await startConversation(listing, activeUser.id, activeUser.name, activeUser.company);
    
    // Create direct buy offer in Pending status
    const buyOffer: DealOffer = {
      id: `buy-${Date.now()}`,
      conversationId: convId,
      listingId: listing.id,
      listingTitle: listing.title,
      buyerId: activeUser.id,
      buyerName: activeUser.name,
      sellerId: listing.seller.id,
      sellerName: listing.seller.name,
      quantity,
      unit: listing.unit || "Ton",
      offeredPricePerUnit: unitPrice,
      totalAmount: quantity * unitPrice,
      currency: listing.currency || "₹",
      status: "Pending",
      createdAt: new Date().toISOString(),
      notes: deliveryNotes || "Direct Buy Request for Whole / Selected Lot",
    };
    sendOffer(buyOffer);
  };

  const handleSubmitOffer = async (
    listing: WasteListing,
    quantity: number,
    pricePerUnit: number,
    notes?: string,
    incoterm?: string
  ) => {
    setIsMakeOfferModalOpen(false);
    const convId = await startConversation(listing, activeUser.id, activeUser.name, activeUser.company);

    const offerId = `offer-${Date.now()}`;
    const newOffer: DealOffer = {
      id: offerId,
      conversationId: convId,
      listingId: listing.id,
      listingTitle: listing.title,
      buyerId: activeUser.id,
      buyerName: activeUser.name,
      sellerId: listing.seller.id,
      sellerName: listing.seller.name,
      senderId: activeUser.id,
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

    // Actually send the offer through the communication context
    await sendOffer(newOffer);

    // Close modal, reset selected listing, select active conversation thread, and switch to Messages tab immediately
    setSelectedListing(null);
    setActiveConversationId(convId);
    setActiveTab("messages");
  };

  // Filtered & Sorted listings for Marketplace
  const filteredListings = useMemo(() => {
    let result = allListings.filter(
      (item) =>
        item.status !== "sold" &&
        (item.remainingQuantity === undefined || item.remainingQuantity > 0) &&
        item.totalQuantity > 0
    );

    if (selectedCategories.length > 0 && !selectedCategories.includes("All Categories")) {
      result = result.filter((item) =>
        selectedCategories.some((cat) => cat.toLowerCase() === item.category.toLowerCase())
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
  }, [allListings, selectedCategories, searchQuery, locationQuery, minPrice, maxPrice, minQuantity, maxQuantity, sortBy]);

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
          unreadMessageCount={unreadMessageCount}
          unreadNotificationCount={unreadNotificationCount}
          onLogout={handleLogout}
        />
        <ListingDetailPage
          listing={selectedListing}
          onBack={() => setSelectedListing(null)}
          onStartChat={handleStartChat}
          onOpenMakeOffer={handleOpenMakeOffer}
          onOpenBuyModal={handleOpenBuyModal}
          isFavorite={favorites.has(selectedListing.id)}
          onToggleFavorite={(id) => handleToggleFavorite(id)}
          currentUser={activeUser}
        />
        {/* Modals */}
        <MakeOfferModal
          isOpen={isMakeOfferModalOpen}
          onClose={() => setIsMakeOfferModalOpen(false)}
          onSubmitOffer={handleSubmitOffer}
          listing={offerListing}
          currentUser={activeUser}
        />
        {buyListing && (
          <InstantBuyModal
            isOpen={isInstantBuyModalOpen}
            onClose={() => setIsInstantBuyModalOpen(false)}
            listing={buyListing}
            currentUser={activeUser}
            onConfirmPurchase={handleConfirmDirectPurchase}
          />
        )}
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
        unreadMessageCount={unreadMessageCount}
        unreadNotificationCount={unreadNotificationCount}
        onLogout={handleLogout}
      />

      {/* Main Container without awkward side margins or extra scrolls */}
      <main id="landing-page" className="flex-1 w-full max-w-[1700px] mx-auto px-3 sm:px-6 py-4 space-y-4">
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
            onOpenMakeOffer={handleOpenMakeOffer}
            onOpenListingSpecs={(listingId) => {
              const match = allListings.find((l) => l.id === listingId);
              if (match) setSelectedListing(match);
            }}
            listings={allListings}
            currentUser={activeUser}
          />
        ) : activeTab === "notifications" ? (
          <NotificationsPage />
        ) : (
          /* Marketplace View */
          <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
            {/* Left Sidebar Filter */}
            <SidebarFilter
              selectedCategories={selectedCategories}
              onToggleCategory={handleToggleCategory}
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
                  {!selectedCategories.includes("All Categories") && selectedCategories.length > 0 && (
                    <span className="ml-1 text-emerald-800 font-medium">
                      • {selectedCategories.join(", ")}
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
                      currentUser={activeUser}
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
      {buyListing && (
        <InstantBuyModal
          isOpen={isInstantBuyModalOpen}
          onClose={() => setIsInstantBuyModalOpen(false)}
          listing={buyListing}
          currentUser={activeUser}
          onConfirmPurchase={handleConfirmDirectPurchase}
        />
      )}
    </div>
  );
};