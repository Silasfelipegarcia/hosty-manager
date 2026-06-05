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
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { firstValueFrom } from 'rxjs';
import { OperationsService } from '../../core/api/operations.service';
import { PropertiesService } from '../../core/api/properties.service';
import { PropertyDto } from '../../core/models/property.models';
import { BookingDto } from '../../core/models/operations.models';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';

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
    MatChipsModule,
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

  readonly channels = CHANNELS;
  readonly properties = signal<PropertyDto[]>([]);
  readonly recentSales = signal<BookingDto[]>([]);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    propertyId: ['', Validators.required],
    channel: ['WHATSAPP', Validators.required],
    historical: [false],
    competence: [this.currentCompetence()],
    guestName: [''],
    guestEmail: [''],
    grossAmount: [0, [Validators.required, Validators.min(0.01)]],
    checkinDate: ['', Validators.required],
    checkoutDate: ['', Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
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
    if (!d) return this.currentCompetence();
    const [y, m] = d.split('-');
    return `${y}-${m}`;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const channel = CHANNELS.find((c) => c.source === raw.channel)!;
    const tenantIdentifier = raw.guestEmail.trim() || undefined;

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
        notes: raw.notes.trim() || undefined,
      };
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
        snackRef.onAction().subscribe(() => void this.router.navigate(['/reservations', bookingId]));
      }
      this.form.patchValue({
        guestName: '',
        guestEmail: '',
        grossAmount: 0,
        notes: '',
      });
      await this.load();
    } catch {
      this.snack.open('Não foi possível registrar a venda. Verifique datas e valor.', 'OK', { duration: 4000 });
    } finally {
      this.saving.set(false);
    }
  }

  channelLabel(source?: string): string {
    return CHANNELS.find((c) => c.source === source?.toUpperCase())?.label ?? source ?? '—';
  }

  private currentCompetence(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
