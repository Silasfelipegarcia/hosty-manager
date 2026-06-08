export interface FeatureEntitlement {
  enabled: boolean;
  limitValue: number | null;
}

export interface PlanEntitlement {
  planCode: string;
  planName: string;
  priceCents: number;
  paidActive: boolean;
  features: Record<string, FeatureEntitlement>;
  globalFlags: Record<string, boolean>;
}

export interface MeEntitlements {
  owner: PlanEntitlement;
  guest: PlanEntitlement;
}

export const OWNER_FEATURES = {
  propertiesMax: 'properties.max',
  financeMonth: 'finance.month',
  financePerformance: 'finance.performance',
  financeCaixa: 'finance.caixa',
  financeExportCsv: 'finance.export_csv',
  salesBulkImport: 'sales.bulk_import',
  icalSync: 'ical.sync',
  kits: 'kits',
  fieldServices: 'field_services',
  loyaltyRules: 'loyalty.rules',
  claraAi: 'clara.ai',
  claraTools: 'clara.tools',
} as const;
