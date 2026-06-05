export interface MonthlyDashboard {
  totalGross: number;
  totalPlatformFees: number;
  totalVariableCosts: number;
  totalFixedCosts: number;
  totalProfit: number;
  margin: number;
}

export interface PropertyMonthlyPerformance {
  propertyId: string;
  propertyName?: string;
  grossAmount: number;
  totalCosts: number;
  profit: number;
}

export interface PlatformMonthlyPerformance {
  platform: string;
  grossAmount: number;
  platformFees: number;
  profit: number;
}

export interface FinanceDashboardBundle {
  dashboard: MonthlyDashboard;
  byProperty: PropertyMonthlyPerformance[];
  byPlatform: PlatformMonthlyPerformance[];
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
