import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { firstValueFrom } from 'rxjs';
import { OperationsService } from '../../core/api/operations.service';
import { FinanceService } from '../../core/api/finance.service';
import { PropertiesService } from '../../core/api/properties.service';
import { BadgeService } from '../../core/api/badge.service';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';
import { CompetencePipe } from '../../shared/pipes/competence.pipe';
import { FinanceDashboardBundle } from '../../core/models/finance.models';
import { PropertyDto } from '../../core/models/property.models';
import { StaysSummary } from '../../core/models/operations.models';
import { AccessRequest } from '../../core/models/operations.models';
import { propertyLabel } from '../../core/utils/property-label.util';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
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
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly competence = signal(this.currentCompetence());
  readonly bundle = signal<FinanceDashboardBundle | null>(null);
  readonly stays = signal<StaysSummary | null>(null);
  readonly accessRequests = signal<AccessRequest[]>([]);
  readonly inboxPreview = signal<{ bookingId: string; tenantName?: string; lastMessage?: string }[]>([]);
  readonly ownerProperties = signal<PropertyDto[]>([]);
  readonly propertyLabel = propertyLabel;

  platformChart: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [{ data: [] }] };
  platformChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const competence = this.competence();
      const [bundle, stays, access, inbox, badges, ownerProps] = await Promise.all([
        firstValueFrom(this.finance.getDashboardBundle(competence)),
        firstValueFrom(this.ops.getStaysSummary()),
        firstValueFrom(this.properties.listPendingAccessRequests(0, 5)),
        firstValueFrom(this.ops.listMessagesInbox(0, 5)),
        this.badges.refresh().then(() => this.badges),
        firstValueFrom(this.properties.listOwner()),
      ]);
      this.ownerProperties.set(ownerProps.content);
      this.bundle.set(bundle);
      this.stays.set(stays);
      this.accessRequests.set(access.content);
      this.inboxPreview.set(inbox.content);
      void badges;

      const platforms = bundle.byPlatform ?? [];
      this.platformChart = {
        labels: platforms.map((p) => p.platform),
        datasets: [{ data: platforms.map((p) => p.grossAmount), backgroundColor: ['#0F766E', '#0B5ED7', '#14B8A6', '#64748B'] }],
      };
    } catch {
      this.error.set('Não foi possível carregar o painel.');
    } finally {
      this.loading.set(false);
    }
  }

  async exportCsv(): Promise<void> {
    const from = this.competence();
    const blob = await firstValueFrom(this.finance.exportCsv(from, from));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hosty-finance-${from}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private currentCompetence(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
