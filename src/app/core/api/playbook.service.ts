import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ChecklistItem {
  id?: string;
  title: string;
  required?: boolean;
  photoRequired?: boolean;
  photoInstruction?: string;
  stage?: string;
}

export interface PropertyInstruction {
  id?: string;
  title: string;
  text: string;
  videoUrl?: string;
}

export interface LocalGuideConfig {
  wifiName?: string;
  wifiPassword?: string;
  houseRules?: string;
  importantInfo?: string;
  gettingThere?: string;
  gettingThereVideoUrl?: string;
  gateAccessVideoUrl?: string;
  gateAccessInfo?: string;
  releasedToTenant?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlaybookService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/admin/properties`;

  listChecklist(propertyId: string) {
    return this.http.get<ChecklistItem[]>(`${this.base}/${propertyId}/checklist-items`);
  }

  addChecklistItem(propertyId: string, body: ChecklistItem) {
    return this.http.post<ChecklistItem>(`${this.base}/${propertyId}/checklist-items`, body);
  }

  listInstructions(propertyId: string) {
    return this.http.get<PropertyInstruction[]>(`${this.base}/${propertyId}/instructions`);
  }

  addInstruction(propertyId: string, body: PropertyInstruction) {
    return this.http.post<PropertyInstruction>(`${this.base}/${propertyId}/instructions`, body);
  }

  getLocalGuide(propertyId: string) {
    return this.http.get<LocalGuideConfig>(`${this.base}/${propertyId}/local-guide`);
  }

  upsertLocalGuide(propertyId: string, body: LocalGuideConfig) {
    return this.http.put<LocalGuideConfig>(`${this.base}/${propertyId}/local-guide`, body);
  }

  clonePlaybook(targetPropertyId: string, sourcePropertyId: string, replaceTarget = false) {
    return this.http.post(`${this.base}/${targetPropertyId}/clone-playbook`, {
      sourcePropertyId,
      replaceTarget,
    });
  }
}
