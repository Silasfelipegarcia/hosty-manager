import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { firstValueFrom } from 'rxjs';
import { OperationsService } from '../../core/api/operations.service';
import { MessageInboxItem } from '../../core/models/operations.models';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatListModule],
  template: `
    <h1>Mensagens</h1>
    <mat-card>
      <mat-list>
        @for (m of items(); track m.bookingId) {
          <a mat-list-item [routerLink]="['/reservations']" [queryParams]="{ id: m.bookingId }">
            <span matListItemTitle>{{ m.tenantName || 'Hóspede' }}</span>
            <span matListItemLine>{{ m.propertyName }} — {{ m.lastMessage }}</span>
            <span matListItemMeta>{{ m.lastMessageAt }}</span>
          </a>
        }
      </mat-list>
    </mat-card>
  `,
})
export class MessagesPage implements OnInit {
  private readonly ops = inject(OperationsService);
  readonly items = signal<MessageInboxItem[]>([]);

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    const res = await firstValueFrom(this.ops.listMessagesInbox(0, 40));
    this.items.set(res.content);
  }
}
