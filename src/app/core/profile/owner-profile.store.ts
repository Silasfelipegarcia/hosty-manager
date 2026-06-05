import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AccountService, TenantProfile } from '../api/account.service';
import { AuthService } from '../auth/auth.service';
import { profileInitials, resolveProfilePhotoSrc } from './profile-photo.util';

@Injectable({ providedIn: 'root' })
export class OwnerProfileStore {
  private readonly account = inject(AccountService);
  private readonly auth = inject(AuthService);

  readonly profile = signal<TenantProfile | null>(null);
  readonly loading = signal(false);

  readonly displayName = computed(
    () => this.profile()?.fullName?.trim() || this.auth.email || 'Você',
  );

  readonly photoSrc = computed(() => resolveProfilePhotoSrc(this.profile()?.photoUrl));

  readonly initials = computed(() =>
    profileInitials(this.displayName(), this.auth.email),
  );

  async ensureLoaded(force = false): Promise<void> {
    if (!force && this.profile() !== null) return;
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const p = await firstValueFrom(this.account.getProfile());
      this.profile.set(p);
    } catch {
      this.profile.set({
        fullName: '',
        phone: '',
        cpf: '',
        photoUrl: '',
        birthDate: '',
        documentNumber: '',
      });
    } finally {
      this.loading.set(false);
    }
  }

  applyLocal(profile: TenantProfile): void {
    this.profile.set(profile);
  }
}
