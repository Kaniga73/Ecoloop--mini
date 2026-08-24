import React from "react";
import { DashboardView, PurchaseRecord } from "../components/common/DashboardView";
import { WasteListing, UserProfile, DealOffer, PartyDetails } from "../types";

interface DashboardPageProps {
  listings: WasteListing[];
  currentUser: UserProfile;
  onOpenListing: (listing: WasteListing) => void;
  onOpenListWaste?: () => void;
  onNavigateToMessages: () => void;
  onViewContract: (offer: DealOffer) => void;
  purchases?: PurchaseRecord[];
  onDeleteListing?: (listing: WasteListing) => void;
  onEditListing?: (listing: WasteListing) => void;
  favorites?: Set<string>;
  onToggleFavorite?: (id: string) => void;
  onOpenMakeOffer?: (listing: WasteListing) => void;
  onExploreMarketplace?: () => void;
  onMarkAsSold?: (
    listing: WasteListing,
    buyer: PartyDetails,
    quantity: number,
    pricePerUnit: number
  ) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  return <DashboardView {...props} />;
};

