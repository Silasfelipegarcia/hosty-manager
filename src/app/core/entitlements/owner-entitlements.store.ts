import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EntitlementsService } from '../api/entitlements.service';
import { MeEntitlements, OWNER_FEATURES } from '../models/entitlements.models';

@Injectable({ providedIn: 'root' })
export class OwnerEntitlementsStore {
  private readonly api = inject(EntitlementsService);

  readonly data = signal<MeEntitlements | null>(null);
  readonly loading = signal(false);

  readonly ownerPlan = computed(() => this.data()?.owner.planCode ?? 'FREE');
  readonly ownerPlanName = computed(() => this.data()?.owner.planName ?? 'Free');

  readonly can = (featureKey: string) =>
    computed(() => {
      const ent = this.data()?.owner.features[featureKey];
      return !!ent?.enabled;
    });

  readonly claraAiEnabled = computed(() => {
    const flags = this.data()?.owner.globalFlags ?? {};
    if (flags['clara_ai_enabled'] === false) return false;
    return !!this.data()?.owner.features[OWNER_FEATURES.claraAi]?.enabled;
  });

  async ensureLoaded(): Promise<void> {
    if (this.data() || this.loading()) return;
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.api.getMine());
      this.data.set(res);
    } finally {
      this.loading.set(false);
    }
  }

  featureEnabled(featureKey: string): boolean {
    return !!this.data()?.owner.features[featureKey]?.enabled;
  }

  async refresh(): Promise<void> {
    this.data.set(null);
    await this.ensureLoaded();
  }
}
