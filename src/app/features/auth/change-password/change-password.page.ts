import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-change-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <mat-card class="card">
      <h2>Alterar senha</h2>
      <p>É necessário definir uma nova senha para continuar.</p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Senha atual</mat-label>
          <input matInput type="password" formControlName="currentPassword" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nova senha</mat-label>
          <input matInput type="password" formControlName="newPassword" />
        </mat-form-field>
        @if (error()) { <p class="err">{{ error() }}</p> }
        <button mat-flat-button color="primary" type="submit" [disabled]="loading()">Salvar</button>
      </form>
    </mat-card>
  `,
  styles: `
    .card { max-width: 420px; margin: 40px auto; padding: 24px; }
    .full { width: 100%; }
    .err { color: #b91c1c; }
  `,
})
export class ChangePasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.changePassword(this.form.getRawValue());
      await this.router.navigate(['/dashboard']);
    } catch {
      this.error.set('Não foi possível alterar a senha.');
    } finally {
      this.loading.set(false);
    }
  }
}
