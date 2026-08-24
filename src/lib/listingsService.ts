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

export async function uploadListingImages(files: File[], userId: string): Promise<string[]> {
  if (!isLiveSupabaseConfigured || !supabase) {
    // Return fake URLs for local simulation
    return files.map(file => URL.createObjectURL(file));
  }

  const uploadedUrls: string[] = [];

  for (const file of files) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('listing_images')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    if (data) {
      const { data: publicUrlData } = supabase.storage
        .from('listing_images')
        .getPublicUrl(fileName);
      uploadedUrls.push(publicUrlData.publicUrl);
    }
  }

  return uploadedUrls;
}

export async function createWasteListing(listingData: any): Promise<{ data?: any, error?: string }> {
  const newId = `lst-${Date.now()}`;
  const now = new Date().toISOString();
  const simulatedRow = {
    id: newId,
    created_at: now,
    updated_at: now,
    status: 'available',
    ...listingData,
  };

  // Always store in local storage so it persists even in simulation mode
  const existingListings = getStoredListings();
  saveStoredListings([simulatedRow, ...existingListings]);

  if (!isLiveSupabaseConfigured || !supabase) {
    return { data: simulatedRow };
  }

  try {
    const { data, error } = await supabase
      .from('waste_listings')
      .insert([listingData])
      .select()
      .single();

    if (error) {
      console.warn('Supabase insert error, falling back to local storage:', error.message);
      return { data: simulatedRow };
    }
    return { data };
  } catch (err: any) {
    return { data: simulatedRow };
  }
}

export async function updateWasteListing(id: string, listingData: any): Promise<{ data?: any, error?: string }> {
  const existingListings = getStoredListings();
  const updatedListings = existingListings.map(item => 
    item.id === id ? { ...item, ...listingData, updated_at: new Date().toISOString() } : item
  );
  saveStoredListings(updatedListings);

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

    if (error) return { error: error.message };
    return { data };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteWasteListing(id: string): Promise<{ success?: boolean, error?: string }> {
  const existingListings = getStoredListings();
  saveStoredListings(existingListings.filter(item => item.id !== id));

  if (!isLiveSupabaseConfigured || !supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('waste_listings')
      .delete()
      .eq('id', id);

    if (error) return { error: error.message };
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function fetchActiveListings(): Promise<WasteListing[]> {
  let dbRows: any[] = [];

  if (isLiveSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('waste_listings')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbRows = data;
      }
    } catch (err) {
      console.error("Error fetching listings from Supabase:", err);
    }
  }

  const simulatedRows = getStoredListings().filter((r: any) => r.status === 'available');
  
  // Deduplicate rows by ID (giving priority to Supabase row if exists)
  const rowMap = new Map<string, any>();
  for (const r of dbRows) {
    if (r && r.id) rowMap.set(r.id, r);
  }
  for (const r of simulatedRows) {
    if (r && r.id && !rowMap.has(r.id)) rowMap.set(r.id, r);
  }

  const allRows = Array.from(rowMap.values());

  try {
    // Map DB/local rows to WasteListing frontend interface
    const listings = await Promise.all(allRows.map(async (row: any): Promise<WasteListing> => {
      
      let sellerName = row.seller_name || 'Seller';
      let sellerCompany = row.seller_company || 'Business';
      let sellerEmail = row.seller_email || '';

      if (isLiveSupabaseConfigured && supabase && row.seller_id) {
        const { data: indProfile } = await supabase
          .from('individual_profiles')
          .select('full_name, email')
          .eq('auth_user_id', row.seller_id)
          .single();

        if (indProfile) {
          sellerName = indProfile.full_name;
          sellerCompany = indProfile.full_name;
          sellerEmail = indProfile.email;
        } else {
          const { data: busProfile } = await supabase
            .from('business_profiles')
            .select('full_name, business_name, email')
            .eq('auth_user_id', row.seller_id)
            .single();
          if (busProfile) {
            sellerName = busProfile.full_name;
            sellerCompany = busProfile.business_name;
            sellerEmail = busProfile.email;
          }
        }
      }

      if (sellerName === 'Seller' && row.seller_id) {
        const storedProfiles = getStoredProfiles();
        const profileMatch = storedProfiles.find(p => p.auth_user_id === row.seller_id);
        if (profileMatch) {
          sellerName = profileMatch.full_name;
          sellerCompany = (profileMatch as any).business_name || profileMatch.full_name;
          sellerEmail = profileMatch.email;
        }
      }

      const sellerInfo: WasteSellerInfo = {
        id: row.seller_id || row.seller?.id || 'seller-1',
        name: sellerName,
        company: sellerCompany,
        location: `${row.location_city || ''}, ${row.location_state || ''}`.replace(/^, | ,$/, ''),
        contactEmail: sellerEmail,
      };

      const location: WasteListingLocation = {
        city: row.location_city || row.location?.city || '',
        stateOrCountry: row.location_state || row.location_country || row.location?.stateOrCountry || '',
        coordinates: (row.location_lat && row.location_lng) ? {
          lat: row.location_lat,
          lng: row.location_lng
        } : undefined
      };

      return {
        id: row.id,
        title: row.title,
        category: row.category,
        subcategory: row.subcategory,
        description: row.description || '',
        location,
        images: row.images || [],
        pricePerUnit: Number(row.price || row.pricePerUnit || 0),
        unit: row.unit || 'Ton',
        currency: row.currency || '₹',
        totalQuantity: row.remainingQuantity !== undefined ? row.remainingQuantity : Number(row.quantity || row.totalQuantity || 0),
        originalQuantity: row.originalQuantity ?? Number(row.quantity || row.totalQuantity || 0),
        soldQuantity: row.soldQuantity ?? 0,
        remainingQuantity: row.remainingQuantity ?? Math.max(0, (row.originalQuantity ?? Number(row.quantity || row.totalQuantity || 0)) - (row.soldQuantity ?? 0)),
        totalEstimatedValue: Number(row.price || row.pricePerUnit || 0) * Number(row.quantity || row.totalQuantity || 0),
        minPurchaseQuantity: row.min_purchase_quantity || row.minPurchaseQuantity || 1,
        isPriceNegotiable: row.price_type ? row.price_type !== 'Fixed' : (row.isPriceNegotiable ?? true),
        priceType: row.price_type || row.priceType || 'Fixed',
        brand: row.brand,
        modelCode: row.model_code || row.modelCode,
        manufacturingYear: row.manufacturing_year || row.manufacturingYear,
        condition: row.condition || 'Good',
        aiSuggestions: row.ai_suggestions || row.aiSuggestions,
        materialType: row.material_type || row.materialType,
        recyclability: row.recyclability,
        reusability: row.reusability,
        wasteCategory: row.waste_category || row.wasteCategory,
        hazardousMaterial: row.hazardous_material || row.hazardousMaterial,
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
        status: (row.remainingQuantity !== undefined && row.remainingQuantity <= 0) ? 'sold' : (row.status || 'available'),
      };
    }));

    return listings;
  } catch (err) {
    console.error("Error mapping active listings:", err);
    return [];
  }
}

