import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Upload,
  X,
  Bot,
  MapPin,
  Sparkles,
  CheckCircle2,
  Calendar,
  Recycle,
  ChevronRight,
  User,
  IndianRupee,
  Image as ImageIcon,
  ArrowRight,
  Truck
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { AuthView, WasteListing } from "../types";
import {
  uploadListingImages,
  createWasteListing,
  updateWasteListing
} from "../lib/listingsService";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface SellPageProps {
  onNavigate: (view: AuthView | "back") => void;
  initialListing?: WasteListing | null;
}

export const SellPage: React.FC<SellPageProps> = ({
  onNavigate,
  initialListing,
}) => {
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Draft Data
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(initialListing?.images || []); 
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  
  const [title, setTitle] = useState(initialListing?.title || "");
  const [category, setCategory] = useState(initialListing?.category || "");
  const [otherCategory, setOtherCategory] = useState("");
  const [subcategory, setSubcategory] = useState(initialListing?.subcategory || "");
  const [material, setMaterial] = useState(initialListing?.materialType || "");
  const [condition, setCondition] = useState(initialListing?.condition || "");
  const [description, setDescription] = useState(initialListing?.description || "");
  const [quantity, setQuantity] = useState(initialListing ? String(initialListing.totalQuantity) : "");
  const [unit, setUnit] = useState(initialListing?.unit || "Tonnes");
  const [brand, setBrand] = useState(initialListing?.brand || "");
  const [modelCode, setModelCode] = useState(initialListing?.modelCode || "");
  
  const [price, setPrice] = useState(initialListing ? String(initialListing.pricePerUnit) : "");
  const [bulkPurchaseAllowed, setBulkPurchaseAllowed] = useState(initialListing?.bulkPurchaseAllowed || false);
  const [bulkPrice, setBulkPrice] = useState(initialListing?.bulkPrice ? String(initialListing.bulkPrice) : "");
  
  const [listingStartDate, setListingStartDate] = useState(initialListing?.startDate ? initialListing.startDate.split("T")[0] : new Date().toISOString().split("T")[0]);
  
  const [city, setCity] = useState(initialListing?.location.city || "");
  const [state, setState] = useState(initialListing?.location.stateOrCountry || "");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState(initialListing?.location.pincode || "");
  const [deliveryOption, setDeliveryOption] = useState(initialListing?.transactionType || "Both"); 
  const [preferredBuyer, setPreferredBuyer] = useState(initialListing?.preferredBuyer || "Both");
  
  const [aiSuggestions, setAiSuggestions] = useState<any>(initialListing?.aiSuggestions || null);
  const [aiInsights, setAiInsights] = useState(initialListing?.aiSuggestions?.whatCanIDoWithThis || "");
  const [recyclability, setRecyclability] = useState(initialListing?.recyclability || "");
  const [reusability, setReusability] = useState(initialListing?.reusability || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  type FieldOrigin = 'seller' | 'ai' | null;
  const [fieldOrigins, setFieldOrigins] = useState<Record<string, FieldOrigin>>({
    title: null,
    category: null,
    subcategory: null,
    material: null,
    condition: null,
    description: null,
    price: null,
    brand: null,
    modelCode: null,
  });

  useEffect(() => {
    if (category === 'E-Waste') {
      setUnit('Pieces');
    }
  }, [category]);

  const categories = [
    "Scrap Metal",
    "Industrial Plastics",
    "Chemical Byproducts",
    "E-Waste",
    "Textiles & Fibers",
    "Construction & Demolition",
    "Rubber & Tyres",
    "Organic / Bio Waste",
    "Other",
  ];

  const updateField = (setter: React.Dispatch<React.SetStateAction<any>>, fieldName: string, value: any) => {
    setter(value);
    setFieldOrigins(prev => ({ ...prev, [fieldName]: 'seller' }));
  };

  const clearAiSuggestions = () => {
    setAiSuggestions(null);
    setAiInsights("");
    setRecyclability("");
    setReusability("");
    setFieldOrigins({
      title: null,
      category: null,
      subcategory: null,
      material: null,
      condition: null,
      description: null,
      price: null,
      brand: null,
      modelCode: null,
    });
    // Don't clear seller-entered data, but if it was AI, we could optionally clear it.
    // For now, we'll just clear the AI state so the UI doesn't look like AI is overriding.
  };

  const handleUseProfileLocation = () => {
    if (profile) {
      if (profile.city) setCity(profile.city);
      if (profile.state) setState(profile.state);
      if (profile.country) setCountry(profile.country);
      if (profile.pincode) setPincode(profile.pincode);
    } else {
      alert("Profile location data not found.");
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          if (data.city) setCity(data.city);
          if (data.principalSubdivision) setState(data.principalSubdivision);
          if (data.countryName) setCountry(data.countryName);
        } catch (err) {
          console.error("Location fetch failed", err);
          alert("Failed to fetch location details.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        alert("Location access denied or unavailable.");
      }
    );
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files) as File[];
      if (images.length + imageUrls.length + newFiles.length > 8) {
        alert("Maximum 8 images allowed");
        return;
      }
      setImages((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setImageUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    if (index >= (imageUrls.length - images.length)) {
      const fileIndex = index - (imageUrls.length - images.length);
      setImages(prev => prev.filter((_, i) => i !== fileIndex));
    }
    if (primaryImageIndex === index) setPrimaryImageIndex(0);
    else if (primaryImageIndex > index) setPrimaryImageIndex(prev => prev - 1);
  };

  const triggerAIAnalysis = async () => {
    if (images.length === 0 && imageUrls.length === 0) {
      alert("Please upload an image first.");
      return;
    }
    setIsAnalyzing(true);
    setCurrentStep(2); 

    try {
      let base64Image = "";
      if (images.length > 0) {
        const file = images[0];
        const reader = new FileReader();
        base64Image = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      }
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key missing");

      const genAI = new GoogleGenerativeAI(apiKey);

      const prompt = `Analyze this industrial waste item for a B2B marketplace.
Return ONLY a strictly valid JSON object without markdown formatting, with these keys:
{
  "title": "Clear, professional name of the waste",
  "category": "Must be exactly one of: Scrap Metal, Industrial Plastics, Chemical Byproducts, E-Waste, Textiles & Fibers, Construction & Demolition, Rubber & Tyres, Organic / Bio Waste, Other",
  "subcategory": "More specific type",
  "brand": "Extract if category is E-Waste or equipment (otherwise empty string)",
  "modelCode": "Extract if category is E-Waste or equipment (otherwise empty string)",
  "material": "Primary material composition",
  "condition": "Must be exactly one of: New, Good, Fair, Mixed, Processed",
  "description": "2-3 sentences describing the potential value",
  "recyclability": "High/Medium/Low with short reason",
  "reusability": "High/Medium/Low with short reason",
  "suggestedPriceRange": "Number range in INR per Tonne/Kg",
  "tags": ["tag1", "tag2"],
  "potentialBuyers": "Types of businesses that would buy this",
  "whatCanIDoWithThis": "Bullet points on second-life applications"
}`;

      let result;
      const modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-pro-latest"];
      let lastError;

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          if (base64Image) {
            const base64Data = base64Image.split(",")[1];
            result = await model.generateContent([
              prompt,
              { inlineData: { data: base64Data, mimeType: images[0].type } }
            ]);
          } else {
            result = await model.generateContent(prompt);
          }
          // If successful, break out of the loop
          break;
        } catch (e: any) {
          lastError = e;
          console.warn(`Model ${modelName} failed:`, e.message);
          // Only continue to the next model if it's a 503 or 404
          if (!e.message.includes("503") && !e.message.includes("404")) {
            throw e;
          }
        }
      }

      if (!result) {
        throw lastError || new Error("All fallback models failed.");
      }

      const responseText = result.response.text();
      let cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const startIndex = cleanedJson.indexOf('{');
      const endIndex = cleanedJson.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        cleanedJson = cleanedJson.substring(startIndex, endIndex + 1);
      }
      const parsed = JSON.parse(cleanedJson);

      setAiSuggestions(parsed);
      
      if (!title) { setTitle(parsed.title); setFieldOrigins(p => ({...p, title: 'ai'})); }
      if (!category && categories.includes(parsed.category)) { setCategory(parsed.category); setFieldOrigins(p => ({...p, category: 'ai'})); }
      if (!subcategory) { setSubcategory(parsed.subcategory); setFieldOrigins(p => ({...p, subcategory: 'ai'})); }
      if (!brand && parsed.brand) { setBrand(parsed.brand); setFieldOrigins(p => ({...p, brand: 'ai'})); }
      if (!modelCode && parsed.modelCode) { setModelCode(parsed.modelCode); setFieldOrigins(p => ({...p, modelCode: 'ai'})); }
      if (!material) { setMaterial(parsed.material); setFieldOrigins(p => ({...p, material: 'ai'})); }
      if (!condition) { setCondition(parsed.condition); setFieldOrigins(p => ({...p, condition: 'ai'})); }
      if (!description) { setDescription(parsed.description); setFieldOrigins(p => ({...p, description: 'ai'})); }
      
      setRecyclability(parsed.recyclability);
      setReusability(parsed.reusability);
      setAiInsights(parsed.whatCanIDoWithThis);
      
    } catch (err: any) {
      console.error("AI Analysis failed:", err);
      alert("AI Analysis failed. Please fill the details manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePublish = async () => {
    if (!price || parseFloat(price) < 1) {
      alert("Selling price must be at least ₹1.");
      return;
    }
    if (!user) return alert("Must be logged in.");
    if (!title || !category || !quantity || !unit || !price) {
      return alert("Please fill all required fields (Title, Category, Quantity, Unit, Price).");
    }

    setIsSubmitting(true);
    try {
      let uploadedUrls: string[] = [];
      if (images.length > 0) {
        uploadedUrls = await uploadListingImages(images, user.id);
      }
      
      const finalImages = [...(initialListing?.images || []), ...uploadedUrls];
      if (finalImages.length > 0 && primaryImageIndex > 0 && primaryImageIndex < finalImages.length) {
        const primary = finalImages.splice(primaryImageIndex, 1)[0];
        finalImages.unshift(primary);
      }

      const listingData = {
        seller_id: user.id,
        title,
        category: category === "Other" ? otherCategory : category,
        subcategory,
        material_type: material,
        description,
        quantity: parseFloat(quantity),
        unit,
        condition,
        images: finalImages.length > 0 ? finalImages : [
          "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80"
        ],
        ai_suggestions: aiSuggestions || {},
        recyclability,
        reusability,
        price: parseFloat(price),
        currency: "₹",
        price_type: "Fixed",
        brand,
        model_code: modelCode,
        min_acceptable_price: null,
        bulk_purchase_allowed: bulkPurchaseAllowed,
        bulk_price: bulkPrice ? parseFloat(bulkPrice) : null,
        start_date: listingStartDate,
        deadline: null,
        location_city: city,
        location_state: state,
        location_country: country,
        location_pincode: pincode,
        preferred_buyer: preferredBuyer,
        transaction_type: deliveryOption,
        status: 'available'
      };

      if (initialListing?.id) {
        await updateWasteListing(initialListing.id, listingData);
      } else {
        await createWasteListing(listingData);
      }
      
      onNavigate("back");
    } catch (err) {
      console.error("Failed to publish:", err);
      alert("Failed to publish listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const FieldLabel = ({ label, isAi, required = false }: { label: string, isAi?: boolean, required?: boolean }) => (
    <div className="flex items-center justify-between mb-1.5">
      <label className="block text-sm font-semibold text-neutral-800">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {isAi && (
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
          <Sparkles className="w-3 h-3" /> AI Suggested
        </span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate("back")}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-neutral-900">
                {initialListing ? "Edit Listing" : "Create Listing"}
              </h1>
              <p className="text-xs text-emerald-600 font-medium">Give your item a second life</p>
            </div>
          </div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['Upload', 'Analysis & Details', 'Pricing & Location', 'Review & Upload'].map((step, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isPast = currentStep > stepNum;
            return (
              <React.Fragment key={step}>
                <div className={`flex items-center gap-2 shrink-0 ${isActive ? 'text-emerald-700' : isPast ? 'text-neutral-900' : 'text-neutral-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive ? 'bg-emerald-100' : isPast ? 'bg-neutral-100' : 'bg-neutral-100'
                  }`}>
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : `0${stepNum}`}
                  </div>
                  <span className="text-sm font-semibold">{step}</span>
                </div>
                {stepNum < 4 && <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 h-[calc(100vh-140px)] flex flex-col">
        {currentStep === 1 && (
          <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-2xl font-extrabold text-neutral-900">Upload Product Images</h2>
              <p className="text-neutral-500 text-sm">Upload up to 8 high-quality images. AI will analyze the first image to help you fill the form.</p>
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60 transition-colors rounded-3xl p-8 text-center cursor-pointer flex flex-col items-center justify-center min-h-[250px]"
            >
              <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center text-emerald-600 mb-3">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Drag & Drop or Click to Upload</h3>
              <p className="text-xs text-neutral-500 mt-1">Supports JPG, PNG, WEBP (Max 8 images)</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-4">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className={`relative rounded-xl overflow-hidden aspect-square border-2 ${primaryImageIndex === idx ? 'border-emerald-500' : 'border-neutral-200'}`}>
                    <img src={url} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                    <div className="absolute inset-0 bg-neutral-900/10 hover:bg-neutral-900/30 transition-colors" />
                    <button onClick={(e) => { e.stopPropagation(); removeImage(idx); }} className="absolute top-1 right-1 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-rose-500 hover:bg-white shadow-sm cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                    {primaryImageIndex === idx && (
                      <div className="absolute bottom-1 left-1 right-1 py-1 bg-emerald-500 text-[9px] font-bold text-white rounded shadow-sm text-center">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-6 mt-auto">
              <button
                onClick={triggerAIAnalysis}
                disabled={imageUrls.length === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer text-sm"
              >
                Continue with AI Analysis <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && isAnalyzing && (
          <div className="flex flex-col items-center justify-center flex-1 animate-in fade-in duration-500">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-70"></div>
              <div className="relative w-full h-full bg-white border border-emerald-100 shadow-xl rounded-full flex items-center justify-center text-emerald-600 z-10">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-neutral-900">EcoLoop AI is analyzing your item</h2>
            <p className="text-sm text-neutral-500 mt-2">Extracting material, condition, and recyclability...</p>
            <div className="w-full max-w-sm mt-8 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-neutral-100 rounded-xl animate-pulse"></div>)}
            </div>
          </div>
        )}

        {currentStep === 2 && !isAnalyzing && (
          <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
              
              {/* Left Column: Form */}
              <div className="flex-1 bg-white rounded-2xl p-5 shadow-xs border border-neutral-200 overflow-hidden">
                <h2 className="text-lg font-bold text-neutral-900 mb-4">Item Details</h2>
                
                <div className="space-y-4">
                  {/* Row 1: Title */}
                  <div>
                    <FieldLabel label="Item Name" isAi={fieldOrigins.title === 'ai'} required />
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => updateField(setTitle, 'title', e.target.value)}
                      placeholder="e.g., Industrial Aluminum Scrap"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Row 2: Grid for properties */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <FieldLabel label="Category" isAi={fieldOrigins.category === 'ai'} required />
                      <select
                        value={category}
                        onChange={(e) => updateField(setCategory, 'category', e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white outline-none"
                      >
                        <option value="" disabled>Select category</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    {category === "Other" ? (
                      <div className="col-span-2">
                        <FieldLabel label="Specify Category" required />
                        <input
                          type="text"
                          value={otherCategory}
                          onChange={(e) => setOtherCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white outline-none"
                        />
                      </div>
                    ) : (
                      <div className="col-span-2">
                        <FieldLabel label="Subcategory" isAi={fieldOrigins.subcategory === 'ai'} />
                        <input
                          type="text"
                          value={subcategory}
                          onChange={(e) => updateField(setSubcategory, 'subcategory', e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white outline-none"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Row 3: Grid 2 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel label="Primary Material" isAi={fieldOrigins.material === 'ai'} />
                      <input
                        type="text"
                        value={material}
                        onChange={(e) => updateField(setMaterial, 'material', e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <FieldLabel label="Condition" isAi={fieldOrigins.condition === 'ai'} required />
                      <select
                        value={condition}
                        onChange={(e) => updateField(setCondition, 'condition', e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white outline-none"
                      >
                        <option value="" disabled>Select condition</option>
                        <option value="New">New / Unused</option>
                        <option value="Good">Good / Reusable</option>
                        <option value="Fair">Fair / Requires Processing</option>
                        <option value="Mixed">Mixed Quality</option>
                        <option value="Processed">Processed / Shredded</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 4: E-Waste Conditionals */}
                  {category === "E-Waste" && (
                    <div className="grid grid-cols-2 gap-4 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      <div>
                        <FieldLabel label="Brand" isAi={fieldOrigins.brand === 'ai'} />
                        <input
                          type="text"
                          value={brand}
                          onChange={(e) => updateField(setBrand, 'brand', e.target.value)}
                          placeholder="e.g., Dell, Apple"
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:bg-white outline-none"
                        />
                      </div>
                      <div>
                        <FieldLabel label="Model" isAi={fieldOrigins.modelCode === 'ai'} />
                        <input
                          type="text"
                          value={modelCode}
                          onChange={(e) => updateField(setModelCode, 'modelCode', e.target.value)}
                          placeholder="e.g., Latitude 5420"
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:bg-white outline-none"
                        />
                      </div>
                    </div>
                  )}



                  {/* Row 5: Description */}
                  <div>
                    <FieldLabel label="Description" isAi={fieldOrigins.description === 'ai'} />
                    <textarea
                      value={description}
                      onChange={(e) => updateField(setDescription, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm h-12 focus:bg-white outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: AI Insights */}
              <div className="lg:w-80 shrink-0 bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-2xl p-5 shadow-xl text-white relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
                <div className="relative z-10 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-base font-extrabold flex items-center gap-2">
                      <Recycle className="w-5 h-5 text-emerald-400" /> What Can I Do With This?
                    </h2>
                    {aiSuggestions && (
                      <button onClick={clearAiSuggestions} className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-white cursor-pointer transition-colors">Clear AI</button>
                    )}
                  </div>
                  <div className="text-emerald-50 text-xs leading-relaxed whitespace-pre-line font-medium overflow-hidden flex-1 mb-4">
                    {aiInsights || "AI couldn't generate specific insights, but this material is highly valuable in secondary markets."}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-emerald-700/50 mt-auto">
                    <div>
                      <div className="text-emerald-300 text-[9px] font-bold uppercase tracking-wider mb-0.5">Recyclability</div>
                      <div className="font-semibold text-sm">{recyclability || "Unknown"}</div>
                    </div>
                    <div>
                      <div className="text-emerald-300 text-[9px] font-bold uppercase tracking-wider mb-0.5">Reusability</div>
                      <div className="font-semibold text-sm">{reusability || "Unknown"}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            
            <div className="flex justify-between pt-4 mt-auto">
              <button onClick={() => setCurrentStep(1)} className="px-5 py-2.5 font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer text-sm">Back</button>
              <button onClick={() => setCurrentStep(3)} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm">Next Step</button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-neutral-200 flex-1 overflow-hidden">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Left Side: Pricing & Deadline */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-neutral-400" /> Pricing Structure
                    </h2>
                    
                    {aiSuggestions?.suggestedPriceRange && (
                      <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <p className="text-xs text-emerald-800 font-medium">
                          <Sparkles className="w-3 h-3 inline mr-1 text-emerald-600" />
                          AI Rate: <strong className="font-extrabold">{aiSuggestions.suggestedPriceRange}</strong>
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <FieldLabel label="Quantity" required />
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white outline-none"
                        />
                      </div>
                      <div>
                        <FieldLabel label="Unit" required />
                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white outline-none"
                        >
                          <option value="Tonnes">Tonnes (t)</option>
                          <option value="Kg">Kilograms (kg)</option>
                          <option value="Pounds">Pounds (lbs)</option>
                          <option value="Pieces">Pieces / Items</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <FieldLabel label={`Selling Price (per ${unit})`} isAi={fieldOrigins.price === 'ai'} required />
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-neutral-500 font-semibold text-sm">₹</span>
                          </div>
                          <input
                            type="number"
                            min="1"
                            value={price}
                            onChange={(e) => updateField(setPrice, 'price', e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-semibold focus:bg-white outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <hr className="border-neutral-100" />
                  
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-neutral-400" /> Logistics Option
                    </h2>
                    
                    <div>
                      <FieldLabel label="Logistics Option" />
                      <select
                        value={deliveryOption}
                        onChange={(e) => setDeliveryOption(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white outline-none"
                      >
                        <option value="Both">Buyer Pickup or Seller Delivery</option>
                        <option value="Pickup">Buyer MUST arrange Pickup (Recommended for Bulk)</option>
                        <option value="Delivery">Seller will handle Delivery (Requires transport fee)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Side: Location */}
                <div className="space-y-6 lg:border-l lg:border-neutral-100 lg:pl-8">
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-neutral-400" /> Location Details
                    </h2>

                    <div className="mb-5 flex flex-wrap gap-2">
                      <button onClick={handleUseProfileLocation} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer">
                        <User className="w-3 h-3" /> Use from profile
                      </button>
                      <button onClick={handleUseCurrentLocation} disabled={isLocating} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                        <MapPin className="w-3 h-3" /> {isLocating ? "Locating..." : "Use current location"}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <FieldLabel label="City" required />
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white outline-none"
                        />
                      </div>
                      <div>
                        <FieldLabel label="State" required />
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white outline-none"
                        />
                      </div>
                      <div>
                        <FieldLabel label="Country" required />
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <FieldLabel label="Pincode" required />
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            
            <div className="flex justify-between pt-4 mt-auto">
              <button onClick={() => setCurrentStep(2)} className="px-5 py-2.5 font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer text-sm">Back</button>
              <button onClick={() => setCurrentStep(4)} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm">Review Details</button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-neutral-200 max-w-2xl mx-auto w-full">
              <h2 className="text-xl font-bold text-neutral-900 mb-5">Review Listing</h2>
              
              <div className="flex gap-5 mb-6">
                {imageUrls[0] && (
                  <img src={imageUrls[0]} alt="Primary" className="w-20 h-20 rounded-xl object-cover border border-neutral-200 shadow-sm" />
                )}
                <div>
                  <h3 className="text-lg font-extrabold text-neutral-900">{title}</h3>
                  <p className="text-xs text-neutral-500 mt-1">{category} {subcategory ? `• ${subcategory}` : ''}</p>
                  {brand && <p className="text-[10px] text-neutral-400 mt-1">{brand} {modelCode}</p>}
                  <div className="text-base font-bold text-emerald-700 mt-2">₹{price} <span className="text-xs text-neutral-500 font-semibold">/ {unit}</span></div>
                </div>
              </div>
              
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Quantity</span>
                    <span className="font-semibold text-neutral-900">{quantity} {unit}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Condition</span>
                    <span className="font-semibold text-neutral-900">{condition}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Location</span>
                    <span className="font-semibold text-neutral-900">{city}, {state}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 mt-auto max-w-2xl mx-auto w-full">
              <button onClick={() => setCurrentStep(3)} className="px-5 py-2.5 font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer text-sm">Back to Edit</button>
              <button 
                onClick={handlePublish}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer text-sm"
              >
                {isSubmitting ? "Publishing..." : "Publish Listing"}
              </button>
            </div>
          </div>
        )}
      </main>

    </div>
  );
};
