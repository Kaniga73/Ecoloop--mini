import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { WasteListing, UserProfile } from "../../types";

interface ListWasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (listing: Partial<WasteListing>) => void;
  currentUser: UserProfile;
  initialListing?: WasteListing | null;
}

const CATEGORIES = [
  "Scrap Metal",
  "Industrial Plastics",
  "Chemical Waste",
  "Paper & Cardboard",
  "E-Waste",
  "Textiles",
  "Glass",
  "Rubber & Tyres",
  "Wood & Biomass",
  "Hazardous Waste",
  "Other Industrial",
];

const UNITS = ["Ton", "Kg", "Barrels", "Pieces", "M3"];

export const ListWasteModal: React.FC<ListWasteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  initialListing,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Scrap Metal");
  const [city, setCity] = useState("Chennai");
  const [stateOrCountry, setStateOrCountry] = useState("Tamil Nadu");
  const [industrialPark, setIndustrialPark] = useState("Ambattur Industrial Estate");
  const [pricePerUnit, setPricePerUnit] = useState<number>(1000);
  const [unit, setUnit] = useState("Ton");
  const [totalQuantity, setTotalQuantity] = useState<number>(10);
  const [minPurchaseQuantity, setMinPurchaseQuantity] = useState<number>(1);
  const [isPriceNegotiable, setIsPriceNegotiable] = useState(true);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80"
  );

  useEffect(() => {
    if (initialListing) {
      setTitle(initialListing.title || "");
      setCategory(initialListing.category || "Scrap Metal");
      setCity(initialListing.location?.city || "Chennai");
      setStateOrCountry(initialListing.location?.stateOrCountry || "Tamil Nadu");
      setIndustrialPark(initialListing.location?.industrialPark || "");
      setPricePerUnit(initialListing.pricePerUnit || 1000);
      setUnit(initialListing.unit || "Ton");
      setTotalQuantity(initialListing.totalQuantity || 10);
      setMinPurchaseQuantity(initialListing.minPurchaseQuantity || 1);
      setIsPriceNegotiable(initialListing.isPriceNegotiable ?? true);
      setDescription(initialListing.description || "");
      setImageUrl(initialListing.images?.[0] || "");
    } else {
      setTitle("");
      setCategory("Scrap Metal");
      setCity("Chennai");
      setStateOrCountry("Tamil Nadu");
      setIndustrialPark("Ambattur Industrial Estate");
      setPricePerUnit(15000);
      setUnit("Ton");
      setTotalQuantity(25);
      setMinPurchaseQuantity(5);
      setIsPriceNegotiable(true);
      setDescription("");
      setImageUrl("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80");
    }
  }, [initialListing, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: Partial<WasteListing> = {
      ...(initialListing ? { id: initialListing.id } : {}),
      title: title.trim(),
      category,
      location: {
        city,
        stateOrCountry,
        industrialPark,
      },
      images: [imageUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80"],
      pricePerUnit,
      unit,
      currency: "₹",
      totalQuantity,
      totalEstimatedValue: pricePerUnit * totalQuantity,
      minPurchaseQuantity,
      isPriceNegotiable,
      description: description.trim(),
      seller: {
        id: currentUser.id || "user-seller-1",
        name: currentUser.name || (currentUser as any).full_name || "Seller",
        company: currentUser.company || (currentUser as any).business_name || "EcoLoop Enterprise",
        contactEmail: currentUser.email || "",
        location: `${city}, ${stateOrCountry}`,
      },
      listedDate: initialListing ? initialListing.listedDate : "Today",
      viewCount: initialListing ? initialListing.viewCount : 1,
      status: initialListing ? initialListing.status : "available",
    };

    onSubmit(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200">
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              {initialListing ? "Edit Waste Listing" : "List Industrial Waste Product"}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Fill in the details to publish your industrial waste or byproduct for buyers.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mixed Heavy Steel Scrap - 50 Tons"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Unit *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Quantities */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Price per {unit} (₹) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Total Quantity ({unit}) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Min Order ({unit})
              </label>
              <input
                type="number"
                min="1"
                value={minPurchaseQuantity}
                onChange={(e) => setMinPurchaseQuantity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Negotiable switch */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="negotiable-checkbox"
              checked={isPriceNegotiable}
              onChange={(e) => setIsPriceNegotiable(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300"
            />
            <label htmlFor="negotiable-checkbox" className="text-xs font-medium text-neutral-700 cursor-pointer">
              Price is negotiable with buyers
            </label>
          </div>

          {/* Location fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                City *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Chennai"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                State / Region *
              </label>
              <input
                type="text"
                required
                value={stateOrCountry}
                onChange={(e) => setStateOrCountry(e.target.value)}
                placeholder="e.g. Tamil Nadu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Industrial Estate / Park
              </label>
              <input
                type="text"
                value={industrialPark}
                onChange={(e) => setIndustrialPark(e.target.value)}
                placeholder="e.g. Ambattur Phase II"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Product Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Description & Specifications
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe material purity, storage, handling requirements, certified weighbridge details..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {initialListing ? "Save Changes" : "Publish Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
