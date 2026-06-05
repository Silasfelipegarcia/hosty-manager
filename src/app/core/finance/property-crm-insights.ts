import { FinanceDashboardBundle, FixedCostRow } from '../models/finance.models';
import { PropertyExpense } from '../models/property-expense.models';
import { PropertyDto } from '../models/property.models';
import { fixedCostsForProperty, HealthStatus } from './financial-health';
import { financeStatusLabel } from './finance-status-labels';
import { breakEvenNights, revenueTarget } from './portfolio-analytics';

export interface PeriodMonthBundle {
  competence: string;
  bundle: FinanceDashboardBundle;
}

export interface MonthlyInsight {
  competence: string;
  label: string;
  gross: number;
  profit: number;
  costs: number;
}

export interface PropertyCrmRow {
  propertyId: string;
  propertyName: string;
  gross: number;
  totalCosts: number;
  profit: number;
  margin: number;
  monthlyFixed: number;
  periodExpenses: number;
  nightlyRate: number;
  breakEvenNights: number;
  revenueTarget30: number;
  /** Faturamento mínimo para cobrir custos do período (média mensal) */
  monthlyBreakEven: number;
  /** Meta para ficar tranquilo: fixos + despesas + colchão operacional */
  tranquilityTarget: number;
  gapToTranquility: number;
  /** Acima disso você vê só lucro líquido no mês (custos totais + 10% buffer) */
  profitOnlyThreshold: number;
  status: HealthStatus;
  statusLabel: string;
}

export interface CrmPortfolioInsights {
  topMonths: MonthlyInsight[];
  deficitProperties: PropertyCrmRow[];
  bestMarginProperties: PropertyCrmRow[];
  totalGross: number;
  totalProfit: number;
  totalExpenses: number;
  monthCount: number;
}

export function buildPeriodMonths(from: string, to: string): string[] {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  const out: string[] = [];
  let y = fy;
  let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function monthLabel(competence: string): string {
  const [year, month] = competence.split('-');
  return `${month}/${year}`;
}

export function presetPeriod(preset: '3m' | '6m' | '12m' | 'ytd'): { from: string; to: string } {
  const now = new Date();
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  if (preset === 'ytd') {
    return { from: `${now.getFullYear()}-01`, to };
  }
  const months = preset === '3m' ? 2 : preset === '6m' ? 5 : 11;
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);
  const from = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
  return { from, to };
}

export function isPeriodValid(from: string, to: string): boolean {
  return buildPeriodMonths(from, to).length > 0;
}

export function buildMonthlyInsights(bundles: PeriodMonthBundle[], propertyId?: string): MonthlyInsight[] {
  return bundles
    .map(({ competence, bundle }) => {
      if (propertyId) {
        const p = bundle.byProperty.find((row) => row.propertyId === propertyId);
        return {
          competence,
          label: monthLabel(competence),
          gross: p?.grossAmount ?? 0,
          profit: p?.profit ?? 0,
          costs: p?.totalCosts ?? 0,
        };
      }
      const d = bundle.dashboard;
      const costs = d.totalPlatformFees + d.totalVariableCosts + d.totalFixedCosts;
      return {
        competence,
        label: monthLabel(competence),
        gross: d.totalGross,
        profit: d.totalProfit,
        costs,
      };
    })
    .sort((a, b) => b.gross - a.gross);
}

export function buildPropertyCrmRows(
  properties: PropertyDto[],
  bundles: PeriodMonthBundle[],
  fixedCosts: FixedCostRow[],
  expenses: PropertyExpense[],
): PropertyCrmRow[] {
  const monthCount = Math.max(bundles.length, 1);
  const propertyCount = Math.max(properties.length, 1);
  const perfByProperty = new Map<string, { gross: number; costs: number; profit: number }>();

  for (const { bundle } of bundles) {
    for (const p of bundle.byProperty) {
      const cur = perfByProperty.get(p.propertyId) ?? { gross: 0, costs: 0, profit: 0 };
      cur.gross += p.grossAmount;
      cur.costs += p.totalCosts;
      cur.profit += p.profit;
      perfByProperty.set(p.propertyId, cur);
    }
  }

  const expensesByProperty = new Map<string, number>();
  for (const e of expenses) {
    expensesByProperty.set(e.propertyId, (expensesByProperty.get(e.propertyId) ?? 0) + e.amount);
  }

  return properties.map((prop) => {
    const perf = perfByProperty.get(prop.id) ?? { gross: 0, costs: 0, profit: 0 };
    const gross = perf.gross;
    const totalCosts = perf.costs;
    const profit = perf.profit;
    const margin = gross > 0 ? profit / gross : 0;
    const monthlyFixed = fixedCostsForProperty(fixedCosts, prop.id, propertyCount);
    const periodExpenses = expensesByProperty.get(prop.id) ?? 0;
    const avgMonthlyGross = gross / monthCount;
    const avgMonthlyCosts = totalCosts / monthCount;
    const avgMonthlyExpenses = periodExpenses / monthCount;
    const nightlyRate = prop.nightlyRate ?? 0;
    const beNights = breakEvenNights(monthlyFixed + avgMonthlyExpenses, nightlyRate);
    const target30 = revenueTarget(nightlyRate, 30);
    const monthlyBreakEven = avgMonthlyCosts + avgMonthlyExpenses;
    const tranquilityTarget = monthlyFixed + avgMonthlyExpenses + monthlyFixed * 2 + avgMonthlyGross * 0.12;
    const gapToTranquility = Math.max(0, tranquilityTarget - avgMonthlyGross);
    const profitOnlyThreshold = monthlyBreakEven * 1.1;

    let status: HealthStatus = 'healthy';
    if (profit < 0 || margin < 0) {
      status = 'critical';
    } else if (avgMonthlyGross < tranquilityTarget || margin < 0.2) {
      status = 'attention';
    }
    const statusLabel = financeStatusLabel(status, 'performance');

    return {
      propertyId: prop.id,
      propertyName: prop.name,
      gross,
      totalCosts,
      profit,
      margin,
      monthlyFixed,
      periodExpenses,
      nightlyRate,
      breakEvenNights: beNights,
      revenueTarget30: target30,
      monthlyBreakEven,
      tranquilityTarget,
      gapToTranquility,
      profitOnlyThreshold,
      status,
      statusLabel,
    };
  });
}

export function buildCrmInsights(rows: PropertyCrmRow[], monthly: MonthlyInsight[]): CrmPortfolioInsights {
  const sortedMargin = rows.slice().sort((a, b) => b.margin - a.margin);
  return {
    topMonths: monthly.slice(0, 3),
    deficitProperties: rows.filter((r) => r.profit < 0).sort((a, b) => a.profit - b.profit),
    bestMarginProperties: sortedMargin.filter((r) => r.profit > 0).slice(0, 3),
    totalGross: rows.reduce((s, r) => s + r.gross, 0),
    totalProfit: rows.reduce((s, r) => s + r.profit, 0),
    totalExpenses: rows.reduce((s, r) => s + r.periodExpenses, 0),
    monthCount: monthly.length,
  };
}
