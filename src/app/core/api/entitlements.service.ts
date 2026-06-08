import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MeEntitlements } from '../models/entitlements.models';

@Injectable({ providedIn: 'root' })
export class EntitlementsService {
  private readonly http = inject(HttpClient);

  getMine() {
    return this.http.get<MeEntitlements>(`${environment.apiBaseUrl}/api/v1/me/entitlements`);
  }
}
