import React from "react";
import { X, Wrench } from "lucide-react";
import { WasteListing, UserProfile } from "../../types";

interface ListWasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (listing: Partial<WasteListing>) => void;
  currentUser?: UserProfile;
  initialListing?: WasteListing | null;
}

export const ListWasteModal: React.FC<ListWasteModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 text-center space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mt-2">
          <Wrench className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-neutral-900">
            Sell Page Redesign
          </h2>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            The sell page has been removed as requested and is ready for your new design.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
