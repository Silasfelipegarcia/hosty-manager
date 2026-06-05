export interface PropertyDto {
  id: string;
  name: string;
  city?: string;
  addressLine?: string;
  state?: string;
  neighborhood?: string;
  streetAddress?: string;
  streetNumber?: string;
  complement?: string;
  country?: string;
  postalCode?: string;
  description?: string;
  neighborhoodInfo?: string;
  coverPhotoUrl?: string;
  galleryPhotoUrls?: string[];
  operationalStatus?: string;
  nightlyRate?: number;
  maxGuests?: number;
  petsAllowed?: boolean;
  maxPets?: number;
  instagramUrl?: string;
  facebookUrl?: string;
  whatsappUrl?: string;
  websiteUrl?: string;
  loyaltyEnabled?: boolean;
  loyaltyDiscountCapPercent?: number;
  loyaltyPointsBonus?: number;
  checkinStartMode?: string;
  checkinQrCode?: string;
  tenantCancellationMinDaysBeforeCheckin?: number;
  noShowGraceHours?: number;
  noShowPenaltyType?: string;
  noShowPenaltyValue?: number;
}

export interface PropertyUpsert {
  name: string;
  city?: string;
  addressLine?: string;
  state?: string;
  neighborhood?: string;
  streetAddress?: string;
  streetNumber?: string;
  complement?: string;
  country?: string;
  postalCode?: string;
  description?: string;
  neighborhoodInfo?: string;
  coverPhotoUrl?: string;
  galleryPhotoUrls?: string[];
  operationalStatus?: string;
  nightlyRate?: number;
  maxGuests?: number;
  petsAllowed?: boolean;
  maxPets?: number;
  instagramUrl?: string;
  facebookUrl?: string;
  whatsappUrl?: string;
  websiteUrl?: string;
  loyaltyEnabled?: boolean;
  loyaltyDiscountCapPercent?: number;
  loyaltyPointsBonus?: number;
  checkinStartMode?: string;
  checkinQrCode?: string;
  tenantCancellationMinDaysBeforeCheckin?: number;
  noShowGraceHours?: number;
  noShowPenaltyType?: string;
  noShowPenaltyValue?: number;
}

export interface LocalRecommendation {
  id?: string;
  category?: string;
  name: string;
  description?: string;
  address?: string;
  mapsUrl?: string;
  orderUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  sortOrder?: number;
  visibleToTenant?: boolean;
}

export interface PropertyKit {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
  active: boolean;
}

export interface CoOwner {
  userId: string;
  email: string;
  fullName?: string;
}

export interface IcalFeed {
  id: string;
  label?: string;
  url: string;
  lastSyncedAt?: string;
}

export interface LoyaltyDiscountRule {
  label?: string;
  dateFrom?: string;
  dateTo?: string;
  discountCapPercent?: number;
  promotionType?: string;
  promotionValue?: number;
}
