import {
  Component,
  ElementRef,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { OperationsService } from '../../../core/api/operations.service';
import { ChatMessage } from '../../../core/models/operations.models';
import { OwnerProfileStore } from '../../../core/profile/owner-profile.store';
import { ProfileAvatarComponent } from '../profile-avatar/profile-avatar.component';

@Component({
  selector: 'app-stay-chat-panel',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, ProfileAvatarComponent],
  templateUrl: './stay-chat-panel.component.html',
  styleUrl: './stay-chat-panel.component.scss',
})
export class StayChatPanelComponent {
  private readonly ops = inject(OperationsService);
  readonly profileStore = inject(OwnerProfileStore);

  readonly bookingId = input.required<string>();
  readonly guestName = input('Hóspede');
  readonly guestPhoto = input<string | undefined>();

  readonly chatLog = viewChild<ElementRef<HTMLDivElement>>('chatLog');
  readonly messages = signal<ChatMessage[]>([]);
  readonly chatDraft = signal('');
  readonly chatSending = signal(false);
  readonly loading = signal(false);

  constructor() {
    effect(() => {
      const id = this.bookingId();
      if (id) void this.loadMessages(id);
    });
  }

  async loadMessages(bookingId: string): Promise<void> {
    this.loading.set(true);
    try {
      const msgs = await firstValueFrom(this.ops.listBookingMessages(bookingId));
      this.messages.set(msgs);
      queueMicrotask(() => this.scrollToBottom());
    } catch {
      this.messages.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  chatSenderLabel(role: string | undefined): string {
    if (role === 'OWNER') return 'Você';
    if (role === 'TENANT') return 'Hóspede';
    return role ?? 'Mensagem';
  }

  isOwnerMessage(role: string | undefined): boolean {
    return role === 'OWNER';
  }

  formatChatTime(value: string | undefined): string {
    if (!value) return '';
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onChatKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.sendMessage();
    }
  }

  async sendMessage(): Promise<void> {
    const text = this.chatDraft().trim();
    if (!text || this.chatSending()) return;

    const pendingId = `pending-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: pendingId,
      senderRole: 'OWNER',
      senderDisplayName: this.profileStore.displayName(),
      text,
      sentAt: new Date().toISOString(),
    };
    this.messages.update((list) => [...list, optimistic]);
    this.chatDraft.set('');
    this.chatSending.set(true);
    queueMicrotask(() => this.scrollToBottom());

    try {
      const saved = await firstValueFrom(this.ops.sendBookingMessage(this.bookingId(), text));
      this.messages.update((list) => list.map((m) => (m.id === pendingId ? saved : m)));
    } catch {
      this.messages.update((list) => list.filter((m) => m.id !== pendingId));
      this.chatDraft.set(text);
    } finally {
      this.chatSending.set(false);
      queueMicrotask(() => this.scrollToBottom());
    }
  }

  private scrollToBottom(): void {
    const el = this.chatLog()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
