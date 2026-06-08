import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface CheckoutSession {
  checkoutUrl: string;
  sessionId: string;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/billing`;

  ownerCheckout(planId: string) {
    return this.http.post<CheckoutSession>(`${this.base}/owner/checkout`, { planId });
  }
}
