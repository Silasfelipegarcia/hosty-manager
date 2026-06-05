import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/page-response';
import {
  AddFixedCostRequest,
  FinanceBreakEvenRow,
  FinanceDashboardBundle,
  FinanceDashboardRangeResult,
  FixedCostRow,
  VariableCostRequest,
} from '../models/finance.models';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/finance`;

  getDashboardBundle(competence: string, propertyId?: string) {
    const pid = propertyId ? `&propertyId=${encodeURIComponent(propertyId)}` : '';
    return this.http.get<FinanceDashboardBundle>(
      `${this.base}/dashboard/bundle?competence=${competence}${pid}`,
    );
  }

  getDashboardRange(from: string, to: string, propertyId?: string) {
    const pid = propertyId ? `&propertyId=${encodeURIComponent(propertyId)}` : '';
    return this.http.get<FinanceDashboardRangeResult>(
      `${this.base}/dashboard/range?from=${from}&to=${to}${pid}`,
    );
  }

  getBreakEven(competence: string, propertyId?: string) {
    const pid = propertyId ? `&propertyId=${encodeURIComponent(propertyId)}` : '';
    return this.http.get<FinanceBreakEvenRow[]>(
      `${this.base}/break-even?competence=${competence}${pid}`,
    );
  }

  listFixedCosts(page = 0, size = 50) {
    return this.http.get<PageResponse<FixedCostRow>>(`${this.base}/fixed-costs?page=${page}&size=${size}`);
  }

  addFixedCost(body: AddFixedCostRequest) {
    return this.http.post<FixedCostRow>(`${this.base}/fixed-costs`, body);
  }

  updateFixedCost(id: string, body: Partial<AddFixedCostRequest>) {
    return this.http.put<FixedCostRow>(`${this.base}/fixed-costs/${id}`, body);
  }

  deleteFixedCost(id: string) {
    return this.http.delete(`${this.base}/fixed-costs/${id}`, { responseType: 'text' });
  }

  addVariableCost(bookingId: string, body: VariableCostRequest) {
    return this.http.post(`${this.base}/bookings/${bookingId}/variable-costs`, body);
  }

  exportCsv(from: string, to?: string) {
    const toParam = to ? `&to=${to}` : '';
    return this.http.get(`${this.base}/export/csv?from=${from}${toParam}`, {
      responseType: 'blob',
    });
  }
}
