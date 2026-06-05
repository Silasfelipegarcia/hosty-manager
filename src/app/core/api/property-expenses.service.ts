import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PropertyExpense, PropertyExpenseRequest } from '../models/property-expense.models';

@Injectable({ providedIn: 'root' })
export class PropertyExpensesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/finance`;
  private readonly propertyBase = `${this.base}/properties`;

  listOwner(from: string, to?: string, propertyId?: string) {
    const toParam = to ? `&to=${to}` : '';
    const propParam = propertyId ? `&propertyId=${propertyId}` : '';
    return this.http.get<PropertyExpense[]>(`${this.base}/expenses?from=${from}${toParam}${propParam}`);
  }

  list(propertyId: string, competence?: string) {
    const q = competence ? `?competence=${competence}` : '';
    return this.http.get<PropertyExpense[]>(`${this.propertyBase}/${propertyId}/expenses${q}`);
  }

  add(propertyId: string, body: PropertyExpenseRequest) {
    return this.http.post<PropertyExpense>(`${this.propertyBase}/${propertyId}/expenses`, body);
  }

  update(propertyId: string, expenseId: string, body: PropertyExpenseRequest) {
    return this.http.put<PropertyExpense>(`${this.propertyBase}/${propertyId}/expenses/${expenseId}`, body);
  }

  delete(propertyId: string, expenseId: string) {
    return this.http.delete(`${this.propertyBase}/${propertyId}/expenses/${expenseId}`, { responseType: 'text' });
  }
}
