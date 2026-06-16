import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { firstValueFrom } from 'rxjs';
import { FinanceService } from '../../core/api/finance.service';
import { PropertiesService } from '../../core/api/properties.service';
import {
  EXPENSE_CATEGORY_LABELS,
  FinanceBreakEvenRow,
  FinanceDashboardBundle,
  FixedCostRow,
} from '../../core/models/finance.models';
import { PropertyDto } from '../../core/models/property.models';
import { GLOBAL_PROPERTY_ID, propertyLabel, propertySelectLabel } from '../../core/utils/property-label.util';
import { buildYtdSeries, yearStatus, ytdTotals } from '../../core/finance/portfolio-analytics';
import { sparklineRange, ytdRangeForYear } from '../../core/finance/finance-query.util';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';
import { CompetencePipe } from '../../shared/pipes/competence.pipe';
import { PortalKpiComponent } from '../../shared/components/portal-kpi/portal-kpi.component';
import { currentCompetence } from '../../core/dates/competence';

const FIXED_TEMPLATES = [
  { name: 'Condomínio', amount: 0 },
  { name: 'Água', amount: 0 },
  { name: 'Luz', amount: 0 },
  { name: 'Internet', amount: 0 },
  { name: 'IPTU', amount: 0 },
] as const;

@Component({
  selector: 'app-finance-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    BaseChartDirective,
    CurrencyBrlPipe,
    CompetencePipe,
    DecimalPipe,
    PortalKpiComponent,
  ],
  templateUrl: './finance.page.html',
  styleUrl: './finance.page.scss',
})
export class FinancePage implements OnInit {
  private readonly finance = inject(FinanceService);
  private readonly props = inject(PropertiesService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly currencyBrl = new CurrencyBrlPipe();

  readonly bundle = signal<FinanceDashboardBundle | null>(null);
  readonly fixedCosts = signal<FixedCostRow[]>([]);
  readonly properties = signal<PropertyDto[]>([]);
  readonly competence = signal(currentCompetence());
  readonly propertyFilter = signal('');
  readonly ytdSeries = signal<ReturnType<typeof buildYtdSeries>>([]);
  readonly breakEvenRows = signal<FinanceBreakEvenRow[]>([]);
  readonly sparklineGross = signal<number[]>([]);
  readonly sparklineProfit = signal<number[]>([]);
  readonly editingFixed = signal<FixedCostRow | null>(null);
  readonly propertySelectLabel = propertySelectLabel;
  readonly propertyLabel = propertyLabel;
  readonly globalPropertyId = GLOBAL_PROPERTY_ID;
  readonly fixedTemplates = FIXED_TEMPLATES;
  readonly expenseCategoryLabels = EXPENSE_CATEGORY_LABELS;

  readonly ytdStatus = computed(() => yearStatus(ytdTotals(this.ytdSeries()).profit));
  readonly ytdSummary = computed(() => ytdTotals(this.ytdSeries()));

  readonly expenseCategories = computed(() => {
    const cats = this.bundle()?.dashboard.expensesByCategory ?? {};
    return Object.entries(cats)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({
        key,
        label: this.expenseCategoryLabels[key] ?? key,
        value,
      }));
  });

  readonly propertyRows = computed(() => {
    const b = this.bundle();
    const props = this.properties();
    if (!b) return [];
    return b.byProperty
      .slice()
      .sort((a, b2) => b2.profit - a.profit)
      .map((r) => ({
        propertyId: r.propertyId,
        propertyName: propertyLabel(r.propertyId, props, r.propertyName),
        gross: r.grossAmount,
        costs: r.totalCosts,
        profit: r.profit,
        margin: r.margin ?? (r.grossAmount > 0 ? r.profit / r.grossAmount : 0),
        nights: r.bookedNights ?? 0,
        occupancy: (r.occupancyRate ?? 0) * 100,
      }));
  });

  readonly platformDonut = computed((): ChartConfiguration<'doughnut'>['data'] => {
    const platforms = this.bundle()?.byPlatform ?? [];
    return {
      labels: platforms.map((p) => p.platform),
      datasets: [
        {
          data: platforms.map((p) => p.grossAmount),
          backgroundColor: ['#0F766E', '#0369A1', '#7C3AED', '#B45309', '#64748B'],
        },
      ],
    };
  });

  ytdChart: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      { label: 'Bruto', data: [], borderColor: '#0F766E', tension: 0.2 },
      { label: 'Lucro', data: [], borderColor: '#0369A1', tension: 0.2 },
      { label: 'Custos', data: [], borderColor: '#B45309', tension: 0.2 },
    ],
  };

  waterfallChart: ChartConfiguration<'bar'>['data'] = {
    labels: ['Bruto', 'Taxas', 'Fixos', 'Variáveis', 'Despesas', 'Lucro'],
    datasets: [{ label: 'R$', data: [], backgroundColor: ['#0F766E', '#F59E0B', '#64748B', '#94A3B8', '#CBD5E1', '#0369A1'] }],
  };

  readonly newFixed = this.fb.nonNullable.group({
    propertyId: ['__GLOBAL__'],
    name: [''],
    amount: [0],
    recurring: [false],
    competence: [currentCompetence()],
  });

  readonly editFixed = this.fb.nonNullable.group({
    name: [''],
    amount: [0],
    recurring: [false],
    competence: [currentCompetence()],
  });

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
    const c = this.competence();
    const propertyId = this.propertyFilter() || undefined;
    const year = Number(c.slice(0, 4));
    const ytdRange = ytdRangeForYear(year);
    const spark = sparklineRange(c, 6);

    const [bundle, costs, properties, ytdRangeRes, sparkRangeRes, breakEven] = await Promise.all([
      firstValueFrom(this.finance.getDashboardBundle(c, propertyId)),
      firstValueFrom(this.finance.listFixedCosts()),
      firstValueFrom(this.props.listOwner()),
      firstValueFrom(this.finance.getDashboardRange(ytdRange.from, ytdRange.to, propertyId)),
      firstValueFrom(this.finance.getDashboardRange(spark.from, spark.to, propertyId)),
      firstValueFrom(this.finance.getBreakEven(c, propertyId)),
    ]);

    this.properties.set(properties.content);
    this.bundle.set(bundle);
    this.fixedCosts.set(costs.content);
    this.breakEvenRows.set(breakEven);

    const ytdBundles = ytdRangeRes.months.map((m) => ({
      competence: m.competence ?? '',
      bundle: m,
    }));
    this.ytdSeries.set(buildYtdSeries(ytdBundles));
    this.sparklineGross.set(sparkRangeRes.months.map((m) => m.dashboard.totalGross));
    this.sparklineProfit.set(sparkRangeRes.months.map((m) => m.dashboard.totalProfit));

    const series = this.ytdSeries();
    this.ytdChart = {
      labels: series.map((p) => p.label),
      datasets: [
        { label: 'Bruto', data: series.map((p) => p.gross), borderColor: '#0F766E', tension: 0.2 },
        { label: 'Lucro', data: series.map((p) => p.profit), borderColor: '#0369A1', tension: 0.2 },
        { label: 'Custos', data: series.map((p) => p.costs), borderColor: '#B45309', tension: 0.2 },
      ],
    };

    const d = bundle.dashboard;
    this.waterfallChart = {
      labels: ['Bruto', 'Taxas', 'Fixos', 'Variáveis', 'Despesas', 'Lucro'],
      datasets: [
        {
          label: 'R$',
          data: [
            d.totalGross,
            -d.totalPlatformFees,
            -d.totalFixedCosts,
            -(d.totalBookingVariableCosts ?? d.totalVariableCosts),
            -(d.totalPropertyExpenses ?? 0),
            d.totalProfit,
          ],
          backgroundColor: ['#0F766E', '#F59E0B', '#64748B', '#94A3B8', '#CBD5E1', '#0369A1'],
        },
      ],
    };
  }

  formatBrl(value: number | null | undefined): string {
    return this.currencyBrl.transform(value);
  }

  grossDeltaPercent(): number | null {
    const cmp = this.bundle()?.dashboard.comparison;
    const gross = this.bundle()?.dashboard.totalGross;
    if (!cmp || gross === undefined) return null;
    const prev = gross - cmp.grossDelta;
    if (prev === 0) return null;
    return (cmp.grossDelta / Math.abs(prev)) * 100;
  }

  marginDeltaPercent(): number | null {
    const cmp = this.bundle()?.dashboard.comparison;
    if (!cmp) return null;
    const prev = (this.bundle()!.dashboard.margin - cmp.marginDelta);
    if (prev === 0) return null;
    return (cmp.marginDelta / Math.abs(prev)) * 100;
  }

  profitDeltaPercent(): number | null {
    const cmp = this.bundle()?.dashboard.comparison;
    const profit = this.bundle()?.dashboard.totalProfit;
    if (!cmp || profit === undefined) return null;
    const prev = profit - cmp.profitDelta;
    if (prev === 0) return null;
    return (cmp.profitDelta / Math.abs(prev)) * 100;
  }

  performanceLink(propertyId: string): string[] {
    return ['/finance'];
  }

  performanceQuery(propertyId: string): Record<string, string> {
    return { tab: 'performance', propertyId, competence: this.competence() };
  }

  caixaLink(): string[] {
    return ['/finance'];
  }

  caixaQuery(): Record<string, string> {
    return { tab: 'caixa', competence: this.competence(), ...(this.propertyFilter() ? { propertyId: this.propertyFilter() } : {}) };
  }

  applyTemplate(t: { name: string; amount: number }): void {
    this.newFixed.patchValue({ name: t.name, amount: t.amount });
  }

  async addFixedCost(): Promise<void> {
    const raw = this.newFixed.getRawValue();
    await firstValueFrom(
      this.finance.addFixedCost({
        propertyId: raw.propertyId,
        name: raw.name,
        amount: raw.amount,
        recurring: raw.recurring,
        competence: raw.recurring ? undefined : raw.competence,
      }),
    );
    this.newFixed.patchValue({ name: '', amount: 0 });
    await this.load();
  }

  openEditFixed(row: FixedCostRow): void {
    this.editingFixed.set(row);
    this.editFixed.patchValue({
      name: row.name,
      amount: row.amount,
      recurring: !!row.recurring,
      competence: row.recurring ? currentCompetence() : row.competence,
    });
  }

  closeEditFixed(): void {
    this.editingFixed.set(null);
  }

  async saveEditFixed(): Promise<void> {
    const row = this.editingFixed();
    if (!row) return;
    const raw = this.editFixed.getRawValue();
    await firstValueFrom(
      this.finance.updateFixedCost(row.id, {
        name: raw.name,
        amount: raw.amount,
        recurring: raw.recurring,
        competence: raw.recurring ? undefined : raw.competence,
      }),
    );
    this.closeEditFixed();
    await this.load();
  }

  async deleteFixed(id: string): Promise<void> {
    await firstValueFrom(this.finance.deleteFixedCost(id));
    await this.load();
  }

  async exportCsv(): Promise<void> {
    const from = this.competence();
    const blob = await firstValueFrom(this.finance.exportCsv(from, from));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staya-finance-${from}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  competenceLabel(value: string): string {
    return value === '9999-12' ? 'Recorrente' : value;
  }
}
