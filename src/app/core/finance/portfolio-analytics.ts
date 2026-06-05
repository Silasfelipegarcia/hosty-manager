import { FinanceDashboardBundle } from '../models/finance.models';

export interface YtdMonthPoint {
  competence: string;
  label: string;
  gross: number;
  profit: number;
  costs: number;
}

export interface BreakEvenRow {
  propertyId: string;
  propertyName: string;
  monthlyFixed: number;
  nightlyRate: number;
  breakEvenNights: number;
  revenueTarget30: number;
  actualGross: number;
  gap: number;
}

export function buildYtdSeries(bundles: { competence: string; bundle: FinanceDashboardBundle }[]): YtdMonthPoint[] {
  return bundles
    .slice()
    .sort((a, b) => a.competence.localeCompare(b.competence))
    .map(({ competence, bundle }) => {
      const d = bundle.dashboard;
      const costs = d.totalPlatformFees + d.totalVariableCosts + d.totalFixedCosts;
      const [, m] = competence.split('-');
      return {
        competence,
        label: `${m}/${competence.slice(0, 4)}`,
        gross: d.totalGross,
        profit: d.totalProfit,
        costs,
      };
    });
}

export function breakEvenNights(monthlyFixed: number, nightlyRate: number): number {
  if (nightlyRate <= 0) return 0;
  return Math.ceil(monthlyFixed / nightlyRate);
}

export function revenueTarget(nightlyRate: number, days = 30): number {
  return nightlyRate * days;
}

export function yearStatus(ytdProfit: number): { label: string; tone: 'positive' | 'neutral' | 'negative' } {
  if (ytdProfit > 0) return { label: 'Ano positivo', tone: 'positive' };
  if (ytdProfit === 0) return { label: 'Empate no ano', tone: 'neutral' };
  return { label: 'Ano negativo', tone: 'negative' };
}

export function ytdTotals(series: YtdMonthPoint[]) {
  return series.reduce(
    (acc, p) => ({
      gross: acc.gross + p.gross,
      profit: acc.profit + p.profit,
      costs: acc.costs + p.costs,
    }),
    { gross: 0, profit: 0, costs: 0 },
  );
}
