import React from "react";
import { MapPin, Heart, ArrowUpRight, Package, MessageSquare } from "lucide-react";
import { WasteListing } from "../../types";

interface ListingCardProps {
  listing: WasteListing;
  onSelect: (listing: WasteListing) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onStartChat?: (listing: WasteListing, e: React.MouseEvent) => void;
  featured?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onSelect,
  isFavorite,
  onToggleFavorite,
  onStartChat,
}) => {
  return (
    <div
      id={`listing-card-${listing.id}`}
      onClick={() => onSelect(listing)}
      className="group bg-white rounded-2xl border border-neutral-200/90 overflow-hidden hover:border-emerald-500/60 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-16/10 overflow-hidden bg-neutral-100">
        <img
          src={listing.images[0] || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80"}
          alt={listing.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />

        {/* Favorite Button */}
        <button
          id={`favorite-btn-${listing.id}`}
          onClick={(e) => onToggleFavorite(listing.id, e)}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-neutral-500 hover:text-rose-500 p-1.5 rounded-full shadow-xs hover:bg-white transition-colors focus:outline-none shrink-0"
          title={isFavorite ? "Remove from saved" : "Save listing"}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>

        {/* Quantity Tag */}
        <div className="absolute bottom-2.5 left-3">
          <span className="text-[11px] font-semibold tracking-wide bg-neutral-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
            <Package className="w-3 h-3 text-emerald-400" />
            <span>{listing.totalQuantity} {listing.unit}s Available</span>
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Row with Title */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4 className="text-base font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
              {listing.title}
            </h4>
          </div>

          {/* Tags: Category & Location */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2.5 flex-wrap">
            <span className="bg-emerald-50 text-emerald-800 font-medium px-2 py-0.5 rounded">
              {listing.category}
            </span>
            <span className="flex items-center gap-1 text-neutral-600">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="line-clamp-1">{listing.location.city}, {listing.location.stateOrCountry}</span>
            </span>
          </div>

          {/* Description snippet */}
          <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed mb-4">
            {listing.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-neutral-100 flex items-end justify-between gap-2">
          <div>
            <span className="block text-[11px] text-neutral-500 font-medium">
              Price per {listing.unit.toLowerCase()}
            </span>
            <div className="text-lg font-bold text-emerald-800">
              {listing.currency}
              {listing.pricePerUnit.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onStartChat && (
              <button
                id={`chat-btn-${listing.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onStartChat(listing, e);
                }}
                className="p-1.5 rounded-lg border border-neutral-300 hover:border-emerald-600 hover:bg-emerald-50 text-neutral-700 hover:text-emerald-800 text-xs font-semibold transition-all flex items-center gap-1"
                title="Chat with Seller"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              </button>
            )}
            <button
              id={`view-details-btn-${listing.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(listing);
              }}
              className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:border-emerald-600 hover:bg-emerald-50 text-neutral-700 hover:text-emerald-800 text-xs font-semibold transition-all flex items-center gap-1"
            >
              <span>View Details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
