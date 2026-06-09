import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './privacy.page.html',
  styleUrl: './legal-document.scss',
})
export class PrivacyPage {
  readonly brandName = environment.brandName;
  readonly supportEmail = 'contato@hosty.com.br';
  readonly lastUpdated = '9 de junho de 2026';
  readonly deletionMailto = `mailto:contato@hosty.com.br?subject=${encodeURIComponent('Exclusão de conta Hosty')}`;
}
