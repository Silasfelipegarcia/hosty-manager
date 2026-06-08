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

/** Resposta de GET /bookings/stays-summary (alinhado à API Java). */
export interface StaysSummary {
  activeAll?: number;
  running?: number;
  waiting?: number;
  hostPending?: number;
  completed?: number;
  noShow?: number;
  totalBookings?: number;
}

export function activeStaysCount(summary: StaysSummary | null | undefined): number {
  if (!summary) return 0;
  return summary.running ?? summary.activeAll ?? 0;
}

export function upcomingStaysCount(summary: StaysSummary | null | undefined): number {
  if (!summary) return 0;
  return summary.waiting ?? 0;
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
  senderDisplayName?: string;
  text: string;
  sentAt?: string;
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
  /** Nomes enviados pela API Java */
  proposedCheckinDate?: string;
  proposedCheckoutDate?: string;
  /** Alias legado no front */
  requestedCheckinDate?: string;
  requestedCheckoutDate?: string;
  estimatedGrossAtRequest?: number;
  message?: string;
  tenantPhotoUrl?: string;
  operationBookingId?: string;
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

export interface UpdateOwnerRegisteredSaleRequest {
  grossAmount: number;
  platform: string;
  feeType: string;
  percentage?: number;
  fixedAmount?: number;
  checkinDate: string;
  checkoutDate: string;
  competence?: string;
  tenantIdentifier?: string;
  reservationSource?: string;
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
