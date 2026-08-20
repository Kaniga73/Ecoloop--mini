import React from "react";
import { Search, Bell, Plus, Recycle, ShieldCheck, UserCheck, ArrowRightLeft, LogOut } from "lucide-react";
import { UserProfile } from "../../types";

interface HeaderProps {
  activeTab: "marketplace" | "dashboard" | "messages" | "list-waste";
  setActiveTab: (tab: "marketplace" | "dashboard" | "messages" | "list-waste") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenListWaste?: () => void;
  currentUser: UserProfile;
  onSwitchUser: () => void;
  unreadCount: number;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenListWaste,
  currentUser,
  onSwitchUser,
  unreadCount,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <button
              id="brand-logo-btn"
              onClick={() => setActiveTab("marketplace")}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-700 transition-colors">
                <Recycle className="w-5 h-5 transition-transform group-hover:rotate-45" />
              </div>
              <span className="text-xl font-bold tracking-tight text-neutral-900">
                EcoLoop
              </span>
            </button>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                id="nav-tab-marketplace"
                onClick={() => setActiveTab("marketplace")}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "marketplace"
                    ? "text-emerald-700 bg-emerald-50 font-semibold"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                Marketplace
              </button>
              <button
                id="nav-tab-dashboard"
                onClick={() => setActiveTab("dashboard")}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "dashboard"
                    ? "text-emerald-700 bg-emerald-50 font-semibold"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                Dashboard
              </button>
            </nav>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="global-waste-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search industrial waste, polymers, metals, chemicals..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-100 border border-transparent rounded-full text-neutral-800 placeholder-neutral-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Actions & Profile */}
          <div className="flex items-center gap-3">
            {/* List Waste Button */}
            <button
              id="top-list-waste-btn"
              onClick={onOpenListWaste}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-all hover:shadow focus:outline-none cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Sell</span>
            </button>

            {/* Notifications */}
            <button
              id="top-notifications-btn"
              onClick={() => setActiveTab("messages")}
              className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg relative transition-colors focus:outline-none"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Profile / Role Switcher */}
            <div className="flex items-center pl-2 border-l border-neutral-200 gap-2">
              <button
                id="role-switch-btn"
                onClick={onSwitchUser}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-left group focus:outline-none"
                title="Click to toggle between Buyer and Seller mode"
              >
                <img
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"}
                  alt={currentUser.name || currentUser.full_name || "User"}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-neutral-200"
                />
                <div className="hidden lg:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-neutral-800 leading-none">
                      {currentUser.name || currentUser.full_name || "User"}
                    </span>
                    <ArrowRightLeft className="w-3 h-3 text-neutral-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <span className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                    <span className="capitalize font-medium text-emerald-700 bg-emerald-50 px-1 rounded text-[10px]">
                      {currentUser.role || currentUser.account_type || "User"}
                    </span>
                    {(currentUser.company || currentUser.business_name || currentUser.email || "").slice(0, 18)}...
                  </span>
                </div>
              </button>

              {/* Logout Button */}
              {onLogout && (
                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all border border-rose-200/80 cursor-pointer focus:outline-none shrink-0"
                  title="Sign out of EcoLoop"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-neutral-100">
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`text-xs font-medium py-1 px-3 rounded-full ${
              activeTab === "marketplace" ? "bg-emerald-100 text-emerald-800" : "text-neutral-600"
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`text-xs font-medium py-1 px-3 rounded-full ${
              activeTab === "dashboard" ? "bg-emerald-100 text-emerald-800" : "text-neutral-600"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`text-xs font-medium py-1 px-3 rounded-full relative ${
              activeTab === "messages" ? "bg-emerald-100 text-emerald-800" : "text-neutral-600"
            }`}
          >
            Messages
          </button>
        </div>
      </div>
    </header>
  );
};
