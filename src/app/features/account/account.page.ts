import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '../../core/api/account.service';
import { AuthService } from '../../core/auth/auth.service';
import { OwnerProfileStore } from '../../core/profile/owner-profile.store';
import { imageFileToDataUrl } from '../../core/profile/profile-photo.util';
import { ProfileAvatarComponent } from '../../shared/components/profile-avatar/profile-avatar.component';
import { OwnerEntitlementsStore } from '../../core/entitlements/owner-entitlements.store';
import { BillingService, OwnerBillingStatus } from '../../core/api/billing.service';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ProfileAvatarComponent,
    DatePipe,
  ],
  templateUrl: './account.page.html',
  styleUrl: './account.page.scss',
})
export class AccountPage implements OnInit {
  private readonly account = inject(AccountService);
  private readonly auth = inject(AuthService);
  private readonly profileStore = inject(OwnerProfileStore);
  private readonly fb = inject(FormBuilder);
  readonly entitlements = inject(OwnerEntitlementsStore);
  private readonly billing = inject(BillingService);

  readonly saving = signal(false);
  readonly upgrading = signal(false);
  readonly startingTrial = signal(false);
  readonly photoDraft = signal<string | null>(null);
  readonly profileStatus = signal<string | null>(null);
  readonly planStatus = signal<string | null>(null);
  readonly billingStatus = signal<OwnerBillingStatus | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: [''],
    email: [''],
    phone: [''],
    cpf: [''],
    birthDate: [''],
    documentNumber: [''],
  });

  get displayPhoto() {
    return this.photoDraft() ?? this.profileStore.photoSrc();
  }

  get displayInitials() {
    return this.profileStore.initials();
  }

  get displayName() {
    return this.form.controls.fullName.value.trim() || this.profileStore.displayName();
  }

  ngOnInit(): void {
    void this.entitlements.ensureLoaded();
    void this.loadBillingStatus();
    void this.load();
  }

  async loadBillingStatus(): Promise<void> {
    try {
      const status = await firstValueFrom(this.billing.getOwnerStatus());
      this.billingStatus.set(status);
    } catch {
      this.billingStatus.set(null);
    }
  }

  async startTrial(): Promise<void> {
    this.startingTrial.set(true);
    this.planStatus.set(null);
    try {
      const status = await firstValueFrom(this.billing.startOwnerTrial());
      this.billingStatus.set(status);
      await this.entitlements.refresh();
      this.planStatus.set('Trial ativado — Clara IA e Plus++ liberados por 14 dias.');
    } catch (err) {
      const msg = err instanceof HttpErrorResponse ? err.error?.message ?? err.message : null;
      this.planStatus.set(msg ?? 'Não foi possível iniciar o trial. Tente novamente.');
    } finally {
      this.startingTrial.set(false);
    }
  }

  async upgradeTo(planId: string): Promise<void> {
    this.upgrading.set(true);
    this.planStatus.set(null);
    try {
      const session = await firstValueFrom(this.billing.ownerCheckout(planId));
      if (session.checkoutUrl) {
        window.location.href = session.checkoutUrl;
      } else {
        this.planStatus.set('Checkout sem URL de redirecionamento.');
      }
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 503) {
        this.planStatus.set('Pagamento online em configuração. Use o trial gratuito abaixo.');
      } else {
        this.planStatus.set('Não foi possível abrir o checkout. Tente o trial gratuito.');
      }
    } finally {
      this.upgrading.set(false);
    }
  }

  async load(): Promise<void> {
    await this.profileStore.refresh();
    const p = this.profileStore.profile();
    if (!p) return;
    this.photoDraft.set(null);
    this.form.patchValue({
      fullName: p.fullName ?? '',
      email: this.auth.email ?? '',
      phone: p.phone ?? '',
      cpf: p.cpf ?? '',
      birthDate: p.birthDate ?? '',
      documentNumber: p.documentNumber ?? '',
    });
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await imageFileToDataUrl(file);
      this.photoDraft.set(dataUrl);
      this.profileStatus.set(null);
    } catch {
      this.profileStatus.set('Não foi possível processar a imagem.');
    }
  }

  removePhoto(): void {
    this.photoDraft.set('');
    this.profileStatus.set(null);
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.profileStatus.set(null);
    try {
      const raw = this.form.getRawValue();
      const photoUrl = this.photoDraft();
      const body = {
        fullName: raw.fullName.trim(),
        phone: raw.phone.trim(),
        cpf: raw.cpf.replace(/\D/g, ''),
        birthDate: raw.birthDate.trim(),
        documentNumber: raw.documentNumber.replace(/\D/g, ''),
        ...(photoUrl !== null ? { photoUrl: photoUrl.trim() } : {}),
      };
      const saved = await firstValueFrom(this.account.updateProfile(body));
      this.profileStore.applyLocal(saved);
      this.photoDraft.set(null);
      this.profileStatus.set('Perfil salvo — mesmos dados do app mobile.');
    } catch {
      this.profileStatus.set('Erro ao salvar. Tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
