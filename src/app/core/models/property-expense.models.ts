export interface PropertyExpense {
  id: string;
  propertyId: string;
  propertyName?: string;
  competence: string;
  category: string;
  categoryLabel?: string;
  name: string;
  amount: number;
  notes?: string;
  createdAt?: string;
}

export interface PropertyExpenseRequest {
  competence: string;
  category?: string;
  name: string;
  amount: number;
  notes?: string;
}

export const EXPENSE_CATEGORIES = [
  { value: 'CONDOMINIO', label: 'Condomínio' },
  { value: 'UTILITIES', label: 'Água / luz / gás' },
  { value: 'MAINTENANCE', label: 'Manutenção / reparo' },
  { value: 'INSURANCE', label: 'Seguro' },
  { value: 'TAX', label: 'Impostos / IPTU' },
  { value: 'OTHER', label: 'Outro' },
] as const;
