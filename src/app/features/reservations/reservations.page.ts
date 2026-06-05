import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { firstValueFrom } from 'rxjs';
import { OperationsService } from '../../core/api/operations.service';
import { PropertiesService } from '../../core/api/properties.service';
import { BookingDto, ChatMessage } from '../../core/models/operations.models';
import { PropertyDto } from '../../core/models/property.models';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';

@Component({
  selector: 'app-reservations-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatListModule,
    CurrencyBrlPipe,
  ],
  templateUrl: './reservations.page.html',
  styleUrl: './reservations.page.scss',
})
export class ReservationsPage implements OnInit {
  private readonly ops = inject(OperationsService);
  private readonly props = inject(PropertiesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly bookings = signal<BookingDto[]>([]);
  readonly selected = signal<BookingDto | null>(null);
  readonly messages = signal<ChatMessage[]>([]);
  readonly properties = signal<PropertyDto[]>([]);
  readonly showCreate = signal(false);
  readonly newMessage = signal('');

  readonly createForm = this.fb.nonNullable.group({
    propertyId: ['', Validators.required],
    competence: [this.competenceNow()],
    grossAmount: [0, Validators.required],
    platform: ['DIRECT', Validators.required],
    feeType: ['PERCENTAGE'],
    checkinDate: ['', Validators.required],
    checkoutDate: ['', Validators.required],
    tenantIdentifier: [''],
  });

  ngOnInit(): void {
    if (this.route.snapshot.routeConfig?.path === 'new') {
      this.showCreate.set(true);
    }
    void this.load();
    this.route.paramMap.subscribe((p) => {
      const id = p.get('id');
      if (id && id !== 'new') void this.select(id);
    });
  }

  async load(): Promise<void> {
    const [bookings, properties] = await Promise.all([
      firstValueFrom(this.ops.listBookings(0, 50)),
      firstValueFrom(this.props.listOwner()),
    ]);
    this.bookings.set(bookings.content);
    this.properties.set(properties.content);
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') await this.select(id);
  }

  async select(id: string): Promise<void> {
    const booking = await firstValueFrom(this.ops.getBooking(id));
    this.selected.set(booking);
    const msgs = await firstValueFrom(this.ops.listBookingMessages(id));
    this.messages.set(msgs);
  }

  async create(): Promise<void> {
    if (this.createForm.invalid) return;
    const res = await firstValueFrom(this.ops.createBooking(this.createForm.getRawValue()));
    this.showCreate.set(false);
    const id = res.booking?.id;
    if (id) await this.router.navigate(['/reservations', id]);
    await this.load();
  }

  async ownerConfirm(): Promise<void> {
    const b = this.selected();
    if (!b) return;
    await firstValueFrom(this.ops.ownerConfirm(b.id));
    await this.select(b.id);
    await this.load();
  }

  async approveCheckout(): Promise<void> {
    const b = this.selected();
    if (!b) return;
    await firstValueFrom(this.ops.approveCheckout(b.id));
    await this.select(b.id);
  }

  async sendMessage(): Promise<void> {
    const b = this.selected();
    const body = this.newMessage().trim();
    if (!b || !body) return;
    await firstValueFrom(this.ops.sendBookingMessage(b.id, body));
    this.newMessage.set('');
    await this.select(b.id);
  }

  private competenceNow(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
