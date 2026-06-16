import { FinanceDashboardBundle } from '../models/finance.models';

export function downloadFinanceCsv(bundle: FinanceDashboardBundle, competence: string): void {
  const rows = [
    ['propertyId', 'propertyName', 'gross', 'profit'],
    ...bundle.byProperty.map((p) => [p.propertyId, p.propertyName ?? '', p.grossAmount, p.profit]),
  ];
  const csv = rows.map((r) => r.join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `staya-finance-${competence}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
