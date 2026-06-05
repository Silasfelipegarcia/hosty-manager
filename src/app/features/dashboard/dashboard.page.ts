import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { OperationsService } from '../../core/api/operations.service';
import { FinanceService } from '../../core/api/finance.service';
import { PropertiesService } from '../../core/api/properties.service';
import { BadgeService } from '../../core/api/badge.service';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';
import { CompetencePipe } from '../../shared/pipes/competence.pipe';
import { FinanceDashboardBundle } from '../../core/models/finance.models';
import { StaysSummary } from '../../core/models/operations.models';
import { AccessRequest } from '../../core/models/operations.models';
import { currentCompetence } from '../../core/dates/competence';
import { OWNER_LABELS } from '../../core/i18n/owner-labels';

interface ActionItem {
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
    MatProgressSpinnerModule,
    CurrencyBrlPipe,
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
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly competence = signal(currentCompetence());
  readonly bundle = signal<FinanceDashboardBundle | null>(null);
  readonly stays = signal<StaysSummary | null>(null);
  readonly accessRequests = signal<AccessRequest[]>([]);
  readonly inboxPreview = signal<{ bookingId: string; tenantName?: string; lastMessage?: string }[]>([]);

  readonly actionItems = computed(() => {
    const items: ActionItem[] = [];
    const b = this.badges;
    if (b.ownerActionRequired() > 0) {
      items.push({
        label: 'Aprovar reservas',
        detail: `${b.ownerActionRequired()} ação(ões) na fila`,
        path: '/reservations',
        cta: 'Abrir reservas',
        priority: 1,
      });
    }
    if (b.pendingAccessRequests() > 0) {
      items.push({
        label: 'Pedidos de estadia',
        detail: `${b.pendingAccessRequests()} aguardando você`,
        path: '/reservations',
        cta: 'Ver fila',
        priority: 2,
      });
    }
    if (b.pendingKitOrders() > 0) {
      items.push({
        label: 'Kits pendentes',
        detail: `${b.pendingKitOrders()} pedido(s)`,
        path: '/kits/pending',
        cta: 'Ver kits',
        priority: 3,
      });
    }
    if (b.pendingFieldServices() > 0) {
      items.push({
        label: 'Serviços de campo',
        detail: `${b.pendingFieldServices()} ordem(ns)`,
        path: '/field-services/pending',
        cta: 'Ver serviços',
        priority: 4,
      });
    }
    for (const req of this.accessRequests()) {
      items.push({
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
    this.loading.set(true);
    this.error.set(null);
    try {
      const competence = this.competence();
      const [bundle, stays, access, inbox] = await Promise.all([
        firstValueFrom(this.finance.getDashboardBundle(competence)),
        firstValueFrom(this.ops.getStaysSummary()),
        firstValueFrom(this.properties.listPendingAccessRequests(0, 5)),
        firstValueFrom(this.ops.listMessagesInbox(0, 5)),
        this.badges.refresh(),
      ]);
      this.bundle.set(bundle);
      this.stays.set(stays);
      this.accessRequests.set(access.content);
      this.inboxPreview.set(inbox.content);
    } catch {
      this.error.set('Não foi possível carregar o painel.');
    } finally {
      this.loading.set(false);
    }
  }
}
