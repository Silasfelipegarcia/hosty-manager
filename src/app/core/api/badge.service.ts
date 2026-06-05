import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OperationsService } from './operations.service';

@Injectable({ providedIn: 'root' })
export class BadgeService {
  private readonly ops = inject(OperationsService);

  readonly ownerActionRequired = signal(0);
  readonly pendingAccessRequests = signal(0);
  readonly pendingKitOrders = signal(0);
  readonly pendingFieldServices = signal(0);

  get totalBadges(): number {
    return (
      this.ownerActionRequired() +
      this.pendingAccessRequests() +
      this.pendingKitOrders() +
      this.pendingFieldServices()
    );
  }

  async refresh(): Promise<void> {
    try {
      const counts = await firstValueFrom(this.ops.getCounts());
      this.ownerActionRequired.set(counts.ownerActionRequired ?? 0);
      this.pendingAccessRequests.set(counts.ownerPendingAccessRequests ?? 0);
      this.pendingKitOrders.set(counts.pendingKitOrders ?? 0);
      this.pendingFieldServices.set(counts.pendingFieldServices ?? 0);
    } catch {
      // silent — shell still usable
    }
  }
}
