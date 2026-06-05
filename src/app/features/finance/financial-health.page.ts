import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { firstValueFrom } from 'rxjs';
import { FinanceService } from '../../core/api/finance.service';
import { PropertiesService } from '../../core/api/properties.service';
import {
  buildPropertyHealth,
  portfolioSummary,
  PropertyFinancialHealth,
} from '../../core/finance/financial-health';
import { sparklineRange } from '../../core/finance/finance-query.util';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';
import { CompetencePipe } from '../../shared/pipes/competence.pipe';
import { PortalSkeletonComponent } from '../../shared/components/portal-skeleton/portal-skeleton.component';
import { currentCompetence } from '../../core/dates/competence';

@Component({
  selector: 'app-financial-health-page',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatChipsModule,
    BaseChartDirective,
    CurrencyBrlPipe,
    CompetencePipe,
    PortalSkeletonComponent,
    DecimalPipe,
  ],
  templateUrl: './financial-health.page.html',
  styleUrl: './financial-health.page.scss',
})
export class FinancialHealthPage implements OnInit {
  private readonly finance = inject(FinanceService);
  private readonly props = inject(PropertiesService);
  private readonly route = inject(ActivatedRoute);

  readonly competence = signal(currentCompetence());
  readonly propertyFilter = signal('');
  readonly health = signal<PropertyFinancialHealth[]>([]);
  readonly loading = signal(true);
  readonly sparklines = signal<Record<string, number[]>>({});

  readonly filteredHealth = computed(() => {
    const id = this.propertyFilter();
    const all = this.health();
    return id ? all.filter((h) => h.propertyId === id) : all;
  });

  readonly summary = computed(() => portfolioSummary(this.filteredHealth()));

  ngOnInit(): void {
    this.syncFromRoute();
    this.route.queryParamMap.subscribe(() => {
      this.syncFromRoute();
      void this.load();
    });
    void this.load();
  }

  private syncFromRoute(): void {
    const competence = this.route.snapshot.queryParamMap.get('competence');
    if (competence) this.competence.set(competence);
    this.propertyFilter.set(this.route.snapshot.queryParamMap.get('propertyId') ?? '');
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const c = this.competence();
      const propertyId = this.propertyFilter() || undefined;
      const spark = sparklineRange(c, 6);
      const [properties, bundle, costs, rangeRes] = await Promise.all([
        firstValueFrom(this.props.listOwner()),
        firstValueFrom(this.finance.getDashboardBundle(c, propertyId)),
        firstValueFrom(this.finance.listFixedCosts()),
        firstValueFrom(this.finance.getDashboardRange(spark.from, spark.to, propertyId)),
      ]);
      const rows = buildPropertyHealth(properties.content, bundle, costs.content);
      this.health.set(
        rows.map((row) => {
          const perf = bundle.byProperty.find((p) => p.propertyId === row.propertyId);
          return {
            ...row,
            propertyExpenses: perf?.propertyExpenses ?? 0,
            bookingVariableCosts: perf?.bookingVariableCosts ?? 0,
          };
        }),
      );
      const sparkMap: Record<string, number[]> = {};
      for (const prop of properties.content) {
        sparkMap[prop.id] = rangeRes.months.map((m) => {
          const perf = m.byProperty.find((p) => p.propertyId === prop.id);
          return perf?.profit ?? 0;
        });
      }
      this.sparklines.set(sparkMap);
    } finally {
      this.loading.set(false);
    }
  }

  sparklineFor(propertyId: string): ChartConfiguration<'line'>['data'] {
    const data = this.sparklines()[propertyId] ?? [];
    return {
      labels: data.map((_, i) => `${i + 1}`),
      datasets: [{ data, borderColor: '#0369A1', tension: 0.3, pointRadius: 0 }],
    };
  }

  statusClass(status: PropertyFinancialHealth['status']): string {
    return `status-${status}`;
  }
}
