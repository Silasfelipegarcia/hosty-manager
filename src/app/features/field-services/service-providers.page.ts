import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { OperationsService } from '../../core/api/operations.service';
import { ProviderInviteResult, ServiceProvider } from '../../core/models/operations.models';

const SERVICE_TYPE_OPTIONS = [
  { id: 'CLEANING', label: 'Limpeza' },
  { id: 'POOL', label: 'Piscina' },
  { id: 'GARDEN', label: 'Jardim' },
  { id: 'MAINTENANCE', label: 'Manutenção' },
] as const;

@Component({
  selector: 'app-service-providers-page',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './service-providers.page.html',
  styleUrl: './service-providers.page.scss',
})
export class ServiceProvidersPage implements OnInit {
  private readonly ops = inject(OperationsService);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);
  readonly serviceTypes = SERVICE_TYPE_OPTIONS;
  readonly providers = signal<ServiceProvider[]>([]);
  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly showCreate = signal(false);
  readonly lastInvite = signal<ProviderInviteResult | null>(null);
  readonly inviteProviderName = signal('');

  readonly createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    cleaning: [true],
    pool: [false],
    garden: [false],
    maintenance: [false],
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.ops.listServiceProviders());
      this.providers.set(res.content);
    } catch {
      this.snack.open('Não foi possível carregar prestadores.', 'Fechar', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  statusLabel(provider: ServiceProvider): string {
    const status = (provider.status ?? 'ACTIVE').toUpperCase();
    if (provider.linkedUserId) return 'Ativo no app';
    if (status === 'PENDING_INVITE') return 'Convite pendente';
    return 'Cadastro local';
  }

  async submitCreate(): Promise<void> {
    if (this.createForm.invalid) return;
    const raw = this.createForm.getRawValue();
    const serviceTypes = this.selectedServiceTypes(raw);
    if (serviceTypes.length === 0) {
      this.snack.open('Selecione ao menos um tipo de serviço.', 'Fechar', { duration: 3500 });
      return;
    }
    this.creating.set(true);
    try {
      await firstValueFrom(
        this.ops.createServiceProvider({
          name: raw.name.trim(),
          phone: raw.phone.trim() || undefined,
          serviceTypes,
        }),
      );
      this.createForm.reset({ name: '', phone: '', cleaning: true, pool: false, garden: false, maintenance: false });
      this.showCreate.set(false);
      await this.load();
      this.snack.open('Prestador criado.', 'Fechar', { duration: 3000 });
    } catch {
      this.snack.open('Não foi possível criar o prestador.', 'Fechar', { duration: 4000 });
    } finally {
      this.creating.set(false);
    }
  }

  async invite(provider: ServiceProvider): Promise<void> {
    const email = window.prompt('E-mail do prestador para o convite:', provider.email ?? '');
    if (!email?.trim()) return;
    try {
      const result = await firstValueFrom(this.ops.inviteServiceProvider(provider.id, email.trim()));
      this.lastInvite.set(result);
      this.inviteProviderName.set(provider.name);
      await this.load();
      this.snack.open('Convite gerado. Copie ou compartilhe o link.', 'Fechar', { duration: 4000 });
    } catch {
      this.snack.open('Não foi possível gerar o convite.', 'Fechar', { duration: 4000 });
    }
  }

  async copyInviteLink(): Promise<void> {
    const link = this.lastInvite()?.inviteUrl;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      this.snack.open('Link copiado.', 'Fechar', { duration: 2500 });
    } catch {
      this.snack.open(link, 'Fechar', { duration: 8000 });
    }
  }

  shareInviteWhatsApp(): void {
    const link = this.lastInvite()?.inviteUrl;
    if (!link) return;
    const text = encodeURIComponent(
      `Você foi convidado(a) para prestar serviços no Staya. Abra o link no app para criar sua senha:\n${link}`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
  }

  async shareInviteNative(): Promise<void> {
    const link = this.lastInvite()?.inviteUrl;
    if (!link) return;
    const title = `Convite Staya — ${this.inviteProviderName()}`;
    const text = `Abra no app Staya para aceitar o convite:\n${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: link });
        return;
      } catch {
        // fallback below
      }
    }
    await this.copyInviteLink();
  }

  serviceTypeLabels(provider: ServiceProvider): string {
    const types = provider.serviceTypes ?? [];
    if (types.length === 0) return 'Serviços de campo';
    return types
      .map((t) => this.serviceTypes.find((o) => o.id === t)?.label ?? t)
      .join(', ');
  }

  private selectedServiceTypes(raw: {
    cleaning: boolean;
    pool: boolean;
    garden: boolean;
    maintenance: boolean;
  }): string[] {
    const out: string[] = [];
    if (raw.cleaning) out.push('CLEANING');
    if (raw.pool) out.push('POOL');
    if (raw.garden) out.push('GARDEN');
    if (raw.maintenance) out.push('MAINTENANCE');
    return out;
  }
}
