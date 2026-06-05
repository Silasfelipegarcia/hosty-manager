import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ClaraChatRequest {
  message: string;
  propertyId?: string;
  competence?: string;
}

export interface ClaraChatResponse {
  agentId: string;
  agentName: string;
  reply: string;
  fallback: boolean;
  fallbackReason?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClaraService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/manager/clara`;

  chat(body: ClaraChatRequest) {
    return this.http.post<ClaraChatResponse>(`${this.base}/chat`, body);
  }

  clearSession() {
    return this.http.delete(`${this.base}/session`, { responseType: 'text' });
  }
}
