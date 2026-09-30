import React, { useState } from "react";
import { X, Star, ShieldAlert, AlertTriangle, Send } from "lucide-react";
import { DealOffer } from "../../types";

interface DealReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: DealOffer | null;
  onSubmitReview: (offer: DealOffer, rating: number, reason: string, comments: string) => void;
}

export const DealReviewModal: React.FC<DealReviewModalProps> = ({
  isOpen,
  onClose,
  offer,
  onSubmitReview,
}) => {
  const [rating, setRating] = useState<number>(3);
  const [reason, setReason] = useState<string>("Material quality or specifications did not match");
  const [comments, setComments] = useState<string>("");

  if (!isOpen || !offer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReview(offer, rating, reason, comments);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-neutral-900">Mandatory Deal Verification</h3>
              <p className="text-xs text-rose-700">Fraud Prevention & Accountability Review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-neutral-200 text-neutral-400 hover:text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              To prevent fraudulent listings or repeated cancellations on EcoLoop, both parties must record an honest review before a negotiated deal can be formally closed.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              Experience Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-neutral-300"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-semibold text-neutral-600 ml-2">
                {rating === 5 ? "Excellent" : rating === 4 ? "Good" : rating === 3 ? "Average" : rating === 2 ? "Poor" : "Fraud / Unacceptable"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              Reason for Cancellation / Rejection <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full py-2.5 px-3.5 rounded-xl border border-neutral-200 text-xs bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="Material quality or specifications did not match">Material quality or specifications did not match</option>
              <option value="Counterpart did not show up for inspection">Counterpart did not show up for inspection</option>
              <option value="Logistics / Transportation disagreement">Logistics / Transportation disagreement</option>
              <option value="Price renegotiation dispute on site">Price renegotiation dispute on site</option>
              <option value="Suspected fraudulent or counterfeit listing">Suspected fraudulent or counterfeit listing</option>
              <option value="Other mutual cancellation">Other mutual cancellation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              Detailed Feedback / Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Describe what occurred during inspection or negotiation..."
              className="w-full p-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Review & Reject Deal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
