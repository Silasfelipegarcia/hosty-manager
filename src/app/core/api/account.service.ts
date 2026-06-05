import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface TenantProfile {
  email?: string;
  fullName?: string;
  phone?: string;
  cpf?: string;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/tenant`;

  getProfile() {
    return this.http.get<TenantProfile>(`${this.base}/profile`);
  }

  updateProfile(body: TenantProfile) {
    return this.http.put<TenantProfile>(`${this.base}/profile`, body);
  }
}
