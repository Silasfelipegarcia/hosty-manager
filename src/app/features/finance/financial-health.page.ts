import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
import { buildYtdSeries, yearStatus, ytdTotals } from '../../core/finance/portfolio-analytics';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';
import { CompetencePipe } from '../../shared/pipes/competence.pipe';

@Component({
  selector: 'app-financial-health-page',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatChipsModule,
    BaseChartDirective,
    CurrencyBrlPipe,
    CompetencePipe,
    DecimalPipe,
  ],
  templateUrl: './financial-health.page.html',
  styleUrl: './financial-health.page.scss',
})
export class FinancialHealthPage implements OnInit {
  private readonly finance = inject(FinanceService);
  private readonly props = inject(PropertiesService);

  readonly competence = signal(this.nowCompetence());
  readonly health = signal<PropertyFinancialHealth[]>([]);
  readonly loading = signal(true);
  readonly ytdSeries = signal<ReturnType<typeof buildYtdSeries>>([]);

  readonly summary = computed(() => portfolioSummary(this.health()));
  readonly ytdStatus = computed(() => yearStatus(ytdTotals(this.ytdSeries()).profit));

  ytdChart: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{ label: 'Lucro YTD', data: [], borderColor: '#0F766E', tension: 0.2 }],
  };

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const c = this.competence();
      const year = new Date().getFullYear();
      const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
      const [properties, bundle, costs, ...ytdBundles] = await Promise.all([
        firstValueFrom(this.props.listOwner()),
        firstValueFrom(this.finance.getDashboardBundle(c)),
        firstValueFrom(this.finance.listFixedCosts()),
        ...months.map((competence) => firstValueFrom(this.finance.getDashboardBundle(competence)).then((b) => ({ competence, bundle: b }))),
      ]);
      this.health.set(buildPropertyHealth(properties.content, bundle, costs.content));
      const series = buildYtdSeries(ytdBundles);
      this.ytdSeries.set(series);
      this.ytdChart = {
        labels: series.map((p) => p.label),
        datasets: [{ label: 'Lucro YTD', data: series.map((p) => p.profit), borderColor: '#0F766E', tension: 0.2 }],
      };
    } finally {
      this.loading.set(false);
    }
  }

  setCompetence(value: string): void {
    this.competence.set(value);
    void this.load();
  }

  statusClass(status: PropertyFinancialHealth['status']): string {
    return `status-${status}`;
  }

  private nowCompetence(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
