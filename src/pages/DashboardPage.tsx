import React from "react";
import { DashboardView, PurchaseRecord } from "../components/common/DashboardView";
import { WasteListing, UserProfile, DealOffer } from "../types";

interface DashboardPageProps {
  listings: WasteListing[];
  currentUser: UserProfile;
  onOpenListing: (listing: WasteListing) => void;
  onOpenListWaste: () => void;
  onNavigateToMessages: () => void;
  onViewContract: (offer: DealOffer) => void;
  purchases?: PurchaseRecord[];
  onDeleteListing?: (listing: WasteListing) => void;
  onEditListing?: (listing: WasteListing) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  return <DashboardView {...props} />;
};

