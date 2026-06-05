import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { firstValueFrom } from 'rxjs';
import { PropertiesService } from '../../../core/api/properties.service';

@Component({
  selector: 'app-property-create-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
  templateUrl: './property-create.page.html',
})
export class PropertyCreatePage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PropertiesService);
  private readonly router = inject(Router);
  readonly saving = signal(false);

  readonly identity = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    nightlyRate: [0],
    maxGuests: [2],
  });

  readonly address = this.fb.nonNullable.group({
    city: ['', Validators.required],
    state: ['SP'],
    neighborhood: [''],
    streetAddress: [''],
    streetNumber: [''],
    complement: [''],
    postalCode: [''],
    country: ['BR'],
  });

  readonly rules = this.fb.nonNullable.group({
    petsAllowed: [false],
    maxPets: [0],
    tenantCancellationMinDaysBeforeCheckin: [7],
    noShowGraceHours: [24],
  });

  readonly media = this.fb.nonNullable.group({
    coverPhotoUrl: [''],
    instagramUrl: [''],
    websiteUrl: [''],
  });

  readonly publish = this.fb.nonNullable.group({
    operationalStatus: ['DRAFT', Validators.required],
  });

  async submit(): Promise<void> {
    this.saving.set(true);
    try {
      const body = {
        ...this.identity.getRawValue(),
        ...this.address.getRawValue(),
        ...this.rules.getRawValue(),
        ...this.media.getRawValue(),
        ...this.publish.getRawValue(),
      };
      const created = await firstValueFrom(this.api.create(body));
      await this.router.navigate(['/properties', created.id]);
    } finally {
      this.saving.set(false);
    }
  }
}
