import React, { useState } from "react";
import {
  ClipboardList,
  Tag,
  ShoppingBag,
  IndianRupee,
  Pencil,
  Trash2,
  Eye,
  X,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Heart,
  ShoppingCart,
  CheckCircle2,
} from "lucide-react";
import { WasteListing, DealOffer, UserProfile, PartyDetails, PurchaseRecord } from "../../types";
import { MarkAsSoldModal } from "./MarkAsSoldModal";

export type { PurchaseRecord };

interface DashboardViewProps {
  listings: WasteListing[];
  currentUser: UserProfile;
  onOpenListing: (listing: WasteListing) => void;
  onOpenListWaste?: () => void;
  onNavigateToMessages: () => void;
  onViewContract?: (offer: DealOffer) => void;
  purchases?: PurchaseRecord[];
  onDeleteListing?: (listing: WasteListing) => void;
  onEditListing?: (listing: WasteListing) => void;
  favorites?: Set<string>;
  onToggleFavorite?: (id: string) => void;
  onOpenMakeOffer?: (listing: WasteListing) => void;
  onExploreMarketplace?: () => void;
  onMarkAsSold?: (
    listing: WasteListing,
    buyer: PartyDetails,
    quantity: number,
    pricePerUnit: number
  ) => void;
}

interface TransactionDetailModalItem {
  id: string;
  productTitle: string;
  category: string;
  originalQuantity: number;
  soldQuantity: number;
  remainingQuantity: number;
  unit: string;
  quantity: string;
  amount: string;
  unitPrice?: string;
  status: string;
  date: string;
  image?: string;
  seller: PartyDetails;
  buyer?: PartyDetails;
  purchaseHistory?: PurchaseRecord[];
  type: "listing" | "purchase";
}

const statusPillClasses: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reserved: "bg-amber-50 text-amber-700 border-amber-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  sold: "bg-rose-50 text-rose-700 border-rose-200",
  Sold: "bg-rose-50 text-rose-700 border-rose-200",
  "Sold Out": "bg-rose-50 text-rose-700 border-rose-200",
  Shipped: "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusLabel = (status: string) => {
  if (!status) return "";
  if (status.toLowerCase() === "sold" || status === "Sold Out") return "Sold Out";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatListedDate = (dateStr: string) => {
  if (!dateStr) return "N/A";
  if (dateStr === "Today" || dateStr.includes("ago")) {
    return dateStr;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  listings,
  currentUser,
  onOpenListing,
  onOpenListWaste,
  onNavigateToMessages,
  onViewContract,
  purchases = [],
  onDeleteListing,
  onEditListing,
  favorites = new Set(),
  onToggleFavorite,
  onOpenMakeOffer,
  onExploreMarketplace,
  onMarkAsSold,
}) => {
  const [selectedDetail, setSelectedDetail] = useState<TransactionDetailModalItem | null>(null);
  const [markAsSoldListing, setMarkAsSoldListing] = useState<WasteListing | null>(null);

  // Filter listings saved in Wishlist (favorites)
  const wishlistListings = listings.filter((l) => favorites && favorites.has(l.id));

  // My listings (selling side)
  const userMyListings = listings.filter((l) => {
    if (l.seller && l.seller.id && currentUser.id && l.seller.id === currentUser.id) return true;
    if (l.seller && l.seller.contactEmail && currentUser.email && l.seller.contactEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (l.seller && l.seller.name && (currentUser.name || (currentUser as any).full_name) && l.seller.name.toLowerCase() === ((currentUser.name || (currentUser as any).full_name) as string).toLowerCase()) return true;
    return false;
  });

  const myListings = userMyListings.length > 0 ? userMyListings : listings;

  const activeListings = myListings.filter((l) => l.status === "available" && (l.remainingQuantity === undefined || l.remainingQuantity > 0));
  const soldListings = myListings.filter((l) => l.status === "sold" || (l.remainingQuantity !== undefined && l.remainingQuantity <= 0));
  const totalEarnings = soldListings.reduce(
    (sum, l) => sum + (l.totalEstimatedValue || 0),
    0
  );

  // Fallback buyer details when none explicit
  const defaultBuyerDetails: PartyDetails = {
    name: "Karthik Sundaram",
    company: "TN Metal & Polymer Recyclers Pvt Ltd",
    email: "karthik@tnrecyclers.in",
    phone: "+91 98401 23456",
    location: "Guindy Industrial Estate, Chennai, Tamil Nadu",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  };

  // Helper to open details modal for listing
  const handleViewListingDetails = (l: WasteListing) => {
    const seller: PartyDetails = {
      name: l.seller.name || currentUser.name || "Unknown Name",
      company: l.seller.company || currentUser.company || "Unknown Company",
      email: l.seller.contactEmail || currentUser.email || "N/A",
      phone: l.seller.contactPhone || (currentUser as any).phone || "N/A",
      location: l.seller.location || currentUser.location || `${l.location.city}, ${l.location.stateOrCountry}`,
      avatar: l.seller.avatar || currentUser.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    };

    const originalQuantity = l.originalQuantity ?? l.totalQuantity ?? 0;
    
    // Combine purchases matching this listing
    const matchingPurchases = purchases.filter((p) => p.listingId === l.id || p.productTitle === l.title);
    const combinedHistory = [...(l.purchaseHistory || [])];
    for (const hp of matchingPurchases) {
      if (!combinedHistory.some((item) => item.id === hp.id)) {
        combinedHistory.push(hp);
      }
    }

    const soldQuantity = l.soldQuantity ?? combinedHistory.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const remainingQuantity = l.remainingQuantity ?? Math.max(0, originalQuantity - soldQuantity);
    const effectiveStatus = remainingQuantity <= 0 ? "sold" : l.status;

    setSelectedDetail({
      id: l.id,
      productTitle: l.title,
      category: l.category,
      originalQuantity,
      soldQuantity,
      remainingQuantity,
      unit: l.unit || "kg",
      quantity: `${originalQuantity} ${l.unit || "kg"}`,
      amount: `${l.currency || "₹"}${((l.totalEstimatedValue || l.pricePerUnit * originalQuantity)).toLocaleString("en-IN")}`,
      unitPrice: `${l.currency || "₹"}${l.pricePerUnit.toLocaleString("en-IN")} / ${l.unit || "kg"}`,
      status: effectiveStatus,
      date: formatListedDate(l.listedDate),
      image: l.images[0],
      seller,
      buyer: l.buyer,
      purchaseHistory: combinedHistory,
      type: "listing",
    });
  };

  // Helper to open details modal for purchase
  const handleViewPurchaseDetails = (p: PurchaseRecord) => {
    const seller: PartyDetails = p.seller || {
      name: "Venkatesh Rao",
      company: "Hosur Precision Conductors Ltd",
      email: "venkatesh@hosurconductors.com",
      phone: "+91 98840 98765",
      location: "SIPCOT Phase II, Hosur, Tamil Nadu",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    };

    const buyer: PartyDetails = p.buyer || {
      name: currentUser.name || "Karthik Sundaram",
      company: currentUser.company || "TN Metal & Polymer Recyclers",
      email: currentUser.email || "karthik@tnrecyclers.in",
      phone: (currentUser as any).phone || "+91 98401 23456",
      location: currentUser.location || "Guindy Industrial Estate, Chennai",
      avatar: currentUser.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    };

    setSelectedDetail({
      id: p.id,
      productTitle: p.productTitle,
      category: p.category,
      originalQuantity: p.quantity,
      soldQuantity: p.quantity,
      remainingQuantity: 0,
      unit: p.unit || "kg",
      quantity: `${p.quantity} ${p.unit}`,
      amount: `${p.currency}${p.amount.toLocaleString("en-IN")}`,
      unitPrice: p.unitPrice ? `${p.currency}${p.unitPrice.toLocaleString("en-IN")} / ${p.unit}` : undefined,
      status: p.status,
      date: formatListedDate(p.orderedDate),
      image: p.image,
      seller,
      buyer,
      purchaseHistory: [p],
      type: "purchase",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Track your listed products, sales, seller & buyer details, and saved wishlist products.
        </p>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Listings */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-semibold text-neutral-700 block">
              Total Products
            </span>
            <div className="text-3xl font-extrabold text-neutral-900 mt-0.5">
              {myListings.length}
            </div>
            <span className="text-xs text-emerald-700 mt-0.5 block">
              All products you have listed
            </span>
          </div>
        </div>

        {/* Active Listings */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-semibold text-neutral-700 block">
              Available Products
            </span>
            <div className="text-3xl font-extrabold text-neutral-900 mt-0.5">
              {activeListings.length}
            </div>
            <span className="text-xs text-blue-700 mt-0.5 block">
              Currently available products
            </span>
          </div>
        </div>

        {/* Sold Products */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-semibold text-neutral-700 block">
              Sold Products
            </span>
            <div className="text-3xl font-extrabold text-neutral-900 mt-0.5">
              {soldListings.length}
            </div>
            <span className="text-xs text-amber-700 mt-0.5 block">
              Products you have sold
            </span>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-semibold text-neutral-700 block">
              Total Earnings
            </span>
            <div className="text-3xl font-extrabold text-neutral-900 mt-0.5">
              ₹{totalEarnings.toLocaleString("en-IN")}
            </div>
            <span className="text-xs text-violet-700 mt-0.5 block">
              Total amount earned
            </span>
          </div>
        </div>
      </div>

      {/* My Listings (Selling) Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-100">
          <h3 className="text-base font-bold text-neutral-900">
            My Products <span className="text-neutral-400 font-semibold">(Selling)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="text-neutral-500 text-xs font-semibold bg-neutral-50/60">
              <tr>
                <th className="px-5 py-3 align-middle w-5/12">Product</th>
                <th className="px-5 py-3 align-middle w-2/12">Category</th>
                <th className="px-5 py-3 align-middle w-2/12">Status</th>
                <th className="px-5 py-3 align-middle w-3/12 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {myListings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-neutral-400 text-sm">
                    You haven't listed any products yet.
                  </td>
                </tr>
              ) : (
                myListings.map((l) => {
                  const isSoldOut = l.status === "sold" || (l.remainingQuantity !== undefined && l.remainingQuantity <= 0);
                  const displayStatus = isSoldOut ? "sold" : l.status;
                  return (
                    <tr key={l.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="px-5 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <img
                            src={l.images[0]}
                            alt={l.title}
                            className="w-9 h-9 rounded-lg object-cover border border-neutral-200 shrink-0"
                          />
                          <span className="font-semibold text-neutral-900 truncate max-w-[220px]">{l.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-neutral-600 align-middle">{l.category}</td>
                      <td className="px-5 py-3 align-middle">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            statusPillClasses[displayStatus] || "bg-neutral-100 text-neutral-600 border-neutral-200"
                          }`}
                        >
                          {statusLabel(displayStatus)}
                        </span>
                      </td>
                      <td className="px-5 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewListingDetails(l)}
                            className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all flex items-center gap-1.5 cursor-pointer"
                            title="View complete transaction details"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            View Details
                          </button>
                          {!isSoldOut && (
                            <button
                              onClick={() => setMarkAsSoldListing(l)}
                              className="px-2.5 py-1.5 rounded-lg border border-emerald-600 bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Mark product as sold to an interested buyer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Mark as Sold
                            </button>
                          )}
                          <button
                            onClick={() => (onEditListing ? onEditListing(l) : onOpenListing(l))}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Edit listing"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteListing && onDeleteListing(l)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Purchases (Buying) Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-base font-bold text-neutral-900">
            My Purchases <span className="text-neutral-400 font-semibold">(Buying)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="text-neutral-500 text-xs font-semibold bg-neutral-50/60">
              <tr>
                <th className="px-5 py-3 align-middle w-5/12">Product</th>
                <th className="px-5 py-3 align-middle w-2/12">Category</th>
                <th className="px-5 py-3 align-middle w-2/12">Status</th>
                <th className="px-5 py-3 align-middle w-3/12 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-neutral-400 text-sm">
                    You haven't made any purchases yet.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-5 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        {p.image && (
                          <img
                            src={p.image}
                            alt={p.productTitle}
                            className="w-9 h-9 rounded-lg object-cover border border-neutral-200 shrink-0"
                          />
                        )}
                        <span className="font-semibold text-neutral-900 truncate max-w-[220px]">{p.productTitle}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-600 align-middle">{p.category}</td>
                    <td className="px-5 py-3 align-middle">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          statusPillClasses[p.status] || "bg-neutral-100 text-neutral-600 border-neutral-200"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewPurchaseDetails(p)}
                          className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all flex items-center gap-1.5 cursor-pointer"
                          title="View complete transaction details"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wishlist Section (Saved Products under My Purchases) */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
              <Heart className="w-4 h-4 fill-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                Wishlist 
              </h3>
            </div>
          </div>
          <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
            {wishlistListings.length} {wishlistListings.length === 1 ? "Product" : "Products"} Saved
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="text-neutral-500 text-xs font-semibold bg-neutral-50/60">
              <tr>
                <th className="px-5 py-3 align-middle w-5/12">Product</th>
                <th className="px-5 py-3 align-middle w-2/12">Category</th>
                <th className="px-5 py-3 align-middle w-2/12">Status</th>
                <th className="px-5 py-3 align-middle w-3/12 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {wishlistListings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-neutral-400 text-sm">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
                        <Heart className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-neutral-800">Your wishlist is empty</p>
                      <p className="text-xs text-neutral-500">
                        Click the heart icon on any waste listing in the marketplace to save it here for quick access.
                      </p>
                      {onExploreMarketplace && (
                        <button
                          onClick={onExploreMarketplace}
                          className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                          Browse Marketplace
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                wishlistListings.map((l) => (
                  <tr key={l.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-5 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <img
                          src={l.images[0]}
                          alt={l.title}
                          className="w-9 h-9 rounded-lg object-cover border border-neutral-200 shrink-0"
                        />
                        <span className="font-semibold text-neutral-900 truncate max-w-[220px]">{l.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-600 align-middle">{l.category}</td>
                    <td className="px-5 py-3 align-middle">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          statusPillClasses[l.status] || "bg-neutral-100 text-neutral-600 border-neutral-200"
                        }`}
                      >
                        {statusLabel(l.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenListing(l)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          title="View product post"
                        >
                          <Eye className="w-3.5 h-3.5 text-white" />
                          View Product
                        </button>
                        {onToggleFavorite && (
                          <button
                            onClick={() => onToggleFavorite(l.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove from wishlist"
                          >
                            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction & Party Details Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8 transform transition-all">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedDetail.type === 'purchase' || selectedDetail.status === 'sold' || selectedDetail.status === 'Completed' ? 'Transaction & Order Details' : 'Listing Details'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {selectedDetail.type === 'purchase' || selectedDetail.status === 'sold' || selectedDetail.status === 'Completed' ? 'Order Ref' : 'Listing Ref'}: #{selectedDetail.id.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Product Summary Banner */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {selectedDetail.image && (
                    <img
                      src={selectedDetail.image}
                      alt={selectedDetail.productTitle}
                      className="w-14 h-14 rounded-xl object-cover border border-neutral-200 shrink-0"
                    />
                  )}
                  <div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block mb-1">
                      {selectedDetail.category}
                    </span>
                    <h4 className="text-sm font-bold text-neutral-900">
                      {selectedDetail.productTitle}
                    </h4>
                    {selectedDetail.unitPrice && (
                      <p className="text-xs text-neutral-600 mt-0.5">
                        Unit Price: <strong className="text-neutral-900 font-semibold">{selectedDetail.unitPrice}</strong>
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-lg font-extrabold text-neutral-900">
                    {selectedDetail.amount}
                  </div>
                  <div className="flex items-center gap-2 mt-1 justify-start sm:justify-end">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        statusPillClasses[selectedDetail.status] || "bg-neutral-100 text-neutral-600 border-neutral-200"
                      }`}
                    >
                      {statusLabel(selectedDetail.status)}
                    </span>
                    <span className="text-[11px] text-neutral-400">{selectedDetail.date}</span>
                  </div>
                </div>
              </div>

              {/* Quantity Summary Card */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
                <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-700" />
                  Quantity Summary
                </h5>
                {selectedDetail.type === "listing" ? (
                  <>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-neutral-800 bg-white/90 p-3 rounded-xl border border-emerald-100 shadow-2xs">
                      <div className="flex items-center gap-1">
                        <span className="text-neutral-500">Listed:</span>
                        <strong className="text-neutral-900 font-bold">{selectedDetail.originalQuantity} {selectedDetail.unit}</strong>
                      </div>
                      <span className="text-neutral-300">•</span>
                      <div className="flex items-center gap-1">
                        <span className="text-neutral-500">Sold:</span>
                        <strong className="text-amber-700 font-bold">{selectedDetail.soldQuantity} {selectedDetail.unit}</strong>
                      </div>
                      <span className="text-neutral-300">•</span>
                      <div className="flex items-center gap-1">
                        <span className="text-neutral-500">Remaining:</span>
                        <strong className={selectedDetail.remainingQuantity === 0 ? "text-rose-600 font-extrabold" : "text-emerald-700 font-extrabold"}>
                          {selectedDetail.remainingQuantity} {selectedDetail.unit}
                        </strong>
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-600 font-medium px-1">
                      Listed: {selectedDetail.originalQuantity} {selectedDetail.unit}, Sold: {selectedDetail.soldQuantity} {selectedDetail.unit}, Remaining: {selectedDetail.remainingQuantity} {selectedDetail.unit}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-800 bg-white/90 p-3 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-neutral-500">Purchased Quantity:</span>
                    <strong className="text-emerald-700 font-extrabold">{selectedDetail.originalQuantity} {selectedDetail.unit}</strong>
                  </div>
                )}
              </div>

              {/* Seller & Buyer Party Cards */}
              <div className="grid grid-cols-1 gap-4">
                {/* Seller Info Card (Shown for My Purchases) */}
                {selectedDetail.type === "purchase" && (
                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                      <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        Seller Details
                      </h5>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        Vendor
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-neutral-400 block text-[10px]">Company / Facility</span>
                          <span className="font-bold text-neutral-900">{selectedDetail.seller.company}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <User className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-neutral-400 block text-[10px]">Contact Person</span>
                          <span className="font-semibold text-neutral-800">{selectedDetail.seller.name}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-neutral-400 block text-[10px]">Email Address</span>
                          <a href={`mailto:${selectedDetail.seller.email}`} className="text-emerald-700 hover:underline font-medium">
                            {selectedDetail.seller.email || "N/A"}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-neutral-400 block text-[10px]">Facility Location</span>
                          <span className="text-neutral-700">{selectedDetail.seller.location || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buyer Info Card (Shown for My Products) */}
                {selectedDetail.type === "listing" && (
                  selectedDetail.buyer ? (
                    <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                        <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          Purchased By (Buyer)
                        </h5>
                        <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          Procurer
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-neutral-400 block text-[10px]">Company / Purchasing Org</span>
                            <span className="font-bold text-neutral-900">{selectedDetail.buyer.company}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <User className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-neutral-400 block text-[10px]">Purchaser Name</span>
                            <span className="font-semibold text-neutral-800">{selectedDetail.buyer.name}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-neutral-400 block text-[10px]">Email Address</span>
                            <a href={`mailto:${selectedDetail.buyer.email}`} className="text-emerald-700 hover:underline font-medium">
                              {selectedDetail.buyer.email || "N/A"}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-neutral-400 block text-[10px]">Delivery Address</span>
                            <span className="text-neutral-700">{selectedDetail.buyer.location || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex flex-col items-center justify-center text-neutral-400 space-y-2 min-h-[150px]">
                      <User className="w-8 h-8 opacity-20" />
                      <span className="text-xs font-medium">No primary buyer assigned yet</span>
                    </div>
                  )
                )}
              </div>

              {/* Purchase History Section (Only for My Products listings) */}
              {selectedDetail.type === "listing" && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      Purchase History
                    </h5>
                    <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {selectedDetail.purchaseHistory?.length || 0} {selectedDetail.purchaseHistory?.length === 1 ? "Buyer" : "Buyers"}
                    </span>
                  </div>

                  {selectedDetail.purchaseHistory && selectedDetail.purchaseHistory.length > 0 ? (
                    <div className="space-y-3 divide-y divide-neutral-100">
                      {selectedDetail.purchaseHistory.map((p, idx) => {
                        const buyerName = p.buyer?.name || (p as any).buyerName || `Buyer ${String.fromCharCode(65 + idx)}`;
                        return (
                          <div key={p.id || idx} className={`${idx > 0 ? "pt-3" : ""} flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs`}>
                            <div className="space-y-1">
                              <div className="text-neutral-800 font-medium leading-snug">
                                <span className="font-semibold text-neutral-900">{buyerName}</span>
                                {" – "}
                                <span className="font-bold text-emerald-700">{p.quantity} {p.unit || selectedDetail.unit}</span>
                                {" – "}
                                <span className="font-bold text-neutral-900">{p.currency || '₹'}{p.amount.toLocaleString("en-IN")}</span>
                                {" – "}
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusPillClasses[p.status] || "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                                  {p.status}
                                </span>
                              </div>
                              {p.buyer?.company && (
                                <span className="text-[11px] text-neutral-400 block">{p.buyer.company}</span>
                              )}
                            </div>

                            <div className="text-left sm:text-right shrink-0">
                              <span className="text-[11px] text-neutral-400 block">{p.orderedDate}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-4 flex flex-col items-center justify-center text-neutral-400 space-y-1.5 text-center">
                      <User className="w-6 h-6 opacity-30" />
                      <p className="text-xs font-medium text-neutral-600">No purchase history yet</p>
                      <p className="text-[11px] text-neutral-400 max-w-sm">
                        When buyers purchase quantities from this listing, each transaction will be recorded here separately.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200/80 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark As Sold Action Modal */}
      <MarkAsSoldModal
        isOpen={!!markAsSoldListing}
        onClose={() => setMarkAsSoldListing(null)}
        listing={markAsSoldListing}
        onConfirmSale={(lst, buyer, qty, price) => {
          if (onMarkAsSold) {
            onMarkAsSold(lst, buyer, qty, price);
          }
        }}
      />
    </div>
  );
};