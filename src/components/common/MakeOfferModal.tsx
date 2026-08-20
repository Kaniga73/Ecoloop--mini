import React, { useState } from "react";
import { X, Send, Package } from "lucide-react";
import { WasteListing, UserProfile } from "../../types";

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitOffer: (listing: WasteListing, quantity: number, pricePerUnit: number) => void;
  listing: WasteListing | null;
  currentUser: UserProfile;
}

export const MakeOfferModal: React.FC<MakeOfferModalProps> = ({
  isOpen,
  onClose,
  onSubmitOffer,
  listing,
}) => {
  if (!isOpen || !listing) return null;

  const [quantity, setQuantity] = useState<number>(listing.minPurchaseQuantity || 1);
  const [offerPrice, setOfferPrice] = useState<number>(listing.pricePerUnit);
  const [notes, setNotes] = useState("");

  const totalAmount = quantity * offerPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitOffer(listing, quantity, offerPrice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200">
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Make an Offer / Order</h2>
            <p className="text-xs text-neutral-500 mt-0.5">{listing.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center gap-3">
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-14 h-14 rounded-xl object-cover border border-neutral-200 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-neutral-900 truncate">{listing.title}</h4>
              <p className="text-xs text-neutral-500 mt-0.5">
                Seller: <span className="font-semibold text-neutral-700">{listing.seller.name}</span>
              </p>
              <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                Asking: {listing.currency}{listing.pricePerUnit.toLocaleString("en-IN")} / {listing.unit}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Quantity ({listing.unit}s) *
              </label>
              <input
                type="number"
                min={listing.minPurchaseQuantity || 1}
                max={listing.totalQuantity}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Min: {listing.minPurchaseQuantity || 1} | Max: {listing.totalQuantity}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Offer Price / {listing.unit} (₹) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={offerPrice}
                onChange={(e) => setOfferPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                {listing.isPriceNegotiable ? "Negotiable" : "Fixed Asking Price"}
              </span>
            </div>
          </div>

          {/* Total calculation card */}
          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-800 font-medium block">Total Calculated Value</span>
              <span className="text-xl font-extrabold text-emerald-950">
                {listing.currency}{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <Package className="w-6 h-6 text-emerald-600" />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Message / Notes to Seller (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add pickup details, transport preference, or payment terms..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Transmit Offer to Seller
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
