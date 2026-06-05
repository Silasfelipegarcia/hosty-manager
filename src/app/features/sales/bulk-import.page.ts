import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { OperationsService } from '../../core/api/operations.service';

const TEMPLATE = `property;competence;checkin;checkout;gross;platform;feeType;source;email;notes
Meu Apê;2024-06;2024-06-10;2024-06-15;2500.00;AIRBNB;PERCENTAGE;AIRBNB;hospede@email.com;Estadia histórica`;

@Component({
  selector: 'app-bulk-import-page',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule],
  templateUrl: './bulk-import.page.html',
  styleUrl: './bulk-import.page.scss',
})
export class BulkImportPage {
  private readonly ops = inject(OperationsService);

  readonly csv = signal(TEMPLATE);
  readonly loading = signal(false);
  readonly result = signal<{ createdCount: number; errors: string[] } | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.csv.set(String(reader.result ?? ''));
    reader.readAsText(file);
  }

  useTemplate(): void {
    this.csv.set(TEMPLATE);
  }

  async importCsv(): Promise<void> {
    this.loading.set(true);
    this.result.set(null);
    try {
      const res = await firstValueFrom(this.ops.importBackfillCsv(this.csv()));
      this.result.set({ createdCount: res.createdCount, errors: res.errors ?? [] });
    } finally {
      this.loading.set(false);
    }
  }
}
