import { HealthStatus } from './financial-health';

/** Labels unificados para status financeiro (Caixa e Performance). */
export function financeStatusLabel(status: HealthStatus, variant: 'cash' | 'performance' = 'cash'): string {
  if (variant === 'performance') {
    switch (status) {
      case 'healthy':
        return 'Gerando lucro';
      case 'attention':
        return 'Abaixo da meta';
      case 'critical':
        return 'Prejuízo no período';
    }
  }
  switch (status) {
    case 'healthy':
      return 'Saudável';
    case 'attention':
      return 'Ajustar reservas';
    case 'critical':
      return 'Atenção urgente';
  }
}
