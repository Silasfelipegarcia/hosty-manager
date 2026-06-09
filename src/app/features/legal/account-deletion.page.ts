import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-account-deletion-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './account-deletion.page.html',
  styleUrl: './legal-document.scss',
})
export class AccountDeletionPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly brandName = environment.brandName;
  readonly supportEmail = 'contato@hosty.com.br';
  readonly lastUpdated = '9 de junho de 2026';
  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    note: [''],
  });

  ngOnInit(): void {
    const prefill = this.route.snapshot.queryParamMap.get('email');
    if (prefill?.trim()) {
      this.form.patchValue({ email: prefill.trim() });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const email = this.form.getRawValue().email.trim();
    const note = this.form.getRawValue().note.trim();
    const body = [
      'Olá,',
      '',
      'Solicito a exclusão da minha conta Hosty e dos dados pessoais associados.',
      `E-mail de login: ${email}`,
      '',
      note ? `Observação: ${note}` : '',
      '',
      'Entendo que alguns registros podem ser mantidos quando exigido por lei.',
      '',
      'Obrigado.',
    ]
      .filter(Boolean)
      .join('\n');

    const mailto = `mailto:${this.supportEmail}?subject=${encodeURIComponent('Exclusão de conta Hosty')}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    this.submitted.set(true);
  }
}
