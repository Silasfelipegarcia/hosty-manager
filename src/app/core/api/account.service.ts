import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/** Mesmo contrato do app mobile — GET/PUT /api/v1/tenant/profile */
export interface TenantProfile {
  userId?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  cpf?: string;
  photoUrl?: string;
  birthDate?: string;
  documentNumber?: string;
}

export interface UpdateTenantProfileRequest {
  fullName?: string;
  phone?: string;
  cpf?: string;
  photoUrl?: string;
  birthDate?: string;
  documentNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/tenant`;

  getProfile() {
    return this.http.get<TenantProfile>(`${this.base}/profile`);
  }

  updateProfile(body: UpdateTenantProfileRequest) {
    return this.http.put<TenantProfile>(`${this.base}/profile`, body);
  }
}
