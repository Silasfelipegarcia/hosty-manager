import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/page-response';
import {
  BookingCounts,
  BookingDto,
  ChatMessage,
  BackfillBookingRequest,
  CreateBookingRequest,
  FieldServiceOrder,
  KitOrder,
  MessageInboxItem,
  PortfolioAvailabilitySummary,
  ServiceProvider,
  StaysSummary,
  TenantSearchResult,
} from '../models/operations.models';

@Injectable({ providedIn: 'root' })
export class OperationsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/operations`;

  listBookings(page = 0, size = 20) {
    return this.http.get<PageResponse<BookingDto>>(`${this.base}/bookings?page=${page}&size=${size}`);
  }

  getBooking(id: string) {
    return this.http.get<BookingDto>(`${this.base}/bookings/${id}`);
  }

  createBooking(body: CreateBookingRequest) {
    return this.http.post<{ booking: BookingDto; pendingTenantInviteCreated?: boolean }>(
      `${this.base}/bookings`,
      body,
    );
  }

  createBackfillBooking(body: BackfillBookingRequest) {
    return this.http.post<{ booking: BookingDto; pendingTenantInviteCreated?: boolean }>(
      `${this.base}/bookings/backfill`,
      body,
    );
  }

  deleteBooking(id: string) {
    return this.http.delete(`${this.base}/bookings/${id}`, { responseType: 'text' });
  }

  getCounts() {
    return this.http.get<BookingCounts>(`${this.base}/bookings/counts`);
  }

  getStaysSummary() {
    return this.http.get<StaysSummary>(`${this.base}/bookings/stays-summary`);
  }

  getPortfolioSummary(from: string, to: string) {
    return this.http.get<PortfolioAvailabilitySummary>(
      `${this.base}/availability/portfolio-summary?from=${from}&to=${to}`,
    );
  }

  cancelBookingByOwner(bookingId: string) {
    return this.http.post<BookingDto>(`${this.base}/bookings/${bookingId}/cancellation/owner`, {});
  }

  approveTenantCancellation(bookingId: string) {
    return this.http.post<BookingDto>(`${this.base}/bookings/${bookingId}/cancellation/approve`, {});
  }

  rejectTenantCancellation(bookingId: string) {
    return this.http.post<BookingDto>(`${this.base}/bookings/${bookingId}/cancellation/reject`, {});
  }

  importBackfillCsv(csv: string) {
    return this.http.post<{ createdCount: number; errors: string[]; importedAt: string }>(
      `${this.base}/bookings/backfill/import-csv`,
      { csv },
    );
  }

  getAvailability(propertyId: string, from: string, to: string) {
    return this.http.get(`${this.base}/availability?propertyId=${propertyId}&from=${from}&to=${to}`);
  }

  searchTenants(q: string) {
    return this.http.get<TenantSearchResult[]>(`${this.base}/tenants/search?q=${encodeURIComponent(q)}`);
  }

  ownerConfirm(bookingId: string) {
    return this.http.post(`${this.base}/bookings/${bookingId}/owner-confirm`, {});
  }

  acknowledgeCheckin(bookingId: string) {
    return this.http.post(`${this.base}/bookings/${bookingId}/checkin/acknowledge`, {});
  }

  approveCheckout(bookingId: string) {
    return this.http.post(`${this.base}/bookings/${bookingId}/checkout/approve`, {});
  }

  rejectCheckout(bookingId: string) {
    return this.http.post(`${this.base}/bookings/${bookingId}/checkout/reject`, {});
  }

  listMessagesInbox(page = 0, size = 10) {
    return this.http.get<PageResponse<MessageInboxItem>>(`${this.base}/messages/inbox?page=${page}&size=${size}`);
  }

  listBookingMessages(bookingId: string) {
    return this.http.get<ChatMessage[]>(
      `${environment.apiBaseUrl}/api/v1/tenant/bookings/${bookingId}/messages`,
    );
  }

  sendBookingMessage(bookingId: string, body: string) {
    return this.http.post<ChatMessage>(
      `${environment.apiBaseUrl}/api/v1/tenant/bookings/${bookingId}/messages`,
      { body },
    );
  }

  listPendingKitOrders(page = 0, size = 20) {
    return this.http.get<PageResponse<KitOrder>>(`${this.base}/kit-requests/pending?page=${page}&size=${size}`);
  }

  listBookingKitOrders(bookingId: string) {
    return this.http.get<KitOrder[]>(`${this.base}/bookings/${bookingId}/kit-requests`);
  }

  approveKitOrder(orderId: string, approvedTotal: number, hostMessage?: string) {
    return this.http.post(`${this.base}/kit-requests/${orderId}/approve`, { approvedTotal, hostMessage });
  }

  rejectKitOrder(orderId: string) {
    return this.http.post(`${this.base}/kit-requests/${orderId}/reject`, {});
  }

  listServiceProviders() {
    return this.http.get<ServiceProvider[]>(`${this.base}/service-providers`);
  }

  createServiceProvider(body: Partial<ServiceProvider>) {
    return this.http.post<ServiceProvider>(`${this.base}/service-providers`, body);
  }

  inviteServiceProvider(id: string) {
    return this.http.post(`${this.base}/service-providers/${id}/invite`, {}, { responseType: 'text' });
  }
}
