import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'competence', standalone: true })
export class CompetencePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const [year, month] = value.split('-');
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ];
    const idx = Number(month) - 1;
    return `${months[idx] ?? month}/${year}`;
  }
}
