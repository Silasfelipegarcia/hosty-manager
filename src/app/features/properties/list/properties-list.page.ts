import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { PropertiesService } from '../../../core/api/properties.service';
import { PropertyDto } from '../../../core/models/property.models';
import { CurrencyBrlPipe } from '../../../shared/pipes/currency-brl.pipe';

@Component({
  selector: 'app-properties-list-page',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatChipsModule, MatIconModule, CurrencyBrlPipe],
  templateUrl: './properties-list.page.html',
  styleUrl: './properties-list.page.scss',
})
export class PropertiesListPage implements OnInit {
  private readonly api = inject(PropertiesService);
  readonly items = signal<PropertyDto[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.api.listOwner());
      this.items.set(res.content);
    } finally {
      this.loading.set(false);
    }
  }
}
