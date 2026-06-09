import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly appName = environment.appName;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const raw = this.form.getRawValue();
      await this.auth.register({
        email: raw.email.trim(),
        password: raw.password,
        fullName: raw.fullName.trim(),
        cpf: raw.cpf.replace(/\D/g, ''),
        phone: raw.phone.replace(/\D/g, ''),
      });
      if (!this.auth.isOwner()) {
        this.auth.logout();
        this.error.set('Conta criada sem perfil de proprietário.');
        return;
      }
      await this.router.navigate(['/dashboard']);
    } catch {
      this.error.set('Não foi possível criar a conta. Verifique os dados.');
    } finally {
      this.loading.set(false);
    }
  }
}
