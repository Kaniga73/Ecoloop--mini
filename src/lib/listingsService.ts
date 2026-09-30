import { supabase, isLiveSupabaseConfigured, getStoredProfiles } from './supabase';
import { WasteListing, WasteListingLocation, WasteSellerInfo } from '../types';

const LOCAL_STORAGE_LISTINGS_KEY = 'ecoloop_simulated_listings';

function getStoredListings(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LISTINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredListings(listings: any[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_LISTINGS_KEY, JSON.stringify(listings));
  } catch (err) {
    console.error('Error saving simulated listings:', err);
  }
}

export function isUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function toUUID(str?: string): string {
  if (str && isUUID(str)) return str;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function notifyListingsBroadcast() {
  try {
    const bc = new BroadcastChannel('ecoloop_listings_sync');
    bc.postMessage({ timestamp: Date.now() });
    bc.close();
  } catch {
    // ignore
  }
}

export async function uploadListingImages(files: File[], userId: string): Promise<string[]> {
  if (!isLiveSupabaseConfigured || !supabase) {
    // Return fake URLs for local simulation
    return files.map(file => URL.createObjectURL(file));
  }

  const uploadedUrls: string[] = [];

  for (const file of files) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    
    try {
      const { data, error } = await supabase.storage
        .from('listing_images')
        .upload(fileName, file);

      if (error) {
        console.warn('Storage upload error, using object URL fallback:', error.message);
        uploadedUrls.push(URL.createObjectURL(file));
        continue;
      }

      if (data) {
        const { data: publicUrlData } = supabase.storage
          .from('listing_images')
          .getPublicUrl(fileName);
        uploadedUrls.push(publicUrlData.publicUrl);
      }
    } catch {
      uploadedUrls.push(URL.createObjectURL(file));
    }
  }

  return uploadedUrls;
}

export function inferCategoryFromTitle(title?: string): string {
  if (!title) return 'Scrap Metal';
  const lower = title.toLowerCase();
  if (lower.includes('scrap') || lower.includes('metal') || lower.includes('steel') || lower.includes('iron') || lower.includes('aluminum') || lower.includes('aluminium') || lower.includes('copper') || lower.includes('brass') || lower.includes('zinc') || lower.includes('lead')) {
    return 'Scrap Metal';
  }
  if (lower.includes('plastic') || lower.includes('pet') || lower.includes('hdpe') || lower.includes('pvc') || lower.includes('ldpe') || lower.includes('polymer') || lower.includes('poly')) {
    return 'Industrial Plastics';
  }
  if (lower.includes('chemical') || lower.includes('acid') || lower.includes('solvent') || lower.includes('oil') || lower.includes('byproduct')) {
    return 'Chemical Byproducts';
  }
  if (lower.includes('electronic') || lower.includes('e-waste') || lower.includes('pcb') || lower.includes('battery') || lower.includes('circuit') || lower.includes('wire') || lower.includes('cable')) {
    return 'E-Waste';
  }
  if (lower.includes('textile') || lower.includes('fabric') || lower.includes('cotton') || lower.includes('yarn') || lower.includes('fiber') || lower.includes('cloth')) {
    return 'Textiles & Fibers';
  }
  if (lower.includes('construction') || lower.includes('concrete') || lower.includes('debris') || lower.includes('brick') || lower.includes('sand') || lower.includes('cement') || lower.includes('demolition')) {
    return 'Construction & Demolition';
  }
  if (lower.includes('rubber') || lower.includes('tyre') || lower.includes('tire')) {
    return 'Rubber & Tyres';
  }
  if (lower.includes('organic') || lower.includes('bio') || lower.includes('food') || lower.includes('agri') || lower.includes('wood') || lower.includes('compost')) {
    return 'Organic / Bio Waste';
  }
  return 'Scrap Metal';
}

export async function createWasteListing(listingData: any): Promise<{ data?: any, error?: string }> {
  const newId = toUUID(listingData.id);
  const now = new Date().toISOString();
  const simulatedRow = {
    id: newId,
    created_at: now,
    updated_at: now,
    status: 'available',
    ...listingData,
  };

  const existingListings = getStoredListings();
  // Always save locally immediately and notify broadcast
  saveStoredListings([simulatedRow, ...existingListings.filter(item => item.id !== newId)]);
  notifyListingsBroadcast();

  if (!isLiveSupabaseConfigured || !supabase) {
    return { data: simulatedRow };
  }

  // Get active authenticated user if present
  let authUserId = listingData.seller_id;
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) {
      authUserId = authData.user.id;
    }
  } catch {
    // ignore
  }

  // 1. Try inserting to waste_listings
  try {
    const payload = {
      id: newId,
      ...listingData,
      seller_id: authUserId,
    };
    const { data, error } = await supabase
      .from('waste_listings')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      saveStoredListings([data, ...existingListings.filter((item) => item.id !== newId)]);
      notifyListingsBroadcast();
      return { data };
    }
  } catch (err) {
    console.warn('Supabase waste_listings insert failed, trying listings table fallback...', err);
  }

  // 2. Try inserting to listings table (matching schema.sql) with JSON packed metadata in image_url
  try {
    const metadataObj = {
      url: listingData.images?.[0] || null,
      images: listingData.images || [],
      category: listingData.category || inferCategoryFromTitle(listingData.title),
      subcategory: listingData.subcategory,
      quantity: listingData.quantity || listingData.totalQuantity || 100,
      unit: listingData.unit || 'Kgs',
      description: listingData.description || '',
      condition: listingData.condition || 'Good',
      city: listingData.location_city || 'hosur',
      state: listingData.location_state || 'Tamil Nadu',
      seller_name: listingData.seller_name,
      seller_company: listingData.seller_company,
      material_type: listingData.material_type,
      hazardous_material: listingData.hazardous_material,
    };

    const basicPayload = {
      id: newId,
      seller_id: authUserId,
      title: listingData.title,
      price: listingData.price || listingData.pricePerUnit || 0,
      image_url: JSON.stringify(metadataObj),
    };
    const { data: bData, error: bError } = await supabase
      .from('listings')
      .insert([basicPayload])
      .select()
      .single();

    if (!bError && bData) {
      return { data: simulatedRow };
    } else if (bError) {
      // Fallback with plain image url
      const plainPayload = {
        id: newId,
        seller_id: authUserId,
        title: listingData.title,
        price: listingData.price || listingData.pricePerUnit || 0,
        image_url: listingData.images?.[0] || null,
      };
      await supabase.from('listings').insert([plainPayload]);
    }
  } catch (bErr) {
    console.warn('Supabase listings table insert error:', bErr);
  }

  return { data: simulatedRow };
}

export async function updateWasteListing(id: string, listingData: any): Promise<{ data?: any, error?: string }> {
  const existingListings = getStoredListings();
  const updatedListings = existingListings.map(item => 
    item.id === id ? { ...item, ...listingData, updated_at: new Date().toISOString() } : item
  );
  saveStoredListings(updatedListings);
  notifyListingsBroadcast();

  if (!isLiveSupabaseConfigured || !supabase) {
    return { data: { id, ...listingData } };
  }

  try {
    const { data, error } = await supabase
      .from('waste_listings')
      .update(listingData)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) return { data };
    
    await supabase
      .from('listings')
      .update({
        title: listingData.title,
        price: listingData.price,
      })
      .eq('id', id);

    return { data: { id, ...listingData } };
  } catch (err: any) {
    return { data: { id, ...listingData } };
  }
}

export async function deleteWasteListing(id: string): Promise<{ success?: boolean, error?: string }> {
  const existingListings = getStoredListings();
  saveStoredListings(existingListings.filter(item => item.id !== id));
  notifyListingsBroadcast();

  if (!isLiveSupabaseConfigured || !supabase) {
    return { success: true };
  }

  try {
    await supabase.from('waste_listings').delete().eq('id', id);
    await supabase.from('listings').delete().eq('id', id);
    return { success: true };
  } catch (err: any) {
    return { success: true };
  }
}

const LOCAL_STORAGE_PURCHASES_KEY = 'ecoloop_simulated_purchases';

export function getStoredPurchases(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PURCHASES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePurchaseRecord(record: any) {
  const existing = getStoredPurchases();
  const updated = [record, ...existing.filter((r: any) => r.id !== record.id)];
  localStorage.setItem(LOCAL_STORAGE_PURCHASES_KEY, JSON.stringify(updated));
  try {
    const bc = new BroadcastChannel('ecoloop_purchases_sync');
    bc.postMessage({ timestamp: Date.now() });
    bc.close();
  } catch {
    // ignore
  }
}

export async function deductListingInventory(
  listingId: string, 
  quantityToDeduct: number
): Promise<{ remainingQuantity: number; status: string }> {
  const existingListings = getStoredListings();
  let updatedRemaining = 0;
  let updatedStatus = 'available';

  const updated = existingListings.map(item => {
    if (item.id === listingId) {
      const origQty = item.originalQuantity ?? Number(item.quantity || item.totalQuantity || 100);
      const currentSold = Number(item.soldQuantity || item.sold_quantity || 0);
      const newSold = currentSold + quantityToDeduct;
      updatedRemaining = Math.max(0, origQty - newSold);
      updatedStatus = updatedRemaining <= 0 ? 'sold' : (item.status || 'available');

      return {
        ...item,
        originalQuantity: origQty,
        soldQuantity: newSold,
        sold_quantity: newSold,
        remainingQuantity: updatedRemaining,
        remaining_quantity: updatedRemaining,
        totalQuantity: updatedRemaining,
        total_quantity: updatedRemaining,
        status: updatedStatus,
        updated_at: new Date().toISOString()
      };
    }
    return item;
  });

  saveStoredListings(updated);
  notifyListingsBroadcast();

  if (isLiveSupabaseConfigured && supabase) {
    try {
      await supabase.from('waste_listings').update({
        sold_quantity: updated.find(i => i.id === listingId)?.soldQuantity,
        remaining_quantity: updatedRemaining,
        total_quantity: updatedRemaining,
        status: updatedStatus,
      }).eq('id', listingId);

      await supabase.from('listings').update({
        status: updatedStatus,
      }).eq('id', listingId);
    } catch (err) {
      console.warn("Error updating Supabase listing inventory:", err);
    }
  }

  return { remainingQuantity: updatedRemaining, status: updatedStatus };
}

export function resolveUserNameAndCompany(userId?: string, listingId?: string): { name: string; company: string } {
  if (!userId || userId === 'unknown') {
    return { name: 'Verified Seller', company: 'EcoLoop Industrial Partner' };
  }

  // 1. Check local stored profiles
  const storedProfiles = getStoredProfiles();
  const matchedProfile = storedProfiles.find(p => p.auth_user_id === userId || p.id === userId);
  if (matchedProfile) {
    const fullName = matchedProfile.full_name || (matchedProfile as any).name;
    const comp = (matchedProfile as any).business_name || (matchedProfile as any).company || fullName || 'EcoLoop Partner';
    if (fullName) {
      return { name: fullName, company: comp };
    }
  }

  // 2. Check local stored listings
  const storedListings = getStoredListings();
  if (listingId) {
    const matchedListing = storedListings.find(l => l.id === listingId);
    if (matchedListing?.seller?.name && matchedListing.seller.name !== 'Unknown Seller') {
      return {
        name: matchedListing.seller.name,
        company: matchedListing.seller.company || matchedListing.seller.name
      };
    }
  }
  const anyListingWithUser = storedListings.find(l => l.seller_id === userId || l.seller?.id === userId);
  if (anyListingWithUser?.seller?.name && anyListingWithUser.seller.name !== 'Unknown Seller') {
    return {
      name: anyListingWithUser.seller.name,
      company: anyListingWithUser.seller.company || anyListingWithUser.seller.name
    };
  }

  // 3. Sensible fallback if userId is recognizable
  if (userId.includes('@')) {
    const prefix = userId.split('@')[0];
    const name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    return { name, company: `${name} Enterprises` };
  }

  return { name: 'Verified Seller', company: 'EcoLoop Industrial Partner' };
}

export async function fetchActiveListings(): Promise<WasteListing[]> {
  let dbRows: any[] = [];

  if (isLiveSupabaseConfigured && supabase) {
    try {
      const [wasteRes, listRes] = await Promise.allSettled([
        supabase.from('waste_listings').select('*').order('created_at', { ascending: false }),
        supabase.from('listings').select('*').order('created_at', { ascending: false })
      ]);

      if (wasteRes.status === 'fulfilled' && wasteRes.value?.data && wasteRes.value.data.length > 0) {
        dbRows.push(...wasteRes.value.data);
      }
      if (listRes.status === 'fulfilled' && listRes.value?.data && listRes.value.data.length > 0) {
        for (const lr of listRes.value.data) {
          if (!dbRows.find(d => d.id === lr.id)) {
            dbRows.push(lr);
          }
        }
      }
    } catch (err) {
      console.warn("Error fetching listings from Supabase, relying on local cache:", err);
    }
  }

  const simulatedRows = getStoredListings().filter((r: any) => 
    r.status !== 'sold' && 
    (r.remainingQuantity === undefined || Number(r.remainingQuantity) > 0) &&
    (r.quantity === undefined || Number(r.quantity) > 0 || Number(r.totalQuantity) > 0)
  );
  
  // Deduplicate rows strictly by unique listing ID
  const rowMap = new Map<string, any>();
  for (const r of dbRows) {
    if (r && r.id) rowMap.set(r.id, r);
  }
  for (const r of simulatedRows) {
    if (r && r.id && !rowMap.has(r.id)) rowMap.set(r.id, r);
  }

  const uniqueRows: any[] = Array.from(rowMap.values());

  try {
    // Map DB/local rows to WasteListing frontend interface
    const listings = await Promise.all(uniqueRows.map(async (row: any): Promise<WasteListing> => {
      // Decode packed JSON metadata in image_url if present
      let metaJson: any = null;
      if (typeof row.image_url === 'string' && (row.image_url.startsWith('{') || row.image_url.startsWith('{"'))) {
        try {
          metaJson = JSON.parse(row.image_url);
        } catch {
          metaJson = null;
        }
      }

      let sellerName = metaJson?.seller_name || row.seller_name || row.seller?.name || '';
      let sellerCompany = metaJson?.seller_company || row.seller_company || row.seller?.company || '';
      let sellerEmail = row.seller_email || row.seller?.contactEmail || '';
      let sellerAccountType = row.seller_account_type || '';
      let sellerLocation = metaJson?.city ? `${metaJson.city}, ${metaJson.state || 'Tamil Nadu'}` : (row.seller_location || '');

      let indProfile: any = null;
      let busProfile: any = null;

      if (isLiveSupabaseConfigured && supabase && row.seller_id) {
        try {
          const { data: ip } = await supabase
            .from('individual_profiles')
            .select('full_name, email, city, state, account_type')
            .eq('auth_user_id', row.seller_id)
            .maybeSingle();
          indProfile = ip;

          if (indProfile) {
            sellerName = indProfile.full_name || sellerName;
            sellerCompany = sellerCompany || indProfile.full_name || sellerName;
            sellerEmail = indProfile.email || sellerEmail;
            sellerAccountType = sellerAccountType || 'individual';
            if (!sellerLocation && indProfile.city) {
              sellerLocation = `${indProfile.city}, ${indProfile.state || ''}`.replace(/, $/, '');
            }
          } else {
            const { data: bp } = await supabase
              .from('business_profiles')
              .select('full_name, business_name, email, city, state, account_type')
              .eq('auth_user_id', row.seller_id)
              .maybeSingle();
            busProfile = bp;

            if (busProfile) {
              sellerName = busProfile.full_name || sellerName;
              sellerCompany = busProfile.business_name || sellerCompany || sellerName;
              sellerEmail = busProfile.email || sellerEmail;
              sellerAccountType = sellerAccountType || 'business';
              if (!sellerLocation && busProfile.city) {
                sellerLocation = `${busProfile.city}, ${busProfile.state || ''}`.replace(/, $/, '');
              }
            }
          }
        } catch {
          // ignore
        }
      }

      // Fallback to locally stored profiles
      if (!sellerName || sellerName === 'Unknown Seller') {
        const resolved = resolveUserNameAndCompany(row.seller_id || row.seller?.id, row.id);
        sellerName = resolved.name;
        sellerCompany = resolved.company;
      }

      let city = metaJson?.city || row.location_city || row.location?.city || '';
      let state = metaJson?.state || row.location_state || row.location_country || row.location?.stateOrCountry || '';

      if (!city && indProfile?.city) city = indProfile.city;
      if (!city && busProfile?.city) city = busProfile.city;
      if (!state && indProfile?.state) state = indProfile.state;
      if (!state && busProfile?.state) state = busProfile.state;

      if (!city) city = 'hosur';
      if (!state) state = 'Tamil Nadu';

      const sellerInfo: WasteSellerInfo = {
        id: row.seller_id || row.seller?.id || 'seller-1',
        name: sellerName,
        company: sellerCompany,
        location: sellerLocation || `${city}, ${state}`.replace(/^, | ,$/g, ''),
        contactEmail: sellerEmail,
      };

      const location: WasteListingLocation = {
        city: city,
        stateOrCountry: state,
        coordinates: (row.location_lat && row.location_lng) ? {
          lat: row.location_lat,
          lng: row.location_lng
        } : undefined
      };

      // Extract quantity safely so it is never 0 for active listings
      let parsedQty = 100;
      if (metaJson?.quantity && !isNaN(Number(metaJson.quantity)) && Number(metaJson.quantity) > 0) {
        parsedQty = Number(metaJson.quantity);
      } else if (row.quantity && !isNaN(Number(row.quantity)) && Number(row.quantity) > 0) {
        parsedQty = Number(row.quantity);
      } else if (row.total_quantity && !isNaN(Number(row.total_quantity)) && Number(row.total_quantity) > 0) {
        parsedQty = Number(row.total_quantity);
      } else if (row.totalQuantity && !isNaN(Number(row.totalQuantity)) && Number(row.totalQuantity) > 0) {
        parsedQty = Number(row.totalQuantity);
      } else if (row.originalQuantity && !isNaN(Number(row.originalQuantity)) && Number(row.originalQuantity) > 0) {
        parsedQty = Number(row.originalQuantity);
      } else if (row.title) {
        const match = row.title.match(/(\d+)\s*(kg|kgs|ton|tons)/i);
        if (match) parsedQty = Number(match[1]);
        else parsedQty = 100;
      }

      const origQty = row.originalQuantity !== undefined ? Number(row.originalQuantity) : parsedQty;
      const soldQty = Number(row.soldQuantity || row.sold_quantity || 0);
      const remQty = row.remainingQuantity !== undefined ? Number(row.remainingQuantity) : (row.remaining_quantity !== undefined ? Number(row.remaining_quantity) : Math.max(1, origQty - soldQty));
      const isCompletelySold = (remQty <= 0) || row.status === 'sold';

      let images: string[] = [];
      if (metaJson?.images && Array.isArray(metaJson.images) && metaJson.images.length > 0) {
        images = metaJson.images;
      } else if (row.images && Array.isArray(row.images) && row.images.length > 0) {
        images = row.images;
      } else if (metaJson?.url && typeof metaJson.url === 'string') {
        images = [metaJson.url];
      } else if (row.image_url && typeof row.image_url === 'string' && row.image_url.startsWith('http')) {
        images = [row.image_url];
      } else {
        images = [
          "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80"
        ];
      }

      const category = metaJson?.category || row.category || inferCategoryFromTitle(row.title);
      const unit = metaJson?.unit || row.unit || 'Kgs';

      return {
        id: row.id,
        title: row.title,
        category: category,
        subcategory: metaJson?.subcategory || row.subcategory,
        description: metaJson?.description || row.description || '',
        location,
        images: images,
        pricePerUnit: Number(row.price || row.pricePerUnit || 0),
        unit: unit,
        currency: row.currency || '₹',
        totalQuantity: remQty,
        originalQuantity: origQty,
        soldQuantity: soldQty,
        remainingQuantity: remQty,
        totalEstimatedValue: Number(row.price || row.pricePerUnit || 0) * remQty,
        minPurchaseQuantity: row.min_purchase_quantity || row.minPurchaseQuantity || 1,
        isPriceNegotiable: row.price_type ? row.price_type !== 'Fixed' : (row.isPriceNegotiable ?? true),
        priceType: row.price_type || row.priceType || 'Fixed',
        brand: metaJson?.brand || row.brand,
        modelCode: row.model_code || row.modelCode,
        manufacturingYear: row.manufacturing_year || row.manufacturingYear,
        condition: metaJson?.condition || row.condition || 'Good',
        aiSuggestions: row.ai_suggestions || row.aiSuggestions,
        materialType: metaJson?.material_type || row.material_type || row.materialType,
        recyclability: row.recyclability,
        reusability: row.reusability,
        wasteCategory: category,
        hazardousMaterial: metaJson?.hazardous_material || row.hazardous_material || row.hazardousMaterial,
        bulkPurchaseAllowed: row.bulk_purchase_allowed || row.bulkPurchaseAllowed,
        bulkPrice: row.bulk_price ? Number(row.bulk_price) : (row.bulkPrice ? Number(row.bulkPrice) : undefined),
        startDate: row.start_date || row.startDate,
        deadline: row.deadline,
        preferredBuyer: row.preferred_buyer || row.preferredBuyer,
        transactionType: row.transaction_type || row.transactionType,
        seller: sellerInfo,
        buyer: row.buyer,
        purchaseHistory: row.purchaseHistory || [],
        interestedBuyers: row.interestedBuyers || [],
        listedDate: row.created_at || row.listedDate || 'Today',
        viewCount: row.viewCount || 0,
        status: isCompletelySold ? 'sold' : (row.status || 'available'),
      };
    }));

    return listings.filter((l) => l.status !== 'sold' && (l.remainingQuantity === undefined || l.remainingQuantity > 0));
  } catch (err) {
    console.error("Error mapping active listings:", err);
    return [];
  }
}

