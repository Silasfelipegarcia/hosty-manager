/** Mês de referência no formato YYYY-MM */
export function currentCompetence(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function competenceYearMonth(competence: string): { year: number; month: number } {
  const [y, m] = competence.split('-').map(Number);
  return { year: y, month: m };
}
