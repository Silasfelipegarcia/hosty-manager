import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  monthLabel,
  PeriodMonthBundle,
  presetPeriod,
  PropertyCrmRow,
} from '../../core/finance/property-crm-insights';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';

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

  readonly from = signal(presetPeriod('6m').from);
  readonly to = signal(presetPeriod('6m').to);
  readonly propertyFilter = signal('');
  readonly loading = signal(true);
  readonly properties = signal<PropertyDto[]>([]);
  readonly rows = signal<PropertyCrmRow[]>([]);
  readonly expenses = signal<PropertyExpense[]>([]);

  readonly insights = computed(() => {
    const bundles = this.monthBundles();
    const monthly = buildMonthlyInsights(bundles);
    return buildCrmInsights(this.rows(), monthly);
  });

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

  private readonly monthBundles = signal<PeriodMonthBundle[]>([]);

  monthChart: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ label: 'Bruto', data: [], backgroundColor: '#0F766E' }],
  };

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const from = this.from();
      const to = this.to();
      const months = buildPeriodMonths(from, to);
      const propFilter = this.propertyFilter() || undefined;

      const [properties, fixedCosts, expenseList, ...bundles] = await Promise.all([
        firstValueFrom(this.props.listOwner()),
        firstValueFrom(this.finance.listFixedCosts(0, 200)),
        firstValueFrom(this.expensesApi.listOwner(from, to, propFilter)),
        ...months.map((competence) =>
          firstValueFrom(this.finance.getDashboardBundle(competence)).then((bundle) => ({ competence, bundle })),
        ),
      ]);

      this.properties.set(properties.content);
      this.monthBundles.set(bundles);
      this.expenses.set(expenseList);

      const crmRows = buildPropertyCrmRows(properties.content, bundles, fixedCosts.content, expenseList);
      this.rows.set(crmRows);

      const monthly = buildMonthlyInsights(bundles);
      this.monthChart = {
        labels: monthly.map((m) => m.label),
        datasets: [{ label: 'Bruto', data: monthly.map((m) => m.gross), backgroundColor: '#0F766E' }],
      };
    } finally {
      this.loading.set(false);
    }
  }

  applyPreset(preset: '3m' | '6m' | '12m' | 'ytd'): void {
    const p = presetPeriod(preset);
    this.from.set(p.from);
    this.to.set(p.to);
    void this.load();
  }

  setFrom(value: string): void {
    this.from.set(value);
    void this.load();
  }

  setTo(value: string): void {
    this.to.set(value);
    void this.load();
  }

  setPropertyFilter(value: string): void {
    this.propertyFilter.set(value);
    void this.load();
  }

  statusClass(status: PropertyCrmRow['status']): string {
    return `status-${status}`;
  }

  periodLabel(): string {
    return `${monthLabel(this.from())} — ${monthLabel(this.to())}`;
  }
}
