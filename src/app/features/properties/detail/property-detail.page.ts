import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { firstValueFrom } from 'rxjs';
import { PropertiesService } from '../../../core/api/properties.service';
import { PlaybookService, ChecklistItem, LocalGuideConfig } from '../../../core/api/playbook.service';
import { PropertyDto, LocalRecommendation, PropertyKit, CoOwner } from '../../../core/models/property.models';

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
  ],
  templateUrl: './property-detail.page.html',
  styleUrl: './property-detail.page.scss',
})
export class PropertyDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PropertiesService);
  private readonly playbook = inject(PlaybookService);

  readonly property = signal<PropertyDto | null>(null);
  readonly recommendations = signal<LocalRecommendation[]>([]);
  readonly kits = signal<PropertyKit[]>([]);
  readonly coOwners = signal<CoOwner[]>([]);
  readonly checklist = signal<ChecklistItem[]>([]);
  readonly localGuide = signal<LocalGuideConfig | null>(null);

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
}
