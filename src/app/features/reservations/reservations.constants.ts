import { ReservationFilter } from '../../core/utils/booking-flow-stage.util';

export const RESERVATION_FILTER_OPTIONS: { id: ReservationFilter; label: string }[] = [
  { id: 'approval', label: 'Aprovação' },
  { id: 'all', label: 'Todas' },
  { id: 'waiting', label: 'Aguardando' },
  { id: 'in_progress', label: 'Em estadia' },
  { id: 'completed', label: 'Encerradas' },
];

/** Tamanho de cada página na API. */
export const RESERVATIONS_PAGE_SIZE = 30;

/** Itens visíveis por página na listagem lateral. */
export const RESERVATIONS_LIST_UI_PAGE_SIZE = 6;
