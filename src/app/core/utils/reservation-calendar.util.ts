import { BookingDto } from '../models/operations.models';
import { flowStageKey } from './booking-flow-stage.util';

export interface CalendarCell {
  date: string;
  day: number;
  inMonth: boolean;
  bookings: BookingDto[];
  occupiedCount: number;
}

export function monthRange(year: number, month: number): { from: string; to: string } {
  const last = new Date(year, month, 0).getDate();
  const m = String(month).padStart(2, '0');
  return { from: `${year}-${m}-01`, to: `${year}-${m}-${String(last).padStart(2, '0')}` };
}

export function parseMonth(value: string): { year: number; month: number } {
  const [y, m] = value.split('-').map(Number);
  return { year: y, month: m };
}

export function bookingSpansDate(booking: BookingDto, isoDate: string): boolean {
  const checkin = booking.checkinDate;
  const checkout = booking.checkoutDate;
  if (!checkin || !checkout) return false;
  if (flowStageKey(booking) === 'CANCELLED') return false;
  return isoDate >= checkin && isoDate < checkout;
}

export function buildMonthCalendar(
  monthValue: string,
  bookings: BookingDto[],
  propertyId?: string,
): CalendarCell[] {
  const { year, month } = parseMonth(monthValue);
  const first = new Date(year, month - 1, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month - 1, 1 - (startOffset - i));
    cells.push(emptyCell(d, false));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    const iso = toIso(d);
    const dayBookings = bookings.filter((b) => {
      if (propertyId && b.propertyId !== propertyId) return false;
      return bookingSpansDate(b, iso);
    });
    cells.push({
      date: iso,
      day,
      inMonth: true,
      bookings: dayBookings,
      occupiedCount: new Set(dayBookings.map((b) => b.propertyId)).size,
    });
  }

  let trailing = 1;
  while (cells.length % 7 !== 0) {
    const d = new Date(year, month - 1, daysInMonth + trailing);
    trailing += 1;
    cells.push(emptyCell(d, false));
  }

  return cells;
}

function emptyCell(d: Date, inMonth: boolean): CalendarCell {
  return { date: toIso(d), day: d.getDate(), inMonth, bookings: [], occupiedCount: 0 };
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
