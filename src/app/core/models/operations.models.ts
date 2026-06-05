export interface BookingDto {
  id: string;
  propertyId: string;
  propertyName?: string;
  tenantEmail?: string;
  tenantName?: string;
  checkinDate?: string;
  checkoutDate?: string;
  lifecycleStatus?: string;
  operationalStatus?: string;
  grossAmount?: number;
  platform?: string;
  reservationSource?: string;
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

export interface KitOrder {
  id: string;
  bookingId: string;
  propertyName?: string;
  tenantName?: string;
  status?: string;
  requestedTotal?: number;
  items?: { kitName: string; quantity: number; unitPrice: number }[];
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

export interface PortfolioOccupancyDay {
  date: string;
  occupiedPropertyIds: string[];
}

export interface PortfolioSummary {
  days: PortfolioOccupancyDay[];
  properties: { id: string; name: string }[];
}
