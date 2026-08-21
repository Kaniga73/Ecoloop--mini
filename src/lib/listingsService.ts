import { supabase, isLiveSupabaseConfigured } from './supabase';
import { WasteListing, WasteListingLocation, WasteSellerInfo } from '../types';

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
  if (!isLiveSupabaseConfigured || !supabase) {
    // Simulate network delay and return success
    return new Promise(resolve => setTimeout(() => resolve({ data: { id: `simulated-${Date.now()}` } }), 1000));
  }

  try {
    const { data, error } = await supabase
      .from('waste_listings')
      .insert([listingData])
      .select()
      .single();

    if (error) return { error: error.message };
    return { data };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateWasteListing(id: string, listingData: any): Promise<{ data?: any, error?: string }> {
  if (!isLiveSupabaseConfigured || !supabase) {
    return new Promise(resolve => setTimeout(() => resolve({ data: { id } }), 500));
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
  if (!isLiveSupabaseConfigured || !supabase) {
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 500));
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
  if (!isLiveSupabaseConfigured || !supabase) {
    return []; // Return empty if no supabase, LandingPage falls back to mock
  }

  try {
    const { data, error } = await supabase
      .from('waste_listings')
      .select('*')
      .eq('status', 'available')
      .gte('deadline', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching listings:", error);
      return [];
    }

    // Map DB rows to WasteListing frontend interface
    const listings = await Promise.all((data || []).map(async (row: any): Promise<WasteListing> => {
      
      // Fetch seller info from profiles
      let sellerName = 'Seller';
      let sellerCompany = 'Business';
      let sellerEmail = '';

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

      const sellerInfo: WasteSellerInfo = {
        id: row.seller_id,
        name: sellerName,
        company: sellerCompany,
        location: `${row.location_city || ''}, ${row.location_state || ''}`.replace(/^, | ,$/, ''),
        contactEmail: sellerEmail,
      };

      const location: WasteListingLocation = {
        city: row.location_city || '',
        stateOrCountry: row.location_state || row.location_country || '',
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
        description: row.description,
        location,
        images: row.images || [],
        pricePerUnit: Number(row.price),
        unit: row.unit,
        currency: row.currency,
        totalQuantity: Number(row.quantity),
        totalEstimatedValue: Number(row.price) * Number(row.quantity),
        minPurchaseQuantity: 1, // Defaulting as it's not strictly in schema
        isPriceNegotiable: row.price_type !== 'Fixed',
        priceType: row.price_type,
        brand: row.brand,
        modelCode: row.model_code,
        manufacturingYear: row.manufacturing_year,
        condition: row.condition,
        aiSuggestions: row.ai_suggestions,
        materialType: row.material_type,
        recyclability: row.recyclability,
        reusability: row.reusability,
        wasteCategory: row.waste_category,
        hazardousMaterial: row.hazardous_material,
        bulkPurchaseAllowed: row.bulk_purchase_allowed,
        bulkPrice: row.bulk_price ? Number(row.bulk_price) : undefined,
        startDate: row.start_date,
        deadline: row.deadline,
        preferredBuyer: row.preferred_buyer,
        transactionType: row.transaction_type,
        seller: sellerInfo,
        listedDate: row.created_at,
        viewCount: 0,
        status: row.status,
      };
    }));

    return listings;
  } catch (err) {
    console.error("Error in fetchActiveListings:", err);
    return [];
  }
}
