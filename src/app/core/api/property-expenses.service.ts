import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PropertyExpense, PropertyExpenseRequest } from '../models/property-expense.models';

@Injectable({ providedIn: 'root' })
export class PropertyExpensesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/finance/properties`;

  list(propertyId: string, competence?: string) {
    const q = competence ? `?competence=${competence}` : '';
    return this.http.get<PropertyExpense[]>(`${this.base}/${propertyId}/expenses${q}`);
  }

  add(propertyId: string, body: PropertyExpenseRequest) {
    return this.http.post<PropertyExpense>(`${this.base}/${propertyId}/expenses`, body);
  }

  update(propertyId: string, expenseId: string, body: PropertyExpenseRequest) {
    return this.http.put<PropertyExpense>(`${this.base}/${propertyId}/expenses/${expenseId}`, body);
  }

  delete(propertyId: string, expenseId: string) {
    return this.http.delete(`${this.base}/${propertyId}/expenses/${expenseId}`, { responseType: 'text' });
  }
}
