import React, { useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Heart,
  MessageSquare,
  DollarSign,
  Package,
  Share2,
  Tag,
  Layers,
  Truck,
  Users,
  Recycle,
  Sparkles,
  Building2,
  FileText,
} from "lucide-react";
import { WasteListing, UserProfile } from "../types";
import { LocationMap } from "../components/common/LocationMap";

interface ListingDetailPageProps {
  listing: WasteListing;
  onBack: () => void;
  onStartChat: (listing: WasteListing) => void;
  onOpenMakeOffer: (listing: WasteListing) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  currentUser: UserProfile;
}

export const ListingDetailPage: React.FC<ListingDetailPageProps> = ({
  listing,
  onBack,
  onStartChat,
  onOpenMakeOffer,
  isFavorite,
  onToggleFavorite,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const formatListedDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const remainingQty = listing.remainingQuantity !== undefined ? listing.remainingQuantity : listing.totalQuantity;

  return (
    <div id="listing-detail-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <button
          id="back-to-marketplace-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 hover:text-emerald-700 transition-colors shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-xl transition-colors shadow-xs cursor-pointer"
            title="Share Listing"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? "Link Copied!" : "Share"}</span>
          </button>
          <button
            onClick={() => onToggleFavorite(listing.id)}
            className="p-2 bg-white border border-neutral-200 text-neutral-500 hover:text-rose-600 hover:bg-neutral-50 rounded-xl transition-colors shadow-xs cursor-pointer"
            title={isFavorite ? "Saved" : "Save Listing"}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column (Images, Title, Specifications, Logistics, Eco details) & Right Column (Pricing & Actions & Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Large Image */}
          <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200 shadow-xs">
            <img
              src={listing.images[selectedImageIndex] || listing.images[0]}
              alt={listing.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {/* Category & Condition Tags overlay */}
            <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
              <div className="bg-black/70 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs">
                {listing.category}
              </div>
              {listing.condition && (
                <div className="bg-emerald-600/90 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs">
                  {listing.condition}
                </div>
              )}
            </div>
          </div>

          {/* Gallery Thumbnails */}
          {listing.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {listing.images.map((img, idx) => (
                <button
                  key={idx}
                  id={`detail-thumb-${idx}`}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-24 h-18 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImageIndex === idx
                      ? "border-emerald-600 ring-2 ring-emerald-100"
                      : "border-neutral-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Title & Location / Date */}
          <div className="pt-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              {listing.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 mt-3">
              <span className="flex items-center gap-1.5 font-medium text-neutral-700">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                {listing.location.industrialPark ? `${listing.location.industrialPark}, ` : ""}
                {listing.location.city}, {listing.location.stateOrCountry}
              </span>
              <span className="flex items-center gap-1.5 text-neutral-500">
                <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                Listed on {formatListedDate(listing.listedDate)}
              </span>
            </div>
          </div>

          {/* Description Box */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 space-y-3 shadow-xs">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> Material Description
            </h3>
            <div className="text-sm sm:text-base text-neutral-700 leading-relaxed whitespace-pre-line">
              {listing.description || "No description provided."}
            </div>
          </div>

          {/* Important Item Specifications (From Sell Page) */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" /> Item & Material Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-neutral-50 rounded-xl">
                <span className="text-xs text-neutral-500 block mb-0.5">Category</span>
                <span className="font-bold text-neutral-900 text-sm">{listing.category}</span>
              </div>
              {listing.subcategory && (
                <div className="p-3 bg-neutral-50 rounded-xl">
                  <span className="text-xs text-neutral-500 block mb-0.5">Subcategory</span>
                  <span className="font-bold text-neutral-900 text-sm">{listing.subcategory}</span>
                </div>
              )}
              {listing.materialType && (
                <div className="p-3 bg-neutral-50 rounded-xl">
                  <span className="text-xs text-neutral-500 block mb-0.5">Primary Material</span>
                  <span className="font-bold text-neutral-900 text-sm">{listing.materialType}</span>
                </div>
              )}
              {listing.condition && (
                <div className="p-3 bg-neutral-50 rounded-xl">
                  <span className="text-xs text-neutral-500 block mb-0.5">Condition</span>
                  <span className="font-bold text-neutral-900 text-sm">{listing.condition}</span>
                </div>
              )}
              {listing.brand && (
                <div className="p-3 bg-neutral-50 rounded-xl">
                  <span className="text-xs text-neutral-500 block mb-0.5">Brand</span>
                  <span className="font-bold text-neutral-900 text-sm">{listing.brand}</span>
                </div>
              )}
              {listing.modelCode && (
                <div className="p-3 bg-neutral-50 rounded-xl">
                  <span className="text-xs text-neutral-500 block mb-0.5">Model / Code</span>
                  <span className="font-bold text-neutral-900 text-sm">{listing.modelCode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stock, Supply & Logistics Details */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" /> Stock, Pricing & Logistics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                <span className="text-xs text-emerald-700 font-semibold block mb-0.5">Remaining Stock Available</span>
                <span className="font-extrabold text-emerald-900 text-base">
                  {remainingQty} {listing.unit}s
                  {listing.originalQuantity && listing.originalQuantity !== remainingQty && (
                    <span className="text-xs text-neutral-500 font-normal block mt-0.5">
                      (Original: {listing.originalQuantity} {listing.unit}s)
                    </span>
                  )}
                </span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl">
                <span className="text-xs text-neutral-500 block mb-0.5">Minimum Purchase</span>
                <span className="font-bold text-neutral-900 text-sm">{listing.minPurchaseQuantity || 1} {listing.unit}s</span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl">
                <span className="text-xs text-neutral-500 block mb-0.5">Total Quantity Listed</span>
                <span className="font-bold text-neutral-900 text-sm">{listing.totalQuantity} {listing.unit}s</span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl">
                <span className="text-xs text-neutral-500 block mb-0.5 font-medium flex items-center gap-1">
                  <Truck className="w-3 h-3 text-neutral-400" /> Logistics Option
                </span>
                <span className="font-bold text-neutral-900 text-sm">
                  {listing.transactionType === "Pickup" ? "Buyer Pickup Only" : listing.transactionType === "Delivery" ? "Seller Handles Delivery" : "Buyer Pickup or Seller Delivery"}
                </span>
              </div>
              {listing.bulkPurchaseAllowed && (
                <div className="p-3 bg-neutral-50 rounded-xl">
                  <span className="text-xs text-neutral-500 block mb-0.5">Bulk Purchase</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    Allowed {listing.bulkPrice ? `(₹${listing.bulkPrice}/${listing.unit})` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Eco & Circular Economy Insights */}
          {(listing.recyclability || listing.reusability || listing.aiSuggestions?.whatCanIDoWithThis) && (
            <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-2xl p-6 shadow-md text-white space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold flex items-center gap-2 text-emerald-300">
                  <Recycle className="w-5 h-5 text-emerald-400" /> Eco & Circular Economy Insights
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-700/60 border border-emerald-500/30 px-2.5 py-1 rounded-full text-emerald-200">
                  Verified
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-700/50">
                  <span className="text-emerald-300 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Recyclability</span>
                  <span className="font-bold text-sm text-white">{listing.recyclability || listing.aiSuggestions?.recyclable || "High"}</span>
                </div>
                <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-700/50">
                  <span className="text-emerald-300 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Reusability</span>
                  <span className="font-bold text-sm text-white">{listing.reusability || listing.aiSuggestions?.reusable || "Direct Reuse"}</span>
                </div>
              </div>

              {listing.aiSuggestions?.whatCanIDoWithThis && (
                <div className="bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-700/40 text-xs leading-relaxed text-emerald-100">
                  <span className="text-emerald-300 font-bold block mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Applications & Next Life:
                  </span>
                  {listing.aiSuggestions.whatCanIDoWithThis}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Pricing, Lot Value, Action Buttons, Seller Profile & Location Map */}
        <div className="lg:col-span-5 space-y-6">
          {/* Price & Primary Action Box */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                Unit Price
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-emerald-800">
                  {listing.currency}
                  {listing.pricePerUnit.toLocaleString("en-IN")}
                </span>
                <span className="text-base font-semibold text-neutral-500">
                  / {listing.unit}
                </span>
              </div>
            </div>

            {/* Total Lot Value */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-emerald-800 block">
                  Remaining Lot Value ({remainingQty} {listing.unit}s)
                </span>
                <span className="text-xl font-bold text-emerald-950">
                  {listing.currency}
                  {(remainingQty * listing.pricePerUnit).toLocaleString("en-IN")}
                </span>
              </div>
              <Package className="w-6 h-6 text-emerald-600" />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                id="detail-page-chat-seller-btn"
                onClick={() => onStartChat(listing)}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 focus:outline-none cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat with Seller</span>
              </button>

              {(listing.status === "sold" || (remainingQty <= 0)) ? (
                <div className="w-full py-3.5 px-4 bg-rose-100 border border-rose-200 text-rose-800 rounded-xl font-bold text-sm text-center">
                  COMPLETELY SOLD OUT
                </div>
              ) : (
                <button
                  id="detail-page-make-offer-btn"
                  onClick={() => onOpenMakeOffer(listing)}
                  className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 focus:outline-none cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Make an Offer</span>
                </button>
              )}
            </div>
          </div>

          {/* Seller Profile Summary */}
          {listing.seller && (
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" /> Seller Information
              </h4>
              <div className="flex items-center gap-3 pt-1">
                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-200 shrink-0">
                  {listing.seller.avatar ? (
                    <img src={listing.seller.avatar} alt={listing.seller.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    listing.seller.name ? listing.seller.name.charAt(0).toUpperCase() : "S"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-neutral-900 text-sm truncate">{listing.seller.company || listing.seller.name}</div>
                  <div className="text-xs text-neutral-500 truncate">{listing.seller.name}</div>
                  {listing.seller.location && (
                    <div className="text-[11px] text-neutral-400 truncate mt-0.5">{listing.seller.location}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* React Leaflet Location Map Component */}
          <LocationMap
            city={listing.location.city}
            stateOrCountry={listing.location.stateOrCountry}
            industrialPark={listing.location.industrialPark}
            listingTitle={listing.title}
          />
        </div>
      </div>
    </div>
  );
};
