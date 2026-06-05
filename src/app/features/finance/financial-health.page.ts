import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { firstValueFrom } from 'rxjs';
import { FinanceService } from '../../core/api/finance.service';
import { PropertiesService } from '../../core/api/properties.service';
import {
  buildPropertyHealth,
  portfolioSummary,
  PropertyFinancialHealth,
} from '../../core/finance/financial-health';
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
  private readonly route = inject(ActivatedRoute);

  readonly competence = signal(this.nowCompetence());
  readonly propertyFilter = signal('');
  readonly health = signal<PropertyFinancialHealth[]>([]);
  readonly loading = signal(true);

  readonly filteredHealth = computed(() => {
    const id = this.propertyFilter();
    const all = this.health();
    return id ? all.filter((h) => h.propertyId === id) : all;
  });

  readonly summary = computed(() => portfolioSummary(this.filteredHealth()));

  ngOnInit(): void {
    const propertyId = this.route.snapshot.queryParamMap.get('propertyId');
    if (propertyId) {
      this.propertyFilter.set(propertyId);
    }
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const c = this.competence();
      const [properties, bundle, costs] = await Promise.all([
        firstValueFrom(this.props.listOwner()),
        firstValueFrom(this.finance.getDashboardBundle(c)),
        firstValueFrom(this.finance.listFixedCosts()),
      ]);
      this.health.set(buildPropertyHealth(properties.content, bundle, costs.content));
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
