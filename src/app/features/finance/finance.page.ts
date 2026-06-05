import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { firstValueFrom } from 'rxjs';
import { FinanceService } from '../../core/api/finance.service';
import { PropertiesService } from '../../core/api/properties.service';
import { FinanceDashboardBundle, FixedCostRow } from '../../core/models/finance.models';
import { PropertyDto } from '../../core/models/property.models';
import { GLOBAL_PROPERTY_ID, propertyLabel, propertySelectLabel } from '../../core/utils/property-label.util';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';
import { CompetencePipe } from '../../shared/pipes/competence.pipe';

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
  private readonly fb = inject(FormBuilder);

  readonly bundle = signal<FinanceDashboardBundle | null>(null);
  readonly fixedCosts = signal<FixedCostRow[]>([]);
  readonly properties = signal<PropertyDto[]>([]);
  readonly competence = signal(this.nowCompetence());
  readonly propertySelectLabel = propertySelectLabel;
  readonly propertyLabel = propertyLabel;
  readonly globalPropertyId = GLOBAL_PROPERTY_ID;

  propertyChart: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [{ label: 'Lucro', data: [] }] };

  readonly newFixed = this.fb.nonNullable.group({
    propertyId: ['__GLOBAL__'],
    name: [''],
    amount: [0],
    recurring: [false],
    competence: [this.nowCompetence()],
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    const c = this.competence();
    const [bundle, costs, properties] = await Promise.all([
      firstValueFrom(this.finance.getDashboardBundle(c)),
      firstValueFrom(this.finance.listFixedCosts()),
      firstValueFrom(this.props.listOwner()),
    ]);
    this.properties.set(properties.content);
    this.bundle.set(bundle);
    this.fixedCosts.set(costs.content);
    const rows = bundle.byProperty ?? [];
    const props = properties.content;
    this.propertyChart = {
      labels: rows.map((r) => propertyLabel(r.propertyId, props, r.propertyName)),
      datasets: [{ label: 'Lucro', data: rows.map((r) => r.profit), backgroundColor: '#0F766E' }],
    };
  }

  async addFixedCost(): Promise<void> {
    await firstValueFrom(this.finance.addFixedCost(this.newFixed.getRawValue()));
    this.newFixed.patchValue({ name: '', amount: 0 });
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

  private nowCompetence(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
