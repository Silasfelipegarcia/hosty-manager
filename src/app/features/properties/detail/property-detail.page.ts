import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { firstValueFrom } from 'rxjs';
import { PropertiesService } from '../../../core/api/properties.service';
import { PlaybookService, ChecklistItem, LocalGuideConfig } from '../../../core/api/playbook.service';
import { FinanceService } from '../../../core/api/finance.service';
import { PropertyExpensesService } from '../../../core/api/property-expenses.service';
import { PropertyDto, LocalRecommendation, PropertyKit, CoOwner } from '../../../core/models/property.models';
import { FixedCostRow } from '../../../core/models/finance.models';
import { PropertyExpense, EXPENSE_CATEGORIES } from '../../../core/models/property-expense.models';
import { buildPropertyHealth } from '../../../core/finance/financial-health';
import { CurrencyBrlPipe } from '../../../shared/pipes/currency-brl.pipe';
import { currentCompetence } from '../../../core/dates/competence';

@Component({
  selector: 'app-property-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatChipsModule,
    CurrencyBrlPipe,
    DecimalPipe,
  ],
  templateUrl: './property-detail.page.html',
  styleUrl: './property-detail.page.scss',
})
export class PropertyDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PropertiesService);
  private readonly playbook = inject(PlaybookService);
  private readonly finance = inject(FinanceService);
  private readonly expensesApi = inject(PropertyExpensesService);

  readonly property = signal<PropertyDto | null>(null);
  readonly recommendations = signal<LocalRecommendation[]>([]);
  readonly kits = signal<PropertyKit[]>([]);
  readonly coOwners = signal<CoOwner[]>([]);
  readonly checklist = signal<ChecklistItem[]>([]);
  readonly localGuide = signal<LocalGuideConfig | null>(null);
  readonly financeCompetence = signal(currentCompetence());
  readonly propertyFixedCosts = signal<FixedCostRow[]>([]);
  readonly propertyExpenses = signal<PropertyExpense[]>([]);
  readonly safeToWithdraw = signal(0);
  readonly financeKpis = signal({ gross: 0, costs: 0, profit: 0, margin: 0 });
  readonly expenseCategories = EXPENSE_CATEGORIES;

  readonly editForm = this.fb.group({
    name: [''],
    description: [''],
    city: [''],
    nightlyRate: [0],
    operationalStatus: [''],
    coverPhotoUrl: [''],
  });

  readonly newRec = this.fb.nonNullable.group({
    name: [''],
    category: [''],
    description: [''],
    address: [''],
    instagramUrl: [''],
    websiteUrl: [''],
    visibleToTenant: [true],
  });

  readonly newKit = this.fb.nonNullable.group({
    name: [''],
    description: [''],
    unitPrice: [0],
    active: [true],
  });

  readonly coOwnerEmail = this.fb.nonNullable.group({ email: [''] });

  readonly guideForm = this.fb.nonNullable.group({
    wifiName: [''],
    wifiPassword: [''],
    houseRules: [''],
    importantInfo: [''],
    gettingThere: [''],
    releasedToTenant: [false],
  });

  readonly newExpense = this.fb.nonNullable.group({
    competence: [currentCompetence()],
    category: ['OTHER'],
    name: [''],
    amount: [0],
    notes: [''],
    spentOn: [this.todayIso()],
  });

  get propertyId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    const res = await firstValueFrom(this.api.listOwner(0, 100));
    const p = res.content.find((x) => x.id === this.propertyId) ?? null;
    this.property.set(p);
    if (p) {
      this.editForm.patchValue(p);
    }
    const [recs, kits, owners, checklist, guide] = await Promise.all([
      firstValueFrom(this.api.listLocalRecommendations(this.propertyId)),
      firstValueFrom(this.api.listKits(this.propertyId)),
      firstValueFrom(this.api.listCoOwners(this.propertyId)),
      firstValueFrom(this.playbook.listChecklist(this.propertyId)).catch(() => []),
      firstValueFrom(this.playbook.getLocalGuide(this.propertyId)).catch(() => null),
    ]);
    this.recommendations.set(recs);
    this.kits.set(kits);
    this.coOwners.set(owners);
    this.checklist.set(checklist);
    this.localGuide.set(guide);
    if (guide) this.guideForm.patchValue(guide);
    await this.loadFinanceTab();
  }

  async loadFinanceTab(): Promise<void> {
    const c = this.financeCompetence();
    const [bundle, allFixed, expenses] = await Promise.all([
      firstValueFrom(this.finance.getDashboardBundle(c)),
      firstValueFrom(this.finance.listFixedCosts()),
      firstValueFrom(this.expensesApi.list(this.propertyId, c)),
    ]);
    const perf = bundle.byProperty.find((row) => row.propertyId === this.propertyId);
    const gross = perf?.grossAmount ?? 0;
    const costs = perf?.totalCosts ?? 0;
    const profit = perf?.profit ?? 0;
    this.financeKpis.set({ gross, costs, profit, margin: gross > 0 ? profit / gross : 0 });
    const fixedForProperty = allFixed.content.filter(
      (row) => row.propertyId === this.propertyId || row.propertyId === '__GLOBAL__',
    );
    this.propertyFixedCosts.set(fixedForProperty);
    this.propertyExpenses.set(expenses);
    const p = this.property();
    if (p) {
      const health = buildPropertyHealth([p], bundle, allFixed.content);
      this.safeToWithdraw.set(health[0]?.safeToWithdraw ?? 0);
    }
  }

  async setFinanceCompetence(value: string): Promise<void> {
    this.financeCompetence.set(value);
    await this.loadFinanceTab();
  }

  async addExpense(): Promise<void> {
    const raw = this.newExpense.getRawValue();
    if (!raw.name.trim()) return;
    await firstValueFrom(this.expensesApi.add(this.propertyId, raw));
    this.newExpense.patchValue({ name: '', amount: 0, notes: '', spentOn: this.todayIso() });
    await this.loadFinanceTab();
  }

  async deleteExpense(id: string): Promise<void> {
    await firstValueFrom(this.expensesApi.delete(this.propertyId, id));
    await this.loadFinanceTab();
  }

  competenceLabel(value: string): string {
    return value === '9999-12' ? 'Recorrente' : value;
  }

  async saveProperty(): Promise<void> {
    const body = { ...this.property(), ...this.editForm.getRawValue() };
    await firstValueFrom(this.api.update(this.propertyId, body as never));
    await this.load();
  }

  async addRecommendation(): Promise<void> {
    await firstValueFrom(this.api.createLocalRecommendation(this.propertyId, this.newRec.getRawValue()));
    this.newRec.reset({ visibleToTenant: true });
    await this.load();
  }

  async deleteRecommendation(id: string): Promise<void> {
    await firstValueFrom(this.api.deleteLocalRecommendation(this.propertyId, id));
    await this.load();
  }

  async addKit(): Promise<void> {
    await firstValueFrom(this.api.createKit(this.propertyId, this.newKit.getRawValue()));
    this.newKit.reset({ active: true, unitPrice: 0 });
    await this.load();
  }

  async inviteCoOwner(): Promise<void> {
    const { email } = this.coOwnerEmail.getRawValue();
    if (!email) return;
    await firstValueFrom(this.api.inviteCoOwner(this.propertyId, email));
    this.coOwnerEmail.reset();
    await this.load();
  }

  async saveGuide(): Promise<void> {
    await firstValueFrom(this.playbook.upsertLocalGuide(this.propertyId, this.guideForm.getRawValue()));
    await this.load();
  }

  async deleteProperty(): Promise<void> {
    if (!confirm('Excluir este imóvel?')) return;
    await firstValueFrom(this.api.delete(this.propertyId));
    window.history.back();
  }

  private todayIso(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
