const ROUTE_PATTERNS: { pattern: RegExp; label: string; path: string }[] = [
  { pattern: /\bperformance\b/i, label: 'Abrir Performance', path: '/finance?tab=performance' },
  { pattern: /\bfinanças?\b/i, label: 'Abrir Finanças', path: '/finance' },
  { pattern: /\bcaixa\b/i, label: 'Abrir Caixa', path: '/finance?tab=caixa' },
  { pattern: /\breservas?\b/i, label: 'Abrir Reservas', path: '/reservations' },
  { pattern: /\baprova(ç|c)(ã|a)o\b/i, label: 'Fila de aprovação', path: '/reservations' },
  { pattern: /\bimport(ar|ação)?\b/i, label: 'Importar planilha', path: '/sales/import' },
  { pattern: /\bregistrar estadia\b/i, label: 'Registrar estadia', path: '/sales' },
  { pattern: /\bim(ó|o)veis\b/i, label: 'Ver imóveis', path: '/properties' },
  { pattern: /\bmensagens\b/i, label: 'Mensagens', path: '/messages' },
];

export function parseClaraActionLinks(reply: string): { label: string; path: string }[] {
  const seen = new Set<string>();
  const links: { label: string; path: string }[] = [];
  for (const { pattern, label, path } of ROUTE_PATTERNS) {
    if (pattern.test(reply) && !seen.has(path)) {
      seen.add(path);
      links.push({ label, path });
    }
  }
  return links.slice(0, 4);
}
