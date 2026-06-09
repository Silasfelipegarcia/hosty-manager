import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { firstValueFrom } from 'rxjs';
import {
  BillingEventView,
  FeatureFlagView,
  PlatformAdminService,
  PlatformDashboard,
  PlanView,
  UserSummary,
} from '../../core/api/platform-admin.service';
import { PortalSkeletonComponent } from '../../shared/components/portal-skeleton/portal-skeleton.component';

@Component({
  selector: 'app-platform-admin',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatSlideToggleModule,
    PortalSkeletonComponent,
  ],
  templateUrl: './platform-admin.page.html',
  styleUrl: './platform-admin.page.scss',
})
export class PlatformAdminPage implements OnInit {
  private readonly api = inject(PlatformAdminService);

  readonly loading = signal(true);
  readonly dashboard = signal<PlatformDashboard | null>(null);
  readonly ownerPlans = signal<PlanView[]>([]);
  readonly guestPlans = signal<PlanView[]>([]);
  readonly flags = signal<FeatureFlagView[]>([]);
  readonly users = signal<UserSummary[]>([]);
  readonly events = signal<BillingEventView[]>([]);
  userQuery = '';
  readonly selectedPlanByUser = signal<Record<string, string>>({});

  ngOnInit(): void {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const [dash, owner, guest, fl, ev] = await Promise.all([
        firstValueFrom(this.api.dashboard()),
        firstValueFrom(this.api.plans('OWNER')),
        firstValueFrom(this.api.plans('GUEST')),
        firstValueFrom(this.api.flags()),
        firstValueFrom(this.api.billingEvents(30)),
      ]);
      this.dashboard.set(dash);
      this.ownerPlans.set(owner);
      this.guestPlans.set(guest);
      this.flags.set(fl);
      this.events.set(ev);
    } finally {
      this.loading.set(false);
    }
  }

  async searchUsers(): Promise<void> {
    const list = await firstValueFrom(this.api.searchUsers(this.userQuery));
    this.users.set(list);
  }

  async toggleFlag(flag: FeatureFlagView, enabled: boolean): Promise<void> {
    const updated = await firstValueFrom(this.api.setFlag(flag.featureKey, enabled));
    this.flags.update((items) => items.map((f) => (f.featureKey === updated.featureKey ? updated : f)));
  }

  async assignPlan(user: UserSummary): Promise<void> {
    const planId = this.selectedPlanByUser()[user.id];
    if (!planId) return;
    const isOwner = user.roles.toUpperCase().includes('OWNER');
    if (isOwner) {
      await firstValueFrom(this.api.assignOwnerPlan(user.id, planId));
    } else {
      await firstValueFrom(this.api.assignGuestPlan(user.id, planId));
    }
    await this.searchUsers();
  }

  planOptionsForUser(user: UserSummary): PlanView[] {
    return user.roles.toUpperCase().includes('TENANT') ? this.guestPlans() : this.ownerPlans();
  }

  setUserPlan(userId: string, planId: string): void {
    this.selectedPlanByUser.update((m) => ({ ...m, [userId]: planId }));
  }

  formatBrl(cents: number): string {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
