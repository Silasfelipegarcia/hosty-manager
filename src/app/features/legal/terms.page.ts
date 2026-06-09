import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-terms-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './terms.page.html',
  styleUrl: './legal-document.scss',
})
export class TermsPage {
  readonly brandName = environment.brandName;
  readonly supportEmail = 'contato@hosty.com.br';
  readonly lastUpdated = '9 de junho de 2026';
}
