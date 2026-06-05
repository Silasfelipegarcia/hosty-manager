import { Component, HostListener, inject, effect } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommandPaletteService, CommandItem } from '../../../core/command-palette/command-palette.service';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.scss',
})
export class CommandPaletteComponent {
  readonly palette = inject(CommandPaletteService);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      if (!this.palette.open()) return;
      queueMicrotask(() => document.getElementById('cmdk-input')?.focus());
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.palette.toggle();
      return;
    }
    if (!this.palette.open()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.palette.close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.palette.moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.palette.moveActive(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.palette.execute();
    }
  }

  onInput(value: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.palette.search(value), 120);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('cmdk-backdrop')) {
      this.palette.close();
    }
  }

  select(item: CommandItem, index: number): void {
    this.palette.activeIndex.set(index);
    this.palette.execute(item);
  }
}
