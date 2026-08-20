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
  ShieldCheck,
  FileText,
  Heart,
  ShoppingCart,
} from "lucide-react";
import { WasteListing, DealOffer, UserProfile, PartyDetails } from "../../types";

// Shape for a purchase row shown in "My Purchases (Buying)".
export interface PurchaseRecord {
  id: string;
  productTitle: string;
  category: string;
  quantity: number;
  unit: string;
  amount: number;
  unitPrice?: number;
  currency: string;
  status: "Completed" | "Pending" | "Shipped" | "Cancelled";
  orderedDate: string;
  image?: string;
  seller?: PartyDetails;
  buyer?: PartyDetails;
}

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
}

interface TransactionDetailModalItem {
  id: string;
  productTitle: string;
  category: string;
  quantity: string;
  amount: string;
  unitPrice?: string;
  status: string;
  date: string;
  image?: string;
  seller: PartyDetails;
  buyer: PartyDetails;
  type: "listing" | "purchase";
}

const statusPillClasses: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reserved: "bg-amber-50 text-amber-700 border-amber-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  sold: "bg-blue-50 text-blue-700 border-blue-200",
  Sold: "bg-blue-50 text-blue-700 border-blue-200",
  Shipped: "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusLabel = (status: string) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "";

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
}) => {
  const [selectedDetail, setSelectedDetail] = useState<TransactionDetailModalItem | null>(null);

  // Filter listings saved in Wishlist (favorites)
  const wishlistListings = listings.filter((l) => favorites && favorites.has(l.id));

  // My listings (selling side)
  const myListings = listings.filter((l) => {
    if (l.seller && l.seller.id && currentUser.id && l.seller.id === currentUser.id) return true;
    if (l.seller && l.seller.contactEmail && currentUser.email && l.seller.contactEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (l.seller && l.seller.name && (currentUser.name || (currentUser as any).full_name) && l.seller.name.toLowerCase() === ((currentUser.name || (currentUser as any).full_name) as string).toLowerCase()) return true;
    return false;
  });

  const activeListings = myListings.filter((l) => l.status === "available");
  const soldListings = myListings.filter((l) => l.status === "sold");
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
      name: l.seller.name,
      company: l.seller.company,
      email: l.seller.contactEmail || "senthil@ambatturfab.com",
      phone: l.seller.contactPhone || "+91 98401 12345",
      location: l.seller.location || `${l.location.city}, ${l.location.stateOrCountry}`,
      avatar: l.seller.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    };

    const buyer: PartyDetails = l.buyer || defaultBuyerDetails;

    setSelectedDetail({
      id: l.id,
      productTitle: l.title,
      category: l.category,
      quantity: `${l.totalQuantity} ${l.unit}`,
      amount: `${l.currency}${(l.totalEstimatedValue || l.pricePerUnit * l.totalQuantity).toLocaleString("en-IN")}`,
      unitPrice: `${l.currency}${l.pricePerUnit.toLocaleString("en-IN")} / ${l.unit}`,
      status: l.status,
      date: formatListedDate(l.listedDate),
      image: l.images[0],
      seller,
      buyer,
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
      quantity: `${p.quantity} ${p.unit}`,
      amount: `${p.currency}${p.amount.toLocaleString("en-IN")}`,
      unitPrice: p.unitPrice ? `${p.currency}${p.unitPrice.toLocaleString("en-IN")} / ${p.unit}` : undefined,
      status: p.status,
      date: formatListedDate(p.orderedDate),
      image: p.image,
      seller,
      buyer,
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
          <table className="w-full text-left text-sm">
            <thead className="text-neutral-500 text-xs font-semibold bg-neutral-50/60">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
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
                myListings.map((l) => (
                  <tr key={l.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={l.images[0]}
                          alt={l.title}
                          className="w-9 h-9 rounded-lg object-cover border border-neutral-200 shrink-0"
                        />
                        <span className="font-semibold text-neutral-900 truncate max-w-[180px]">{l.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{l.category}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          statusPillClasses[l.status] || "bg-neutral-100 text-neutral-600 border-neutral-200"
                        }`}
                      >
                        {statusLabel(l.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewListingDetails(l)}
                          className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all flex items-center gap-1.5 cursor-pointer"
                          title="View complete transaction details"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          View Details
                        </button>
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
                ))
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
          <table className="w-full text-left text-sm">
            <thead className="text-neutral-500 text-xs font-semibold bg-neutral-50/60">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
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
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {p.image && (
                          <img
                            src={p.image}
                            alt={p.productTitle}
                            className="w-9 h-9 rounded-lg object-cover border border-neutral-200 shrink-0"
                          />
                        )}
                        <span className="font-semibold text-neutral-900 truncate max-w-[180px]">{p.productTitle}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{p.category}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          statusPillClasses[p.status] || "bg-neutral-100 text-neutral-600 border-neutral-200"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleViewPurchaseDetails(p)}
                        className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                        title="View complete transaction details"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        View Details
                      </button>
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
                Wishlist <span className="text-neutral-400 font-semibold">(Saved Products)</span>
              </h3>
            </div>
          </div>
          <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
            {wishlistListings.length} {wishlistListings.length === 1 ? "Product" : "Products"} Saved
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-neutral-500 text-xs font-semibold bg-neutral-50/60">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Available Quantity</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Seller</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {wishlistListings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-neutral-400 text-sm">
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
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={l.images[0]}
                          alt={l.title}
                          className="w-9 h-9 rounded-lg object-cover border border-neutral-200 shrink-0"
                        />
                        <span className="font-semibold text-neutral-900 truncate max-w-[180px]">{l.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{l.category}</td>
                    <td className="px-5 py-3 text-neutral-600">
                      {l.totalQuantity} {l.unit}
                    </td>
                    <td className="px-5 py-3 text-neutral-600 font-medium">
                      {l.currency}{l.pricePerUnit.toLocaleString("en-IN")} / {l.unit}
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-xs">
                        <span className="font-semibold text-neutral-900 block">{l.seller.company}</span>
                        <span className="text-neutral-500">{l.seller.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          statusPillClasses[l.status] || "bg-neutral-100 text-neutral-600 border-neutral-200"
                        }`}
                      >
                        {statusLabel(l.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onOpenMakeOffer && (
                          <button
                            onClick={() => onOpenMakeOffer(l)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Make offer / Buy"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Make Offer
                          </button>
                        )}
                        <button
                          onClick={() => handleViewListingDetails(l)}
                          className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all flex items-center gap-1.5 cursor-pointer"
                          title="View product details"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          View
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
                    Transaction & Order Details
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Order Ref: #{selectedDetail.id.toUpperCase()}
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

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
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
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Quantity: <strong className="text-neutral-800 font-semibold">{selectedDetail.quantity}</strong>
                      {selectedDetail.unitPrice && (
                        <span> • Unit Price: <strong className="text-neutral-800 font-semibold">{selectedDetail.unitPrice}</strong></span>
                      )}
                    </p>
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

              {/* Seller & Buyer Party Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Seller Info Card */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      Sold By (Seller)
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
                      <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Phone Number</span>
                        <a href={`tel:${selectedDetail.seller.phone}`} className="text-neutral-800 font-medium hover:text-emerald-700">
                          {selectedDetail.seller.phone || "N/A"}
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

                {/* Buyer Info Card */}
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
                      <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Phone Number</span>
                        <a href={`tel:${selectedDetail.buyer.phone}`} className="text-neutral-800 font-medium hover:text-emerald-700">
                          {selectedDetail.buyer.phone || "N/A"}
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
              </div>

              {/* Compliance & Verification Badge */}
              <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-200/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified EcoLoop Circular Economy Transaction</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold">TN PCB Compliant</span>
              </div>
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
    </div>
  );
};