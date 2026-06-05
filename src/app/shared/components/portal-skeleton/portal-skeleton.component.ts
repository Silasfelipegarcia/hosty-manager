import { Component, input } from '@angular/core';

export type PortalSkeletonVariant = 'dashboard' | 'list' | 'kpis' | 'card';

@Component({
  selector: 'app-portal-skeleton',
  standalone: true,
  templateUrl: './portal-skeleton.component.html',
  styleUrl: './portal-skeleton.component.scss',
})
export class PortalSkeletonComponent {
  readonly variant = input<PortalSkeletonVariant>('dashboard');
  readonly rows = input(5);

  rowIndices(): number[] {
    return Array.from({ length: this.rows() }, (_, i) => i);
  }
}
