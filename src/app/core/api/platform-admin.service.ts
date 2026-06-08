import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PlatformDashboard {
  mrrCents: number;
  ownerPlus: number;
  ownerPlusPlus: number;
  guestPlus: number;
  guestPlusPlus: number;
}

export interface PlanView {
  id: string;
  audience: string;
  code: string;
  displayName: string;
  priceCents: number;
  features: { featureKey: string; enabled: boolean; limitValue: number | null }[];
}

export interface FeatureFlagView {
  featureKey: string;
  enabled: boolean;
  updatedAt: string | null;
}

export interface UserSummary {
  id: string;
  email: string;
  roles: string;
}

export interface BillingEventView {
  provider: string;
  eventType: string;
  providerEventId: string;
  processedAt: string;
}

@Injectable({ providedIn: 'root' })
export class PlatformAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/platform`;

  dashboard() {
    return this.http.get<PlatformDashboard>(`${this.base}/dashboard`);
  }

  plans(audience: 'OWNER' | 'GUEST' = 'OWNER') {
    return this.http.get<PlanView[]>(`${this.base}/plans`, { params: { audience } });
  }

  updatePlanPrice(planId: string, priceCents: number) {
    return this.http.patch<PlanView>(`${this.base}/plans/${planId}/price`, { priceCents });
  }

  flags() {
    return this.http.get<FeatureFlagView[]>(`${this.base}/features`);
  }

  setFlag(featureKey: string, enabled: boolean) {
    return this.http.put<FeatureFlagView>(`${this.base}/features/${featureKey}`, { enabled });
  }

  searchUsers(q: string, role?: string) {
    const params: Record<string, string | number> = { q, limit: 30 };
    if (role) params['role'] = role;
    return this.http.get<UserSummary[]>(`${this.base}/users`, { params });
  }

  assignOwnerPlan(userId: string, planId: string) {
    return this.http.put<void>(`${this.base}/owners/${userId}/plan`, { planId });
  }

  assignGuestPlan(userId: string, planId: string) {
    return this.http.put<void>(`${this.base}/guests/${userId}/plan`, { planId });
  }

  billingEvents(limit = 50) {
    return this.http.get<BillingEventView[]>(`${this.base}/billing/events`, { params: { limit } });
  }
}
