import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Conversation, ChatMessage, DealOffer, AppNotification } from '../types';
import { useAuth } from './AuthContext';
import { supabase, isLiveSupabaseConfigured } from '../lib/supabase';
import { chatService } from '../lib/chatService';
import { toUUID, deductListingInventory, savePurchaseRecord } from '../lib/listingsService';

interface CommunicationContextType {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  dealOffers: Record<string, DealOffer[]>;
  notifications: AppNotification[];
  unreadMessageCount: number;
  unreadNotificationCount: number;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  startConversation: (listing: any, buyerId: string, buyerName: string, buyerCompany: string, initialMessage?: string) => Promise<string>;
  sendMessage: (conversationId: string, text: string) => void;
  sendOffer: (offer: DealOffer) => void;
  acceptOffer: (offer: DealOffer) => Promise<void>;
  rejectOffer: (offer: DealOffer) => void;
  markNotificationsAsRead: () => void;
  deleteConversation: (conversationId: string) => void;
  refreshData: () => Promise<void>;
}

const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined);

export const CommunicationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  
  const currentUserId = useMemo(() => {
    return profile?.auth_user_id || user?.id || profile?.id || profile?.custom_id || (user?.email ? user.email : "demo-user");
  }, [user, profile]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [dealOffers, setDealOffers] = useState<Record<string, DealOffer[]>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const isRefreshingRef = React.useRef(false);

  const unreadMessageCount = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  const refreshData = async () => {
    if (!currentUserId || currentUserId === "unknown") return;
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    try {
      // Run offline sync first
      await chatService.syncOfflineQueue();

      const convs = await chatService.fetchConversations(currentUserId);
      setConversations(convs);

      const convIds = convs.map(c => c.id);
      if (convIds.length > 0) {
        const [msgs, offers] = await Promise.all([
          chatService.fetchMessagesForConversations(convIds),
          chatService.fetchDealOffers(convIds)
        ]);
        setMessages(msgs);
        setDealOffers(offers);
      }
    } catch (err) {
      console.error("Error refreshing chat data:", err);
    } finally {
      isRefreshingRef.current = false;
    }
  };

  useEffect(() => {
    refreshData();

    // 1. Cross-tab real-time sync via BroadcastChannel
    let broadcast: BroadcastChannel | null = null;
    try {
      broadcast = new BroadcastChannel('ecoloop_realtime_chat_sync');
      broadcast.onmessage = () => {
        refreshData();
      };
    } catch (e) {
      console.warn("BroadcastChannel not supported in this browser:", e);
    }

    // 2. Cross-tab local storage sync event
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('ecoloop_') && e.key !== 'ecoloop_realtime_chat_sync') {
        refreshData();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Online/offline sync
    const handleOnline = () => {
      refreshData();
    };
    window.addEventListener('online', handleOnline);

    // 4. Supabase Postgres Realtime Subscription (if configured)
    let channel: any = null;
    if (isLiveSupabaseConfigured && supabase) {
      try {
        channel = supabase.channel('schema-db-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
            refreshData();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'deal_offers' }, () => {
            refreshData();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
            refreshData();
          })
          .subscribe();
      } catch (err) {
        console.warn("Realtime channel error:", err);
      }
    }

    // 5. Periodic polling interval for robust cross-browser synchronization
    const pollInterval = setInterval(() => {
      refreshData();
    }, 2500);

    return () => {
      if (broadcast) broadcast.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('online', handleOnline);
      clearInterval(pollInterval);
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const startConversation = async (listing: any, buyerId: string, buyerName: string, buyerCompany: string, initialMessage?: string) => {
    let existing = conversations.find((c) => (c.listingId === listing.id || toUUID(c.listingId) === toUUID(listing.id)) && c.buyer.id === buyerId);
    let convId = existing?.id;

    if (!existing) {
      convId = toUUID();
      const newConv: Conversation = {
        id: convId,
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listing.images?.[0] || '',
        listingPrice: `${listing.currency}${listing.pricePerUnit.toLocaleString("en-IN")} / ${listing.unit}`,
        buyer: {
          id: buyerId,
          name: buyerName,
          company: buyerCompany,
        },
        seller: {
          id: listing.seller.id,
          name: listing.seller.name,
          company: listing.seller.company,
        },
        lastMessage: initialMessage || "Inquiry regarding waste listing specifications.",
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      };

      // Optimistic update
      setConversations(prev => [newConv, ...prev]);
      
      await chatService.createConversation(newConv);

      if (initialMessage) {
        const sysMsg: ChatMessage = {
          id: toUUID(),
          conversationId: convId,
          senderId: buyerId,
          senderName: buyerName,
          senderRole: 'buyer',
          text: initialMessage,
          timestamp: new Date().toISOString(),
        };
        
        setMessages(prev => ({
          ...prev,
          [convId]: [sysMsg]
        }));

        await chatService.sendMessage(sysMsg);
      }
    }

    setActiveConversationId(convId || null);
    return convId || toUUID();
  };

  const sendMessage = async (conversationId: string, text: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;

    const senderRole = conv.seller.id === currentUserId ? 'seller' : 'buyer';
    const senderName = conv.seller.id === currentUserId ? conv.seller.name : conv.buyer.name;

    const newMessage: ChatMessage = {
      id: toUUID(),
      conversationId,
      senderId: currentUserId,
      senderName,
      senderRole,
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage]
    }));

    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, lastMessage: text, lastMessageTime: newMessage.timestamp } : c
    ));

    await chatService.sendMessage(newMessage);
  };

  const sendOffer = async (offer: DealOffer) => {
    const cleanOffer: DealOffer = {
      ...offer,
      id: toUUID(offer.id),
      conversationId: toUUID(offer.conversationId),
      senderId: offer.senderId || currentUserId,
      isCounter: Boolean(offer.isCounter),
      status: offer.status || 'Pending',
    };

    // If counter offer, mark any previous offers in this conversation as 'Countered'
    if (cleanOffer.isCounter) {
      const prevOffers = dealOffers[cleanOffer.conversationId] || [];
      for (const po of prevOffers) {
        if (po.id !== cleanOffer.id) {
          await chatService.updateOfferStatus(po.id, 'Countered');
        }
      }
      setDealOffers(prev => ({
        ...prev,
        [cleanOffer.conversationId]: [
          ...(prev[cleanOffer.conversationId] || []).map(o => o.id !== cleanOffer.id ? { ...o, status: 'Countered' as const } : o).filter(o => o.id !== cleanOffer.id),
          cleanOffer
        ]
      }));
    } else {
      setDealOffers(prev => ({
        ...prev,
        [cleanOffer.conversationId]: [...(prev[cleanOffer.conversationId] || []).filter(o => o.id !== cleanOffer.id), cleanOffer]
      }));
    }
    
    // Create a message with the offer attached so the offer card template renders
    const isSellerSender = cleanOffer.senderId === cleanOffer.sellerId;
    const offerMsg: ChatMessage = {
      id: toUUID(),
      conversationId: cleanOffer.conversationId,
      senderId: cleanOffer.senderId || currentUserId,
      senderName: isSellerSender ? cleanOffer.sellerName : cleanOffer.buyerName,
      senderRole: isSellerSender ? 'seller' : 'buyer',
      text: cleanOffer.isCounter
        ? `Counter-offer: ${cleanOffer.quantity} ${cleanOffer.unit}s @ ${cleanOffer.currency}${cleanOffer.offeredPricePerUnit.toLocaleString("en-IN")}/${cleanOffer.unit}.`
        : `I'd like to make an offer for ${cleanOffer.quantity} ${cleanOffer.unit}s at ${cleanOffer.currency}${cleanOffer.offeredPricePerUnit.toLocaleString("en-IN")}/${cleanOffer.unit}.`,
      timestamp: new Date().toISOString(),
      offerId: cleanOffer.id,
      offer: cleanOffer,
    };

    setMessages(prev => ({
      ...prev,
      [cleanOffer.conversationId]: [...(prev[cleanOffer.conversationId] || []), offerMsg]
    }));

    setConversations(prev => prev.map(c =>
      c.id === cleanOffer.conversationId ? { ...c, lastMessage: `${cleanOffer.isCounter ? "Counter-Offer" : "Offer"}: ${cleanOffer.currency}${cleanOffer.offeredPricePerUnit}/${cleanOffer.unit} × ${cleanOffer.quantity} ${cleanOffer.unit}s`, lastMessageTime: offerMsg.timestamp } : c
    ));

    await chatService.createOffer(cleanOffer);
    await chatService.sendMessage(offerMsg);
  };

  const acceptOffer = async (offer: DealOffer) => {
    const updatedStatus = 'Accepted' as const;
    
    setDealOffers(prev => ({
      ...prev,
      [offer.conversationId]: (prev[offer.conversationId] || []).map(o => 
        o.id === offer.id ? { ...o, status: updatedStatus } : o
      )
    }));

    // Update the offer status inside any messages that carry this offer
    setMessages(prev => ({
      ...prev,
      [offer.conversationId]: (prev[offer.conversationId] || []).map(m =>
        (m.offerId === offer.id || m.offer?.id === offer.id) ? { ...m, offer: { ...(m.offer || offer), status: updatedStatus } } : m
      )
    }));

    // Deduct quantity from listing inventory in real-time
    const { remainingQuantity } = await deductListingInventory(offer.listingId, offer.quantity);

    // Save purchase order record
    savePurchaseRecord({
      id: `pur-${Date.now()}`,
      listingId: offer.listingId,
      productTitle: offer.listingTitle,
      category: "Industrial Material",
      quantity: offer.quantity,
      unit: offer.unit,
      amount: offer.totalAmount,
      unitPrice: offer.offeredPricePerUnit,
      currency: offer.currency,
      status: "Completed",
      orderedDate: new Date().toISOString().split("T")[0],
      seller: { id: offer.sellerId, name: offer.sellerName, company: offer.sellerName },
      buyer: { id: offer.buyerId, name: offer.buyerName, company: offer.buyerName }
    });

    const isCounter = offer.isCounter;
    const accepterRole = isCounter ? (offer.senderId === offer.sellerId ? "Buyer" : "Seller") : "Seller";
    const sysMsg: ChatMessage = {
      id: toUUID(),
      conversationId: offer.conversationId,
      senderId: 'system',
      senderName: 'System',
      senderRole: 'system',
      text: `🎉 Deal Confirmed & Sold! ${accepterRole} accepted ${isCounter ? "counter-offer" : "offer"} of ${offer.quantity} ${offer.unit}s @ ${offer.currency}${offer.offeredPricePerUnit.toLocaleString("en-IN")}/${offer.unit}. ${offer.quantity} ${offer.unit}s deducted from inventory (${remainingQuantity} ${offer.unit}s remaining in stock).`,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => ({
      ...prev,
      [offer.conversationId]: [...(prev[offer.conversationId] || []), sysMsg]
    }));

    setConversations(prev => prev.map(c =>
      c.id === offer.conversationId ? { ...c, lastMessage: `🎉 Deal Confirmed: ${offer.quantity} ${offer.unit}s sold`, lastMessageTime: sysMsg.timestamp } : c
    ));
    
    await chatService.updateOfferStatus(offer.id, 'accepted');
    await chatService.sendMessage(sysMsg);
  };

  const rejectOffer = async (offer: DealOffer) => {
    const updatedStatus = 'Rejected' as const;

    setDealOffers(prev => ({
      ...prev,
      [offer.conversationId]: (prev[offer.conversationId] || []).map(o => 
        o.id === offer.id ? { ...o, status: updatedStatus } : o
      )
    }));

    // Update the offer status inside any messages that carry this offer
    setMessages(prev => ({
      ...prev,
      [offer.conversationId]: (prev[offer.conversationId] || []).map(m =>
        (m.offerId === offer.id || m.offer?.id === offer.id) ? { ...m, offer: { ...(m.offer || offer), status: updatedStatus } } : m
      )
    }));

    const sysMsg: ChatMessage = {
      id: toUUID(),
      conversationId: offer.conversationId,
      senderId: 'system',
      senderName: 'System',
      senderRole: 'system',
      text: `Offer declined for ${offer.quantity} ${offer.unit}s.`,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => ({
      ...prev,
      [offer.conversationId]: [...(prev[offer.conversationId] || []), sysMsg]
    }));

    setConversations(prev => prev.map(c =>
      c.id === offer.conversationId ? { ...c, lastMessage: `Offer declined`, lastMessageTime: sysMsg.timestamp } : c
    ));

    await chatService.updateOfferStatus(offer.id, 'declined');
    await chatService.sendMessage(sysMsg);
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteConversation = async (conversationId: string) => {
    const targetUUID = toUUID(conversationId);
    const targetSet = new Set([conversationId, targetUUID]);

    setConversations(prev => prev.filter(c => !targetSet.has(c.id)));
    setMessages(prev => {
      const next = { ...prev };
      targetSet.forEach(id => delete next[id]);
      return next;
    });
    setDealOffers(prev => {
      const next = { ...prev };
      targetSet.forEach(id => delete next[id]);
      return next;
    });
    if (activeConversationId && targetSet.has(activeConversationId)) {
      setActiveConversationId(null);
    }
    await chatService.deleteConversation(conversationId);
  };

  return (
    <CommunicationContext.Provider value={{
      conversations,
      messages,
      dealOffers,
      notifications,
      unreadMessageCount,
      unreadNotificationCount,
      activeConversationId,
      setActiveConversationId,
      startConversation,
      sendMessage,
      sendOffer,
      acceptOffer,
      rejectOffer,
      markNotificationsAsRead,
      deleteConversation,
      refreshData
    }}>
      {children}
    </CommunicationContext.Provider>
  );
};

export const useCommunication = () => {
  const context = useContext(CommunicationContext);
  if (context === undefined) {
    throw new Error('useCommunication must be used within a CommunicationProvider');
  }
  return context;
};
