import { Router, UrlTree } from '@angular/router';

/** Abre uma reserva no painel lateral sem recarregar a página de listagem. */
export function openReservation(router: Router, bookingId: string): Promise<boolean> {
  return router.navigate(['/reservations'], { queryParams: { id: bookingId } });
}

export function reservationUrlTree(router: Router, bookingId: string): UrlTree {
  return router.createUrlTree(['/reservations'], { queryParams: { id: bookingId } });
}
