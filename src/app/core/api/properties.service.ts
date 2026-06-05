import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/page-response';
import {
  CoOwner,
  IcalFeed,
  LocalRecommendation,
  LoyaltyDiscountRule,
  PropertyDto,
  PropertyKit,
  PropertyUpsert,
} from '../models/property.models';

@Injectable({ providedIn: 'root' })
export class PropertiesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/properties`;

  listOwner(page = 0, size = 50) {
    return this.http.get<PageResponse<PropertyDto>>(`${this.base}/owner?page=${page}&size=${size}`);
  }

  create(body: PropertyUpsert) {
    return this.http.post<PropertyDto>(this.base, body);
  }

  update(id: string, body: PropertyUpsert) {
    return this.http.put<PropertyDto>(`${this.base}/${id}`, body);
  }

  delete(id: string) {
    return this.http.delete(`${this.base}/${id}`, { responseType: 'text' });
  }

  listLocalRecommendations(propertyId: string) {
    return this.http.get<LocalRecommendation[]>(`${this.base}/${propertyId}/local-recommendations`);
  }

  createLocalRecommendation(propertyId: string, body: LocalRecommendation) {
    return this.http.post<LocalRecommendation>(`${this.base}/${propertyId}/local-recommendations`, body);
  }

  updateLocalRecommendation(propertyId: string, recId: string, body: Partial<LocalRecommendation>) {
    return this.http.patch<LocalRecommendation>(
      `${this.base}/${propertyId}/local-recommendations/${recId}`,
      body,
    );
  }

  deleteLocalRecommendation(propertyId: string, recId: string) {
    return this.http.delete(`${this.base}/${propertyId}/local-recommendations/${recId}`, {
      responseType: 'text',
    });
  }

  getLoyaltyRules(propertyId: string) {
    return this.http.get<LoyaltyDiscountRule[]>(`${this.base}/${propertyId}/loyalty-discount-rules`);
  }

  updateLoyaltyRules(propertyId: string, rules: LoyaltyDiscountRule[]) {
    return this.http.put<LoyaltyDiscountRule[]>(`${this.base}/${propertyId}/loyalty-discount-rules`, rules);
  }

  listIcalFeeds(propertyId: string) {
    return this.http.get<IcalFeed[]>(`${this.base}/${propertyId}/ical-feeds`);
  }

  addIcalFeed(propertyId: string, body: { label?: string; url: string }) {
    return this.http.post<IcalFeed>(`${this.base}/${propertyId}/ical-feeds`, body);
  }

  syncIcalFeed(propertyId: string, feedId: string) {
    return this.http.post<IcalFeed>(`${this.base}/${propertyId}/ical-feeds/${feedId}/sync`, {});
  }

  listCoOwners(propertyId: string) {
    return this.http.get<CoOwner[]>(`${this.base}/${propertyId}/co-owners`);
  }

  inviteCoOwner(propertyId: string, email: string) {
    return this.http.post(`${this.base}/${propertyId}/co-owner-invitations`, { email }, { responseType: 'text' });
  }

  revokeCoOwner(propertyId: string, userId: string) {
    return this.http.delete(`${this.base}/${propertyId}/co-owners/${userId}`, { responseType: 'text' });
  }

  listKits(propertyId: string) {
    return this.http.get<PropertyKit[]>(`${this.base}/${propertyId}/kits`);
  }

  createKit(propertyId: string, body: Partial<PropertyKit>) {
    return this.http.post<PropertyKit>(`${this.base}/${propertyId}/kits`, body);
  }

  updateKit(propertyId: string, kitId: string, body: Partial<PropertyKit>) {
    return this.http.put<PropertyKit>(`${this.base}/${propertyId}/kits/${kitId}`, body);
  }

  deleteKit(propertyId: string, kitId: string) {
    return this.http.delete(`${this.base}/${propertyId}/kits/${kitId}`, { responseType: 'text' });
  }

  listFieldServices(propertyId: string) {
    return this.http.get(`${this.base}/${propertyId}/field-services`);
  }

  createFieldService(propertyId: string, body: Record<string, unknown>) {
    return this.http.post(`${this.base}/${propertyId}/field-services`, body);
  }

  listPendingAccessRequests(page = 0, size = 20) {
    return this.http.get<PageResponse<import('../models/operations.models').AccessRequest>>(
      `${this.base}/access-requests/pending?page=${page}&size=${size}`,
    );
  }

  approveAccessRequest(id: string, body?: { reservationSource?: string; grossAmount?: number }) {
    return this.http.post(`${this.base}/access-requests/${id}/approve`, body ?? {});
  }

  rejectAccessRequest(id: string) {
    return this.http.post(`${this.base}/access-requests/${id}/reject`, {});
  }
}
