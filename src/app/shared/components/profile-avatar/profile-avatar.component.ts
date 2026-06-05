import { Component, input } from '@angular/core';

@Component({
  selector: 'app-profile-avatar',
  standalone: true,
  template: `
    @if (photoSrc()) {
      <img
        class="avatar-img"
        [class.sm]="size() === 'sm'"
        [class.md]="size() === 'md'"
        [class.lg]="size() === 'lg'"
        [src]="photoSrc()!"
        [alt]="name()"
        loading="lazy"
      />
    } @else {
      <span
        class="avatar-fallback"
        [class.sm]="size() === 'sm'"
        [class.md]="size() === 'md'"
        [class.lg]="size() === 'lg'"
        [attr.title]="name()"
      >{{ initials() }}</span>
    }
  `,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; }

    .avatar-img,
    .avatar-fallback {
      border-radius: 50%;
      object-fit: cover;
      display: block;
      border: 1px solid rgba(0, 0, 0, 0.06);
    }

    .avatar-fallback {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #fff;
      font-weight: 700;
      display: grid;
      place-items: center;
      user-select: none;
    }

    .sm.avatar-img, .sm.avatar-fallback { width: 28px; height: 28px; font-size: 10px; }
    .md.avatar-img, .md.avatar-fallback { width: 32px; height: 32px; font-size: 11px; }
    .lg.avatar-img, .lg.avatar-fallback { width: 72px; height: 72px; font-size: 1.25rem; }
  `,
})
export class ProfileAvatarComponent {
  readonly photoSrc = input<string | null>(null);
  readonly initials = input('?');
  readonly name = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
}
