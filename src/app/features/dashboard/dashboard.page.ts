import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PortalKpiComponent } from '../../shared/components/portal-kpi/portal-kpi.component';
import { firstValueFrom } from 'rxjs';
import { OperationsService } from '../../core/api/operations.service';
import { FinanceService } from '../../core/api/finance.service';
import { PropertiesService } from '../../core/api/properties.service';
import { BadgeService } from '../../core/api/badge.service';
import { CompetencePipe } from '../../shared/pipes/competence.pipe';
import { FinanceDashboardBundle } from '../../core/models/finance.models';
import { activeStaysCount, StaysSummary } from '../../core/models/operations.models';
import { AccessRequest } from '../../core/models/operations.models';
import { currentCompetence } from '../../core/dates/competence';
import { OWNER_LABELS } from '../../core/i18n/owner-labels';

interface ActionItem {
  trackKey: string;
  label: string;
  detail: string;
  path: string;
  cta: string;
  priority: number;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    PortalKpiComponent,
    CompetencePipe,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage implements OnInit {
  private readonly ops = inject(OperationsService);
  private readonly finance = inject(FinanceService);
  private readonly properties = inject(PropertiesService);

  readonly badges = inject(BadgeService);
  readonly labels = OWNER_LABELS;
  readonly loadingFinance = signal(false);
  readonly loadingStays = signal(true);
  readonly financeError = signal<string | null>(null);
  readonly competence = signal(currentCompetence());
  readonly bundle = signal<FinanceDashboardBundle | null>(null);
  readonly stays = signal<StaysSummary | null>(null);
  readonly accessRequests = signal<AccessRequest[]>([]);
  readonly inboxPreview = signal<{ bookingId: string; tenantName?: string; lastMessage?: string }[]>([]);
  readonly activeStaysCount = activeStaysCount;

  readonly profitSparkline = computed(() => {
    const rows = this.bundle()?.byProperty ?? [];
    if (rows.length < 2) return [];
    return rows.map((r) => Math.max(0, r.profit));
  });

  readonly profitMargin = computed(() => {
    const margin = this.bundle()?.dashboard?.margin;
    return margin != null && margin > 0 ? Math.round(margin) : null;
  });

  readonly profitLabel = computed(() => {
    const profit = this.bundle()?.dashboard?.totalProfit;
    if (profit == null) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profit);
  });

  readonly actionItems = computed(() => {
    const items: ActionItem[] = [];
    const b = this.badges;
    if (b.ownerActionRequired() > 0) {
      items.push({
        trackKey: 'owner-actions',
        label: 'Aprovar reservas',
        detail: `${b.ownerActionRequired()} ação(ões) na fila`,
        path: '/reservations',
        cta: 'Abrir reservas',
        priority: 1,
      });
    }
    if (b.pendingAccessRequests() > 0) {
      items.push({
        trackKey: 'pending-access',
        label: 'Pedidos de estadia',
        detail: `${b.pendingAccessRequests()} aguardando você`,
        path: '/reservations',
        cta: 'Ver fila',
        priority: 2,
      });
    }
    if (b.pendingKitOrders() > 0) {
      items.push({
        trackKey: 'pending-kits',
        label: 'Kits pendentes',
        detail: `${b.pendingKitOrders()} pedido(s)`,
        path: '/kits/pending',
        cta: 'Ver kits',
        priority: 3,
      });
    }
    if (b.pendingFieldServices() > 0) {
      items.push({
        trackKey: 'pending-field-services',
        label: 'Serviços de campo',
        detail: `${b.pendingFieldServices()} ordem(ns)`,
        path: '/field-services/pending',
        cta: 'Ver serviços',
        priority: 4,
      });
    }
    for (const req of this.accessRequests()) {
      items.push({
        trackKey: `access-${req.id}`,
        label: req.tenantName || req.tenantEmail || 'Hóspede',
        detail: `${req.propertyName} — ${req.requestedCheckinDate}`,
        path: '/reservations',
        cta: 'Aprovar',
        priority: 2,
      });
    }
    return items.sort((a, b) => a.priority - b.priority).slice(0, 6);
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.financeError.set(null);
    void this.loadStays();
    void this.loadAccess();
    void this.loadInbox();
    void this.loadFinance();
  }

  private async loadStays(): Promise<void> {
    this.loadingStays.set(true);
    try {
      this.stays.set(await firstValueFrom(this.ops.getStaysSummary()));
    } catch {
      // KPI de estadias fica em 0 até atualizar
    } finally {
      this.loadingStays.set(false);
    }
  }

  private async loadAccess(): Promise<void> {
    try {
      const access = await firstValueFrom(this.properties.listPendingAccessRequests(0, 5));
      this.accessRequests.set(access.content);
    } catch {
      // lista de ações usa badges do shell
    }
  }

  private async loadInbox(): Promise<void> {
    try {
      const inbox = await firstValueFrom(this.ops.listMessagesInbox(0, 5));
      this.inboxPreview.set(inbox.content);
    } catch {
      // inbox vazio até atualizar
    }
  }

  private async loadFinance(): Promise<void> {
    this.loadingFinance.set(true);
    this.financeError.set(null);
    try {
      const bundle = await firstValueFrom(this.finance.getDashboardBundle(this.competence()));
      this.bundle.set(bundle);
    } catch {
      this.financeError.set('Lucro indisponível no momento.');
    } finally {
      this.loadingFinance.set(false);
    }
  }
}
