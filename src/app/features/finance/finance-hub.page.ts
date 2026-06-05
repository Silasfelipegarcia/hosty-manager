import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { FinancePage } from './finance.page';
import { FinancialHealthPage } from './financial-health.page';
import { PropertyCrmPage } from './property-crm.page';
import { OWNER_LABELS } from '../../core/i18n/owner-labels';
import { FinanceFilterBarComponent } from '../../shared/components/finance-filter-bar/finance-filter-bar.component';

export type FinanceTab = 'mes' | 'caixa' | 'performance';

const TAB_INDEX: Record<FinanceTab, number> = { mes: 0, caixa: 1, performance: 2 };
const INDEX_TAB: FinanceTab[] = ['mes', 'caixa', 'performance'];

@Component({
  selector: 'app-finance-hub-page',
  standalone: true,
  imports: [MatTabsModule, FinanceFilterBarComponent, FinancePage, FinancialHealthPage, PropertyCrmPage],
  templateUrl: './finance-hub.page.html',
  styleUrl: './finance-hub.page.scss',
})
export class FinanceHubPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly labels = OWNER_LABELS;
  readonly tabIndex = signal(0);
  readonly activeTab = computed<FinanceTab>(() => INDEX_TAB[this.tabIndex()] ?? 'mes');

  ngOnInit(): void {
    this.syncTab();
    this.route.queryParamMap.subscribe(() => this.syncTab());
    this.route.data.subscribe(() => this.syncTab());
  }

  private syncTab(): void {
    const fromQuery = this.route.snapshot.queryParamMap.get('tab') as FinanceTab | null;
    const fromData = this.route.snapshot.data['tab'] as FinanceTab | undefined;
    const tab = fromQuery ?? fromData ?? 'mes';
    this.tabIndex.set(TAB_INDEX[tab] ?? 0);
  }

  onTabChange(index: number): void {
    const tab = INDEX_TAB[index] ?? 'mes';
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'mes' ? null : tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
