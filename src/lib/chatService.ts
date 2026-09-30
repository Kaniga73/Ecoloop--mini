import { supabase, isLiveSupabaseConfigured } from './supabase';
import { Conversation, ChatMessage, DealOffer } from '../types';
import { toUUID } from './listingsService';

const OFFLINE_QUEUE_KEY = 'ecoloop_chat_offline_queue';
const LOCAL_CONVERSATIONS_KEY = 'ecoloop_local_conversations';
const LOCAL_MESSAGES_KEY = 'ecoloop_local_messages';
const LOCAL_OFFERS_KEY = 'ecoloop_local_offers';
const DELETED_CONVERSATIONS_KEY = 'ecoloop_deleted_conversations_set';

export type QueuedMutation = 
  | { type: 'CREATE_MESSAGE', payload: ChatMessage }
  | { type: 'CREATE_OFFER', payload: DealOffer }
  | { type: 'UPDATE_OFFER_STATUS', payload: { id: string; status: string } }
  | { type: 'CREATE_CONVERSATION', payload: Conversation };

export const chatService = {
  notifyBroadcast() {
    try {
      const bc = new BroadcastChannel('ecoloop_realtime_chat_sync');
      bc.postMessage({ timestamp: Date.now() });
      bc.close();
    } catch {
      // ignore
    }
  },

  // Deleted conversations tracker to permanently prevent deleted chats from resurfacing
  getDeletedConversationIds(): Set<string> {
    try {
      const raw = localStorage.getItem(DELETED_CONVERSATIONS_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  },

  markConversationDeleted(id: string) {
    try {
      const set = this.getDeletedConversationIds();
      set.add(id);
      set.add(toUUID(id));
      localStorage.setItem(DELETED_CONVERSATIONS_KEY, JSON.stringify(Array.from(set)));
    } catch (e) {
      console.warn('Error recording deleted conversation:', e);
    }
  },

  // Read Queue
  getOfflineQueue(): QueuedMutation[] {
    try {
      const q = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return q ? JSON.parse(q) : [];
    } catch {
      return [];
    }
  },

  // Append to Queue
  enqueueMutation(mutation: QueuedMutation) {
    const q = this.getOfflineQueue();
    q.push(mutation);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
    
    // Also save to local storage fallbacks so UI persists immediately across reloads
    if (mutation.type === 'CREATE_MESSAGE') {
      const msgs = this.getLocalMessages();
      if (!msgs[mutation.payload.conversationId]) msgs[mutation.payload.conversationId] = [];
      msgs[mutation.payload.conversationId].push(mutation.payload);
      this.saveLocalMessages(msgs);
    } else if (mutation.type === 'CREATE_CONVERSATION') {
      const convs = this.getLocalConversations();
      if (!convs.find(c => c.id === mutation.payload.id)) {
        convs.push(mutation.payload);
        this.saveLocalConversations(convs);
      }
    } else if (mutation.type === 'CREATE_OFFER') {
      const offers = this.getLocalOffers();
      if (!offers[mutation.payload.conversationId]) offers[mutation.payload.conversationId] = [];
      offers[mutation.payload.conversationId].push(mutation.payload);
      this.saveLocalOffers(offers);
    } else if (mutation.type === 'UPDATE_OFFER_STATUS') {
      const offers = this.getLocalOffers();
      Object.keys(offers).forEach(cid => {
        offers[cid] = offers[cid].map(o => o.id === mutation.payload.id ? { ...o, status: mutation.payload.status as any } : o);
      });
      this.saveLocalOffers(offers);
    }
    this.notifyBroadcast();
  },

  // Clear Queue
  clearQueue() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },

  // Local Storage Fallback accessors
  getLocalConversations(): Conversation[] {
    try {
      const convs: Conversation[] = JSON.parse(localStorage.getItem(LOCAL_CONVERSATIONS_KEY) || '[]');
      const deleted = this.getDeletedConversationIds();
      return convs.filter(c => !deleted.has(c.id));
    } catch {
      return [];
    }
  },
  saveLocalConversations(convs: Conversation[], broadcast = false) {
    const deleted = this.getDeletedConversationIds();
    const filtered = convs.filter(c => !deleted.has(c.id));
    localStorage.setItem(LOCAL_CONVERSATIONS_KEY, JSON.stringify(filtered));
    if (broadcast) this.notifyBroadcast();
  },

  getLocalMessages(): Record<string, ChatMessage[]> {
    try {
      const msgs: Record<string, ChatMessage[]> = JSON.parse(localStorage.getItem(LOCAL_MESSAGES_KEY) || '{}');
      const deleted = this.getDeletedConversationIds();
      deleted.forEach(id => { delete msgs[id]; });
      return msgs;
    } catch {
      return {};
    }
  },
  saveLocalMessages(msgs: Record<string, ChatMessage[]>, broadcast = false) {
    const deleted = this.getDeletedConversationIds();
    deleted.forEach(id => { delete msgs[id]; });
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(msgs));
    if (broadcast) this.notifyBroadcast();
  },

  getLocalOffers(): Record<string, DealOffer[]> {
    try {
      const offers: Record<string, DealOffer[]> = JSON.parse(localStorage.getItem(LOCAL_OFFERS_KEY) || '{}');
      const deleted = this.getDeletedConversationIds();
      deleted.forEach(id => { delete offers[id]; });
      return offers;
    } catch {
      return {};
    }
  },
  saveLocalOffers(offers: Record<string, DealOffer[]>, broadcast = false) {
    const deleted = this.getDeletedConversationIds();
    deleted.forEach(id => { delete offers[id]; });
    localStorage.setItem(LOCAL_OFFERS_KEY, JSON.stringify(offers));
    if (broadcast) this.notifyBroadcast();
  },

  // Fetch all conversations for a user
  async fetchConversations(userId: string): Promise<Conversation[]> {
    const deletedSet = this.getDeletedConversationIds();
    const rawLocalConvs = this.getLocalConversations().filter(c => !deletedSet.has(c.id));

    // Dynamically heal any "Unknown Seller" or "Unknown User" names
    const { resolveUserNameAndCompany } = await import('./listingsService');
    const localConvs = rawLocalConvs.map(c => {
      let sellerName = c.seller?.name;
      let sellerComp = c.seller?.company;
      if (!sellerName || sellerName === 'Unknown Seller' || sellerName === 'Unknown User') {
        const resolved = resolveUserNameAndCompany(c.seller?.id, c.listingId);
        sellerName = resolved.name;
        sellerComp = resolved.company;
      }
      return {
        ...c,
        seller: {
          ...c.seller,
          name: sellerName,
          company: sellerComp || sellerName
        }
      };
    });

    if (!isLiveSupabaseConfigured || !supabase) {
      // In offline/simulated mode, return all local conversations that belong to this user or return all if demo
      if (!userId || userId === 'demo-user' || userId === 'user-buyer-1') {
        return localConvs.filter(c => !deletedSet.has(c.id));
      }
      return localConvs.filter(c => 
        !deletedSet.has(c.id) && (
          c.buyer.id === userId || 
          c.seller.id === userId || 
          c.buyer.name.toLowerCase().includes(userId.toLowerCase()) || 
          c.seller.name.toLowerCase().includes(userId.toLowerCase())
        )
      );
    }
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_time', { ascending: false });

      if (error) throw error;
      
      const convs: Conversation[] = (data || [])
        .filter((row: any) => !deletedSet.has(row.id))
        .map((row: any) => {
          let sName = row.seller_name;
          let sComp = row.seller_company;
          if (!sName || sName === 'Unknown Seller' || sName === 'Unknown User') {
            const resolved = resolveUserNameAndCompany(row.seller_id, row.listing_id);
            sName = resolved.name;
            sComp = resolved.company;
          }
          return {
            id: row.id,
            listingId: row.listing_id,
            listingTitle: row.listing_title,
            listingImage: row.listing_image,
            listingPrice: row.listing_price,
            buyer: { id: row.buyer_id, name: row.buyer_name, company: row.buyer_company },
            seller: { id: row.seller_id, name: sName, company: sComp },
            lastMessage: row.last_message || '',
            lastMessageTime: row.last_message_time || new Date().toISOString(),
            unreadCount: 0 // Local state
          };
        });

      // Combine with local conversations
      const combined = [...convs];
      localConvs.forEach(localConv => {
        if (!deletedSet.has(localConv.id) && !combined.find(c => c.id === localConv.id)) {
          if (localConv.buyer.id === userId || localConv.seller.id === userId || userId === 'demo-user') {
            combined.push(localConv);
          }
        }
      });

      return combined.filter(c => !deletedSet.has(c.id));
    } catch (err) {
      console.warn('Supabase fetchConversations failed. Using local storage fallback.', err);
      return localConvs.filter(c => !deletedSet.has(c.id));
    }
  },

  // Fetch all messages for a set of conversations
  async fetchMessagesForConversations(conversationIds: string[]): Promise<Record<string, ChatMessage[]>> {
    if (!conversationIds.length) return {};
    if (!isLiveSupabaseConfigured || !supabase) {
      return this.getLocalMessages();
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const msgsMap: Record<string, ChatMessage[]> = {};
      data.forEach((row: any) => {
        const cid = row.conversation_id;
        if (!msgsMap[cid]) msgsMap[cid] = [];
        msgsMap[cid].push({
          id: row.id,
          conversationId: cid,
          senderId: row.sender_id,
          senderName: row.sender_name,
          senderRole: row.sender_role,
          text: row.text,
          timestamp: row.created_at
        });
      });

      // Combine with local messages for these conversations
      const localMsgs = this.getLocalMessages();
      conversationIds.forEach(cid => {
        if (localMsgs[cid]) {
          if (!msgsMap[cid]) msgsMap[cid] = [];
          localMsgs[cid].forEach(lMsg => {
            const isDuplicate = msgsMap[cid].some(m => 
              m.id === lMsg.id || 
              toUUID(m.id) === toUUID(lMsg.id) ||
              (m.senderId === lMsg.senderId && m.text === lMsg.text && Math.abs(new Date(m.timestamp).getTime() - new Date(lMsg.timestamp).getTime()) < 5000)
            );
            if (!isDuplicate) {
              msgsMap[cid].push(lMsg);
            }
          });
          // sort by timestamp
          msgsMap[cid].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
      });

      // Cache locally
      this.saveLocalMessages(msgsMap);
      return msgsMap;
    } catch (err) {
      console.warn('Supabase fetchMessages failed. Using local storage fallback.', err);
      return this.getLocalMessages();
    }
  },

  // Fetch all deal offers for conversations
  async fetchDealOffers(conversationIds: string[]): Promise<Record<string, DealOffer[]>> {
    if (!conversationIds.length) return {};
    if (!isLiveSupabaseConfigured || !supabase) {
      return this.getLocalOffers();
    }

    try {
      const { data, error } = await supabase
        .from('deal_offers')
        .select('*, conversations(listing_id, listing_title, buyer_id, buyer_name, seller_id, seller_name)')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const offersMap: Record<string, DealOffer[]> = {};
      data.forEach((row: any) => {
        const cid = row.conversation_id;
        if (!offersMap[cid]) offersMap[cid] = [];
        
        const conv = row.conversations || {};
        const notesStr = row.notes || '';
        const isCounter = Boolean(
          row.is_counter ||
          notesStr.includes('[COUNTER_OFFER]') ||
          notesStr.toLowerCase().includes('counter-offer') ||
          notesStr.toLowerCase().includes('counter offer')
        );
        const cleanNotes = notesStr.replace('[COUNTER_OFFER]', '').trim();
        
        offersMap[cid].push({
          id: row.id,
          conversationId: cid,
          listingId: conv.listing_id || 'unknown',
          listingTitle: conv.listing_title || 'Unknown',
          buyerId: conv.buyer_id || 'unknown',
          buyerName: conv.buyer_name || 'Unknown',
          sellerId: conv.seller_id || 'unknown',
          sellerName: conv.seller_name || 'Unknown',
          senderId: row.sender_id || (isCounter ? conv.seller_id : conv.buyer_id),
          isCounter: isCounter,
          offeredPricePerUnit: Number(row.offered_price_per_unit),
          quantity: Number(row.offered_quantity),
          unit: row.unit,
          totalAmount: Number(row.total_offer_amount),
          currency: row.currency,
          status: row.status.charAt(0).toUpperCase() + row.status.slice(1) as any,
          createdAt: row.created_at,
          incoterm: row.incoterm,
          notes: cleanNotes
        });
      });

      // Combine with local offers
      const localOffers = this.getLocalOffers();
      conversationIds.forEach(cid => {
        if (localOffers[cid]) {
          if (!offersMap[cid]) offersMap[cid] = [];
          localOffers[cid].forEach(lOffer => {
            const isDuplicate = offersMap[cid].some(o => 
              o.id === lOffer.id || 
              toUUID(o.id) === toUUID(lOffer.id) ||
              (o.buyerId === lOffer.buyerId && o.quantity === lOffer.quantity && o.offeredPricePerUnit === lOffer.offeredPricePerUnit && Math.abs(new Date(o.createdAt).getTime() - new Date(lOffer.createdAt).getTime()) < 5000)
            );
            if (!isDuplicate) {
              offersMap[cid].push(lOffer);
            }
          });
          // sort by timestamp
          offersMap[cid].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
      });

      this.saveLocalOffers(offersMap);
      return offersMap;
    } catch (err) {
      console.warn('Supabase fetchDealOffers failed. Using fallback.', err);
      return this.getLocalOffers();
    }
  },

  // Delete conversation completely
  async deleteConversation(conversationId: string): Promise<boolean> {
    const targetUUID = toUUID(conversationId);
    this.markConversationDeleted(conversationId);
    this.markConversationDeleted(targetUUID);

    // 2. Remove from local storage
    const convs = this.getLocalConversations().filter(c => c.id !== conversationId && c.id !== targetUUID);
    localStorage.setItem(LOCAL_CONVERSATIONS_KEY, JSON.stringify(convs));

    const msgs = this.getLocalMessages();
    delete msgs[conversationId];
    delete msgs[targetUUID];
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(msgs));

    const offers = this.getLocalOffers();
    delete offers[conversationId];
    delete offers[targetUUID];
    localStorage.setItem(LOCAL_OFFERS_KEY, JSON.stringify(offers));

    // 3. Remove any queued mutations for this conversation
    const queue = this.getOfflineQueue().filter(m => {
      if ('conversationId' in m.payload && (m.payload.conversationId === conversationId || m.payload.conversationId === targetUUID)) return false;
      if (m.type === 'CREATE_CONVERSATION' && (m.payload.id === conversationId || m.payload.id === targetUUID)) return false;
      return true;
    });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

    this.notifyBroadcast();

    if (!isLiveSupabaseConfigured || !supabase) {
      return true;
    }

    try {
      await supabase.from('messages').delete().or(`conversation_id.eq.${conversationId},conversation_id.eq.${targetUUID}`);
      await supabase.from('deal_offers').delete().or(`conversation_id.eq.${conversationId},conversation_id.eq.${targetUUID}`);
      await supabase.from('conversations').delete().or(`id.eq.${conversationId},id.eq.${targetUUID}`);
      return true;
    } catch (err) {
      console.warn('Failed to delete conversation on Supabase:', err);
      return true;
    }
  },

  // Start new conversation
  async createConversation(conv: Conversation): Promise<boolean> {
    const convs = this.getLocalConversations();
    if (!convs.find(c => c.id === conv.id)) {
      convs.push(conv);
      this.saveLocalConversations(convs);
    }

    if (!isLiveSupabaseConfigured || !supabase) {
      this.enqueueMutation({ type: 'CREATE_CONVERSATION', payload: conv });
      return true;
    }

    try {
      const convUUID = toUUID(conv.id);
      const listingUUID = toUUID(conv.listingId);
      const buyerUUID = toUUID(conv.buyer.id);
      let sellerUUID = toUUID(conv.seller.id);

      // Ensure the listing row exists in listings table so foreign key constraint never fails
      try {
        const { data: existingListing } = await supabase
          .from('listings')
          .select('id, seller_id')
          .eq('id', listingUUID)
          .maybeSingle();

        if (!existingListing) {
          await supabase.from('listings').insert([{
            id: listingUUID,
            seller_id: sellerUUID,
            title: conv.listingTitle || 'Industrial Material',
            price: 100,
            image_url: conv.listingImage || null
          }]);
        } else if (existingListing.seller_id) {
          sellerUUID = existingListing.seller_id;
        }
      } catch (err) {
        console.warn('Listing foreign key pre-check:', err);
      }

      const payload: any = {
        id: convUUID,
        listing_id: listingUUID,
        listing_title: conv.listingTitle,
        listing_image: conv.listingImage,
        listing_price: conv.listingPrice,
        buyer_id: buyerUUID,
        buyer_name: conv.buyer.name,
        buyer_company: conv.buyer.company,
        seller_id: sellerUUID,
        seller_name: conv.seller.name,
        seller_company: conv.seller.company,
        last_message: conv.lastMessage,
        last_message_time: conv.lastMessageTime
      };

      const { error: insErr } = await supabase.from('conversations').insert([payload]);
      if (insErr) {
        const { error: updErr } = await supabase.from('conversations').update({
          last_message: conv.lastMessage,
          last_message_time: conv.lastMessageTime
        }).eq('id', convUUID);

        if (updErr) {
          console.warn('Supabase createConversation warning, queued locally:', insErr.message || updErr.message);
          this.enqueueMutation({ type: 'CREATE_CONVERSATION', payload: conv });
        }
      }
      return true;
    } catch (err) {
      console.warn('Failed to push conversation. Queueing offline.', err);
      this.enqueueMutation({ type: 'CREATE_CONVERSATION', payload: conv });
      return true;
    }
  },

  // Send message
  async sendMessage(msg: ChatMessage): Promise<boolean> {
    const msgs = this.getLocalMessages();
    if (!msgs[msg.conversationId]) msgs[msg.conversationId] = [];
    if (!msgs[msg.conversationId].find(m => m.id === msg.id)) {
      msgs[msg.conversationId].push(msg);
      this.saveLocalMessages(msgs);
    }

    if (!isLiveSupabaseConfigured || !supabase) {
      this.enqueueMutation({ type: 'CREATE_MESSAGE', payload: msg });
      return true;
    }

    try {
      const msgUUID = toUUID(msg.id);
      const convUUID = toUUID(msg.conversationId);
      const senderUUID = toUUID(msg.senderId);

      const { error } = await supabase.from('messages').insert([{
        id: msgUUID,
        conversation_id: convUUID,
        sender_id: senderUUID,
        sender_name: msg.senderName,
        sender_role: msg.senderRole,
        text: msg.text,
        created_at: msg.timestamp || new Date().toISOString()
      }]);

      if (error) {
        console.warn('Supabase sendMessage warning, queued locally:', error.message);
        this.enqueueMutation({ type: 'CREATE_MESSAGE', payload: msg });
      } else {
        await supabase.from('conversations').update({
          last_message: msg.text,
          last_message_time: msg.timestamp || new Date().toISOString()
        }).eq('id', convUUID);
      }

      return true;
    } catch (err) {
      console.warn('Failed to push message. Queueing offline.', err);
      this.enqueueMutation({ type: 'CREATE_MESSAGE', payload: msg });
      return true;
    }
  },

  // Create or sync Deal Offer
  async createOffer(offer: DealOffer): Promise<boolean> {
    const offers = this.getLocalOffers();
    if (!offers[offer.conversationId]) offers[offer.conversationId] = [];
    const existingIndex = offers[offer.conversationId].findIndex(o => o.id === offer.id);
    if (existingIndex >= 0) {
      offers[offer.conversationId][existingIndex] = offer;
    } else {
      offers[offer.conversationId].push(offer);
    }
    this.saveLocalOffers(offers, true);

    if (!isLiveSupabaseConfigured || !supabase) {
      this.enqueueMutation({ type: 'CREATE_OFFER', payload: offer });
      return true;
    }

    try {
      const payload: any = {
        id: toUUID(offer.id),
        conversation_id: toUUID(offer.conversationId),
        offered_price_per_unit: offer.offeredPricePerUnit,
        offered_quantity: offer.quantity,
        unit: offer.unit || 'Kg',
        currency: offer.currency || '₹',
        incoterm: offer.incoterm || 'EXW (Ex Works)',
        total_offer_amount: offer.totalAmount,
        notes: (offer.isCounter ? '[COUNTER_OFFER] ' : '') + (offer.notes || ''),
        status: (offer.status || 'pending').toLowerCase(),
        created_at: offer.createdAt || new Date().toISOString()
      };

      const { error } = await supabase.from('deal_offers').upsert([payload]);
      if (error) {
        console.warn('Supabase createOffer warning, queued locally:', error.message);
        this.enqueueMutation({ type: 'CREATE_OFFER', payload: offer });
      }
      return true;
    } catch (err) {
      console.warn('Failed to push offer:', err);
      this.enqueueMutation({ type: 'CREATE_OFFER', payload: offer });
      return true;
    }
  },

  // Update offer status
  async updateOfferStatus(offerId: string, status: string): Promise<boolean> {
    const localOffers = this.getLocalOffers();
    let updated = false;
    Object.keys(localOffers).forEach(cid => {
      localOffers[cid] = localOffers[cid].map(o => {
        if (o.id === offerId || toUUID(o.id) === toUUID(offerId)) {
          updated = true;
          return { ...o, status: (status.charAt(0).toUpperCase() + status.slice(1)) as any };
        }
        return o;
      });
    });
    if (updated) {
      this.saveLocalOffers(localOffers, true);
    }

    if (!isLiveSupabaseConfigured || !supabase) {
      this.enqueueMutation({ type: 'UPDATE_OFFER_STATUS', payload: { id: offerId, status } });
      return true;
    }

    try {
      await supabase.from('deal_offers').update({
        status: status.toLowerCase()
      }).eq('id', toUUID(offerId));
      return true;
    } catch (err) {
      console.warn('Failed to update offer status in Supabase:', err);
      this.enqueueMutation({ type: 'UPDATE_OFFER_STATUS', payload: { id: offerId, status } });
      return false;
    }
  },

  // Process offline queue
  async syncOfflineQueue() {
    if (!isLiveSupabaseConfigured || !supabase) return;
    
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return;

    this.clearQueue();
    
    for (const mutation of queue) {
      try {
        switch (mutation.type) {
          case 'CREATE_CONVERSATION':
            await this.createConversation(mutation.payload);
            break;
          case 'CREATE_MESSAGE':
            await this.sendMessage(mutation.payload);
            break;
          case 'CREATE_OFFER':
            await this.createOffer(mutation.payload);
            break;
          case 'UPDATE_OFFER_STATUS':
            if (isLiveSupabaseConfigured && supabase) {
              await supabase.from('deal_offers').update({
                status: mutation.payload.status.toLowerCase()
              }).eq('id', toUUID(mutation.payload.id));
            }
            break;
        }
      } catch (err) {
        console.error('Failed to sync mutation, requeueing', mutation, err);
        this.enqueueMutation(mutation);
      }
    }
  }
};
