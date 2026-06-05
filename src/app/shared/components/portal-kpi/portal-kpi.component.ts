import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-portal-kpi',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './portal-kpi.component.html',
  styleUrl: './portal-kpi.component.scss',
})
export class PortalKpiComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly delta = input<number | null>(null);
  readonly deltaLabel = input<string>('');
  readonly sparkline = input<number[]>([]);
  readonly routerLink = input<string | string[] | null>(null);
  readonly hint = input<string>('');

  readonly clicked = output<void>();

  sparklinePath(): string {
    const data = this.sparkline();
    if (!data.length) return '';
    const w = 64;
    const h = 24;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const step = data.length > 1 ? w / (data.length - 1) : w;
    return data
      .map((v, i) => {
        const x = i * step;
        const y = h - ((v - min) / range) * (h - 4) - 2;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  deltaPositive(): boolean {
    const d = this.delta();
    return d !== null && d >= 0;
  }
}
