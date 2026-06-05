import {
  Component,
  OnInit,
  inject,
  signal,
  ElementRef,
  viewChild,
  effect,
  computed,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ClaraService } from '../../core/api/clara.service';
import { PropertiesService } from '../../core/api/properties.service';
import { OwnerProfileStore } from '../../core/profile/owner-profile.store';
import { ProfileAvatarComponent } from '../../shared/components/profile-avatar/profile-avatar.component';
import { PropertyDto } from '../../core/models/property.models';
import { currentCompetence } from '../../core/dates/competence';
import { OWNER_LABELS } from '../../core/i18n/owner-labels';
import { parseClaraActionLinks } from '../../core/clara/clara-action-links';

interface ChatLine {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
  at: Date;
  fallback?: boolean;
  fallbackReason?: string | null;
  actionLinks?: { label: string; path: string }[];
}

const CLARA_AVATAR = '/clara-avatar.png';

const SUGGESTIONS = [
  'Como está meu lucro este mês?',
  'Qual imóvel precisa de atenção?',
  'O que fazer com reservas pendentes?',
  'Como importar aluguéis antigos?',
];

const FALLBACK_HINTS: Record<string, string> = {
  no_base_url: 'Configure hosty.agent-runtime.base-url na API.',
  connection_refused: 'Suba o runtime: python -m uvicorn server:app --host 127.0.0.1 --port 8000',
  timeout: 'O runtime demorou para responder. Tente de novo.',
  runtime_5xx: 'Erro no motor de IA. Confira se o runtime está no ar (porta 8000) e reinicie a API Java.',
  runtime_bad_request: 'A API não conseguiu falar com o runtime (requisição inválida). Reinicie a API Java após atualizar.',
  runtime_unavailable: 'Runtime indisponível no momento.',
  empty_reply: 'A IA respondeu vazio. Reinicie a conversa.',
};

@Component({
  selector: 'app-clara-assistant',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ProfileAvatarComponent,
  ],
  templateUrl: './clara-assistant.widget.html',
  styleUrl: './clara-assistant.widget.scss',
})
export class ClaraAssistantWidget implements OnInit {
  private readonly clara = inject(ClaraService);
  private readonly props = inject(PropertiesService);
  readonly profileStore = inject(OwnerProfileStore);
  private readonly fb = inject(FormBuilder);
  private seq = 0;

  readonly labels = OWNER_LABELS;
  readonly claraAvatar = CLARA_AVATAR;
  readonly chatLog = viewChild<ElementRef<HTMLDivElement>>('chatLog');
  readonly inputRef = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');
  readonly suggestions = SUGGESTIONS;
  readonly open = signal(false);
  readonly showScope = signal(false);
  readonly lines = signal<ChatLine[]>([]);
  readonly sending = signal(false);
  readonly properties = signal<PropertyDto[]>([]);
  readonly propertiesLoaded = signal(false);

  readonly scope = this.fb.nonNullable.group({
    propertyId: [''],
    competence: [currentCompetence()],
  });

  readonly draft = this.fb.nonNullable.control('');

  readonly userInitials = computed(() => this.profileStore.initials());
  readonly userPhoto = computed(() => this.profileStore.photoSrc());
  readonly userName = computed(() => this.profileStore.displayName());
  readonly headerStatus = computed(() => (this.sending() ? 'Digitando…' : 'Online agora'));

  constructor() {
    effect(() => {
      if (this.lines().length || this.sending()) {
        queueMicrotask(() => this.scrollToBottom());
      }
    });
  }

  ngOnInit(): void {
    this.resetGreeting();
    void this.profileStore.ensureLoaded();
  }

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) {
      queueMicrotask(() => this.inputRef()?.nativeElement?.focus());
      if (!this.propertiesLoaded()) void this.loadProperties();
    }
  }

  close(): void {
    this.open.set(false);
  }

  fallbackHint(reason: string | null | undefined): string {
    if (!reason) return 'Motor de IA offline — exibindo resumo automático dos seus dados.';
    return FALLBACK_HINTS[reason] ?? 'Motor de IA offline — exibindo resumo automático.';
  }

  formatTime(d: Date): string {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.send();
    }
  }

  async loadProperties(): Promise<void> {
    try {
      const res = await firstValueFrom(this.props.listOwner());
      this.properties.set(res.content);
      this.propertiesLoaded.set(true);
    } catch {
      // chat works without property list
    }
  }

  async send(preset?: string): Promise<void> {
    const message = (preset ?? this.draft.value).trim();
    if (!message || this.sending()) return;

    this.draft.setValue('');
    this.lines.update((l) => [
      ...l,
      { id: this.nextId(), role: 'user', text: message, at: new Date() },
    ]);
    this.sending.set(true);

    try {
      const scope = this.scope.getRawValue();
      const res = await firstValueFrom(
        this.clara.chat({
          message,
          propertyId: scope.propertyId || undefined,
          competence: scope.competence,
        }),
      );
      this.lines.update((l) => [
        ...l,
        {
          id: this.nextId(),
          role: 'assistant',
          text: res.reply,
          at: new Date(),
          fallback: res.fallback,
          fallbackReason: res.fallbackReason,
          actionLinks: res.fallback ? undefined : parseClaraActionLinks(res.reply),
        },
      ]);
    } catch {
      this.lines.update((l) => [
        ...l,
        {
          id: this.nextId(),
          role: 'error',
          text: 'Não foi possível falar com a Clara. Verifique se a API está no ar.',
          at: new Date(),
        },
      ]);
    } finally {
      this.sending.set(false);
      queueMicrotask(() => this.inputRef()?.nativeElement?.focus());
    }
  }

  async clearChat(): Promise<void> {
    try {
      await firstValueFrom(this.clara.clearSession());
    } catch {
      // noop
    }
    this.resetGreeting();
  }

  toggleScope(): void {
    this.showScope.update((v) => !v);
    if (this.showScope() && !this.propertiesLoaded()) void this.loadProperties();
  }

  private resetGreeting(): void {
    this.lines.set([
      {
        id: this.nextId(),
        role: 'assistant',
        text: 'Sou a Clara. Pergunte sobre lucro, pendências ou onde clicar no portal.',
        at: new Date(),
      },
    ]);
  }

  private nextId(): string {
    this.seq += 1;
    return `msg-${this.seq}`;
  }

  private scrollToBottom(): void {
    const el = this.chatLog()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
