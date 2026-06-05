import { Component, OnInit, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { PropertiesService } from '../../../core/api/properties.service';
import { PropertyDto } from '../../../core/models/property.models';
import { defaultFinanceCompetence, shiftCompetence } from '../../../core/finance/finance-query.util';
import { FinanceTab } from '../../../features/finance/finance-hub.page';

@Component({
  selector: 'app-finance-filter-bar',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  templateUrl: './finance-filter-bar.component.html',
  styleUrl: './finance-filter-bar.component.scss',
})
export class FinanceFilterBarComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly props = inject(PropertiesService);

  readonly activeTab = input<FinanceTab>('mes');

  readonly competence = signal(defaultFinanceCompetence());
  readonly propertyId = signal('');
  readonly properties = signal<PropertyDto[]>([]);

  ngOnInit(): void {
    void this.loadProperties();
    this.route.queryParamMap.subscribe((params) => {
      const c = params.get('competence');
      if (c) this.competence.set(c);
      this.propertyId.set(params.get('propertyId') ?? '');
    });
  }

  private async loadProperties(): Promise<void> {
    const res = await firstValueFrom(this.props.listOwner());
    this.properties.set(res.content);
  }

  setCompetence(value: string): void {
    if (!value) return;
    this.competence.set(value);
    void this.patchQuery({ competence: value });
  }

  shiftMonth(delta: number): void {
    this.setCompetence(shiftCompetence(this.competence(), delta));
  }

  setPropertyId(value: string): void {
    this.propertyId.set(value);
    void this.patchQuery({ propertyId: value || null });
  }

  private patchQuery(params: Record<string, string | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
