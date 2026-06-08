import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FieldServicesService } from './field-services.service';
import { OperationsService } from './operations.service';

@Injectable({ providedIn: 'root' })
export class BadgeService {
  private readonly ops = inject(OperationsService);
  private readonly fieldServices = inject(FieldServicesService);

  readonly ownerActionRequired = signal(0);
  readonly pendingAccessRequests = signal(0);
  readonly pendingKitOrders = signal(0);
  readonly pendingFieldServices = signal(0);

  /** Pendências operacionais reais (sem contar o mesmo item duas vezes). */
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
      const [counts, kits, fields] = await Promise.all([
        firstValueFrom(this.ops.getCounts()),
        firstValueFrom(this.ops.listPendingKitOrders(0, 1)),
        firstValueFrom(this.fieldServices.listPending(0, 1)),
      ]);
      this.ownerActionRequired.set(counts.ownerActionRequired ?? 0);
      this.pendingAccessRequests.set(counts.ownerPendingAccessRequests ?? 0);
      this.pendingKitOrders.set(kits.totalElements ?? 0);
      this.pendingFieldServices.set(fields.totalElements ?? 0);
    } catch {
      // silent — shell still usable
    }
  }
}
