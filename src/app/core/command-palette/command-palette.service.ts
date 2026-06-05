import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PropertiesService } from '../api/properties.service';
import { OperationsService } from '../api/operations.service';
import { OWNER_LABELS } from '../i18n/owner-labels';

export interface CommandItem {
  id: string;
  label: string;
  detail?: string;
  icon: string;
  path: string | string[];
  queryParams?: Record<string, string>;
  group: string;
  keywords?: string[];
}

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private readonly router = inject(Router);
  private readonly properties = inject(PropertiesService);
  private readonly ops = inject(OperationsService);

  readonly open = signal(false);
  readonly query = signal('');
  readonly results = signal<CommandItem[]>([]);
  readonly activeIndex = signal(0);

  private readonly staticCommands: CommandItem[] = [
    { id: 'dashboard', label: 'Início', icon: 'space_dashboard', path: '/dashboard', group: 'Navegação', keywords: ['home', 'inicio'] },
    { id: 'properties', label: 'Imóveis', icon: 'home_work', path: '/properties', group: 'Navegação' },
    { id: 'reservations', label: OWNER_LABELS.reservations, icon: 'calendar_month', path: '/reservations', group: 'Navegação' },
    { id: 'sales', label: OWNER_LABELS.registerStay, icon: 'add_circle_outline', path: '/sales', group: 'Ações' },
    { id: 'finance', label: OWNER_LABELS.finances, icon: 'insights', path: '/finance', group: 'Navegação' },
    { id: 'kits', label: OWNER_LABELS.kitOrders, icon: 'inventory_2', path: '/kits/pending', group: 'Navegação' },
    { id: 'field', label: OWNER_LABELS.fieldServices, icon: 'engineering', path: '/field-services/pending', group: 'Navegação' },
    { id: 'messages', label: OWNER_LABELS.messages, icon: 'forum', path: '/messages', group: 'Navegação' },
    { id: 'help', label: OWNER_LABELS.help, icon: 'help_outline', path: '/help', group: 'Conta' },
    { id: 'account', label: OWNER_LABELS.account, icon: 'manage_accounts', path: '/account', group: 'Conta' },
    { id: 'new-property', label: 'Cadastrar imóvel', icon: 'add_home', path: '/properties/new', group: 'Ações' },
  ];

  toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.show();
    }
  }

  show(): void {
    this.open.set(true);
    this.query.set('');
    this.activeIndex.set(0);
    this.results.set(this.staticCommands);
  }

  close(): void {
    this.open.set(false);
    this.query.set('');
    this.activeIndex.set(0);
  }

  async search(text: string): Promise<void> {
    this.query.set(text);
    this.activeIndex.set(0);
    const q = text.trim().toLowerCase();
    if (!q) {
      this.results.set(this.staticCommands);
      return;
    }

    const staticMatches = this.staticCommands.filter((c) => this.matches(c, q));
    const dynamic: CommandItem[] = [];

    try {
      const [props, bookings] = await Promise.all([
        firstValueFrom(this.properties.listOwner(0, 20)),
        firstValueFrom(this.ops.listBookings(0, 15)),
      ]);

      for (const p of props.content) {
        if (p.name?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q)) {
          dynamic.push({
            id: `prop-${p.id}`,
            label: p.name,
            detail: p.city ?? 'Imóvel',
            icon: 'home_work',
            path: ['/properties', p.id],
            group: 'Imóveis',
          });
        }
      }

      for (const b of bookings.content) {
        const guest = b.tenantName || b.tenantEmail || '';
        if (
          guest.toLowerCase().includes(q) ||
          b.propertyName?.toLowerCase().includes(q)
        ) {
          dynamic.push({
            id: `booking-${b.id}`,
            label: guest || 'Reserva',
            detail: b.propertyName,
            icon: 'calendar_month',
            path: '/reservations',
            queryParams: { id: b.id },
            group: 'Reservas',
          });
        }
      }
    } catch {
      // static results still useful
    }

    this.results.set([...staticMatches, ...dynamic].slice(0, 12));
  }

  moveActive(delta: number): void {
    const len = this.results().length;
    if (!len) return;
    this.activeIndex.update((i) => (i + delta + len) % len);
  }

  execute(item?: CommandItem): void {
    const target = item ?? this.results()[this.activeIndex()];
    if (!target) return;
    this.close();
    void this.router.navigate(Array.isArray(target.path) ? target.path : [target.path], {
      queryParams: target.queryParams,
    });
  }

  private matches(item: CommandItem, q: string): boolean {
    if (item.label.toLowerCase().includes(q)) return true;
    if (item.group.toLowerCase().includes(q)) return true;
    return (item.keywords ?? []).some((k) => k.includes(q));
  }
}
