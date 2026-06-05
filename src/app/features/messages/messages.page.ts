import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { OperationsService } from '../../core/api/operations.service';
import { BookingDto, MessageInboxItem } from '../../core/models/operations.models';
import { StayChatPanelComponent } from '../../shared/components/stay-chat-panel/stay-chat-panel.component';
import { PortalSkeletonComponent } from '../../shared/components/portal-skeleton/portal-skeleton.component';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    StayChatPanelComponent,
    PortalSkeletonComponent,
  ],
  templateUrl: './messages.page.html',
  styleUrl: './messages.page.scss',
})
export class MessagesPage implements OnInit {
  private readonly ops = inject(OperationsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly items = signal<MessageInboxItem[]>([]);
  readonly loading = signal(true);
  readonly selectedBookingId = signal<string | null>(null);
  readonly selectedBooking = signal<BookingDto | null>(null);

  ngOnInit(): void {
    void this.load();
    this.route.queryParamMap.subscribe((params) => {
      const id = params.get('bookingId');
      if (id) {
        this.selectedBookingId.set(id);
        void this.ensureBookingContext(id);
      }
    });
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.ops.listMessagesInbox(0, 40));
      this.items.set(res.content);
      const fromQuery = this.route.snapshot.queryParamMap.get('bookingId');
      if (fromQuery) {
        this.selectedBookingId.set(fromQuery);
        await this.ensureBookingContext(fromQuery);
      } else if (res.content.length && !this.selectedBookingId()) {
        this.selectedBookingId.set(res.content[0].bookingId);
      }
    } finally {
      this.loading.set(false);
    }
  }

  selectConversation(bookingId: string): void {
    this.selectedBookingId.set(bookingId);
    void this.ensureBookingContext(bookingId);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { bookingId },
      queryParamsHandling: 'merge',
    });
  }

  selectedItem(): MessageInboxItem | undefined {
    const id = this.selectedBookingId();
    return id ? this.items().find((m) => m.bookingId === id) : undefined;
  }

  selectedGuestName(): string {
    const inbox = this.selectedItem();
    if (inbox?.tenantName?.trim()) return inbox.tenantName.trim();
    const booking = this.selectedBooking();
    return (
      booking?.tenantFullName?.trim() ||
      booking?.tenantName?.trim() ||
      booking?.tenantIdentifier?.trim() ||
      booking?.tenantEmail?.trim() ||
      'Inquilino'
    );
  }

  selectedPropertyName(): string {
    return this.selectedItem()?.propertyName || this.selectedBooking()?.propertyName || 'Imóvel';
  }

  selectedGuestPhoto(): string | undefined {
    return this.selectedBooking()?.tenantPhotoUrl;
  }

  private async ensureBookingContext(bookingId: string): Promise<void> {
    if (this.selectedItem()) {
      this.selectedBooking.set(null);
      return;
    }
    try {
      const booking = await firstValueFrom(this.ops.getBooking(bookingId));
      this.selectedBooking.set(booking);
    } catch {
      this.selectedBooking.set(null);
    }
  }

  formatInboxTime(value: string): string {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
