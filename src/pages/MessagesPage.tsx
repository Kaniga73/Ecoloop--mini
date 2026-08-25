import React, { useState } from "react";
import {
  Send,
  ShieldCheck,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Package,
  Building2,
  User,
  MessageSquare,
  Sparkles,
  Trash2,
} from "lucide-react";
import { WasteListing, Conversation, ChatMessage, DealOffer, UserProfile } from "../types";

interface MessagesPageProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  messages: Record<string, ChatMessage[]>;
  onSendMessage: (conversationId: string, text: string) => void;
  dealOffers: Record<string, DealOffer[]>;
  onAcceptOffer: (offer: DealOffer) => void;
  onRejectOffer: (offer: DealOffer) => void;
  onOpenMakeOffer: (listing: WasteListing) => void;
  onOpenListingSpecs: (listingId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  listings: WasteListing[];
  currentUser: UserProfile;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  messages,
  onSendMessage,
  dealOffers,
  onAcceptOffer,
  onRejectOffer,
  onOpenMakeOffer,
  onOpenListingSpecs,
  onDeleteConversation,
  listings,
  currentUser,
}) => {
  const [inputText, setInputText] = useState("");

  const [counteringOffer, setCounteringOffer] = useState<DealOffer | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [counterQty, setCounterQty] = useState<number>(0);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;

  const activeMessages = activeConversation ? messages[activeConversation.id] || [] : [];
  const activeOffers = activeConversation ? dealOffers[activeConversation.id] || [] : [];
  const activeListing = activeConversation ? listings.find((l) => l.id === activeConversation.listingId) || null : null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;
    onSendMessage(activeConversation.id, inputText.trim());
    setInputText("");
  };

  const handleClearHistory = () => {
    if (!activeConversation || !onDeleteConversation) return;
    if (window.confirm("Are you sure you want to delete this chat history? This action cannot be undone.")) {
      onDeleteConversation(activeConversation.id);
    }
  };

  const handleOpenCounter = (offer: DealOffer) => {
    setCounteringOffer(offer);
    setCounterPrice(offer.offeredPricePerUnit);
    setCounterQty(offer.quantity);
  };

  const handleSendCounterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counteringOffer || !activeConversation) return;
    onSendMessage(
      activeConversation.id,
      `Counter Offer Transmitted: ${counterQty} ${counteringOffer.unit}s at ${counteringOffer.currency}${counterPrice}/${counteringOffer.unit} (Total Lot: ${counteringOffer.currency}${(counterQty * counterPrice).toLocaleString("en-IN")})`
    );
    setCounteringOffer(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="w-full bg-white rounded-3xl border border-neutral-200/90 shadow-md overflow-hidden flex flex-col md:flex-row min-h-[640px]">
        {/* Left Sidebar: Active Negotiations List */}
        <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-neutral-200/90 bg-neutral-50/50 flex flex-col shrink-0">
          <div className="p-4 border-b border-neutral-200/90 bg-white">
            <h2 className="text-base font-extrabold text-neutral-900 flex items-center justify-between">
              <span>Active Negotiations</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                {conversations.length}
              </span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">Real-time buyer & seller negotiations</p>
          </div>

          {/* Thread items list */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 space-y-2">
                <MessageSquare className="w-8 h-8 opacity-30 mx-auto" />
                <p className="text-xs font-semibold text-neutral-600">No active negotiations yet</p>
                <p className="text-[11px] text-neutral-400">
                  Click "Chat with Seller" on any marketplace listing to start a negotiation.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConversation && conv.id === activeConversation.id;
                const isUserSeller = currentUser.role === "seller" || conv.seller.id === currentUser.id;
                const counterpartCompany = isUserSeller ? conv.buyer.company : conv.seller.company;
                const threadOffers = dealOffers[conv.id] || [];
                const latestOffer = threadOffers[threadOffers.length - 1];

                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full p-4 text-left transition-all flex items-start gap-3 relative group cursor-pointer ${
                      isActive
                        ? "bg-white border-l-4 border-emerald-600 shadow-2xs"
                        : "hover:bg-neutral-100/70 bg-transparent"
                    }`}
                  >
                    <img
                      src={conv.listingImage || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80"}
                      alt={conv.listingTitle}
                      className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0 mt-0.5"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-bold text-neutral-900 truncate">{counterpartCompany}</h4>
                        <span className="text-[10px] text-neutral-400 shrink-0">{conv.lastMessageTime}</span>
                      </div>

                      <p className="text-[11px] font-semibold text-emerald-800 truncate mb-1">
                        {conv.listingTitle}
                      </p>

                      {latestOffer && latestOffer.status === "Pending" ? (
                        <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200">
                          <DollarSign className="w-3 h-3 text-amber-600" />
                          <span>ACTIVE OFFER {latestOffer.currency}{latestOffer.offeredPricePerUnit}/{latestOffer.unit}</span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-neutral-500 truncate leading-snug">
                          {conv.lastMessage || "No messages yet."}
                        </p>
                      )}
                    </div>

                    {/* Delete Conversation quick action on hover */}
                    {onDeleteConversation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Delete this conversation thread?")) {
                            onDeleteConversation(conv.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer absolute top-3 right-3"
                        title="Delete chat thread"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Pane: Active Conversation Header & Messages */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            {/* Header Bar matching target reference image */}
            <div className="p-4 border-b border-neutral-200/90 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={activeConversation.listingImage || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80"}
                  alt={activeConversation.listingTitle}
                  className="w-11 h-11 rounded-xl object-cover border border-neutral-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-neutral-900 truncate">
                      {activeConversation.listingTitle}
                    </h3>
                    <button
                      onClick={() => onOpenListingSpecs(activeConversation.listingId)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      View Specs <Eye className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">
                    Negotiating with: <strong className="text-neutral-800 font-semibold">{activeConversation.seller.name === currentUser.name ? activeConversation.buyer.company : activeConversation.seller.company}</strong>
                    {" • "}
                    Listed Ask: <span className="text-emerald-700 font-bold">{activeConversation.listingPrice}</span>
                  </p>
                </div>
              </div>

              {/* Actions: AI Deal Shield & Delete Chat History */}
              <div className="flex items-center gap-2 shrink-0">
                {onDeleteConversation && (
                  <button
                    onClick={handleClearHistory}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Delete Chat History"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span className="hidden sm:inline">Delete Chat</span>
                  </button>
                )}
                
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-neutral-50/40 min-h-[380px]">
              {activeMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-400 space-y-2">
                  <MessageSquare className="w-10 h-10 opacity-30 text-emerald-600" />
                  <p className="text-sm font-bold text-neutral-700">Start the Conversation</p>
                  
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id || msg.senderRole === (currentUser.role || "buyer");
                  const isSystem = msg.senderRole === "system";

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="bg-emerald-100/90 text-emerald-900 border border-emerald-200 text-xs font-semibold px-4 py-1.5 rounded-full shadow-2xs text-center flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{msg.text}</span>
                        </div>
                      </div>
                    );
                  }

                  // Find matching offer if message is a deal offer
                  const matchingOffer = msg.offer || activeOffers.find((o) => o.id === (msg as any).offerId);

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}
                    >
                      <span className="text-[10px] text-neutral-400 px-1 font-medium">
                        {msg.senderName} • {msg.timestamp}
                      </span>

                      {/* Text Bubble */}
                      <div
                        className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? "bg-emerald-700 text-white rounded-br-none shadow-xs font-medium"
                            : "bg-white text-neutral-800 border border-neutral-200/90 rounded-bl-none shadow-2xs font-normal"
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* Production Grade EcoLoop Deal Shield™ Offer Card matching user reference image */}
                      {matchingOffer && (
                        <div className="w-full max-w-md mt-2 bg-white rounded-3xl border-2 border-emerald-500/70 p-5 shadow-lg space-y-4 animate-in fade-in duration-200">
                          {/* Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                            <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-sm">
                              <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Offer Made</span>
                            </div>
                            <span
                              className={`px-3 py-0.5 rounded-md text-[11px] font-extrabold tracking-wider ${
                                matchingOffer.status === "Accepted"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : matchingOffer.status === "Rejected"
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : matchingOffer.status === "Countered"
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : "bg-blue-100 text-blue-800 border border-blue-200"
                              }`}
                            >
                              {matchingOffer.status === "Rejected" ? "DECLINED" : matchingOffer.status.toUpperCase()}
                            </span>
                          </div>

                          {/* Inner Card Grid */}
                          <div className="bg-neutral-50/90 rounded-2xl p-4 border border-neutral-200/80 grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                            <div>
                              <span className="text-[11px] text-neutral-400 font-medium block">Offered Rate</span>
                              <strong className="text-base font-black text-neutral-900">
                                {matchingOffer.currency}{matchingOffer.offeredPricePerUnit.toLocaleString("en-IN")} / {matchingOffer.unit}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[11px] text-neutral-400 font-medium block">Quantity</span>
                              <strong className="text-base font-black text-neutral-900">
                                {matchingOffer.quantity} {matchingOffer.unit}s
                              </strong>
                            </div>
                            <div>
                              <span className="text-[11px] text-neutral-400 font-medium block">Total Amount</span>
                              <strong className="text-sm font-extrabold text-emerald-700">
                                {matchingOffer.currency}{matchingOffer.totalAmount.toLocaleString("en-IN")}
                              </strong>
                            </div>
                          
                          </div>

                          {/* Notes / Quote block */}
                          {matchingOffer.notes && matchingOffer.notes.trim() !== "" && (
                            <div className="p-3.5 bg-neutral-50/80 rounded-xl border border-neutral-100 text-xs italic text-neutral-600 leading-relaxed font-normal">
                              "{matchingOffer.notes}"
                            </div>
                          )}

                          {/* Action Buttons footer */}
                          {matchingOffer.status === "Pending" && (
                            <div className="pt-2 border-t border-neutral-100">
                              {!isMe ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onAcceptOffer(matchingOffer)}
                                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Accept Deal
                                  </button>
                                  <button
                                    onClick={() => handleOpenCounter(matchingOffer)}
                                    className="py-2.5 px-4 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-full text-xs font-bold transition-all cursor-pointer"
                                  >
                                    Counter
                                  </button>
                                  <button
                                    onClick={() => onRejectOffer(matchingOffer)}
                                    className="py-2.5 px-3 text-neutral-500 hover:text-rose-600 text-xs font-medium transition-colors cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </div>
                              ) : (
                                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-center text-xs font-semibold text-amber-800 flex items-center justify-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                  <span>Offer Transmitted — Awaiting Seller Response</span>
                                </div>
                              )}
                            </div>
                          )}

                          {matchingOffer.status === "Accepted" && (
                            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Deal Accepted & Inventory Reserved</span>
                            </div>
                          )}

                          {matchingOffer.status === "Rejected" && (
                            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-center text-xs font-bold text-rose-800 flex items-center justify-center gap-1.5">
                              <XCircle className="w-4 h-4 text-rose-600" />
                              <span>Offer Declined</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Message Input Bar */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-neutral-200 flex items-center gap-3">
              {activeListing && (
                <button
                  type="button"
                  onClick={() => onOpenMakeOffer(activeListing)}
                  className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                  title="Submit a structured price/quantity offer"
                >
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Make Offer</span>
                </button>
              )}

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message, ask questions about purity, or schedule a site visit..."
                className="flex-1 px-4 py-2.5 text-sm bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-neutral-400 text-center">
            Select a negotiation thread from the left list to view chat.
          </div>
        )}
      </div>

      {/* Counter Offer Modal */}
      {counteringOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-200 animate-in fade-in duration-200">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">Submit Counter Offer</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{counteringOffer.listingTitle}</p>
              </div>
              <button
                onClick={() => setCounteringOffer(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendCounterSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Counter Rate ({counteringOffer.currency} / {counteringOffer.unit})
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Quantity ({counteringOffer.unit}s)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={counterQty}
                    onChange={(e) => setCounterQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900">Total Counter Value:</span>
                <strong className="text-base font-extrabold text-emerald-950">
                  {counteringOffer.currency}{(counterPrice * counterQty).toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCounteringOffer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Transmit Counter Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
