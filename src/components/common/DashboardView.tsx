import React from "react";
import {
  ClipboardList,
  Tag,
  ShoppingBag,
  IndianRupee,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { WasteListing, DealOffer, UserProfile } from "../../types";

// Shape for a purchase row shown in "My Purchases (Buying)".
export interface PurchaseRecord {
  id: string;
  productTitle: string;
  category: string;
  quantity: number;
  unit: string;
  amount: number;
  currency: string;
  status: "Completed" | "Pending" | "Shipped" | "Cancelled";
  orderedDate: string;
  image?: string;
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
}

const statusPillClasses: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700",
  Active: "bg-emerald-50 text-emerald-700",
  reserved: "bg-amber-50 text-amber-700",
  Pending: "bg-amber-50 text-amber-700",
  sold: "bg-blue-50 text-blue-700",
  Sold: "bg-blue-50 text-blue-700",
  Shipped: "bg-blue-50 text-blue-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Cancelled: "bg-rose-50 text-rose-700",
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
}) => {
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


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Track your listed products, sales, and purchase activity.
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

      {/* My Listings (Selling) */}
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
                <th className="px-5 py-3">Quantity</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Listed On</th>
                
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {myListings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-neutral-400 text-sm">
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
                        <span className="font-semibold text-neutral-900">{l.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{l.category}</td>
                    <td className="px-5 py-3 text-neutral-600">
                      {l.totalQuantity} {l.unit}
                    </td>
                    <td className="px-5 py-3 text-neutral-600">
                      {l.currency}{l.pricePerUnit} / {l.unit}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          statusPillClasses[l.status] || "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {statusLabel(l.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-500">
                      {formatListedDate(l.listedDate)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => (onEditListing ? onEditListing(l) : onOpenListing(l))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Edit listing"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteListing && onDeleteListing(l)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors"
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

      {/* My Purchases (Buying) */}
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
                <th className="px-5 py-3">Quantity</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Ordered On</th>
                
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-neutral-400 text-sm">
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
                        <span className="font-semibold text-neutral-900">{p.productTitle}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{p.category}</td>
                    <td className="px-5 py-3 text-neutral-600">
                      {p.quantity} {p.unit}
                    </td>
                    <td className="px-5 py-3 text-neutral-600">
                      {p.currency}{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          statusPillClasses[p.status] || "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-500">
                      {new Date(p.orderedDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3">
                     
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};