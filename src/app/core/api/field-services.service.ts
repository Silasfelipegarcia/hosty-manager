import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/page-response';
import { FieldServiceOrder } from '../models/operations.models';

@Injectable({ providedIn: 'root' })
export class FieldServicesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/field-services`;

  listPending(page = 0, size = 20) {
    return this.http.get<PageResponse<FieldServiceOrder>>(`${this.base}/pending-approval?page=${page}&size=${size}`);
  }

  get(orderId: string) {
    return this.http.get<FieldServiceOrder>(`${this.base}/${orderId}`);
  }

  approve(orderId: string, body?: { amount?: number; competence?: string; bookingId?: string }) {
    return this.http.post(`${this.base}/${orderId}/approve`, body ?? {});
  }

  reject(orderId: string) {
    return this.http.post(`${this.base}/${orderId}/reject`, {});
  }

  cancel(orderId: string) {
    return this.http.post(`${this.base}/${orderId}/cancel`, {});
  }

  regenerateLink(orderId: string) {
    return this.http.post<{ token?: string }>(`${this.base}/${orderId}/regenerate-link`, {});
  }
}
