import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, User, Eye, EyeOff, Mail, Phone, MapPin, Search, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Loader2, KeyRound, Building, Briefcase, Factory, Scale, Check, ShieldCheck, Map, Smartphone, FileText, Globe, Layers, Sparkles, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { EcoLoopLogo } from '../components/common/EcoLoopLogo';
import { CustomSelect } from '../components/common/CustomSelect';
import { AccountType, IndividualSignupData, BusinessSignupData } from '../types';

interface SignupPageProps {
  onNavigate: (view: 'login' | 'verify-email') => void;
  onSuccessToast?: (msg: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate, onSuccessToast }) => {
  const { signup, setPendingVerificationEmail } = useAuth();

  // Selected Account Type
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  // Current Step: 0 is "Select Account Type", then 1..N
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Shared Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');


  // Location Fields
  const [country, setCountry] = useState('India');
  const [stateName, setStateName] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  // Business Only Fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');

  // Agreement
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  // States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Individual: Step 0 (Type) -> Step 1 (Personal) -> Step 2 (Location) -> Step 3 (Agreement) = 3 form steps
  // Business: Step 0 (Type) -> Step 1 (Contact) -> Step 2 (Business Basics) -> Step 3 (Location) -> Step 4 (Agreement) = 4 form steps
  const totalSteps = accountType === 'business' ? 4 : 3;

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 0) {
      if (!accountType) {
        errs.accountType = 'Please select an account type to proceed.';
      }
    }

    if (accountType === 'individual') {
      if (step === 1) {
        if (!fullName.trim()) errs.fullName = 'Full name is required.';
        if (!email.trim()) {
          errs.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          errs.email = 'Please enter a valid email address.';
        }
        if (!phone.trim()) {
          errs.phone = 'Phone number is required.';
        } else if (phone.trim().length < 8) {
          errs.phone = 'Please enter a valid phone number.';
        }
      } else if (step === 2) {
        if (!country.trim()) errs.country = 'Country is required.';
        if (!stateName.trim()) errs.stateName = 'State / Region is required.';
        if (!city.trim()) errs.city = 'City is required.';
        if (!pincode.trim()) {
          errs.pincode = 'Pincode / Postal code is required.';
        } else if (pincode.trim().length < 3) {
          errs.pincode = 'Enter a valid pincode.';
        }
      } else if (step === 3) {
        if (!agreedTerms) errs.agreedTerms = 'You must agree to the Terms & Conditions.';
        if (!agreedPrivacy) errs.agreedPrivacy = 'You must agree to the Privacy Policy.';
      }
    } else if (accountType === 'business') {
      if (step === 1) {
        if (!fullName.trim()) errs.fullName = 'Contact full name is required.';
        if (!email.trim()) {
          errs.email = 'Official email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          errs.email = 'Please enter a valid email address.';
        }
        if (!phone.trim()) {
          errs.phone = 'Phone number is required.';
        } else if (phone.trim().length < 8) {
          errs.phone = 'Please enter a valid phone number.';
        }
      } else if (step === 2) {
        if (!businessName.trim()) errs.businessName = 'Business name is required.';
        if (!businessType.trim()) errs.businessType = 'Please select a business type.';
        if (!businessCategory.trim()) errs.businessCategory = 'Please select a business category.';
      } else if (step === 3) {
        if (!country.trim()) errs.country = 'Country is required.';
        if (!stateName.trim()) errs.stateName = 'State / Region is required.';
        if (!city.trim()) errs.city = 'City is required.';
        if (!pincode.trim()) {
          errs.pincode = 'Pincode / Postal code is required.';
        } else if (pincode.trim().length < 3) {
          errs.pincode = 'Enter a valid pincode.';
        }
      } else if (step === 4) {
        if (!agreedTerms) errs.agreedTerms = 'You must agree to the Terms & Conditions.';
        if (!agreedPrivacy) errs.agreedPrivacy = 'You must agree to the Privacy Policy.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    setServerError(null);
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setServerError(null);
    setErrors({});
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!validateStep(currentStep)) return;

    setLoading(true);
    setServerError(null);

    try {
      let payload: IndividualSignupData | BusinessSignupData;

      if (accountType === 'individual') {
        payload = {
          account_type: 'individual',
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          
          country: country.trim(),
          state: stateName.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
          agreed_terms: agreedTerms,
          agreed_privacy: agreedPrivacy,
        };
      } else {
        payload = {
          account_type: 'business',
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          business_name: businessName.trim(),
          business_type: businessType.trim(),
          business_category: businessCategory.trim(),
          
          country: country.trim(),
          state: stateName.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
          agreed_terms: agreedTerms,
          agreed_privacy: agreedPrivacy,
        };
      }

      const res = await signup(payload);

      if (res.success) {
        setPendingVerificationEmail(email.trim());
        if (onSuccessToast) {
          onSuccessToast('Account created! Please check your email for the OTP to sign in.');
        }
        onNavigate('login');
      } else {
        setServerError(res.error || 'Failed to create account.');
      }
    } catch (err: any) {
      setServerError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-[560px] mx-auto px-0 sm:px-2"
      id="signup-page-container"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06)] p-4 sm:p-5">
        {/* Header */}
        <div className="text-center mb-3">
          <div className="flex justify-center mb-3">
            <EcoLoopLogo size="md" />
          </div>
          <h1 className="text-[13px] sm:text-[13px] font-bold text-slate-900 tracking-normal font-sans tracking-normal">
            {currentStep === 0
              ? 'Join EcoLoop'
              : accountType === 'business'
              ? 'Create Business Account'
              : 'Create Individual Account'}
          </h1>
          <p className="text-[13px] sm:text-[13px] text-slate-500 mt-1">
            {currentStep === 0
              ? 'One account to buy, sell, and participate in circular trade.'
              : `Step ${currentStep} of ${totalSteps}`}
          </p>
        </div>

        {/* Multi-step progress bar (if step > 0) */}
        {currentStep > 0 && (
          <div className="mb-3" id="signup-step-progress">
            <div className="flex items-center justify-between text-[13px] font-semibold text-slate-500 mb-3">
              <span className="capitalize text-emerald-800 flex items-center gap-1">
                {accountType === 'business' ? <><Building2 className="w-4 h-4"/> Business Account</> : <><User className="w-4 h-4"/> Individual Account</>}
              </span>
              <span>
                {Math.round((currentStep / totalSteps) * 100)}% Completed
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-full flex-1 rounded-full transition-all duration-300 ${
                    idx + 1 <= currentStep ? 'bg-emerald-600' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Server Error Alert */}
        {serverError && (
          <div
            className="mb-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-[13px]"
            role="alert"
            id="signup-error-banner"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{serverError}</span>
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* STEP 0: SELECT ACCOUNT TYPE */}
          {currentStep === 0 && (
            <motion.div
              key="step-0-type"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 "
            >
              <div className="text-center mb-3">
                <h2 className="text-[13px] font-semibold text-slate-900">
                  How will you use EcoLoop?
                </h2>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Select your primary account profile. Both can buy & sell freely.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5" id="account-type-cards">
                {/* Individual Card */}
                <div
                  id="account-type-individual"
                  onClick={() => {
                    setAccountType('individual');
                    if (errors.accountType) setErrors({});
                  }}
                  className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer text-left flex items-start gap-4 ${
                    accountType === 'individual'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-600/10'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-[13px] shrink-0 ${
                      accountType === 'individual'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-[13px]">Individual</h3>
                      {accountType === 'individual' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">
                      Buy, sell and give products a second life. Perfect for personal sustainable commerce and C2C circular exchange.
                    </p>
                  </div>
                </div>

                {/* Business Card */}
                <div
                  id="account-type-business"
                  onClick={() => {
                    setAccountType('business');
                    if (errors.accountType) setErrors({});
                  }}
                  className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer text-left flex items-start gap-4 ${
                    accountType === 'business'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-600/10'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-[13px] shrink-0 ${
                      accountType === 'business'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-[13px]">Business</h3>
                      {accountType === 'business' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">
                      Source, sell and manage materials and products. Ideal for manufacturers, recyclers, traders and enterprises.
                    </p>
                  </div>
                </div>
              </div>

              {errors.accountType && (
                <p className="text-[13px] text-rose-600 font-medium text-center" id="account-type-error">
                  {errors.accountType}
                </p>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  id="account-type-continue-btn"
                  onClick={handleNext}
                  disabled={!accountType}
                  className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[13px] font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* INDIVIDUAL FLOW */}
          {accountType === 'individual' && currentStep === 1 && (
            <motion.div
              key="ind-step-1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 "
            >
              <div className="border-b border-slate-100 pb-2 mb-3">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-900">
                  Step 1 - Personal Information
                </h2>
                <p className="text-[13px] text-slate-500">Enter your basic personal contact details.</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="ind-fullname">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="ind-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                    placeholder="e.g. Alex Rivera"
                    className="w-full pl-10 pr-4 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                  />
                </div>
                {errors.fullName && <p className="text-[13px] text-rose-600 mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="ind-email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="ind-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="alex.rivera@example.com"
                    className="w-full pl-10 pr-4 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                  />
                </div>
                {errors.email && <p className="text-[13px] text-rose-600 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="ind-phone">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="ind-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder="+1 555-019-2834"
                    className="w-full pl-10 pr-4 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                  />
                </div>
                {errors.phone && <p className="text-[13px] text-rose-600 mt-1">{errors.phone}</p>}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-1.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-[13px] hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  id="ind-step1-next"
                  onClick={handleNext}
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13px] rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          

          {accountType === 'individual' && currentStep === 2 && (
            <motion.div
              key="ind-step-3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 "
            >
              <div className="border-b border-slate-100 pb-3 mb-3">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-900">
                  Step 2 - Location
                </h2>
                <p className="text-[13px] text-slate-500">Helps connect you with local and regional circular trade.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="ind-country">
                    Country
                  </label>
                  <input
                    id="ind-country"
                    type="text"
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      if (errors.country) setErrors((prev) => ({ ...prev, country: '' }));
                    }}
                    placeholder="e.g. India or United States"
                    className="w-full px-3.5 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                  />
                  {errors.country && <p className="text-[13px] text-rose-600 mt-1">{errors.country}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="ind-state">
                    State / Region
                  </label>
                  <input
                    id="ind-state"
                    type="text"
                    value={stateName}
                    onChange={(e) => {
                      setStateName(e.target.value);
                      if (errors.stateName) setErrors((prev) => ({ ...prev, stateName: '' }));
                    }}
                    placeholder="e.g. Maharashtra or California"
                    className="w-full px-3.5 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                  />
                  {errors.stateName && <p className="text-[13px] text-rose-600 mt-1">{errors.stateName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="ind-city">
                    City
                  </label>
                  <input
                    id="ind-city"
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                    }}
                    placeholder="e.g. Mumbai or San Francisco"
                    className="w-full px-3.5 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                  />
                  {errors.city && <p className="text-[13px] text-rose-600 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="ind-pincode">
                    Pincode / Postal Code
                  </label>
                  <input
                    id="ind-pincode"
                    type="text"
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value);
                      if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' }));
                    }}
                    placeholder="e.g. 400001 or 94107"
                    className="w-full px-3.5 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                  />
                  {errors.pincode && <p className="text-[13px] text-rose-600 mt-1">{errors.pincode}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-1.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-[13px] hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  id="ind-step2-next"
                  onClick={handleNext}
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13px] rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {accountType === 'individual' && currentStep === 3 && (
            <motion.div
              key="ind-step-4"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 "
            >
              <div className="border-b border-slate-100 pb-3 mb-3">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-900">
                  Step 3 - Agreement & Finalize
                </h2>
                <p className="text-[13px] text-slate-500">Please review and agree to EcoLoop terms to complete registration.</p>
              </div>

              {/* Review summary pill */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-[13px] space-y-3.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Account Type:</span>
                  <span className="font-semibold text-emerald-700">🌱 Individual Account</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Full Name:</span>
                  <span className="font-semibold text-slate-800">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="font-semibold text-slate-800">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Location:</span>
                  <span className="font-semibold text-slate-800">{city}, {stateName}, {country}</span>
                </div>
              </div>

              <div className="space-y-3.5 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-[13px] text-slate-700 select-none">
                  <input
                    id="ind-agree-terms"
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => {
                      setAgreedTerms(e.target.checked);
                      if (errors.agreedTerms) setErrors((prev) => ({ ...prev, agreedTerms: '' }));
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 accent-emerald-600"
                  />
                  <span>
                    I agree to EcoLoop's <span className="font-semibold text-emerald-700 underline">Terms & Conditions</span> for circular trade and marketplace standards.
                  </span>
                </label>
                {errors.agreedTerms && <p className="text-[13px] text-rose-600 pl-6">{errors.agreedTerms}</p>}

                <label className="flex items-start gap-2.5 cursor-pointer text-[13px] text-slate-700 select-none">
                  <input
                    id="ind-agree-privacy"
                    type="checkbox"
                    checked={agreedPrivacy}
                    onChange={(e) => {
                      setAgreedPrivacy(e.target.checked);
                      if (errors.agreedPrivacy) setErrors((prev) => ({ ...prev, agreedPrivacy: '' }));
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 accent-emerald-600"
                  />
                  <span>
                    I agree to the <span className="font-semibold text-emerald-700 underline">Privacy Policy</span> and consent to essential authentication cookies and session management.
                  </span>
                </label>
                {errors.agreedPrivacy && <p className="text-[13px] text-rose-600 pl-6">{errors.agreedPrivacy}</p>}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="py-1.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-[13px] hover:bg-slate-50 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  id="ind-create-account-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-[13px] rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* BUSINESS FLOW */}
          {accountType === 'business' && currentStep === 1 && (
            <motion.div
              key="biz-step-1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 "
            >
              <div className="border-b border-slate-100 pb-3 mb-3">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-900">
                  Step 1 - Contact Representative
                </h2>
                <p className="text-[13px] text-slate-500">Authorized contact person for this business account.</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="biz-fullname">
                  Contact Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="biz-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                    placeholder="e.g. Marcus Sterling"
                    className="w-full pl-10 pr-4 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                  />
                </div>
                {errors.fullName && <p className="text-[13px] text-rose-600 mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="biz-email">
                  Official Work Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="biz-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="marcus@sterlingmaterials.com"
                    className="w-full pl-10 pr-4 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                  />
                </div>
                {errors.email && <p className="text-[13px] text-rose-600 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="biz-phone">
                  Phone / Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="biz-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder="+1 555-492-8172"
                    className="w-full pl-10 pr-4 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                  />
                </div>
                {errors.phone && <p className="text-[13px] text-rose-600 mt-1">{errors.phone}</p>}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-1.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-[13px] hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  id="biz-step1-next"
                  onClick={handleNext}
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13px] rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {accountType === 'business' && currentStep === 2 && (
            <motion.div
              key="biz-step-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 "
            >
              <div className="border-b border-slate-100 pb-3 mb-3">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-900">
                  Step 2 - Business Basics
                </h2>
                <p className="text-[13px] text-slate-500">
                  Basic entity details. (Detailed compliance/GST collected later in Profile).
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="biz-name">
                  Business Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    id="biz-name"
                    type="text"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      if (errors.businessName) setErrors((prev) => ({ ...prev, businessName: '' }));
                    }}
                    placeholder="e.g. Circular Polymer Solutions Ltd."
                    className="w-full pl-10 pr-4 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                  />
                </div>
                {errors.businessName && <p className="text-[13px] text-rose-600 mt-1">{errors.businessName}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="biz-type">
                  Business Type
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <CustomSelect
                    value={businessType}
                    onChange={(val) => {
                      setBusinessType(val);
                      if (errors.businessType) setErrors((prev) => ({ ...prev, businessType: '' }));
                    }}
                    hasError={!!errors.businessType}
                    placeholder="Select Business Type"
                    icon={<Briefcase className="w-4 h-4" />}
                    options={[
                      { value: 'Manufacturer', label: 'Manufacturer / Producer' },
                      { value: 'Recycler', label: 'Recycler / Material Recovery Facility' },
                      { value: 'Trader / Distributor', label: 'Trader / Scrap Distributor' },
                      { value: 'Retailer / Brand', label: 'Retailer / D2C Brand' },
                      { value: 'Enterprise Buyer', label: 'Enterprise / Corporate Sourcing' },
                      { value: 'Refurbisher', label: 'Refurbisher / Repair Hub' },
                    ]}
                  />
                </div>
                {errors.businessType && <p className="text-[13px] text-rose-600 mt-1">{errors.businessType}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="biz-category">
                  Business Category
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <CustomSelect
                    value={businessCategory}
                    onChange={(val) => {
                      setBusinessCategory(val);
                      if (errors.businessCategory) setErrors((prev) => ({ ...prev, businessCategory: '' }));
                    }}
                    hasError={!!errors.businessCategory}
                    placeholder="Select Business Category"
                    icon={<Layers className="w-4 h-4" />}
                    options={[
                      { value: 'Plastics & Polymers', label: 'Plastics & Polymers (PET, HDPE, PP, etc.)' },
                      { value: 'Metals & Industrial Scrap', label: 'Metals & Industrial Scrap (Aluminum, Copper, Steel)' },
                      { value: 'Electronics & E-Waste', label: 'Electronics & E-Waste' },
                      { value: 'Textiles & Apparel', label: 'Textiles & Post-Industrial Fabrics' },
                      { value: 'Packaging & Paper', label: 'Packaging, Corrugated Boxes & Paper' },
                    ]}
                  />
                </div>
                {errors.businessCategory && <p className="text-[13px] text-rose-600 mt-1">{errors.businessCategory}</p>}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-1.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-[13px] hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  id="biz-step2-next"
                  onClick={handleNext}
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13px] rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          

          {accountType === 'business' && currentStep === 3 && (
            <motion.div
              key="biz-step-4"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 "
            >
              <div className="border-b border-slate-100 pb-3 mb-3">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-900">
                  Step 3 - Location & Headquarters
                </h2>
                <p className="text-[13px] text-slate-500">Operating base for logistics and regional sourcing.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="biz-country">
                    Country
                  </label>
                  <input
                    id="biz-country"
                    type="text"
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      if (errors.country) setErrors((prev) => ({ ...prev, country: '' }));
                    }}
                    placeholder="e.g. India"
                    className="w-full px-3.5 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                  />
                  {errors.country && <p className="text-[13px] text-rose-600 mt-1">{errors.country}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="biz-state">
                    State / Region
                  </label>
                  <input
                    id="biz-state"
                    type="text"
                    value={stateName}
                    onChange={(e) => {
                      setStateName(e.target.value);
                      if (errors.stateName) setErrors((prev) => ({ ...prev, stateName: '' }));
                    }}
                    placeholder="e.g. Gujarat"
                    className="w-full px-3.5 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                  />
                  {errors.stateName && <p className="text-[13px] text-rose-600 mt-1">{errors.stateName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="biz-city">
                    City / Industrial Area
                  </label>
                  <input
                    id="biz-city"
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                    }}
                    placeholder="e.g. Ahmedabad"
                    className="w-full px-3.5 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                  />
                  {errors.city && <p className="text-[13px] text-rose-600 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="biz-pincode">
                    Pincode / Postal Code
                  </label>
                  <input
                    id="biz-pincode"
                    type="text"
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value);
                      if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' }));
                    }}
                    placeholder="e.g. 380001"
                    className="w-full px-3.5 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-[13px] rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 transition-all outline-none"
                  />
                  {errors.pincode && <p className="text-[13px] text-rose-600 mt-1">{errors.pincode}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-1.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-[13px] hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  id="biz-step3-next"
                  onClick={handleNext}
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13px] rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {accountType === 'business' && currentStep === 4 && (
            <motion.div
              key="biz-step-5"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 "
            >
              <div className="border-b border-slate-100 pb-3 mb-3">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-900">
                  Step 4 - Business Agreement
                </h2>
                <p className="text-[13px] text-slate-500">
                  Review your business details and accept marketplace policies.
                </p>
              </div>

              {/* Review summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-[13px] space-y-3.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Business:</span>
                  <span className="font-semibold text-slate-900">{businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Type & Category:</span>
                  <span className="font-semibold text-emerald-800">{businessType} | {businessCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Representative:</span>
                  <span className="font-semibold text-slate-800">{fullName} ({email})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Location:</span>
                  <span className="font-semibold text-slate-800">{city}, {stateName}, {country}</span>
                </div>
              </div>

              <div className="space-y-3.5 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-[13px] text-slate-700 select-none">
                  <input
                    id="biz-agree-terms"
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => {
                      setAgreedTerms(e.target.checked);
                      if (errors.agreedTerms) setErrors((prev) => ({ ...prev, agreedTerms: '' }));
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 accent-emerald-600"
                  />
                  <span>
                    I represent that I am authorized and agree to EcoLoop's <span className="font-semibold text-emerald-700 underline">Terms & Conditions</span> for B2B/C2C trading.
                  </span>
                </label>
                {errors.agreedTerms && <p className="text-[13px] text-rose-600 pl-6">{errors.agreedTerms}</p>}

                <label className="flex items-start gap-2.5 cursor-pointer text-[13px] text-slate-700 select-none">
                  <input
                    id="biz-agree-privacy"
                    type="checkbox"
                    checked={agreedPrivacy}
                    onChange={(e) => {
                      setAgreedPrivacy(e.target.checked);
                      if (errors.agreedPrivacy) setErrors((prev) => ({ ...prev, agreedPrivacy: '' }));
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 accent-emerald-600"
                  />
                  <span>
                    I agree to the <span className="font-semibold text-emerald-700 underline">Privacy Policy</span> and data processing practices for verified circular trade.
                  </span>
                </label>
                {errors.agreedPrivacy && <p className="text-[13px] text-rose-600 pl-6">{errors.agreedPrivacy}</p>}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="py-1.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-[13px] hover:bg-slate-50 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  id="biz-create-account-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-[13px] rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Business Account...</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4 text-emerald-200" />
                      <span>Create Business Account</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom link to login */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-[13px] text-slate-600">
            Already have an EcoLoop account?{' '}
            <button
              type="button"
              id="goto-login-from-signup-btn"
              onClick={() => onNavigate('login')}
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors focus:outline-none ml-1 cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

