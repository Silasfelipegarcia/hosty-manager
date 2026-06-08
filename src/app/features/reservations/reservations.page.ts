import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { OwnerProfileStore } from '../../core/profile/owner-profile.store';
import { firstValueFrom } from 'rxjs';
import { OperationsService } from '../../core/api/operations.service';
import { PropertiesService } from '../../core/api/properties.service';
import {
  activeStaysCount,
  upcomingStaysCount,
  AccessRequest,
  BookingDto,
  KitOrder,
  PropertyAvailabilityItem,
} from '../../core/models/operations.models';
import { currentCompetence } from '../../core/dates/competence';
import { OWNER_LABELS } from '../../core/i18n/owner-labels';
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
import { PortalSkeletonComponent } from '../../shared/components/portal-skeleton/portal-skeleton.component';
import { ProfileAvatarComponent } from '../../shared/components/profile-avatar/profile-avatar.component';

import {
  RESERVATION_FILTER_OPTIONS,
  RESERVATIONS_LIST_UI_PAGE_SIZE,
  RESERVATIONS_PAGE_SIZE,
} from './reservations.constants';

const PAGE_SIZE = RESERVATIONS_PAGE_SIZE;
const LIST_UI_PAGE_SIZE = RESERVATIONS_LIST_UI_PAGE_SIZE;

@Component({
  selector: 'app-reservations-page',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDividerModule,
    MatButtonToggleModule,
    MatIconModule,
    CurrencyBrlPipe,
    PortalSkeletonComponent,
    ProfileAvatarComponent,
    DatePipe,
  ],
  templateUrl: './reservations.page.html',
  styleUrl: './reservations.page.scss',
})
export class ReservationsPage implements OnInit {
  private readonly ops = inject(OperationsService);
  private readonly props = inject(PropertiesService);
  readonly profileStore = inject(OwnerProfileStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly labels = OWNER_LABELS;
  readonly filterOptions = RESERVATION_FILTER_OPTIONS;
  readonly weekdayLabels = WEEKDAY_LABELS;
  readonly bookings = signal<BookingDto[]>([]);
  readonly selected = signal<BookingDto | null>(null);
  readonly selectedAccessRequest = signal<AccessRequest | null>(null);
  readonly kitOrders = signal<KitOrder[]>([]);
  readonly properties = signal<PropertyDto[]>([]);
  readonly accessRequests = signal<AccessRequest[]>([]);
  readonly occupancy = signal<PropertyAvailabilityItem[]>([]);
  readonly activeFilter = signal<ReservationFilter>('all');
  readonly propertyFilter = signal('');
  readonly calendarDayFilter = signal('');
  readonly viewMode = signal<'list' | 'calendar'>('list');
  readonly calendarMonth = signal(currentCompetence());
  readonly loading = signal(true);
  readonly detailLoading = signal(false);
  readonly loadingMore = signal(false);
  readonly hasMore = signal(false);
  readonly bookingsPage = signal(0);
  readonly listUiPage = signal(0);
  readonly staysActive = signal(0);
  readonly staysUpcoming = signal(0);
  readonly ownerActions = signal(0);
  readonly ownerPendingAccess = signal(0);
  readonly approvalPendingTotal = computed(
    () => this.ownerActions() + this.ownerPendingAccess(),
  );
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

  readonly totalListPages = computed(() => {
    const count = this.filteredBookings().length;
    return Math.max(1, Math.ceil(count / LIST_UI_PAGE_SIZE));
  });

  readonly paginatedBookings = computed(() => {
    const all = this.filteredBookings();
    const start = this.listUiPage() * LIST_UI_PAGE_SIZE;
    return all.slice(start, start + LIST_UI_PAGE_SIZE);
  });

  readonly listPageLabel = computed(() => {
    const total = this.filteredBookings().length;
    const access =
      this.activeFilter() === 'approval' ? this.scopedAccessRequests().length : 0;
    if (total === 0 && access === 0) return 'Nenhuma estadia neste filtro';
    if (total === 0 && access > 0) {
      return `${access} pedido${access === 1 ? '' : 's'} de estadia aguardando`;
    }
    const from = this.listUiPage() * LIST_UI_PAGE_SIZE + 1;
    const to = Math.min(total, (this.listUiPage() + 1) * LIST_UI_PAGE_SIZE);
    const range = `${from}–${to} de ${total}`;
    return access > 0 ? `${range} · ${access} pedido${access === 1 ? '' : 's'}` : range;
  });

  readonly canGoNextListPage = computed(() => {
    if (this.listUiPage() < this.totalListPages() - 1) return true;
    return this.hasMore() && !this.loadingMore();
  });

  readonly scopedAccessRequests = computed(() => {
    const propId = this.propertyFilter();
    const all = this.accessRequests();
    return propId ? all.filter((r) => r.propertyId === propId) : all;
  });

  readonly filterCounts = computed(() => {
    const all = this.bookings();
    const propId = this.propertyFilter();
    const scoped = propId ? all.filter((b) => b.propertyId === propId) : all;
    const pendingBookings = scoped.filter((b) => bookingNeedsOwnerAction(b)).length;
    const accessPending = this.scopedAccessRequests().length;
    const approvalTotal = propId
      ? pendingBookings + accessPending
      : this.approvalPendingTotal();
    const counts: Record<ReservationFilter, number> = {
      approval: approvalTotal,
      all: scoped.length,
      waiting: scoped.filter((b) => matchesReservationFilter(b, 'waiting')).length,
      in_progress: scoped.filter((b) => matchesReservationFilter(b, 'in_progress')).length,
      completed: scoped.filter((b) => matchesReservationFilter(b, 'completed')).length,
    };
    return counts;
  });

  readonly listShowsEmpty = computed(() => {
    if (this.filteredBookings().length > 0) return false;
    if (this.activeFilter() === 'approval' && this.scopedAccessRequests().length > 0) return false;
    return true;
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
    void this.profileStore.ensureLoaded();
    void this.load(true);
    this.route.queryParamMap.subscribe((params) => {
      const filter = params.get('filter');
      if (filter && this.isReservationFilter(filter)) {
        this.activeFilter.set(filter);
      }
      const accessId = params.get('accessId');
      if (accessId) {
        this.selected.set(null);
        this.kitOrders.set([]);
        const req = this.accessRequests().find((r) => r.id === accessId);
        this.selectedAccessRequest.set(req ?? null);
        return;
      }
      this.selectedAccessRequest.set(null);
      const id = params.get('id');
      if (!id || id === 'new') {
        this.selected.set(null);
        this.kitOrders.set([]);
        return;
      }
      const preview = this.bookings().find((b) => b.id === id);
      if (preview) this.selected.set(preview);
      void this.loadBookingDetail(id);
    });
  }

  async load(reset = true): Promise<void> {
    if (reset) {
      this.loading.set(true);
      this.bookingsPage.set(0);
    }
    try {
      const page = this.bookingsPage();
      const [bookingsRes, actionQueue, properties, counts, stays, access] = await Promise.all([
        firstValueFrom(this.ops.listBookings(page, PAGE_SIZE)),
        firstValueFrom(this.ops.listOwnerActionQueue(0, 50)),
        firstValueFrom(this.props.listOwner()),
        firstValueFrom(this.ops.getCounts()),
        firstValueFrom(this.ops.getStaysSummary()),
        firstValueFrom(this.props.listPendingAccessRequests(0, 50)),
      ]);

      const merged = this.mergeBookingsById([
        ...(actionQueue.content ?? []),
        ...bookingsRes.content,
      ]);
      if (reset) {
        this.bookings.set(this.sortBookingsActionFirst(merged));
      } else {
        this.bookings.update((cur) =>
          this.sortBookingsActionFirst(this.mergeBookingsById([...cur, ...bookingsRes.content])),
        );
      }
      this.hasMore.set(bookingsRes.hasNext);
      this.properties.set(properties.content);
      this.accessRequests.set(access.content);
      this.ownerActions.set(counts.ownerActionRequired ?? 0);
      this.ownerPendingAccess.set(counts.ownerPendingAccessRequests ?? 0);
      this.staysActive.set(activeStaysCount(stays));
      this.staysUpcoming.set(upcomingStaysCount(stays));

      await this.loadOccupancy();
      this.clampListUiPage();
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

  openBooking(booking: BookingDto): void {
    if (
      this.route.snapshot.queryParamMap.get('id') === booking.id &&
      !this.selectedAccessRequest()
    ) {
      return;
    }
    this.selectedAccessRequest.set(null);
    this.selected.set(booking);
    this.kitOrders.set([]);
    void this.router.navigate(['/reservations'], {
      queryParams: { id: booking.id, accessId: null },
      queryParamsHandling: 'merge',
    });
  }

  openAccessRequest(req: AccessRequest): void {
    if (this.selectedAccessRequest()?.id === req.id) return;
    this.selected.set(null);
    this.kitOrders.set([]);
    this.selectedAccessRequest.set(req);
    void this.router.navigate(['/reservations'], {
      queryParams: { accessId: req.id, id: null },
      queryParamsHandling: 'merge',
    });
  }

  async loadBookingDetail(id: string): Promise<void> {
    this.detailLoading.set(true);
    try {
      const [booking, kits] = await Promise.all([
        firstValueFrom(this.ops.getBooking(id)),
        firstValueFrom(this.ops.listBookingKitOrders(id)),
      ]);
      if (this.selected()?.id !== id && this.route.snapshot.queryParamMap.get('id') !== id) return;
      this.selected.set(booking);
      this.kitOrders.set(kits);
    } finally {
      this.detailLoading.set(false);
    }
  }

  /** Recarrega painel após ação do proprietário. */
  private async refreshBooking(id: string): Promise<void> {
    await this.loadBookingDetail(id);
  }

  setFilter(filter: ReservationFilter): void {
    this.activeFilter.set(filter);
    this.resetListUiPage();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filter: filter === 'all' ? null : filter },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  accessRequestInitials(req: AccessRequest): string {
    const name = this.accessRequestGuestName(req);
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  accessRequestMessagesLink(req: AccessRequest): string[] {
    return ['/messages'];
  }

  accessRequestMessagesQuery(req: AccessRequest): { bookingId?: string } {
    return req.operationBookingId ? { bookingId: req.operationBookingId } : {};
  }

  setPropertyFilter(value: string): void {
    this.propertyFilter.set(value);
    this.resetListUiPage();
    void this.loadOccupancy();
  }

  prevListPage(): void {
    if (this.listUiPage() > 0) {
      this.listUiPage.update((p) => p - 1);
    }
  }

  async nextListPage(): Promise<void> {
    if (this.listUiPage() < this.totalListPages() - 1) {
      this.listUiPage.update((p) => p + 1);
      return;
    }
    if (!this.hasMore() || this.loadingMore()) return;
    await this.loadMore();
    if (this.listUiPage() < this.totalListPages() - 1) {
      this.listUiPage.update((p) => p + 1);
    }
  }

  private resetListUiPage(): void {
    this.listUiPage.set(0);
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
    this.resetListUiPage();
    void this.loadOccupancy();
  }

  selectCalendarDay(cell: CalendarCell): void {
    if (!cell.inMonth) return;
    this.calendarDayFilter.set(this.calendarDayFilter() === cell.date ? '' : cell.date);
    this.resetListUiPage();
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

  async ownerConfirm(): Promise<void> {
    const b = this.selected();
    if (!b) return;
    await firstValueFrom(this.ops.ownerConfirm(b.id));
    await this.refreshBooking(b.id);
    await this.refreshListQuietly();
  }

  async approveCheckout(): Promise<void> {
    const b = this.selected();
    if (!b) return;
    await firstValueFrom(this.ops.approveCheckout(b.id));
    await this.refreshBooking(b.id);
    await this.refreshListQuietly();
  }

  async rejectCheckout(): Promise<void> {
    const b = this.selected();
    if (!b) return;
    await firstValueFrom(this.ops.rejectCheckout(b.id));
    await this.refreshBooking(b.id);
    await this.refreshListQuietly();
  }

  async acknowledgeCheckin(): Promise<void> {
    const b = this.selected();
    if (!b) return;
    await firstValueFrom(this.ops.acknowledgeCheckin(b.id));
    await this.refreshBooking(b.id);
    await this.refreshListQuietly();
  }

  async cancelBooking(): Promise<void> {
    const b = this.selected();
    if (!b || !confirm('Cancelar esta reserva?')) return;
    await firstValueFrom(this.ops.cancelBookingByOwner(b.id));
    this.selected.set(null);
    this.kitOrders.set([]);
    await this.router.navigate(['/reservations'], { queryParams: { id: null }, queryParamsHandling: 'merge' });
    await this.refreshListQuietly();
  }

  async approveCancellation(): Promise<void> {
    const b = this.selected();
    if (!b) return;
    await firstValueFrom(this.ops.approveTenantCancellation(b.id));
    await this.refreshBooking(b.id);
    await this.refreshListQuietly();
  }

  async rejectCancellation(): Promise<void> {
    const b = this.selected();
    if (!b) return;
    await firstValueFrom(this.ops.rejectTenantCancellation(b.id));
    await this.refreshBooking(b.id);
    await this.refreshListQuietly();
  }

  async approveKitOrder(order: KitOrder): Promise<void> {
    const total = this.kitOrderTotal(order);
    await firstValueFrom(this.ops.approveKitOrder(order.id, total));
    const b = this.selected();
    if (b) await this.refreshBooking(b.id);
  }

  async rejectKitOrder(order: KitOrder): Promise<void> {
    await firstValueFrom(this.ops.rejectKitOrder(order.id));
    const b = this.selected();
    if (b) await this.refreshBooking(b.id);
  }

  async approveAccessRequest(req?: AccessRequest): Promise<void> {
    const target = req ?? this.selectedAccessRequest();
    if (!target) return;
    await firstValueFrom(this.props.approveAccessRequest(target.id));
    this.selectedAccessRequest.set(null);
    await this.refreshListQuietly();
    void this.router.navigate(['/reservations'], {
      queryParams: { accessId: null },
      queryParamsHandling: 'merge',
    });
  }

  async rejectAccessRequest(req?: AccessRequest): Promise<void> {
    const target = req ?? this.selectedAccessRequest();
    if (!target) return;
    await firstValueFrom(this.props.rejectAccessRequest(target.id));
    this.selectedAccessRequest.set(null);
    await this.refreshListQuietly();
    void this.router.navigate(['/reservations'], {
      queryParams: { accessId: null },
      queryParamsHandling: 'merge',
    });
  }

  accessRequestPropertyName(req: AccessRequest): string {
    if (req.propertyName?.trim()) return req.propertyName.trim();
    const prop = this.properties().find(
      (p) => this.normalizeId(p.id) === this.normalizeId(req.propertyId),
    );
    return prop?.name ?? 'Imóvel';
  }

  accessRequestPropertyCity(req: AccessRequest): string {
    const prop = this.properties().find(
      (p) => this.normalizeId(p.id) === this.normalizeId(req.propertyId),
    );
    return prop?.city ?? '';
  }

  accessRequestGuestName(req: AccessRequest): string {
    return (
      req.tenantFullName?.trim() ||
      req.tenantName?.trim() ||
      req.tenantEmail?.trim() ||
      req.tenantIdentifier?.trim() ||
      'Inquilino'
    );
  }

  accessRequestDates(req: AccessRequest): string {
    const checkin = req.proposedCheckinDate ?? req.requestedCheckinDate;
    const checkout = req.proposedCheckoutDate ?? req.requestedCheckoutDate;
    if (checkin && checkout) {
      return formatStayDates(checkin, checkout);
    }
    return 'Datas a confirmar com o hóspede';
  }

  financeLink(): string[] {
    return ['/finance'];
  }

  financeQueryParams(booking: BookingDto): { competence?: string } {
    return booking.competence ? { competence: booking.competence } : {};
  }

  private normalizeId(id: string | undefined): string {
    return (id ?? '').replace(/-/g, '').toLowerCase();
  }

  private isReservationFilter(value: string): value is ReservationFilter {
    return RESERVATION_FILTER_OPTIONS.some((o) => o.id === value);
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

  /** Atualiza lista/KPIs sem skeleton nem recriar o componente. */
  private async refreshListQuietly(): Promise<void> {
    try {
      const [bookingsRes, actionQueue, counts, stays, access] = await Promise.all([
        firstValueFrom(this.ops.listBookings(0, PAGE_SIZE)),
        firstValueFrom(this.ops.listOwnerActionQueue(0, 50)),
        firstValueFrom(this.ops.getCounts()),
        firstValueFrom(this.ops.getStaysSummary()),
        firstValueFrom(this.props.listPendingAccessRequests(0, 50)),
      ]);
      this.bookings.set(
        this.sortBookingsActionFirst(
          this.mergeBookingsById([...(actionQueue.content ?? []), ...bookingsRes.content]),
        ),
      );
      this.bookingsPage.set(0);
      this.hasMore.set(bookingsRes.hasNext);
      this.accessRequests.set(access.content);
      this.ownerActions.set(counts.ownerActionRequired ?? 0);
      this.ownerPendingAccess.set(counts.ownerPendingAccessRequests ?? 0);
      this.staysActive.set(activeStaysCount(stays));
      this.staysUpcoming.set(upcomingStaysCount(stays));
      this.clampListUiPage();
    } catch {
      // mantém lista atual
    }
  }

  private clampListUiPage(): void {
    const max = Math.max(0, this.totalListPages() - 1);
    if (this.listUiPage() > max) {
      this.listUiPage.set(max);
    }
  }

  private mergeBookingsById(list: BookingDto[]): BookingDto[] {
    const byId = new Map<string, BookingDto>();
    for (const b of list) {
      byId.set(b.id, b);
    }
    return [...byId.values()];
  }

  /** Pendências no topo para aparecerem na primeira página da lista. */
  private sortBookingsActionFirst(list: BookingDto[]): BookingDto[] {
    return [...list].sort((a, b) => {
      const aPending = bookingNeedsOwnerAction(a) ? 0 : 1;
      const bPending = bookingNeedsOwnerAction(b) ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return (b.checkinDate ?? '').localeCompare(a.checkinDate ?? '');
    });
  }

}
