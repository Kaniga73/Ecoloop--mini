import React, { useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Eye,
  Heart,
  MessageSquare,
  DollarSign,
  Package,
  Share2,
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

  return (
    <div id="listing-detail-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <button
          id="back-to-marketplace-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 hover:text-emerald-700 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-xl transition-colors shadow-xs"
            title="Share Listing"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? "Link Copied!" : "Share"}</span>
          </button>
          <button
            onClick={() => onToggleFavorite(listing.id)}
            className="p-2 bg-white border border-neutral-200 text-neutral-500 hover:text-rose-600 hover:bg-neutral-50 rounded-xl transition-colors shadow-xs"
            title={isFavorite ? "Saved" : "Save Listing"}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column (Images, Title, Description) & Right Column (Pricing & Actions) */}
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
            {/* Category Tag overlay */}
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs">
              {listing.category}
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

          {/* Title & Metadata */}
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
             {formatListedDate(listing.listedDate)}
             
            </div>
          </div>

          {/* Description Box */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 space-y-4 shadow-xs">
            <h3 className="text-lg font-bold text-neutral-900">
              Material Description
            </h3>
            <div className="text-sm sm:text-base text-neutral-700 leading-relaxed whitespace-pre-line">
              {listing.description}
            </div>

            {/* Quick Details Highlights */}
            <div className="pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-neutral-50 rounded-xl">
                <span className="text-xs text-neutral-500 block mb-0.5">Remaining Stock Available</span>
                <span className="font-bold text-emerald-800 text-base">
                  {(listing.remainingQuantity !== undefined ? listing.remainingQuantity : listing.totalQuantity)} {listing.unit}s
                  {listing.originalQuantity && listing.originalQuantity !== (listing.remainingQuantity ?? listing.totalQuantity) && (
                    <span className="text-xs text-neutral-400 font-normal ml-1">
                      (Listed: {listing.originalQuantity} {listing.unit}s)
                    </span>
                  )}
                </span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl">
                <span className="text-xs text-neutral-500 block mb-0.5">Minimum Purchase</span>
                <span className="font-bold text-neutral-900 text-base">{listing.minPurchaseQuantity} {listing.unit}s</span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl">
                <span className="text-xs text-neutral-500 block mb-0.5">State & Region</span>
                <span className="font-bold text-neutral-900 text-base">{listing.location.stateOrCountry || "Tamil Nadu, India"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Pricing, Lot Value, Action Buttons, & Location Details Map */}
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
                  Remaining Lot Value ({(listing.remainingQuantity !== undefined ? listing.remainingQuantity : listing.totalQuantity)} {listing.unit}s)
                </span>
                <span className="text-xl font-bold text-emerald-950">
                  {listing.currency}
                  {((listing.remainingQuantity !== undefined ? listing.remainingQuantity : listing.totalQuantity) * listing.pricePerUnit).toLocaleString("en-IN")}
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

              {(listing.status === "sold" || (listing.remainingQuantity !== undefined && listing.remainingQuantity <= 0)) ? (
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

          {/* React Leaflet Location Map Component - Placed right below the Make an Offer container */}
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
