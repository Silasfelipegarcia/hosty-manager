import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { FieldServicesService } from '../../core/api/field-services.service';
import { FieldServiceOrder } from '../../core/models/operations.models';
@Component({
  selector: 'app-field-services-pending-page',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  template: `
    <h1>Field services pendentes</h1>
    @if (items().length === 0) { <p>Nenhuma ordem pendente.</p> }
    @for (o of items(); track o.id) {
      <mat-card class="row">
        <div>
          <strong>{{ o.serviceType }}</strong> — {{ o.propertyName }}
          <p>{{ o.providerName }} · {{ o.scheduledAt }}</p>
        </div>
        <div>
          <button mat-flat-button color="primary" (click)="approve(o.id)">Aprovar</button>
          <button mat-stroked-button color="warn" (click)="reject(o.id)">Rejeitar</button>
        </div>
      </mat-card>
    }
  `,
  styles: `.row { display: flex; justify-content: space-between; align-items: center; padding: 16px; margin-bottom: 8px; }`,
})
export class FieldServicesPendingPage implements OnInit {
  private readonly api = inject(FieldServicesService);
  readonly items = signal<FieldServiceOrder[]>([]);

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    const res = await firstValueFrom(this.api.listPending());
    this.items.set(res.content);
  }

  async approve(id: string): Promise<void> {
    await firstValueFrom(this.api.approve(id));
    await this.load();
  }

  async reject(id: string): Promise<void> {
    await firstValueFrom(this.api.reject(id));
    await this.load();
  }
}
