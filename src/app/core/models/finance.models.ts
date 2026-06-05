export interface MonthlyDashboardComparison {
  previousCompetence: string;
  grossDelta: number;
  profitDelta: number;
  marginDelta: number;
}

export interface MonthlyDashboard {
  totalGross: number;
  totalPlatformFees: number;
  totalVariableCosts: number;
  totalFixedCosts: number;
  totalProfit: number;
  margin: number;
  totalPropertyExpenses?: number;
  totalBookingVariableCosts?: number;
  bookedNights?: number;
  occupancyRate?: number;
  adr?: number;
  expensesByCategory?: Record<string, number>;
  comparison?: MonthlyDashboardComparison | null;
}

export interface PropertyMonthlyPerformance {
  propertyId: string;
  propertyName?: string;
  grossAmount: number;
  totalCosts: number;
  profit: number;
  platformFees?: number;
  fixedCosts?: number;
  bookingVariableCosts?: number;
  propertyExpenses?: number;
  margin?: number;
  bookedNights?: number;
  occupancyRate?: number;
  adr?: number;
}

export interface PlatformMonthlyPerformance {
  platform: string;
  grossAmount: number;
  platformFees: number;
  profit: number;
}

export interface FinanceDashboardBundle {
  competence?: string;
  dashboard: MonthlyDashboard;
  byProperty: PropertyMonthlyPerformance[];
  byPlatform: PlatformMonthlyPerformance[];
}

export interface FinanceDashboardRangeResult {
  months: FinanceDashboardBundle[];
  totals: MonthlyDashboard;
  ytd: MonthlyDashboard;
}

export interface FinanceBreakEvenRow {
  propertyId: string;
  propertyName: string;
  fixedCostsMonth: number;
  nightlyRate: number;
  breakEvenNights: number;
  targetRevenue30Nights: number;
  realizedGross: number;
  gap: number;
}

export interface FixedCostRow {
  id: string;
  propertyId: string;
  propertyName?: string;
  competence: string;
  name: string;
  amount: number;
  recurring?: boolean;
}

export interface AddFixedCostRequest {
  propertyId: string;
  competence?: string;
  name: string;
  amount: number;
  recurring?: boolean;
}

export interface VariableCostRequest {
  name: string;
  amount: number;
}

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  CONDOMINIO: 'Condomínio',
  UTILITIES: 'Água / luz / gás',
  MAINTENANCE: 'Manutenção',
  INSURANCE: 'Seguro',
  TAX: 'Impostos',
  OTHER: 'Outro',
};
