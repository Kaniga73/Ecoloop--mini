import React, { useState, useRef, useEffect, useMemo } from "react";
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
  Phone,
  Mail,
  MapPin,
  Truck,
  Calendar,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { WasteListing, DealOffer, UserProfile, PartyDetails } from "../types";
import { useCommunication } from "../context/CommunicationContext";
import { formatChatTimestamp } from "../lib/dateUtils";
import { DealReviewModal } from "../components/common/DealReviewModal";
import { resolveUserNameAndCompany, toUUID } from "../lib/listingsService";

interface MessagesPageProps {
  onOpenMakeOffer: (listing: WasteListing) => void;
  onOpenListingSpecs: (listingId: string) => void;
  listings: WasteListing[];
  currentUser: UserProfile;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  onOpenMakeOffer,
  onOpenListingSpecs,
  listings,
  currentUser,
}) => {
  const { 
    conversations, 
    messages, 
    dealOffers, 
    activeConversationId, 
    setActiveConversationId,
    sendMessage,
    sendOffer,
    acceptOffer,
    rejectOffer,
    deleteConversation
  } = useCommunication();
  
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Counter offer state
  const [counteringOffer, setCounteringOffer] = useState<DealOffer | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [counterQty, setCounterQty] = useState<number>(0);

  // Mandatory Review Modal state
  const [reviewingOffer, setReviewingOffer] = useState<DealOffer | null>(null);

  // Active conversation
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;

  // Clear unread indicator only when switching to this conversation
  useEffect(() => {
    if (activeConversation && activeConversation.unreadCount && activeConversation.unreadCount > 0) {
      activeConversation.unreadCount = 0;
    }
  }, [activeConversation?.id]);

  const activeMessages = activeConversation ? messages[activeConversation.id] || [] : [];
  const activeOffers = activeConversation ? dealOffers[activeConversation.id] || [] : [];
  
  const activeListing = useMemo(() => {
    if (!activeConversation) return null;
    const found = listings.find((l) => l.id === activeConversation.listingId || l.id.replace(/-/g, '') === activeConversation.listingId.replace(/-/g, ''));
    if (found) return found;
    return {
      id: activeConversation.listingId,
      title: activeConversation.listingTitle,
      category: "Industrial Material",
      description: activeConversation.listingTitle,
      location: { city: "Chennai", stateOrCountry: "Tamil Nadu" },
      images: [activeConversation.listingImage || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80"],
      pricePerUnit: parseFloat(activeConversation.listingPrice?.replace(/[^0-9.]/g, '') || "100") || 100,
      unit: activeConversation.listingPrice?.split("/")?.[1]?.trim() || "Ton",
      currency: "₹",
      totalQuantity: 1000,
      remainingQuantity: 1000,
      totalEstimatedValue: 100000,
      minPurchaseQuantity: 1,
      isPriceNegotiable: true,
      seller: { id: activeConversation.seller.id, name: activeConversation.seller.name, company: activeConversation.seller.company },
      listedDate: new Date().toISOString(),
      viewCount: 1,
      status: "available" as const
    };
  }, [activeConversation, listings]);

  // Strict deduplication of message stream to eliminate duplicate offer/chat renders
  const uniqueActiveMessages = useMemo(() => {
    const seenIds = new Set<string>();
    const seenContent = new Set<string>();
    return activeMessages.filter((msg) => {
      if (seenIds.has(msg.id)) return false;
      seenIds.add(msg.id);
      const contentKey = `${msg.senderId}_${msg.text}_${msg.timestamp?.slice(0, 16)}`;
      if (seenContent.has(contentKey)) return false;
      seenContent.add(contentKey);
      return true;
    });
  }, [activeMessages]);

  // Auto-scroll to bottom smoothly only when message count changes or conversation changes
  const prevMsgLengthRef = useRef(uniqueActiveMessages.length);
  const prevConvIdRef = useRef(activeConversation?.id);
  useEffect(() => {
    if (activeConversation?.id !== prevConvIdRef.current || uniqueActiveMessages.length > prevMsgLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgLengthRef.current = uniqueActiveMessages.length;
    prevConvIdRef.current = activeConversation?.id;
  }, [uniqueActiveMessages.length, activeConversation?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;
    await sendMessage(activeConversation.id, inputText.trim());
    setInputText("");
  };

  const handleClearHistory = async () => {
    if (!activeConversation) return;
    if (window.confirm("Are you sure you want to delete this chat history? This action cannot be undone.")) {
      await deleteConversation(activeConversation.id);
    }
  };

  const handleOpenCounter = (offer: DealOffer) => {
    setCounteringOffer(offer);
    setCounterPrice(offer.offeredPricePerUnit);
    setCounterQty(offer.quantity);
  };

  // Confirmed Handovers tracker
  const [confirmedHandovers, setConfirmedHandovers] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('ecoloop_confirmed_handovers');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  const handleConfirmHandoverSold = async (offer: DealOffer) => {
    setConfirmedHandovers((prev) => {
      const next = new Set(prev);
      next.add(offer.id);
      localStorage.setItem('ecoloop_confirmed_handovers', JSON.stringify(Array.from(next)));
      return next;
    });

    if (activeConversation) {
      await sendMessage(
        activeConversation.id,
        `✅ Seller verified in-person handover and finalized sale of ${offer.quantity} ${offer.unit}s.`
      );
    }
  };

  const handleSendCounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counteringOffer || !activeConversation) return;

    const isUserSeller = activeConversation.seller.id === currentUser.id;
    const newOffer: DealOffer = {
      id: `offer_${Date.now()}`,
      conversationId: activeConversation.id,
      listingId: activeConversation.listingId,
      listingTitle: activeConversation.listingTitle,
      buyerId: activeConversation.buyer.id,
      buyerName: activeConversation.buyer.name,
      sellerId: activeConversation.seller.id,
      sellerName: activeConversation.seller.name,
      senderId: currentUser.id,
      isCounter: true,
      quantity: counterQty,
      unit: counteringOffer.unit,
      offeredPricePerUnit: counterPrice,
      currency: counteringOffer.currency,
      totalAmount: counterPrice * counterQty,
      notes: `Counter-offer: ${counterQty} ${counteringOffer.unit}s @ ${counteringOffer.currency}${counterPrice}/${counteringOffer.unit}`,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    // Mark previous offer as Countered
    counteringOffer.status = 'Countered';
    
    await sendOffer(newOffer);
    setCounteringOffer(null);
  };

  const handleOpenReviewModal = (offer: DealOffer) => {
    setReviewingOffer(offer);
  };

  const handleSubmitReviewAndReject = (
    offer: DealOffer,
    rating: number,
    reason: string,
    comments: string
  ) => {
    rejectOffer(offer);
    if (activeConversation) {
      sendMessage(
        activeConversation.id,
        `⚠️ Deal Rejected after in-person inspection. Reason: ${reason} (Rating: ${rating}/5 stars). ${comments ? `Notes: "${comments}"` : ""}`
      );
    }
    setReviewingOffer(null);
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-2 sm:px-4 py-2 h-[calc(100vh-80px)] flex flex-col">
      <div className="w-full flex-1 bg-white rounded-3xl border border-neutral-200/90 shadow-md overflow-hidden flex flex-col md:flex-row h-full min-h-0">
        
        {/* Left Sidebar: Active Negotiations List */}
        <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-neutral-200/90 bg-neutral-50/50 flex flex-col shrink-0 h-full">
          <div className="p-4 border-b border-neutral-200/90 bg-white shrink-0">
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
                const isUserSeller = conv.seller.id === currentUser.id;
                
                // Exact counterpart name resolution
                let counterpartName = isUserSeller
                  ? (conv.buyer.name || conv.buyer.company || "Buyer")
                  : (conv.seller.name && conv.seller.name !== "Unknown Seller" && conv.seller.name !== "Unknown User"
                      ? conv.seller.name
                      : (conv.seller.company || resolveUserNameAndCompany(conv.seller.id, conv.listingId).name));

                const threadOffers = dealOffers[conv.id] || [];
                const latestOffer = threadOffers[threadOffers.length - 1];

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
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
                        <h4 className="text-xs font-bold text-neutral-900 truncate">
                          {counterpartName}
                        </h4>
                        <span className="text-[10px] font-medium text-neutral-400 shrink-0">
                          {formatChatTimestamp(conv.lastMessageTime)}
                        </span>
                      </div>

                      <p className="text-[11px] font-semibold text-emerald-800 truncate mb-1">
                        {conv.listingTitle}
                      </p>

                      {latestOffer && latestOffer.status === "Pending" ? (
                        <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200">
                          <DollarSign className="w-3 h-3 text-amber-600" />
                          <span>ACTIVE OFFER {latestOffer.currency}{latestOffer.offeredPricePerUnit}/{latestOffer.unit}</span>
                        </div>
                      ) : latestOffer && latestOffer.status === "Accepted" ? (
                        <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>DEAL ACCEPTED</span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-neutral-500 truncate leading-snug">
                          {conv.lastMessage || "No messages yet."}
                        </p>
                      )}
                    </div>

                    {/* Delete Conversation quick action on hover */}
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.confirm("Delete this conversation thread?")) {
                          await deleteConversation(conv.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer absolute top-3 right-3 z-20"
                      title="Delete chat thread"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Pane: Active Conversation Header & Messages */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col min-w-0 bg-white h-full">
            
            {/* Header Bar with Exact Seller/Buyer Names */}
            {(() => {
              const isUserSeller = activeConversation.seller.id === currentUser.id;
              const exactPartnerName = isUserSeller
                ? (activeConversation.buyer.name || activeConversation.buyer.company || "Buyer")
                : (activeConversation.seller.name && activeConversation.seller.name !== "Unknown Seller" && activeConversation.seller.name !== "Unknown User"
                    ? activeConversation.seller.name
                    : (activeConversation.seller.company || resolveUserNameAndCompany(activeConversation.seller.id, activeConversation.listingId).name));

              return (
                <div className="p-4 border-b border-neutral-200/90 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs shrink-0">
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
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                          isUserSeller 
                            ? "bg-purple-50 text-purple-700 border-purple-200" 
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {isUserSeller ? "Selling" : "Buying"}
                        </span>
                        <button
                          onClick={() => onOpenListingSpecs(activeConversation.listingId)}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          View Specs <Eye className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className="text-neutral-500">
                          Negotiating with: <strong className="text-neutral-900 font-bold">{exactPartnerName}</strong>
                        </span>
                        <span className="text-neutral-300">•</span>
                        <span className="text-neutral-500">
                          Listed Ask: <strong className="text-emerald-700 font-bold">{activeConversation.listingPrice}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Delete Chat History */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleClearHistory}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Delete Chat History"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span className="hidden sm:inline">Delete Chat</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Message Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-neutral-50/40 min-h-0">
              {uniqueActiveMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-400 space-y-2">
                  <MessageSquare className="w-10 h-10 opacity-30 text-emerald-600" />
                  <p className="text-sm font-bold text-neutral-700">Start the Conversation</p>
                </div>
              ) : (
                uniqueActiveMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  const isSystem = msg.senderRole === "system";

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="bg-emerald-100/90 text-emerald-900 border border-emerald-200 text-xs font-semibold px-4 py-1.5 rounded-full shadow-2xs text-center flex items-center gap-1.5 max-w-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{msg.text}</span>
                        </div>
                      </div>
                    );
                  }

                  // Robust matching helper to bind message to exact offer / counter-offer
                  const matchingOffer = (() => {
                    if (msg.offer) return msg.offer;
                    if ((msg as any).offerId) {
                      const found = activeOffers.find(o => o.id === (msg as any).offerId || o.id === toUUID((msg as any).offerId));
                      if (found) return found;
                    }
                    const text = (msg.text || "").toLowerCase();
                    const isCounterMsg = text.includes("counter-offer") || text.includes("counter offer");
                    const isInitialOfferMsg = text.includes("like to make an offer for") || text.includes("make an offer for") || text.includes("direct buy request") || text.startsWith("offer:");

                    if (!isCounterMsg && !isInitialOfferMsg) return undefined;

                    if (isCounterMsg) {
                      const counterOffers = activeOffers.filter(o => o.isCounter || (o.notes && o.notes.toLowerCase().includes("counter")));
                      if (counterOffers.length > 0) {
                        const match = counterOffers.find(o => text.includes(String(o.offeredPricePerUnit)) || text.includes(String(o.quantity)));
                        return match || counterOffers[counterOffers.length - 1];
                      }
                    }

                    if (isInitialOfferMsg) {
                      const standardOffers = activeOffers.filter(o => !o.isCounter && !(o.notes && o.notes.toLowerCase().includes("counter")));
                      if (standardOffers.length > 0) {
                        const match = standardOffers.find(o => text.includes(String(o.offeredPricePerUnit)) || text.includes(String(o.quantity)));
                        return match || standardOffers[0];
                      }
                    }

                    return undefined;
                  })();

                  const isSeller = activeConversation.seller.id === currentUser.id;
                  const sellerTrueName = activeConversation.seller.name && activeConversation.seller.name !== "Unknown Seller" && activeConversation.seller.name !== "Unknown User"
                    ? activeConversation.seller.name
                    : (activeConversation.seller.company || resolveUserNameAndCompany(activeConversation.seller.id, activeConversation.listingId).name);
                  const buyerTrueName = activeConversation.buyer.name || activeConversation.buyer.company || "Buyer";

                  const displayName = isMe 
                    ? "You" 
                    : (msg.senderRole === 'seller' ? sellerTrueName : buyerTrueName);

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}
                    >
                      <span className="text-[10px] text-neutral-400 px-1 font-medium">
                        {displayName} • {formatChatTimestamp(msg.timestamp)}
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

                      {/* Production Grade EcoLoop Deal Offer Card Template */}
                      {matchingOffer && (
                        <div className="w-full max-w-md mt-2 bg-white rounded-3xl border-2 border-emerald-500/70 p-5 shadow-lg space-y-4 animate-in fade-in duration-200">
                          {/* Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                            <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-sm">
                              <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{matchingOffer.isCounter ? "Official Counter-Offer" : "Official Deal Offer"}</span>
                            </div>
                            <span
                              className={`px-3 py-0.5 rounded-md text-[11px] font-extrabold tracking-wider ${
                                matchingOffer.status === "Accepted" || matchingOffer.status === "accepted"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : matchingOffer.status === "Rejected" || matchingOffer.status === "Declined" || matchingOffer.status === "declined"
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : matchingOffer.status === "Countered" || matchingOffer.status === "countered"
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : "bg-blue-100 text-blue-800 border border-blue-200"
                              }`}
                            >
                              {matchingOffer.status === "Rejected" || matchingOffer.status === "Declined" || matchingOffer.status === "declined"
                                ? "DECLINED / REJECTED"
                                : matchingOffer.status === "Countered" || matchingOffer.status === "countered"
                                ? "COUNTERED"
                                : matchingOffer.isCounter
                                ? "COUNTER-OFFER PENDING"
                                : "OFFER PENDING"}
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
                              <span className="text-[11px] text-neutral-400 font-medium block">Total Payable</span>
                              <strong className="text-sm font-extrabold text-emerald-700">
                                {matchingOffer.currency}{matchingOffer.totalAmount.toLocaleString("en-IN")}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[11px] text-neutral-400 font-medium block">Incoterm</span>
                              <strong className="text-xs font-bold text-neutral-700">
                                {matchingOffer.incoterm || "EXW / Buyer Pickup"}
                              </strong>
                            </div>
                          </div>

                          {/* Notes / Quote block */}
                          {matchingOffer.notes && matchingOffer.notes.trim() !== "" && (
                            <div className="p-3 bg-neutral-50/80 rounded-xl border border-neutral-100 text-xs italic text-neutral-600 leading-relaxed font-normal">
                              "{matchingOffer.notes}"
                            </div>
                          )}

                          {/* 1. Pending Offer Flow */}
                          {(matchingOffer.status === "Pending" || matchingOffer.status === "pending") && (() => {
                            const isSenderOfThisOffer = matchingOffer.senderId 
                              ? matchingOffer.senderId === currentUser.id 
                              : (matchingOffer.isCounter ? isSeller : !isSeller);
                            const canAcceptOrDecline = !isSenderOfThisOffer;

                            return (
                              <div className="pt-2 border-t border-neutral-100">
                                {canAcceptOrDecline ? (
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => acceptOffer(matchingOffer)}
                                        className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Agree & Accept {matchingOffer.isCounter ? "Counter-Offer" : "Offer"}</span>
                                      </button>
                                      <button
                                        onClick={() => handleOpenCounter(matchingOffer)}
                                        className="py-2.5 px-3.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                      >
                                        Counter
                                      </button>
                                      <button
                                        onClick={() => rejectOffer(matchingOffer)}
                                        className="py-2.5 px-3 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                      >
                                        Decline
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-center text-xs font-semibold text-amber-800 flex items-center justify-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                    <span>
                                      {matchingOffer.isCounter ? "Counter-Offer Transmitted" : "Offer Transmitted"} — Awaiting {isSeller ? "Buyer" : "Seller"} Response
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* 2. Accepted / Logistics & In-Person Handover Stage */}
                          {(matchingOffer.status === "Accepted" || matchingOffer.status === "accepted") && (
                            <div className="pt-2 border-t border-neutral-100 space-y-3">
                              {/* Contact & Logistics Sharing Card */}
                              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2.5 text-xs text-neutral-800">
                                <div className="flex items-center gap-1.5 font-bold text-emerald-900 border-b border-emerald-200/60 pb-1.5">
                                  <Truck className="w-4 h-4 text-emerald-700" />
                                  <span>Logistics & Contact Verification</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div>
                                    <span className="text-neutral-500 block">Seller Name & Contact:</span>
                                    <strong className="text-neutral-900 block font-semibold">{sellerTrueName}</strong>
                                    <span className="text-neutral-600 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-emerald-600" /> +91 98401 00000</span>
                                  </div>
                                  <div>
                                    <span className="text-neutral-500 block">Buyer Name & Contact:</span>
                                    <strong className="text-neutral-900 block font-semibold">{buyerTrueName}</strong>
                                    <span className="text-neutral-600 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-emerald-600" /> +91 94440 12345</span>
                                  </div>
                                </div>
                                <div className="text-[11px] pt-1.5 border-t border-emerald-200/50 flex items-center justify-between text-emerald-950 font-medium">
                                  <span>Pickup / Inspection: <strong>Agreed Warehouse / In-Person Visit</strong></span>
                                  <span className="bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold">Verified Deal</span>
                                </div>
                              </div>

                              {/* In-Person Actions */}
                              <div className="flex flex-col gap-2">
                                {isSeller ? (
                                  !confirmedHandovers.has(matchingOffer.id) && !matchingOffer.isHandoverCompleted ? (
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmHandoverSold(matchingOffer)}
                                      className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                      <span>Confirm In-Person Handover & Mark as Sold</span>
                                    </button>
                                  ) : (
                                    <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl text-center space-y-1.5">
                                      <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-emerald-950">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                        <span>Goods Handed Over & Finalized as Sold</span>
                                      </div>
                                      <p className="text-[11px] text-emerald-800">
                                        {matchingOffer.quantity} {matchingOffer.unit}s logged to buyer dashboard. Inventory updated.
                                      </p>
                                    </div>
                                  )
                                ) : (
                                  <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl text-center space-y-2">
                                    <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-emerald-950">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                      <span>Purchased & Recorded in Dashboard</span>
                                    </div>
                                    <p className="text-[11px] text-emerald-800">
                                      {matchingOffer.quantity} {matchingOffer.unit}s purchase finalized. Visit Dashboard &gt; Purchases to download your receipt.
                                    </p>
                                    {/* Enable Same Buyer to Make Another Offer / Buy Again directly from this card */}
                                    {activeConversation.seller.id !== currentUser.id && activeListing && (
                                      <button
                                        type="button"
                                        onClick={() => onOpenMakeOffer(activeListing)}
                                        className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                                      >
                                        <DollarSign className="w-3.5 h-3.5" />
                                        <span>Make Another Offer / Buy Again</span>
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Mandatory Review / Rejection option if inspection fails in person */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenReviewModal(matchingOffer)}
                                  className="py-1.5 px-3 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5 text-neutral-400 hover:text-rose-500" />
                                  <span>Issue During In-Person Visit? Submit Review / Cancel</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 3. Rejected Offer */}
                          {matchingOffer.status === "Rejected" && (
                            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-center text-xs font-bold text-rose-800 flex items-center justify-center gap-1.5">
                              <XCircle className="w-4 h-4 text-rose-600" />
                              <span>Deal Rejected & Moved to Cancelled List</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Input Bar */}
            <form onSubmit={handleSend} className="p-3.5 sm:p-4 bg-white border-t border-neutral-200 flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Only the Buyer can initiate a structured Make Offer */}
              {activeConversation.seller.id !== currentUser.id && activeListing && (
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

      {/* Mandatory Review Modal for In-Person Rejection */}
      <DealReviewModal
        isOpen={!!reviewingOffer}
        onClose={() => setReviewingOffer(null)}
        offer={reviewingOffer}
        onSubmitReview={handleSubmitReviewAndReject}
      />
    </div>
  );
};
