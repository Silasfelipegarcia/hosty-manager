import { currentCompetence } from '../dates/competence';

export function shiftCompetence(competence: string, deltaMonths: number): string {
  const [y, m] = competence.split('-').map(Number);
  const d = new Date(y, m - 1 + deltaMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function ytdRangeForYear(year: number): { from: string; to: string } {
  return {
    from: `${year}-01`,
    to: `${year}-12`,
  };
}

export function sparklineRange(competence: string, months = 6): { from: string; to: string } {
  return {
    from: shiftCompetence(competence, -(months - 1)),
    to: competence,
  };
}

export function defaultFinanceCompetence(): string {
  return currentCompetence();
}
