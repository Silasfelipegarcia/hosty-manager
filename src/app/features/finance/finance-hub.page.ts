import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { FinancePage } from './finance.page';
import { FinancialHealthPage } from './financial-health.page';
import { PropertyCrmPage } from './property-crm.page';
import { OWNER_LABELS } from '../../core/i18n/owner-labels';
import { FinanceFilterBarComponent } from '../../shared/components/finance-filter-bar/finance-filter-bar.component';
import { OwnerEntitlementsStore } from '../../core/entitlements/owner-entitlements.store';
import { OWNER_FEATURES } from '../../core/models/entitlements.models';

export type FinanceTab = 'mes' | 'caixa' | 'performance';

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
  private readonly entitlements = inject(OwnerEntitlementsStore);

  readonly labels = OWNER_LABELS;
  readonly tabIndex = signal(0);

  readonly visibleTabs = computed<FinanceTab[]>(() => {
    const tabs: FinanceTab[] = ['mes'];
    if (this.entitlements.featureEnabled(OWNER_FEATURES.financeCaixa)) tabs.push('caixa');
    if (this.entitlements.featureEnabled(OWNER_FEATURES.financePerformance)) tabs.push('performance');
    return tabs;
  });

  readonly activeTab = computed<FinanceTab>(() => this.visibleTabs()[this.tabIndex()] ?? 'mes');
  readonly showCaixa = computed(() => this.visibleTabs().includes('caixa'));
  readonly showPerformance = computed(() => this.visibleTabs().includes('performance'));

  ngOnInit(): void {
    void this.entitlements.ensureLoaded().then(() => this.syncTab());
    this.route.queryParamMap.subscribe(() => this.syncTab());
    this.route.data.subscribe(() => this.syncTab());
  }

  private syncTab(): void {
    const fromQuery = this.route.snapshot.queryParamMap.get('tab') as FinanceTab | null;
    const fromData = this.route.snapshot.data['tab'] as FinanceTab | undefined;
    const requested = fromQuery ?? fromData ?? 'mes';
    const tabs = this.visibleTabs();
    const tab = tabs.includes(requested) ? requested : 'mes';
    if (requested !== tab && (fromQuery || fromData)) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
    this.tabIndex.set(Math.max(0, tabs.indexOf(tab)));
  }

  onTabChange(index: number): void {
    const tab = this.visibleTabs()[index] ?? 'mes';
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'mes' ? null : tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
