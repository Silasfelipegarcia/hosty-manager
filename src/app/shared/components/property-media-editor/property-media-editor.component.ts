import { Component, computed, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  imageFileToDataUrl,
  resolveProfilePhotoSrc,
} from '../../../core/profile/profile-photo.util';

export const PROPERTY_GALLERY_SLOT_COUNT = 4;

@Component({
  selector: 'app-property-media-editor',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './property-media-editor.component.html',
  styleUrl: './property-media-editor.component.scss',
})
export class PropertyMediaEditorComponent {
  readonly coverPhotoUrl = model('');
  readonly galleryPhotoUrls = model<string[]>([]);

  readonly showUrlFields = signal(false);
  readonly error = signal<string | null>(null);

  readonly gallerySlots = computed(() => {
    const current = this.galleryPhotoUrls();
    return Array.from({ length: PROPERTY_GALLERY_SLOT_COUNT }, (_, i) => current[i] ?? '');
  });

  coverPreview(): string | null {
    return resolveProfilePhotoSrc(this.coverPhotoUrl());
  }

  galleryPreview(index: number): string | null {
    return resolveProfilePhotoSrc(this.gallerySlots()[index]);
  }

  toggleUrlFields(): void {
    this.showUrlFields.update((v) => !v);
  }

  async onCoverSelected(event: Event): Promise<void> {
    await this.loadFileInto(event, (url) => this.coverPhotoUrl.set(url));
  }

  async onGallerySelected(event: Event, index: number): Promise<void> {
    await this.loadFileInto(event, (url) => this.setGallerySlot(index, url));
  }

  removeCover(): void {
    this.coverPhotoUrl.set('');
    this.error.set(null);
  }

  removeGallerySlot(index: number): void {
    this.setGallerySlot(index, '');
  }

  onCoverUrlInput(value: string): void {
    this.coverPhotoUrl.set(value.trim());
  }

  onGalleryUrlInput(index: number, value: string): void {
    this.setGallerySlot(index, value.trim());
  }

  private async loadFileInto(event: Event, apply: (url: string) => void): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await imageFileToDataUrl(file);
      apply(dataUrl);
      this.error.set(null);
    } catch {
      this.error.set('Não foi possível processar a imagem.');
    }
  }

  private setGallerySlot(index: number, value: string): void {
    const next = [...this.gallerySlots()];
    next[index] = value;
    this.galleryPhotoUrls.set(next);
  }
}
