import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface CheckoutSession {
  checkoutUrl: string;
  sessionId: string;
}

export interface OwnerBillingStatus {
  stripeConfigured: boolean;
  trialEligible: boolean;
  trialActive: boolean;
  trialEndsAt: string | null;
  trialDays: number;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/billing`;

  getOwnerStatus() {
    return this.http.get<OwnerBillingStatus>(`${this.base}/owner/status`);
  }

  startOwnerTrial() {
    return this.http.post<OwnerBillingStatus>(`${this.base}/owner/trial`, {});
  }

  ownerCheckout(planId: string) {
    return this.http.post<CheckoutSession>(`${this.base}/owner/checkout`, { planId });
  }
}
