export interface BookingDto {
  id: string;
  propertyId: string;
  propertyName?: string;
  tenantEmail?: string;
  tenantName?: string;
  tenantFullName?: string;
  tenantIdentifier?: string;
  tenantPhotoUrl?: string;
  checkinDate?: string;
  checkoutDate?: string;
  lifecycleStatus?: string;
  flowStage?: string;
  reservationStatus?: string;
  operationalStatus?: string;
  grossAmount?: number;
  amountToPay?: number;
  competence?: string;
  backfill?: boolean;
  backfillNotes?: string;
  platform?: string;
  reservationSource?: string;
  accessRequestId?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  checkoutRequestedAt?: string;
  ownerCheckinAcknowledgedAt?: string;
  pendingOwnerCheckinAck?: boolean;
  noShowPenaltyStatus?: string;
  ownerActionRequired?: boolean;
  pendingStayRequest?: boolean;
}

export interface BookingCounts {
  ownerActionRequired?: number;
  ownerPendingAccessRequests?: number;
  pendingKitOrders?: number;
  pendingFieldServices?: number;
  total?: number;
}

export interface StaysSummary {
  active?: number;
  upcoming?: number;
  completed?: number;
}

export interface MessageInboxItem {
  bookingId: string;
  propertyName?: string;
  tenantName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id?: string;
  senderRole?: string;
  body: string;
  createdAt?: string;
}

export interface AccessRequest {
  id: string;
  propertyId: string;
  propertyName?: string;
  tenantEmail?: string;
  tenantName?: string;
  tenantFullName?: string;
  tenantIdentifier?: string;
  status?: string;
  requestedCheckinDate?: string;
  requestedCheckoutDate?: string;
}

export interface TenantSearchResult {
  id: string;
  email: string;
  fullName?: string;
}

export interface CreateBookingRequest {
  propertyId: string;
  competence: string;
  grossAmount: number;
  platform: string;
  feeType: string;
  percentage?: number;
  fixedAmount?: number;
  checkinDate: string;
  checkoutDate: string;
  tenantIdentifier?: string;
  reservationSource?: string;
}

export interface BackfillBookingRequest extends CreateBookingRequest {
  notes?: string;
}

export interface KitOrderLine {
  kitId: string;
  kitName: string;
  quantity: number;
  unitPriceSnapshot: number;
}

export interface KitOrder {
  id: string;
  bookingId: string;
  propertyId?: string;
  propertyName?: string;
  tenantName?: string;
  tenantPrincipal?: string;
  status?: string;
  guestMessage?: string;
  hostMessage?: string;
  approvedTotal?: number;
  requestedTotal?: number;
  createdAt?: string;
  decidedAt?: string;
  lines?: KitOrderLine[];
  items?: { kitName: string; quantity: number; unitPrice: number }[];
}

export interface PropertyAvailabilityItem {
  propertyId: string;
  freeDays: number;
  bookedDays: number;
  freeWeekendDays: number;
  occupancyRate: number;
}

export interface PortfolioAvailabilitySummary {
  totalFreeDays: number;
  properties: PropertyAvailabilityItem[];
}

export interface FieldServiceOrder {
  id: string;
  propertyId: string;
  propertyName?: string;
  serviceType?: string;
  status?: string;
  scheduledAt?: string;
  amount?: number;
  providerName?: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

/** @deprecated use PortfolioAvailabilitySummary */
export interface PortfolioSummary {
  totalFreeDays: number;
  properties: PropertyAvailabilityItem[];
}
