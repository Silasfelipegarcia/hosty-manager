import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '../../core/api/account.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h1>Conta</h1>
    <mat-card class="card">
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="full"><mat-label>Nome</mat-label><input matInput formControlName="fullName" /></mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>E-mail</mat-label><input matInput formControlName="email" readonly /></mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>Telefone</mat-label><input matInput formControlName="phone" /></mat-form-field>
        <button mat-flat-button color="primary" type="submit">Salvar perfil</button>
      </form>
    </mat-card>
    <mat-card class="card">
      <h3>Segurança</h3>
      <p>Para alterar a senha, use a opção no app ou solicite recuperação por e-mail.</p>
      <button mat-stroked-button color="warn" (click)="logout()">Sair</button>
    </mat-card>
  `,
  styles: `.card { padding: 16px; margin-bottom: 16px; max-width: 480px; } .full { width: 100%; }`,
})
export class AccountPage implements OnInit {
  private readonly account = inject(AccountService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({ fullName: [''], email: [''], phone: [''] });

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    const p = await firstValueFrom(this.account.getProfile());
    this.form.patchValue({ ...p, email: p.email ?? this.auth.email ?? '' });
  }

  async save(): Promise<void> {
    const { fullName, phone } = this.form.getRawValue();
    await firstValueFrom(this.account.updateProfile({ fullName, phone }));
  }

  logout(): void { this.auth.logout(); }
}
