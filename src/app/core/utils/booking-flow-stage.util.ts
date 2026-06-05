import { BookingDto } from '../models/operations.models';

const SOURCE_LABELS: Record<string, string> = {
  HOSTY: 'Hosty',
  AIRBNB: 'Airbnb',
  BOOKING: 'Booking',
  DIRECT: 'Direto',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  MANUAL: 'Manual',
  ICAL: 'iCal',
  I_CAL: 'iCal',
};

export type ReservationFilter = 'approval' | 'all' | 'waiting' | 'in_progress' | 'completed';

export function reservationStatusKey(booking: BookingDto): string {
  return (booking.reservationStatus ?? '').toUpperCase();
}

export function flowStageKey(booking: BookingDto): string {
  const fromApi = (booking.flowStage ?? booking.lifecycleStatus ?? '').trim().toUpperCase();
  if (fromApi) return fromApi;

  const status = reservationStatusKey(booking);
  const checkin = parseDate(booking.checkinDate);
  const checkout = parseDate(booking.checkoutDate);
  const today = startOfDay(new Date());

  if (booking.checkedOutAt) return 'COMPLETED';
  if (status === 'DISPUTED') return 'DISPUTED';
  if (status === 'CANCELLED') return 'CANCELLED';
  if (status === 'TENANT_CANCELLATION_PENDING') return 'TENANT_CANCELLATION_PENDING';
  if (booking.checkoutRequestedAt) return 'WAITING_CHECKOUT_APPROVAL';
  if (booking.checkedInAt) {
    if (checkout && today < checkout) return 'IN_PROGRESS';
    return 'CHECKOUT_ENABLED';
  }
  if (status === 'PENDING_OWNER_CONFIRMATION') return 'WAITING_OWNER_CONFIRMATION';
  if (status !== 'CONFIRMED') return 'WAITING_TENANT_ACCEPTANCE';
  if (checkin && today < checkin) return 'WAITING_DATE';
  if (checkin && today > checkin) return 'ABANDONED_NO_CHECKIN';
  return 'CHECKIN_ENABLED';
}

export function flowStageDisplayLabel(stageKey: string): string {
  switch (stageKey.toUpperCase()) {
    case 'WAITING_TENANT_ACCEPTANCE': return 'Aguardando aceite do inquilino';
    case 'WAITING_OWNER_CONFIRMATION': return 'Aguardando sua confirmação';
    case 'WAITING_DATE': return 'Antes da data de entrada';
    case 'CHECKIN_ENABLED': return 'Check-in disponível';
    case 'IN_PROGRESS': return 'Estadia em andamento';
    case 'CHECKOUT_ENABLED': return 'Check-out disponível';
    case 'WAITING_CHECKOUT_APPROVAL': return 'Check-out aguardando aprovação';
    case 'TENANT_CANCELLATION_PENDING': return 'Cancelamento solicitado';
    case 'CANCELLED': return 'Reserva cancelada';
    case 'ABANDONED_NO_CHECKIN': return 'Sem check-in na data';
    case 'COMPLETED': return 'Estadia finalizada';
    case 'DISPUTED': return 'Contestação em andamento';
    default: return 'Em processamento';
  }
}

export function flowStageTone(stageKey: string): 'positive' | 'warning' | 'danger' | 'neutral' {
  switch (stageKey.toUpperCase()) {
    case 'COMPLETED': return 'positive';
    case 'DISPUTED':
    case 'WAITING_CHECKOUT_APPROVAL':
    case 'TENANT_CANCELLATION_PENDING':
    case 'WAITING_OWNER_CONFIRMATION': return 'danger';
    case 'CANCELLED':
    case 'ABANDONED_NO_CHECKIN': return 'neutral';
    case 'CHECKIN_ENABLED':
    case 'CHECKOUT_ENABLED': return 'warning';
    case 'IN_PROGRESS': return 'positive';
    default: return 'neutral';
  }
}

export function isWaitingCheckoutApproval(booking: BookingDto): boolean {
  return !!booking.checkoutRequestedAt && !booking.checkedOutAt;
}

export function isAwaitingOwnerCheckinAck(booking: BookingDto): boolean {
  if (booking.pendingOwnerCheckinAck) return true;
  if (!booking.checkedInAt || booking.checkedOutAt) return false;
  if (booking.ownerCheckinAcknowledgedAt) return false;
  const st = reservationStatusKey(booking);
  if (st === 'CANCELLED' || st === 'TENANT_CANCELLATION_PENDING') return false;
  return st === 'CONFIRMED' || st === 'PENDING_TENANT_ACCEPTANCE';
}

export function bookingNeedsOwnerAction(booking: BookingDto): boolean {
  const stage = flowStageKey(booking);
  if (stage === 'DISPUTED') return true;
  if (stage === 'WAITING_OWNER_CONFIRMATION') return true;
  if (reservationStatusKey(booking) === 'PENDING_OWNER_CONFIRMATION') return true;
  if (isWaitingCheckoutApproval(booking)) return true;
  if (isAwaitingOwnerCheckinAck(booking)) return true;
  if (reservationStatusKey(booking) === 'TENANT_CANCELLATION_PENDING') return true;
  return false;
}

/** Mesma regra do KPI `ownerActionRequired` na API e do badge "Ação" na lista. */
export function bookingMatchesApprovalFilter(booking: BookingDto): boolean {
  return bookingNeedsOwnerAction(booking);
}

export function matchesReservationFilter(booking: BookingDto, filter: ReservationFilter): boolean {
  const stage = flowStageKey(booking);
  switch (filter) {
    case 'approval':
      return bookingNeedsOwnerAction(booking);
    case 'waiting':
      return ['WAITING_TENANT_ACCEPTANCE', 'WAITING_OWNER_CONFIRMATION', 'WAITING_DATE'].includes(stage);
    case 'in_progress':
      return ['IN_PROGRESS', 'CHECKIN_ENABLED', 'CHECKOUT_ENABLED', 'WAITING_CHECKOUT_APPROVAL'].includes(stage)
        || isAwaitingOwnerCheckinAck(booking);
    case 'completed':
      return ['COMPLETED', 'CANCELLED', 'ABANDONED_NO_CHECKIN'].includes(stage);
    default:
      return true;
  }
}

export function ownerCanCancelOrDelete(booking: BookingDto): boolean {
  if (booking.checkedInAt) return false;
  const stage = flowStageKey(booking);
  if (['ABANDONED_NO_CHECKIN', 'COMPLETED', 'CANCELLED', 'DISPUTED'].includes(stage)) return false;
  if (reservationStatusKey(booking) === 'CANCELLED') return false;
  const ns = (booking.noShowPenaltyStatus ?? '').trim().toUpperCase();
  if (ns === 'APPLIED' || ns === 'WAIVED') return false;
  return true;
}

export function tenantCancellationPending(booking: BookingDto): boolean {
  return reservationStatusKey(booking) === 'TENANT_CANCELLATION_PENDING'
    || flowStageKey(booking) === 'TENANT_CANCELLATION_PENDING';
}

export function reservationSourceLabel(booking: BookingDto): string {
  const raw = (booking.reservationSource ?? booking.platform ?? '').trim().toUpperCase();
  if (!raw) return 'Hosty';
  return SOURCE_LABELS[raw] ?? raw;
}

export function displayGuestName(booking: BookingDto): string {
  return booking.tenantFullName ?? booking.tenantName ?? booking.tenantIdentifier ?? booking.tenantEmail ?? 'Reserva';
}

export function displayGuestEmail(booking: BookingDto): string | undefined {
  return booking.tenantIdentifier ?? booking.tenantEmail;
}

export function displayAmount(booking: BookingDto): number {
  return booking.amountToPay ?? booking.grossAmount ?? 0;
}

export function nightsBetween(checkin?: string, checkout?: string): number {
  const a = parseDate(checkin);
  const b = parseDate(checkout);
  if (!a || !b) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

export function formatStayDates(checkin?: string, checkout?: string): string {
  if (!checkin || !checkout) return '—';
  const nights = nightsBetween(checkin, checkout);
  return `${formatBrDate(checkin)} → ${formatBrDate(checkout)} (${nights} noite${nights !== 1 ? 's' : ''})`;
}

function formatBrDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return startOfDay(new Date(y, m - 1, d));
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
