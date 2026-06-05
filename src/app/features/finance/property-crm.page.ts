import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { firstValueFrom } from 'rxjs';
import { FinanceService } from '../../core/api/finance.service';
import { PropertiesService } from '../../core/api/properties.service';
import { PropertyExpensesService } from '../../core/api/property-expenses.service';
import { PropertyExpense } from '../../core/models/property-expense.models';
import { PropertyDto } from '../../core/models/property.models';
import {
  buildCrmInsights,
  buildMonthlyInsights,
  buildPeriodMonths,
  buildPropertyCrmRows,
  isPeriodValid,
  monthLabel,
  PeriodMonthBundle,
  presetPeriod,
  PropertyCrmRow,
} from '../../core/finance/property-crm-insights';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';
import { PortalSkeletonComponent } from '../../shared/components/portal-skeleton/portal-skeleton.component';

@Component({
  selector: 'app-property-crm-page',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatChipsModule,
    BaseChartDirective,
    CurrencyBrlPipe,
    PortalSkeletonComponent,
    DecimalPipe,
    DatePipe,
  ],
  templateUrl: './property-crm.page.html',
  styleUrl: './property-crm.page.scss',
})
export class PropertyCrmPage implements OnInit {
  private readonly finance = inject(FinanceService);
  private readonly props = inject(PropertiesService);
  private readonly expensesApi = inject(PropertyExpensesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly from = signal(presetPeriod('6m').from);
  readonly to = signal(presetPeriod('6m').to);
  readonly propertyFilter = signal('');
  readonly activePreset = signal<'3m' | '6m' | '12m' | 'ytd' | ''>('6m');
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly properties = signal<PropertyDto[]>([]);
  readonly rows = signal<PropertyCrmRow[]>([]);
  readonly expenses = signal<PropertyExpense[]>([]);

  readonly periodInvalid = computed(() => !isPeriodValid(this.from(), this.to()));
  readonly focusMode = computed(() => !!this.propertyFilter());

  readonly filteredRows = computed(() => {
    const id = this.propertyFilter();
    const all = this.rows();
    return id ? all.filter((r) => r.propertyId === id) : all;
  });

  readonly filteredExpenses = computed(() => {
    const id = this.propertyFilter();
    const all = this.expenses();
    return id ? all.filter((e) => e.propertyId === id) : all;
  });

  readonly focusProperty = computed(() => {
    const id = this.propertyFilter();
    if (!id) return null;
    return this.properties().find((p) => p.id === id) ?? null;
  });

  private readonly monthBundles = signal<PeriodMonthBundle[]>([]);

  readonly insights = computed(() => {
    const propId = this.propertyFilter() || undefined;
    const monthly = buildMonthlyInsights(this.monthBundles(), propId);
    return buildCrmInsights(this.filteredRows(), monthly);
  });

  readonly monthChart = computed((): ChartConfiguration<'bar'>['data'] => {
    const propId = this.propertyFilter() || undefined;
    const monthly = buildMonthlyInsights(this.monthBundles(), propId)
      .slice()
      .sort((a, b) => a.competence.localeCompare(b.competence));
    return {
      labels: monthly.map((m) => m.label),
      datasets: [
        { label: 'Bruto', data: monthly.map((m) => m.gross), backgroundColor: '#0F766E' },
        { label: 'Lucro', data: monthly.map((m) => m.profit), backgroundColor: '#0369A1' },
      ],
    };
  });

  readonly expensesByCategory = computed(() => {
    const totals = new Map<string, number>();
    for (const e of this.filteredExpenses()) {
      const key = e.category || 'OTHER';
      totals.set(key, (totals.get(key) ?? 0) + e.amount);
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, amount]) => ({ key, amount }));
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
    const propertyId = this.route.snapshot.queryParamMap.get('propertyId');
    if (propertyId) this.propertyFilter.set(propertyId);
    const competence = this.route.snapshot.queryParamMap.get('competence');
    if (competence) {
      this.to.set(competence);
      this.from.set(competence);
      this.activePreset.set('');
    }
  }

  async load(): Promise<void> {
    if (this.periodInvalid()) {
      this.loading.set(false);
      this.loadError.set(null);
      return;
    }
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const from = this.from();
      const to = this.to();
      const propertyId = this.propertyFilter() || undefined;

      const [properties, fixedCosts, expenseList, rangeRes] = await Promise.all([
        firstValueFrom(this.props.listOwner()),
        firstValueFrom(this.finance.listFixedCosts(0, 100)),
        firstValueFrom(this.expensesApi.listOwner(from, to)),
        firstValueFrom(this.finance.getDashboardRange(from, to, propertyId)),
      ]);

      const bundles: PeriodMonthBundle[] = rangeRes.months.map((bundle) => ({
        competence: bundle.competence ?? '',
        bundle,
      }));

      this.properties.set(properties.content);
      this.monthBundles.set(bundles);
      this.expenses.set(expenseList);
      this.rows.set(buildPropertyCrmRows(properties.content, bundles, fixedCosts.content, expenseList));
    } catch (err) {
      this.monthBundles.set([]);
      this.rows.set([]);
      this.expenses.set([]);
      const msg = err instanceof Error ? err.message : 'Falha ao carregar performance';
      this.loadError.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  applyPreset(preset: '3m' | '6m' | '12m' | 'ytd'): void {
    const p = presetPeriod(preset);
    this.from.set(p.from);
    this.to.set(p.to);
    this.activePreset.set(preset);
    void this.load();
  }

  setFrom(value: string): void {
    if (!value) return;
    this.from.set(value);
    this.activePreset.set('');
    void this.load();
  }

  setTo(value: string): void {
    if (!value) return;
    this.to.set(value);
    this.activePreset.set('');
    void this.load();
  }

  setPropertyFilter(value: string): void {
    this.propertyFilter.set(value);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: value ? { propertyId: value } : { propertyId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  clearPropertyFilter(): void {
    this.setPropertyFilter('');
  }

  statusClass(status: PropertyCrmRow['status']): string {
    return `status-${status}`;
  }

  periodLabel(): string {
    return `${monthLabel(this.from())} — ${monthLabel(this.to())}`;
  }
}
