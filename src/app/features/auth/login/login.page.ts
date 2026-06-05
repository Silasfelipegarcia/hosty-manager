import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly appName = environment.appName;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'owner_only') {
      this.error.set('Esta área é exclusiva para proprietários. Use o app Hosty como hóspede.');
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.form.getRawValue());
      if (!this.auth.isOwner()) {
        this.auth.logout();
        this.error.set('Conta sem perfil de proprietário.');
        return;
      }
      if (this.auth.passwordMustChange()) {
        await this.router.navigate(['/change-password']);
      } else {
        await this.router.navigate(['/dashboard']);
      }
    } catch {
      this.error.set('E-mail ou senha inválidos.');
    } finally {
      this.loading.set(false);
    }
  }
}
