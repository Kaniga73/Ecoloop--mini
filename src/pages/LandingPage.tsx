import React, { useState, useMemo } from "react";
import { SidebarFilter } from "../components/common/SidebarFilter";
import { ListingCard } from "../components/common/ListingCard";
import { Header } from "../components/common/Header";
import { ListingDetailPage } from "./ListingDetailPage";
import { DashboardPage } from "./DashboardPage";
import { ListWasteModal } from "../components/common/ListWasteModal";
import { PurchaseRecord } from "../components/common/DashboardView";
import { initialListings, currentUserProfiles, initialPurchases } from "../data/mockListings";
import { WasteListing, UserProfile, AuthView } from "../types";
import { useAuth } from "../hooks/useAuth";
import { Search } from "lucide-react";

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

  // State management
  const [allListings, setAllListings] = useState<WasteListing[]>(propListings || initialListings);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(initialPurchases);
  const [activeTab, setActiveTab] = useState<"marketplace" | "dashboard" | "messages" | "list-waste">("marketplace");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<number>(1000000);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "quantity">("newest");
  const [selectedListing, setSelectedListing] = useState<WasteListing | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentUserIndex, setCurrentUserIndex] = useState<number>(0);

  // List Waste Modal state
  const [isListWasteModalOpen, setIsListWasteModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<WasteListing | null>(null);

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
    setMaxPrice(1000000);
    setSortBy("newest");
  };

  // Listing CRUD actions
  const handleOpenListWaste = () => {
    setEditingListing(null);
    setIsListWasteModalOpen(true);
  };

  const handleEditListing = (listing: WasteListing) => {
    setEditingListing(listing);
    setIsListWasteModalOpen(true);
  };

  const handleDeleteListing = (listing: WasteListing) => {
    if (window.confirm(`Are you sure you want to delete "${listing.title}"?`)) {
      setAllListings((prev) => prev.filter((item) => item.id !== listing.id));
    }
  };

  const handleSubmitListing = (listingData: Partial<WasteListing>) => {
    if (listingData.id) {
      setAllListings((prev) =>
        prev.map((item) => (item.id === listingData.id ? ({ ...item, ...listingData } as WasteListing) : item))
      );
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

    if (maxPrice < 1000000) {
      result = result.filter((item) => item.pricePerUnit <= maxPrice);
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
    } else if (sortBy === "quantity") {
      result.sort((a, b) => b.totalQuantity - a.totalQuantity);
    }

    return result;
  }, [allListings, selectedCategory, searchQuery, locationQuery, maxPrice, sortBy]);

  // If a listing is selected, render ListingDetailPage with LocationMap
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
          onOpenListWaste={handleOpenListWaste}
          currentUser={activeUser}
          onSwitchUser={handleSwitchUser}
          unreadCount={1}
          onLogout={handleLogout}
        />
        <ListingDetailPage
          listing={selectedListing}
          onBack={() => setSelectedListing(null)}
          onStartChat={(item) => alert(`Chat started with seller for ${item.title}`)}
          onOpenMakeOffer={(item) => alert(`Offer form opened for ${item.title}`)}
          isFavorite={favorites.has(selectedListing.id)}
          onToggleFavorite={(id) => handleToggleFavorite(id)}
          currentUser={activeUser}
        />
        <ListWasteModal
          isOpen={isListWasteModalOpen}
          onClose={() => setIsListWasteModalOpen(false)}
          onSubmit={handleSubmitListing}
          currentUser={activeUser}
          initialListing={editingListing}
        />
      </div>
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
        onOpenListWaste={handleOpenListWaste}
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
            onOpenListWaste={handleOpenListWaste}
            onNavigateToMessages={() => setActiveTab("messages")}
            onViewContract={(offer) => alert(`View contract for ${offer.listingTitle}`)}
            purchases={purchases}
            onDeleteListing={handleDeleteListing}
            onEditListing={handleEditListing}
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
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
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
              {isLoadingListings ? (
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
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* List Waste Modal */}
      <ListWasteModal
        isOpen={isListWasteModalOpen}
        onClose={() => setIsListWasteModalOpen(false)}
        onSubmit={handleSubmitListing}
        currentUser={activeUser}
        initialListing={editingListing}
      />
    </div>
  );
};