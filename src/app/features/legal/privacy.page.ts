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
  readonly supportEmail = environment.supportEmail;
  readonly lastUpdated = '9 de junho de 2026';
  readonly deletionMailto = `mailto:${environment.supportEmail}?subject=${encodeURIComponent(`Exclusão de conta ${environment.brandName}`)}`;
}
