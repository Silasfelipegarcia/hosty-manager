import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { firstValueFrom } from 'rxjs';
import { OperationsService } from '../../core/api/operations.service';
import { PropertiesService } from '../../core/api/properties.service';
import { PropertyDto } from '../../core/models/property.models';
import { BookingDto } from '../../core/models/operations.models';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';
import { currentCompetence } from '../../core/dates/competence';
import { OwnerEntitlementsStore } from '../../core/entitlements/owner-entitlements.store';
import { OWNER_FEATURES } from '../../core/models/entitlements.models';

const CHANNELS = [
  { source: 'AIRBNB', platform: 'AIRBNB', label: 'Airbnb', fee: 15 },
  { source: 'BOOKING', platform: 'BOOKING', label: 'Booking.com', fee: 18 },
  { source: 'WHATSAPP', platform: 'DIRECT', label: 'WhatsApp / direto', fee: 0 },
  { source: 'INSTAGRAM', platform: 'DIRECT', label: 'Instagram', fee: 0 },
  { source: 'DIRECT', platform: 'DIRECT', label: 'Venda direta (PIX/transferência)', fee: 0 },
  { source: 'MANUAL', platform: 'OTHER', label: 'Outro canal', fee: 0 },
] as const;

@Component({
  selector: 'app-external-sales-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDividerModule,
    MatCheckboxModule,
    CurrencyBrlPipe,
  ],
  templateUrl: './external-sales.page.html',
  styleUrl: './external-sales.page.scss',
})
export class ExternalSalesPage implements OnInit {
  private readonly ops = inject(OperationsService);
  private readonly props = inject(PropertiesService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snack = inject(MatSnackBar);
  private readonly entitlements = inject(OwnerEntitlementsStore);

  readonly channels = CHANNELS;
  readonly bulkImportEnabled = () => this.entitlements.featureEnabled(OWNER_FEATURES.salesBulkImport);
  readonly properties = signal<PropertyDto[]>([]);
  readonly recentSales = signal<BookingDto[]>([]);
  readonly saving = signal(false);
  readonly editingSale = signal<BookingDto | null>(null);
  readonly deletingId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    propertyId: ['', Validators.required],
    channel: ['WHATSAPP', Validators.required],
    historical: [false],
    competence: [currentCompetence()],
    guestName: [''],
    guestEmail: [''],
    grossAmount: [0, [Validators.required, Validators.min(0.01)]],
    checkinDate: ['', Validators.required],
    checkoutDate: ['', Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    void this.entitlements.ensureLoaded();
    void this.load();
    this.form.controls.channel.valueChanges.subscribe((ch) => this.onChannelChange(ch));
  }

  async load(): Promise<void> {
    const [properties, bookings] = await Promise.all([
      firstValueFrom(this.props.listOwner()),
      firstValueFrom(this.ops.listBookings(0, 30)),
    ]);
    this.properties.set(properties.content);
    const queryPropertyId = this.route.snapshot.queryParamMap.get('propertyId');
    if (queryPropertyId && properties.content.some((p) => p.id === queryPropertyId)) {
      this.form.patchValue({ propertyId: queryPropertyId });
    } else if (properties.content.length && !this.form.controls.propertyId.value) {
      this.form.patchValue({ propertyId: properties.content[0].id });
    }
    const external = bookings.content.filter(
      (b) => b.reservationSource && !['HOSTY', 'ICAL_IMPORT'].includes(b.reservationSource.toUpperCase()),
    );
    const mapped = (external.length ? external : bookings.content.slice(0, 10)).map((b) => ({
      ...b,
      grossAmount: b.grossAmount ?? b.amountToPay,
    }));
    this.recentSales.set(mapped);
  }

  onChannelChange(channel: string): void {
    const cfg = CHANNELS.find((c) => c.source === channel);
    if (!cfg) return;
    // fee hint shown in template via selected channel
  }

  selectedChannel() {
    return CHANNELS.find((c) => c.source === this.form.controls.channel.value);
  }

  competenceFromCheckin(): string {
    const d = this.form.controls.checkinDate.value;
    if (!d) return currentCompetence();
    const [y, m] = d.split('-');
    return `${y}-${m}`;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const channel = CHANNELS.find((c) => c.source === raw.channel)!;
    const tenantIdentifier = raw.guestEmail.trim() || undefined;
    const notes = this.buildNotes(raw.guestName.trim(), raw.notes.trim());
    const editing = this.editingSale();

    this.saving.set(true);
    try {
      const payload = {
        propertyId: raw.propertyId,
        competence: raw.historical ? raw.competence : this.competenceFromCheckin(),
        grossAmount: raw.grossAmount,
        platform: channel.platform,
        feeType: channel.fee > 0 ? 'PERCENTAGE' : 'FIXED',
        percentage: channel.fee > 0 ? channel.fee : undefined,
        fixedAmount: channel.fee === 0 ? 0 : undefined,
        checkinDate: raw.checkinDate,
        checkoutDate: raw.checkoutDate,
        tenantIdentifier,
        reservationSource: channel.source,
        notes: notes || undefined,
      };

      if (editing) {
        await firstValueFrom(
          this.ops.updateOwnerRegisteredSale(editing.id, {
            grossAmount: payload.grossAmount,
            platform: payload.platform,
            feeType: payload.feeType,
            percentage: payload.percentage,
            fixedAmount: payload.fixedAmount,
            checkinDate: payload.checkinDate,
            checkoutDate: payload.checkoutDate,
            competence: raw.historical ? payload.competence : undefined,
            tenantIdentifier: payload.tenantIdentifier,
            reservationSource: payload.reservationSource,
            notes: payload.notes,
          }),
        );
        this.snack.open('Venda atualizada.', 'OK', { duration: 4000 });
        this.cancelEdit();
      } else {
        const res = await firstValueFrom(
          raw.historical ? this.ops.createBackfillBooking(payload) : this.ops.createBooking(payload),
        );
        const bookingId = res.booking?.id;
        let message = raw.historical
          ? 'Estadia histórica registrada no financeiro.'
          : 'Venda registrada no financeiro e na agenda.';
        if (res.pendingTenantInviteCreated) {
          message += ' Convite pendente criado para o hóspede.';
        }
        const snackRef = this.snack.open(message, bookingId ? 'Ver reserva' : 'OK', { duration: 5000 });
        if (bookingId) {
          snackRef.onAction().subscribe(() =>
            void this.router.navigate(['/reservations'], { queryParams: { id: bookingId } }),
          );
        }
        this.form.patchValue({
          guestName: '',
          guestEmail: '',
          grossAmount: 0,
          notes: '',
        });
      }
      await this.load();
    } catch {
      const action = editing ? 'atualizar' : 'registrar';
      this.snack.open(`Não foi possível ${action} a venda. Verifique datas e valor.`, 'OK', { duration: 4000 });
    } finally {
      this.saving.set(false);
    }
  }

  canManageSale(s: BookingDto): boolean {
    if (s.backfill) return true;
    const source = s.reservationSource?.toUpperCase();
    if (!source || ['HOSTY', 'ICAL_IMPORT'].includes(source)) return false;
    if (s.checkedInAt) return false;
    const stage = s.flowStage?.toUpperCase();
    if (stage && ['DISPUTED', 'CANCELLED', 'ABANDONED_NO_CHECKIN', 'COMPLETED'].includes(stage)) return false;
    const ns = s.noShowPenaltyStatus?.toUpperCase();
    if (ns === 'APPLIED' || ns === 'WAIVED') return false;
    return true;
  }

  startEdit(s: BookingDto): void {
    if (!this.canManageSale(s)) return;
    const parsed = this.parseBackfillNotes(s.backfillNotes);
    const source = s.reservationSource?.toUpperCase();
    const channel = CHANNELS.find((c) => c.source === source)?.source ?? 'MANUAL';
    this.editingSale.set(s);
    this.form.patchValue({
      propertyId: s.propertyId,
      channel,
      historical: !!s.backfill,
      competence: s.competence ?? this.competenceFromCheckin(),
      guestName: parsed.guestName,
      guestEmail: s.tenantEmail?.trim() || s.tenantIdentifier?.trim() || '',
      grossAmount: s.grossAmount ?? s.amountToPay ?? 0,
      checkinDate: s.checkinDate ?? '',
      checkoutDate: s.checkoutDate ?? '',
      notes: parsed.notes,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingSale.set(null);
    this.form.reset({
      propertyId: this.properties()[0]?.id ?? '',
      channel: 'WHATSAPP',
      historical: false,
      competence: currentCompetence(),
      guestName: '',
      guestEmail: '',
      grossAmount: 0,
      checkinDate: '',
      checkoutDate: '',
      notes: '',
    });
  }

  async deleteSale(s: BookingDto): Promise<void> {
    if (!this.canManageSale(s)) return;
    const guest = this.guestDisplayName(s);
    const ok = window.confirm(
      `Apagar a venda de ${guest} (${this.formatStayDates(s)})?\n\nEssa ação remove a estadia do financeiro e da agenda.`,
    );
    if (!ok) return;
    this.deletingId.set(s.id);
    try {
      await firstValueFrom(this.ops.deleteBooking(s.id));
      if (this.editingSale()?.id === s.id) this.cancelEdit();
      this.snack.open('Venda apagada.', 'OK', { duration: 4000 });
      await this.load();
    } catch {
      this.snack.open('Não foi possível apagar esta venda.', 'OK', { duration: 4000 });
    } finally {
      this.deletingId.set(null);
    }
  }

  channelLabel(source?: string): string {
    return CHANNELS.find((c) => c.source === source?.toUpperCase())?.label ?? source ?? '—';
  }

  guestDisplayName(s: BookingDto): string {
    const profile = s.tenantFullName?.trim() || s.tenantName?.trim();
    if (profile) return profile;
    const email = s.tenantEmail?.trim() || s.tenantIdentifier?.trim();
    if (email?.includes('@')) return email;
    const fromNotes = this.guestNameFromNotes(s.backfillNotes);
    if (fromNotes) return fromNotes;
    return 'Sem hóspede';
  }

  formatStayDates(s: BookingDto): string {
    const in_ = this.formatShortDate(s.checkinDate);
    const out = this.formatShortDate(s.checkoutDate);
    if (!in_ && !out) return '—';
    return `${in_} → ${out}`;
  }

  private buildNotes(guestName: string, notes: string): string {
    const parts: string[] = [];
    if (guestName) parts.push(`Hóspede: ${guestName}`);
    if (notes) parts.push(notes);
    return parts.join(' · ');
  }

  private guestNameFromNotes(notes?: string): string | null {
    return this.parseBackfillNotes(notes).guestName;
  }

  private parseBackfillNotes(notes?: string): { guestName: string; notes: string } {
    if (!notes?.trim()) return { guestName: '', notes: '' };
    const match = notes.match(/Hóspede:\s*([^·\n]+)/i);
    if (!match) return { guestName: '', notes: notes.trim() };
    const guestName = match[1]?.trim() ?? '';
    const rest = notes.replace(match[0], '').replace(/^[·\s]+/, '').trim();
    return { guestName, notes: rest };
  }

  private formatShortDate(iso?: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  }

}
