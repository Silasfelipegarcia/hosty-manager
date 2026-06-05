import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink,
  ],
  template: `
    <div class="wrap">
      <mat-card class="card">
        <h2>Recuperar senha</h2>
        @if (done()) {
          <p>Se o e-mail existir, você receberá instruções em breve.</p>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full">
              <mat-label>E-mail</mat-label>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="loading()">Enviar</button>
          </form>
        }
        <a routerLink="/login">Voltar ao login</a>
      </mat-card>
    </div>
  `,
  styles: `
    .wrap { min-height: 100vh; display: grid; place-items: center; background: #f5f7fb; }
    .card { padding: 24px; width: min(400px, 100%); }
    .full { width: 100%; }
    a { display: block; margin-top: 16px; }
  `,
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  readonly loading = signal(false);
  readonly done = signal(false);
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    try {
      await this.auth.forgotPassword(this.form.getRawValue());
      this.done.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
