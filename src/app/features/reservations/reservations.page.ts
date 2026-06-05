import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { firstValueFrom } from 'rxjs';
import { OperationsService } from '../../core/api/operations.service';
import { PropertiesService } from '../../core/api/properties.service';
import {
  AccessRequest,
  BookingDto,
  ChatMessage,
  KitOrder,
  PropertyAvailabilityItem,
  TenantSearchResult,
} from '../../core/models/operations.models';
import { PropertyDto } from '../../core/models/property.models';
import {
  bookingNeedsOwnerAction,
  displayAmount,
  displayGuestEmail,
  displayGuestName,
  flowStageDisplayLabel,
  flowStageKey,
  flowStageTone,
  formatStayDates,
  isAwaitingOwnerCheckinAck,
  isWaitingCheckoutApproval,
  matchesReservationFilter,
  ownerCanCancelOrDelete,
  reservationSourceLabel,
  ReservationFilter,
  tenantCancellationPending,
} from '../../core/utils/booking-flow-stage.util';
import {
  buildMonthCalendar,
  CalendarCell,
  monthRange,
  WEEKDAY_LABELS,
} from '../../core/utils/reservation-calendar.util';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';

const FILTER_OPTIONS: { id: ReservationFilter; label: string }[] = [
  { id: 'approval', label: 'Aprovação' },
  { id: 'all', label: 'Todas' },
  { id: 'waiting', label: 'Aguardando' },
  { id: 'in_progress', label: 'Em estadia' },
  { id: 'completed', label: 'Encerradas' },
];

const PAGE_SIZE = 30;

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
    MatChipsModule,
    MatDividerModule,
    MatAutocompleteModule,
    MatButtonToggleModule,
    CurrencyBrlPipe,
    DatePipe,
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

  readonly filterOptions = FILTER_OPTIONS;
  readonly weekdayLabels = WEEKDAY_LABELS;
  readonly bookings = signal<BookingDto[]>([]);
  readonly selected = signal<BookingDto | null>(null);
  readonly messages = signal<ChatMessage[]>([]);
  readonly kitOrders = signal<KitOrder[]>([]);
  readonly properties = signal<PropertyDto[]>([]);
  readonly accessRequests = signal<AccessRequest[]>([]);
  readonly occupancy = signal<PropertyAvailabilityItem[]>([]);
  readonly showCreate = signal(false);
  readonly newMessage = signal('');
  readonly activeFilter = signal<ReservationFilter>('all');
  readonly propertyFilter = signal('');
  readonly calendarDayFilter = signal('');
  readonly viewMode = signal<'list' | 'calendar'>('list');
  readonly calendarMonth = signal(this.competenceNow());
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly hasMore = signal(false);
  readonly bookingsPage = signal(0);
  readonly staysActive = signal(0);
  readonly staysUpcoming = signal(0);
  readonly ownerActions = signal(0);
  readonly tenantResults = signal<TenantSearchResult[]>([]);

  readonly createForm = this.fb.nonNullable.group({
    propertyId: ['', Validators.required],
    competence: [this.competenceNow()],
    grossAmount: [0, Validators.required],
    platform: ['DIRECT', Validators.required],
    feeType: ['PERCENTAGE'],
    checkinDate: ['', Validators.required],
    checkoutDate: ['', Validators.required],
    tenantIdentifier: [''],
    reservationSource: ['DIRECT'],
  });

  readonly calendarCells = computed(() =>
    buildMonthCalendar(this.calendarMonth(), this.bookings(), this.propertyFilter() || undefined),
  );

  readonly filteredBookings = computed(() => {
    const filter = this.activeFilter();
    const propId = this.propertyFilter();
    const day = this.calendarDayFilter();
    return this.bookings().filter((b) => {
      if (propId && b.propertyId !== propId) return false;
      if (day && !this.bookingOnDay(b, day)) return false;
      return matchesReservationFilter(b, filter);
    });
  });

  readonly filterCounts = computed(() => {
    const all = this.bookings();
    const propId = this.propertyFilter();
    const scoped = propId ? all.filter((b) => b.propertyId === propId) : all;
    const counts: Record<ReservationFilter, number> = {
      approval: scoped.filter((b) => matchesReservationFilter(b, 'approval')).length + this.accessRequests().length,
      all: scoped.length,
      waiting: scoped.filter((b) => matchesReservationFilter(b, 'waiting')).length,
      in_progress: scoped.filter((b) => matchesReservationFilter(b, 'in_progress')).length,
      completed: scoped.filter((b) => matchesReservationFilter(b, 'completed')).length,
    };
    return counts;
  });

  readonly displayGuestName = displayGuestName;
  readonly displayGuestEmail = displayGuestEmail;
  readonly displayAmount = displayAmount;
  readonly formatStayDates = formatStayDates;
  readonly reservationSourceLabel = reservationSourceLabel;
  readonly flowStageDisplayLabel = flowStageDisplayLabel;
  readonly flowStageKey = flowStageKey;
  readonly flowStageTone = flowStageTone;
  readonly bookingNeedsOwnerAction = bookingNeedsOwnerAction;
  readonly isWaitingCheckoutApproval = isWaitingCheckoutApproval;
  readonly isAwaitingOwnerCheckinAck = isAwaitingOwnerCheckinAck;
  readonly ownerCanCancelOrDelete = ownerCanCancelOrDelete;
  readonly tenantCancellationPending = tenantCancellationPending;

  ngOnInit(): void {
    if (this.route.snapshot.routeConfig?.path === 'new') {
      this.showCreate.set(true);
    }
    void this.load(true);
    this.route.paramMap.subscribe((p) => {
      const id = p.get('id');
      if (id && id !== 'new') void this.select(id);
    });
  }

  async load(reset = true): Promise<void> {
    if (reset) {
      this.loading.set(true);
      this.bookingsPage.set(0);
    }
    try {
      const page = this.bookingsPage();
      const [bookingsRes, properties, counts, stays, access] = await Promise.all([
        firstValueFrom(this.ops.listBookings(page, PAGE_SIZE)),
        firstValueFrom(this.props.listOwner()),
        firstValueFrom(this.ops.getCounts()),
        firstValueFrom(this.ops.getStaysSummary()),
        firstValueFrom(this.props.listPendingAccessRequests(0, 20)),
      ]);

      if (reset) {
        this.bookings.set(bookingsRes.content);
      } else {
        this.bookings.update((cur) => [...cur, ...bookingsRes.content]);
      }
      this.hasMore.set(bookingsRes.hasNext);
      this.properties.set(properties.content);
      this.accessRequests.set(access.content);
      this.ownerActions.set(counts.ownerActionRequired ?? 0);
      this.staysActive.set(stays.active ?? 0);
      this.staysUpcoming.set(stays.upcoming ?? 0);

      await this.loadOccupancy();

      const id = this.route.snapshot.paramMap.get('id');
      if (id && id !== 'new') await this.select(id);
    } finally {
      this.loading.set(false);
      this.loadingMore.set(false);
    }
  }

  async loadMore(): Promise<void> {
    if (!this.hasMore() || this.loadingMore()) return;
    this.loadingMore.set(true);
    this.bookingsPage.update((p) => p + 1);
    await this.load(false);
  }

  async loadOccupancy(): Promise<void> {
    const { year, month } = this.parseMonth(this.calendarMonth());
    const range = monthRange(year, month);
    try {
      const summary = await firstValueFrom(this.ops.getPortfolioSummary(range.from, range.to));
      this.occupancy.set(summary.properties ?? []);
    } catch {
      this.occupancy.set([]);
    }
  }

  async select(id: string): Promise<void> {
    const [booking, msgs, kits] = await Promise.all([
      firstValueFrom(this.ops.getBooking(id)),
      firstValueFrom(this.ops.listBookingMessages(id)),
      firstValueFrom(this.ops.listBookingKitOrders(id)),
    ]);
    this.selected.set(booking);
    this.messages.set(msgs);
    this.kitOrders.set(kits);
  }

  setFilter(filter: ReservationFilter): void {
    this.activeFilter.set(filter);
  }

  setPropertyFilter(value: string): void {
    this.propertyFilter.set(value);
    void this.loadOccupancy();
  }

  setViewMode(mode: 'list' | 'calendar'): void {
    this.viewMode.set(mode);
    if (mode === 'calendar') {
      void this.loadOccupancy();
    }
  }

  setCalendarMonth(value: string): void {
    this.calendarMonth.set(value);
    this.calendarDayFilter.set('');
    void this.loadOccupancy();
  }

  selectCalendarDay(cell: CalendarCell): void {
    if (!cell.inMonth) return;
    this.calendarDayFilter.set(this.calendarDayFilter() === cell.date ? '' : cell.date);
  }

  propertyName(id: string): string {
    return this.properties().find((p) => p.id === id)?.name ?? id;
  }

  occupancyLabel(item: PropertyAvailabilityItem): string {
    const name = this.propertyName(item.propertyId);
    const pct = Math.round((item.occupancyRate ?? 0) * 100);
    return `${name}: ${pct}% ocupado`;
  }

  kitOrderTotal(order: KitOrder): number {
    if (order.lines?.length) {
      return order.lines.reduce((s, l) => s + l.quantity * l.unitPriceSnapshot, 0);
    }
    return order.requestedTotal ?? order.approvedTotal ?? 0;
  }

  async searchTenants(query: string): Promise<void> {
    const q = query.trim();
    if (q.length < 2) {
      this.tenantResults.set([]);
      return;
    }
    const results = await firstValueFrom(this.ops.searchTenants(q));
    this.tenantResults.set(results);
  }

  selectTenant(tenant: TenantSearchResult): void {
    this.createForm.patchValue({ tenantIdentifier: tenant.email });
    this.tenantResults.set([]);
  }

  async create(): Promise<void> {
    if (this.createForm.invalid) return;
    const raw = this.createForm.getRawValue();
    const res = await firstValueFrom(
      this.ops.createBooking({
        ...raw,
        platform: raw.reservationSource,
        reservationSource: raw.reservationSource,
      }),
    );
    this.showCreate.set(false);
    const id = res.booking?.id;
    if (id) await this.router.navigate(['/reservations', id]);
    await this.load(true);
  }

  async ownerConfirm(): Promise<void> {
    const b = this.selected();
    if (!b) return;
    await firstValueFrom(this.ops.ownerConfirm(b.id));
    await this.select(b.id);
    await this.load(true);
  }

  async approveCheckout(): Promise<void> {
    const b = this.selected();
    if (!b) return;
    await firstValueFrom(this.ops.approveCheckout(b.id));
    await this.select(b.id);
    await this.load(true);
  }

  async rejectCheckout(): Promise<void> {
    const b = this.selected();
    if (!b) return;
    await firstValueFrom(this.ops.rejectCheckout(b.id));
    await this.select(b.id);
    await this.load(true);
  }

  async acknowledgeCheckin(): Promise<void> {
    const b = this.selected();
    if (!b) return;
    await firstValueFrom(this.ops.acknowledgeCheckin(b.id));
    await this.select(b.id);
    await this.load(true);
  }

  async cancelBooking(): Promise<void> {
    const b = this.selected();
    if (!b || !confirm('Cancelar esta reserva?')) return;
    await firstValueFrom(this.ops.cancelBookingByOwner(b.id));
    await this.load(true);
    this.selected.set(null);
    await this.router.navigate(['/reservations']);
  }

  async approveCancellation(): Promise<void> {
    const b = this.selected();
    if (!b) return;
    await firstValueFrom(this.ops.approveTenantCancellation(b.id));
    await this.select(b.id);
    await this.load(true);
  }

  async rejectCancellation(): Promise<void> {
    const b = this.selected();
    if (!b) return;
    await firstValueFrom(this.ops.rejectTenantCancellation(b.id));
    await this.select(b.id);
    await this.load(true);
  }

  async approveKitOrder(order: KitOrder): Promise<void> {
    const total = this.kitOrderTotal(order);
    await firstValueFrom(this.ops.approveKitOrder(order.id, total));
    const b = this.selected();
    if (b) await this.select(b.id);
  }

  async rejectKitOrder(order: KitOrder): Promise<void> {
    await firstValueFrom(this.ops.rejectKitOrder(order.id));
    const b = this.selected();
    if (b) await this.select(b.id);
  }

  async approveAccessRequest(req: AccessRequest): Promise<void> {
    await firstValueFrom(this.props.approveAccessRequest(req.id));
    await this.load(true);
  }

  async sendMessage(): Promise<void> {
    const b = this.selected();
    const body = this.newMessage().trim();
    if (!b || !body) return;
    await firstValueFrom(this.ops.sendBookingMessage(b.id, body));
    this.newMessage.set('');
    await this.select(b.id);
  }

  financeLink(): string[] {
    return ['/finance'];
  }

  financeQueryParams(booking: BookingDto): { competence?: string } {
    return booking.competence ? { competence: booking.competence } : {};
  }

  private bookingOnDay(booking: BookingDto, isoDate: string): boolean {
    const checkin = booking.checkinDate;
    const checkout = booking.checkoutDate;
    if (!checkin || !checkout) return false;
    return isoDate >= checkin && isoDate < checkout;
  }

  private parseMonth(value: string): { year: number; month: number } {
    const [y, m] = value.split('-').map(Number);
    return { year: y, month: m };
  }

  private competenceNow(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
