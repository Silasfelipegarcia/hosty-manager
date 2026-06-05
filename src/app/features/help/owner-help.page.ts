import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { OWNER_LABELS } from '../../core/i18n/owner-labels';

@Component({
  selector: 'app-owner-help-page',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule],
  templateUrl: './owner-help.page.html',
  styleUrl: './owner-help.page.scss',
})
export class OwnerHelpPage {
  readonly labels = OWNER_LABELS;
}
