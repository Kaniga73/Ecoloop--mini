import React, { useState } from "react";
import { X, ShieldCheck, Truck, Package, CheckCircle2, ArrowRight, DollarSign } from "lucide-react";
import { WasteListing, UserProfile } from "../../types";

interface InstantBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: WasteListing;
  currentUser: UserProfile;
  onConfirmPurchase: (listing: WasteListing, quantity: number, unitPrice: number, deliveryNotes?: string) => Promise<void>;
}

export const InstantBuyModal: React.FC<InstantBuyModalProps> = ({
  isOpen,
  onClose,
  listing,
  currentUser,
  onConfirmPurchase,
}) => {
  const maxAvailable = listing.remainingQuantity !== undefined ? listing.remainingQuantity : listing.totalQuantity;
  const minRequired = listing.minPurchaseQuantity || 1;

  const [quantity, setQuantity] = useState<number>(Math.min(minRequired, maxAvailable));
  const [deliveryOption, setDeliveryOption] = useState<string>("Buyer Arranges Pickup (EXW)");
  const [deliveryAddress, setDeliveryAddress] = useState<string>(currentUser.location || "");
  const [phone, setPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalAmount = quantity * listing.pricePerUnit;

  const handleQtyChange = (val: number) => {
    const clamped = Math.max(1, Math.min(maxAvailable, val));
    setQuantity(clamped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 || quantity > maxAvailable) {
      return alert(`Please select a valid quantity between 1 and ${maxAvailable} ${listing.unit}s.`);
    }

    setIsSubmitting(true);
    try {
      const combinedNotes = `Delivery: ${deliveryOption} | Address: ${deliveryAddress} | Phone: ${phone}${notes ? ` | Notes: ${notes}` : ''}`;
      await onConfirmPurchase(listing, quantity, listing.pricePerUnit, combinedNotes);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error("Purchase error:", err);
      alert("Failed to complete purchase.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-neutral-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Package className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-neutral-900">Direct Purchase Order</h3>
              <p className="text-xs text-neutral-500">EcoLoop Guaranteed Order Checkout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-neutral-200 text-neutral-400 hover:text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-neutral-900">Purchase Order Confirmed!</h3>
            <p className="text-sm text-neutral-600 max-w-sm mx-auto">
              You have successfully purchased <strong>{quantity} {listing.unit}s</strong> of {listing.title}. The inventory has been updated and a confirmation has been sent to the seller.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Listing Summary Preview */}
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 flex items-center gap-3">
              <img
                src={listing.images[0] || "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80"}
                alt={listing.title}
                className="w-14 h-14 rounded-xl object-cover border border-neutral-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-extrabold text-neutral-900 truncate">{listing.title}</h4>
                <div className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                  <span>Seller: <strong className="text-neutral-800">{listing.seller.name}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">In Stock: {maxAvailable} {listing.unit}s</span>
                </div>
              </div>
            </div>

            {/* Quantity Selector & Price Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                  Select Purchase Quantity ({listing.unit}s)
                </label>
                <span className="text-xs text-neutral-400">
                  Min: {minRequired} {listing.unit} | Max: {maxAvailable} {listing.unit}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleQtyChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="w-11 h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 font-bold text-lg text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={maxAvailable}
                  value={quantity}
                  onChange={(e) => handleQtyChange(Number(e.target.value))}
                  className="flex-1 text-center py-2.5 px-3 rounded-xl border border-neutral-200 font-bold text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => handleQtyChange(quantity + 1)}
                  disabled={quantity >= maxAvailable}
                  className="w-11 h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 font-bold text-lg text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Quick Percentage Chips */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleQtyChange(Math.ceil(maxAvailable * 0.25))}
                  className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[11px] font-semibold text-neutral-600 transition-colors"
                >
                  25% ({Math.ceil(maxAvailable * 0.25)} {listing.unit}s)
                </button>
                <button
                  type="button"
                  onClick={() => handleQtyChange(Math.ceil(maxAvailable * 0.5))}
                  className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[11px] font-semibold text-neutral-600 transition-colors"
                >
                  50% ({Math.ceil(maxAvailable * 0.5)} {listing.unit}s)
                </button>
                <button
                  type="button"
                  onClick={() => handleQtyChange(maxAvailable)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[11px] font-bold text-emerald-800 border border-emerald-200 transition-colors"
                >
                  100% Full Lot ({maxAvailable} {listing.unit}s)
                </button>
              </div>
            </div>

            {/* Price Calculation Summary Box */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-900">
                <span>Unit Rate</span>
                <span className="font-semibold">{listing.currency}{listing.pricePerUnit.toLocaleString("en-IN")} / {listing.unit}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-900">
                <span>Selected Lot Volume</span>
                <span className="font-semibold">{quantity} {listing.unit}s</span>
              </div>
              <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-950">Total Payable Amount</span>
                <strong className="text-xl font-black text-emerald-950">
                  {listing.currency}{totalAmount.toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            {/* Delivery / Shipping details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Logistics Option
                </label>
                <select
                  value={deliveryOption}
                  onChange={(e) => setDeliveryOption(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-neutral-200 text-xs bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Buyer Arranges Pickup (EXW)">Buyer Arranges Pickup (EXW)</option>
                  <option value="Seller Delivery (FOB/CIF)">Seller Delivery</option>
                  <option value="EcoLoop Logistics Partner">EcoLoop Logistics Partner</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98400 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Buy ({listing.currency}{totalAmount.toLocaleString("en-IN")})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
