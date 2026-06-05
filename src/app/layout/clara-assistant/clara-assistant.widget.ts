import { Component, OnInit, inject, signal, ElementRef, viewChild, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ClaraService } from '../../core/api/clara.service';
import { PropertiesService } from '../../core/api/properties.service';
import { PropertyDto } from '../../core/models/property.models';
import { currentCompetence } from '../../core/dates/competence';
import { OWNER_LABELS } from '../../core/i18n/owner-labels';
import { parseClaraActionLinks } from '../../core/clara/clara-action-links';

interface ChatLine {
  role: 'user' | 'assistant' | 'error';
  text: string;
  fallback?: boolean;
  fallbackReason?: string | null;
  actionLinks?: { label: string; path: string }[];
}

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
  runtime_5xx: 'Erro no motor de IA (verifique ANTHROPIC_API_KEY ou GROQ_API_KEY).',
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
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './clara-assistant.widget.html',
  styleUrl: './clara-assistant.widget.scss',
})
export class ClaraAssistantWidget implements OnInit {
  private readonly clara = inject(ClaraService);
  private readonly props = inject(PropertiesService);
  private readonly fb = inject(FormBuilder);

  readonly labels = OWNER_LABELS;
  readonly chatLog = viewChild<ElementRef<HTMLDivElement>>('chatLog');
  readonly suggestions = SUGGESTIONS;
  readonly open = signal(false);
  readonly showScope = signal(false);
  readonly lines = signal<ChatLine[]>([]);
  readonly loading = signal(false);
  readonly properties = signal<PropertyDto[]>([]);

  readonly scope = this.fb.nonNullable.group({
    propertyId: [''],
    competence: [currentCompetence()],
  });

  readonly messageForm = this.fb.nonNullable.group({
    message: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      if (this.lines().length || this.loading()) {
        queueMicrotask(() => this.scrollToBottom());
      }
    });
  }

  ngOnInit(): void {
    void this.loadProperties();
    this.resetGreeting();
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  fallbackHint(reason: string | null | undefined): string {
    if (!reason) return 'Motor de IA offline — exibindo resumo automático dos seus dados.';
    return FALLBACK_HINTS[reason] ?? 'Motor de IA offline — exibindo resumo automático.';
  }

  async loadProperties(): Promise<void> {
    const res = await firstValueFrom(this.props.listOwner());
    this.properties.set(res.content);
  }

  async send(preset?: string): Promise<void> {
    const message = (preset ?? this.messageForm.controls.message.value).trim();
    if (!message || this.loading()) return;

    this.lines.update((l) => [...l, { role: 'user', text: message }]);
    this.messageForm.patchValue({ message: '' });
    this.loading.set(true);
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
          role: 'assistant',
          text: res.reply,
          fallback: res.fallback,
          fallbackReason: res.fallbackReason,
          actionLinks: res.fallback ? undefined : parseClaraActionLinks(res.reply),
        },
      ]);
    } catch {
      this.lines.update((l) => [
        ...l,
        {
          role: 'error',
          text: 'Não foi possível falar com a Clara. Verifique se a API está no ar.',
        },
      ]);
    } finally {
      this.loading.set(false);
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
  }

  private resetGreeting(): void {
    this.lines.set([
      {
        role: 'assistant',
        text: 'Olá! Sou a Clara. Posso explicar seus números, sugerir ações e mostrar onde clicar no portal. Como posso ajudar?',
      },
    ]);
  }

  private scrollToBottom(): void {
    const el = this.chatLog()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
