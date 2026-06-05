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
import { FinanceDashboardBundle, FixedCostRow } from '../../core/models/finance.models';
import { PropertyDto } from '../../core/models/property.models';
import { GLOBAL_PROPERTY_ID, propertyLabel, propertySelectLabel } from '../../core/utils/property-label.util';
import {
  breakEvenNights,
  buildYtdSeries,
  revenueTarget,
  yearStatus,
  ytdTotals,
  BreakEvenRow,
} from '../../core/finance/portfolio-analytics';
import { fixedCostsForProperty } from '../../core/finance/financial-health';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';
import { CompetencePipe } from '../../shared/pipes/competence.pipe';

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
  ],
  templateUrl: './finance.page.html',
  styleUrl: './finance.page.scss',
})
export class FinancePage implements OnInit {
  private readonly finance = inject(FinanceService);
  private readonly props = inject(PropertiesService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  readonly bundle = signal<FinanceDashboardBundle | null>(null);
  readonly fixedCosts = signal<FixedCostRow[]>([]);
  readonly properties = signal<PropertyDto[]>([]);
  readonly competence = signal(this.nowCompetence());
  readonly ytdSeries = signal<ReturnType<typeof buildYtdSeries>>([]);
  readonly breakEvenRows = signal<BreakEvenRow[]>([]);
  readonly editingFixed = signal<FixedCostRow | null>(null);
  readonly propertySelectLabel = propertySelectLabel;
  readonly propertyLabel = propertyLabel;
  readonly globalPropertyId = GLOBAL_PROPERTY_ID;
  readonly fixedTemplates = FIXED_TEMPLATES;

  readonly ytdStatus = computed(() => yearStatus(ytdTotals(this.ytdSeries()).profit));
  readonly ytdSummary = computed(() => ytdTotals(this.ytdSeries()));

  readonly topPropertyRows = computed(() => {
    const b = this.bundle();
    const props = this.properties();
    if (!b) return [];
    return b.byProperty
      .slice()
      .sort((a, b2) => b2.profit - a.profit)
      .slice(0, 5)
      .map((r) => ({
        propertyId: r.propertyId,
        propertyName: propertyLabel(r.propertyId, props, r.propertyName),
        gross: r.grossAmount,
        profit: r.profit,
      }));
  });
  ytdChart: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      { label: 'Bruto', data: [], borderColor: '#0F766E', tension: 0.2 },
      { label: 'Lucro', data: [], borderColor: '#0369A1', tension: 0.2 },
    ],
  };

  readonly newFixed = this.fb.nonNullable.group({
    propertyId: ['__GLOBAL__'],
    name: [''],
    amount: [0],
    recurring: [false],
    competence: [this.nowCompetence()],
  });

  readonly editFixed = this.fb.nonNullable.group({
    name: [''],
    amount: [0],
    recurring: [false],
    competence: [this.nowCompetence()],
  });

  ngOnInit(): void {
    const competence = this.route.snapshot.queryParamMap.get('competence');
    if (competence) {
      this.competence.set(competence);
    }
    void this.load();
  }

  async load(): Promise<void> {
    const c = this.competence();
    const [bundle, costs, properties, ytdBundles] = await Promise.all([
      firstValueFrom(this.finance.getDashboardBundle(c)),
      firstValueFrom(this.finance.listFixedCosts()),
      firstValueFrom(this.props.listOwner()),
      this.loadYtdBundles(),
    ]);
    this.properties.set(properties.content);
    this.bundle.set(bundle);
    this.fixedCosts.set(costs.content);
    this.ytdSeries.set(buildYtdSeries(ytdBundles));
    this.breakEvenRows.set(this.buildBreakEven(properties.content, bundle, costs.content));

    const series = buildYtdSeries(ytdBundles);
    this.ytdChart = {
      labels: series.map((p) => p.label),
      datasets: [
        { label: 'Bruto', data: series.map((p) => p.gross), borderColor: '#0F766E', tension: 0.2 },
        { label: 'Lucro', data: series.map((p) => p.profit), borderColor: '#0369A1', tension: 0.2 },
      ],
    };
  }

  private async loadYtdBundles() {
    const year = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
    const bundles = await Promise.all(
      months.map(async (competence) => ({
        competence,
        bundle: await firstValueFrom(this.finance.getDashboardBundle(competence)),
      })),
    );
    return bundles;
  }

  private buildBreakEven(
    properties: PropertyDto[],
    bundle: FinanceDashboardBundle,
    fixedCosts: FixedCostRow[],
  ): BreakEvenRow[] {
    const byId = new Map(bundle.byProperty.map((p) => [p.propertyId, p]));
    const count = Math.max(properties.length, 1);
    return properties.map((p) => {
      const perf = byId.get(p.id);
      const monthlyFixed = fixedCostsForProperty(fixedCosts, p.id, count);
      const nightly = p.nightlyRate ?? 0;
      const target = revenueTarget(nightly);
      const actual = perf?.grossAmount ?? 0;
      return {
        propertyId: p.id,
        propertyName: p.name,
        monthlyFixed,
        nightlyRate: nightly,
        breakEvenNights: breakEvenNights(monthlyFixed, nightly),
        revenueTarget30: target,
        actualGross: actual,
        gap: actual - target,
      };
    });
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
      competence: row.recurring ? this.nowCompetence() : row.competence,
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
    a.download = `hosty-finance-${from}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  setCompetence(value: string): void {
    this.competence.set(value);
    void this.load();
  }

  competenceLabel(value: string): string {
    return value === '9999-12' ? 'Recorrente' : value;
  }

  private nowCompetence(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
