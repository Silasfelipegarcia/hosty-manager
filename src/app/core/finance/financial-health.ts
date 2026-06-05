import { FinanceDashboardBundle } from '../models/finance.models';
import { financeStatusLabel } from './finance-status-labels';
import { FixedCostRow } from '../models/finance.models';
import { PropertyDto } from '../models/property.models';

export type HealthStatus = 'healthy' | 'attention' | 'critical';

export interface PropertyFinancialHealth {
  propertyId: string;
  propertyName: string;
  gross: number;
  totalCosts: number;
  profit: number;
  margin: number;
  monthlyFixedCosts: number;
  /** Reserva operacional: 2 meses de custos fixos do imóvel */
  operationalReserve: number;
  /** Colchão de contingência: 12% do bruto (impostos, manutenção imprevista) */
  contingencyReserve: number;
  /** Total recomendado para manter em caixa neste mês */
  recommendedReserve: number;
  /** Quanto pode retirar com segurança após reservas */
  safeToWithdraw: number;
  status: HealthStatus;
  statusLabel: string;
}

const MONTHS_BUFFER = 2;
const CONTINGENCY_RATE = 0.12;

export function fixedCostsForProperty(
  fixedCosts: FixedCostRow[],
  propertyId: string,
  propertyCount = 1,
): number {
  const direct = fixedCosts
    .filter((c) => c.propertyId === propertyId)
    .reduce((sum, c) => sum + c.amount, 0);
  const globalTotal = fixedCosts
    .filter((c) => c.propertyId === '__GLOBAL__')
    .reduce((sum, c) => sum + c.amount, 0);
  const globalShare = propertyCount > 0 ? globalTotal / propertyCount : 0;
  return direct + globalShare;
}

export function buildPropertyHealth(
  properties: PropertyDto[],
  bundle: FinanceDashboardBundle,
  fixedCosts: FixedCostRow[],
): PropertyFinancialHealth[] {
  const byId = new Map(bundle.byProperty.map((p) => [p.propertyId, p]));
  const propertyCount = Math.max(properties.length, 1);

  return properties.map((prop) => {
    const perf = byId.get(prop.id);
    const gross = perf?.grossAmount ?? 0;
    const totalCosts = perf?.totalCosts ?? 0;
    const profit = perf?.profit ?? 0;
    const margin = gross > 0 ? profit / gross : 0;
    const monthlyFixed = fixedCostsForProperty(fixedCosts, prop.id, propertyCount);
    const operationalReserve = monthlyFixed * MONTHS_BUFFER;
    const contingencyReserve = gross * CONTINGENCY_RATE;
    const recommendedReserve = operationalReserve + contingencyReserve + totalCosts * 0.15;
    const safeToWithdraw = Math.max(0, profit - recommendedReserve);

    let status: HealthStatus = 'healthy';
    if (margin < 0.15 || profit < monthlyFixed) {
      status = 'critical';
    } else if (margin < 0.3 || safeToWithdraw <= 0) {
      status = 'attention';
    }
    const statusLabel = financeStatusLabel(status, 'cash');

    return {
      propertyId: prop.id,
      propertyName: prop.name,
      gross,
      totalCosts,
      profit,
      margin,
      monthlyFixedCosts: monthlyFixed,
      operationalReserve,
      contingencyReserve,
      recommendedReserve,
      safeToWithdraw,
      status,
      statusLabel,
    };
  });
}

export function portfolioSummary(health: PropertyFinancialHealth[]) {
  return {
    totalGross: health.reduce((s, h) => s + h.gross, 0),
    totalProfit: health.reduce((s, h) => s + h.profit, 0),
    totalRecommendedReserve: health.reduce((s, h) => s + h.recommendedReserve, 0),
    totalSafeToWithdraw: health.reduce((s, h) => s + h.safeToWithdraw, 0),
    criticalCount: health.filter((h) => h.status === 'critical').length,
  };
}
