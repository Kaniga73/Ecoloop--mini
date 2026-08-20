import React from "react";
import { MapPin, Filter, RotateCcw } from "lucide-react";

interface SidebarFilterProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  locationQuery: string;
  onLocationChange: (loc: string) => void;
  minPrice: string;
  onMinPriceChange: (val: string) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
  minQuantity: string;
  onMinQuantityChange: (val: string) => void;
  maxQuantity: string;
  onMaxQuantityChange: (val: string) => void;
  onResetFilters: () => void;
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: "All Categories", label: "All Categories" },
  { id: "Scrap Metal", label: "Scrap Metal" },
  { id: "Industrial Plastics", label: "Industrial Plastics" },
  { id: "Chemical Byproducts", label: "Chemical Byproducts" },
  { id: "E-Waste", label: "E-Waste" },
  { id: "Textiles & Fibers", label: "Textiles & Fibers" },
  { id: "Construction & Demolition", label: "Construction & Demolition" },
  { id: "Rubber & Tyres", label: "Rubber & Tyres" },
  { id: "Organic / Bio Waste", label: "Organic / Bio Waste" },
];

const TN_CITIES = ["Chennai", "Coimbatore", "Tiruppur", "Salem", "Hosur", "Madurai", "Ranipet"];

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  locationQuery,
  onLocationChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  minQuantity,
  onMinQuantityChange,
  maxQuantity,
  onMaxQuantityChange,
  onResetFilters,
}) => {
  return (
    <aside className="w-full lg:w-64 bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs flex flex-col gap-6">
      {/* Top Title & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          Filter Waste
        </h3>
        <button
          id="reset-filter-btn"
          onClick={onResetFilters}
          className="text-xs text-neutral-400 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors cursor-pointer"
          title="Reset all filters"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Categories Checkbox/Radio List */}
      <div>
        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5">Category</h4>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <label
                key={cat.id}
                id={`filter-category-${cat.id.toLowerCase().replace(/\s+/g, "-")}`}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-emerald-50 text-emerald-950 font-semibold"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSelectCategory(cat.id)}
                  className="w-3.5 h-3.5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 transition-colors cursor-pointer"
                />
                <span className="flex-1 truncate">{cat.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Tamil Nadu Location Filter */}
      <div className="pt-2 border-t border-neutral-100">
        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5">
          Tamil Nadu Location
        </h4>
        <div className="relative mb-2.5">
          <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="sidebar-location-filter-input"
            type="text"
            value={locationQuery}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="City, e.g. Chennai, Hosur"
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
          />
        </div>

        {/* Quick City Chips */}
        <div className="flex flex-wrap gap-1.5">
          {TN_CITIES.map((city) => (
            <button
              key={city}
              id={`filter-city-chip-${city.toLowerCase()}`}
              onClick={() => onLocationChange(locationQuery.toLowerCase() === city.toLowerCase() ? "" : city)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                locationQuery.toLowerCase() === city.toLowerCase()
                  ? "bg-emerald-700 text-white font-semibold"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter (₹) */}
      <div className="pt-2 border-t border-neutral-100">
        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Price Range (₹)</span>
          <span className="text-[10px] text-neutral-400 font-normal lowercase">per unit</span>
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="sidebar-min-price-input" className="block text-[11px] font-medium text-neutral-600 mb-1">
              From (₹)
            </label>
            <input
              id="sidebar-min-price-input"
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              placeholder="Min"
              className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label htmlFor="sidebar-max-price-input" className="block text-[11px] font-medium text-neutral-600 mb-1">
              To (₹)
            </label>
            <input
              id="sidebar-max-price-input"
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              placeholder="Max"
              className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Quantity Range Filter */}
      <div className="pt-2 border-t border-neutral-100">
        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Quantity Range</span>
          <span className="text-[10px] text-neutral-400 font-normal lowercase">total units</span>
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="sidebar-min-quantity-input" className="block text-[11px] font-medium text-neutral-600 mb-1">
              From
            </label>
            <input
              id="sidebar-min-quantity-input"
              type="number"
              min="0"
              value={minQuantity}
              onChange={(e) => onMinQuantityChange(e.target.value)}
              placeholder="Min"
              className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label htmlFor="sidebar-max-quantity-input" className="block text-[11px] font-medium text-neutral-600 mb-1">
              To
            </label>
            <input
              id="sidebar-max-quantity-input"
              type="number"
              min="0"
              value={maxQuantity}
              onChange={(e) => onMaxQuantityChange(e.target.value)}
              placeholder="Max"
              className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
