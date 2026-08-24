import React, { useState, useEffect } from "react";
import { X, CheckCircle2, User, Building2, Package, IndianRupee, Mail, Phone, MapPin } from "lucide-react";
import { WasteListing, PartyDetails } from "../../types";

interface MarkAsSoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSale: (
    listing: WasteListing,
    buyer: PartyDetails,
    quantity: number,
    pricePerUnit: number
  ) => void;
  listing: WasteListing | null;
}

const defaultInterestedBuyers: PartyDetails[] = [
  {
    id: "buyer-a-default",
    name: "Karthik Sundaram (Buyer A)",
    company: "TN Metal & Polymer Recyclers Pvt Ltd",
    email: "karthik@tnrecyclers.in",
    phone: "+91 98401 23456",
    location: "Guindy Industrial Estate, Chennai",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "buyer-b-default",
    name: "Rajesh Sharma (Buyer B)",
    company: "Kovai Smelters & Refineries Ltd",
    email: "rajesh@kovaismelters.com",
    phone: "+91 94432 10987",
    location: "SIDCO Industrial Estate, Coimbatore",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "buyer-c-default",
    name: "Deepak Patel (Buyer C)",
    company: "Apex Metal Trading Corp",
    email: "deepak@apexmetals.in",
    phone: "+91 98940 55432",
    location: "Ranipet Industrial Area, Ranipet",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  },
];

export const MarkAsSoldModal: React.FC<MarkAsSoldModalProps> = ({
  isOpen,
  onClose,
  onConfirmSale,
  listing,
}) => {
  if (!isOpen || !listing) return null;

  const originalQty = listing.originalQuantity ?? listing.totalQuantity ?? 0;
  const currentSoldQty = listing.soldQuantity ?? 0;
  const currentRemainingQty = listing.remainingQuantity ?? Math.max(0, originalQty - currentSoldQty);

  const availableBuyers = (listing.interestedBuyers && listing.interestedBuyers.length > 0)
    ? listing.interestedBuyers
    : defaultInterestedBuyers;

  const [selectedBuyerId, setSelectedBuyerId] = useState<string>(availableBuyers[0]?.id || "buyer-a-default");
  const [isCustomBuyer, setIsCustomBuyer] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCompany, setCustomCompany] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [customLocation, setCustomLocation] = useState("");

  const [soldQuantity, setSoldQuantity] = useState<number>(currentRemainingQty > 0 ? currentRemainingQty : 1);
  const [pricePerUnit, setPricePerUnit] = useState<number>(listing.pricePerUnit);

  useEffect(() => {
    if (currentRemainingQty > 0) {
      setSoldQuantity(currentRemainingQty);
    }
    setPricePerUnit(listing.pricePerUnit);
  }, [listing, currentRemainingQty]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "custom") {
      setIsCustomBuyer(true);
    } else {
      setIsCustomBuyer(false);
      setSelectedBuyerId(val);
    }
  };

  const getActiveBuyer = (): PartyDetails => {
    if (isCustomBuyer) {
      return {
        id: `buyer-custom-${Date.now()}`,
        name: customName || "Direct Buyer",
        company: customCompany || "Independent Buyer Org",
        email: customEmail || "buyer@ecoloop.in",
        phone: customPhone || "+91 98400 00000",
        location: customLocation || "Tamil Nadu, India",
      };
    }
    const match = availableBuyers.find((b) => b.id === selectedBuyerId);
    return match || availableBuyers[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (soldQuantity <= 0) {
      alert("Quantity sold must be greater than 0");
      return;
    }
    if (soldQuantity > currentRemainingQty) {
      alert(`Cannot sell more than current remaining quantity (${currentRemainingQty} ${listing.unit})`);
      return;
    }

    const buyer = getActiveBuyer();
    onConfirmSale(listing, buyer, soldQuantity, pricePerUnit);
    onClose();
  };

  const totalAmount = soldQuantity * pricePerUnit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-neutral-200 my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Mark Product as Sold</h3>
              <p className="text-xs text-neutral-400">Select interested buyer and record sale quantity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Listing Summary Card */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 flex items-center gap-3.5">
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-14 h-14 rounded-xl object-cover border border-neutral-200 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-neutral-900 truncate">{listing.title}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                <span className="text-neutral-500">Listed: <strong>{originalQty} {listing.unit}</strong></span>
                <span className="text-neutral-300">•</span>
                <span className="text-amber-700">Already Sold: <strong>{currentSoldQty} {listing.unit}</strong></span>
                <span className="text-neutral-300">•</span>
                <span className="text-emerald-700 font-bold">Remaining: <strong>{currentRemainingQty} {listing.unit}</strong></span>
              </div>
            </div>
          </div>

          {/* Interested Buyer Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Select Buyer (Interested Buyers) *
            </label>
            <select
              value={isCustomBuyer ? "custom" : selectedBuyerId}
              onChange={handleSelectChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              {availableBuyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.company} ({b.location || "Verified Buyer"})
                </option>
              ))}
              <option value="custom">+ Enter New Buyer Details</option>
            </select>
          </div>

          {/* Custom Buyer Inputs (if custom chosen) */}
          {isCustomBuyer && (
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/70 space-y-3">
              <span className="text-xs font-bold text-emerald-900 block">Enter Buyer Contact & Company Details</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Purchaser Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai Eco Smelters"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="ramesh@ecosmelters.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98400 12345"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-neutral-700 mb-1">Location / Address</label>
                  <input
                    type="text"
                    placeholder="Guindy Industrial Estate, Chennai, Tamil Nadu"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Selected Buyer Preview Card */}
          {!isCustomBuyer && (
            <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 flex items-start gap-3 text-xs">
              <User className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-900">{getActiveBuyer().name}</span>
                <span className="text-neutral-600 block">{getActiveBuyer().company}</span>
                <span className="text-neutral-500 block text-[11px] mt-0.5">
                  {getActiveBuyer().email} • {getActiveBuyer().phone}
                </span>
              </div>
            </div>
          )}

          {/* Quantity & Unit Price Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Quantity to Sell ({listing.unit}s) *
              </label>
              <input
                type="number"
                min={1}
                max={currentRemainingQty}
                required
                value={soldQuantity}
                onChange={(e) => setSoldQuantity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Max available: <strong>{currentRemainingQty} {listing.unit}s</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Selling Price per {listing.unit} (₹) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Listing Price: ₹{listing.pricePerUnit.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Calculation & Status Preview */}
          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-emerald-900 font-semibold block">Total Transaction Value</span>
              <span className="text-xl font-extrabold text-emerald-950">
                {listing.currency}{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-neutral-600 block font-medium">
                Post-sale Listing Status:
              </span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mt-0.5 ${
                  currentRemainingQty - soldQuantity <= 0
                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                {currentRemainingQty - soldQuantity <= 0
                  ? "Sold Out (Removed from Marketplace)"
                  : `Available (${currentRemainingQty - soldQuantity} ${listing.unit} remaining)`}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm Sale & Update Quantity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
