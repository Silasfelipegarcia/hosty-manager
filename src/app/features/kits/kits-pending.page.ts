import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { OperationsService } from '../../core/api/operations.service';
import { KitOrder } from '../../core/models/operations.models';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';

@Component({
  selector: 'app-kits-pending-page',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, CurrencyBrlPipe],
  template: `
    <h1>Kits pendentes</h1>
    @if (items().length === 0) { <p>Nenhum pedido pendente.</p> }
    @for (o of items(); track o.id) {
      <mat-card class="row">
        <div>
          <strong>{{ o.tenantName }}</strong> — {{ o.propertyName }}
          <p>{{ o.requestedTotal | currencyBrl }}</p>
        </div>
        <div>
          <button mat-flat-button color="primary" (click)="approve(o)">Aprovar</button>
          <button mat-stroked-button color="warn" (click)="reject(o.id)">Rejeitar</button>
        </div>
      </mat-card>
    }
  `,
  styles: `.row { display: flex; justify-content: space-between; align-items: center; padding: 16px; margin-bottom: 8px; }`,
})
export class KitsPendingPage implements OnInit {
  private readonly ops = inject(OperationsService);
  readonly items = signal<KitOrder[]>([]);

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    const res = await firstValueFrom(this.ops.listPendingKitOrders());
    this.items.set(res.content);
  }

  async approve(o: KitOrder): Promise<void> {
    await firstValueFrom(this.ops.approveKitOrder(o.id, o.requestedTotal ?? 0));
    await this.load();
  }

  async reject(id: string): Promise<void> {
    await firstValueFrom(this.ops.rejectKitOrder(id));
    await this.load();
  }
}
