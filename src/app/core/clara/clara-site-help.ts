export interface ClaraSiteHelpReply {
  text: string;
  actionLinks: { label: string; path: string }[];
}

interface HelpRule {
  keywords: RegExp;
  text: string;
  links: { label: string; path: string }[];
}

const HELP_RULES: HelpRule[] = [
  {
    keywords: /\b(lucro|finan(ç|c)a?s?|caixa|margem|faturamento|performance|break.?even|empatar)\b/i,
    text: 'Para ver lucro, margem e caixa, abra Finanças. Na aba Performance você compara períodos por imóvel.',
    links: [
      { label: 'Abrir Finanças', path: '/finance' },
      { label: 'Ver Performance', path: '/finance?tab=performance' },
    ],
  },
  {
    keywords: /\b(reserva?s?|pendente|aprova(ç|c)(ã|a)o|check.?in|check.?out|calend(á|a)rio)\b/i,
    text: 'Reservas concentra aprovações, check-in, check-out e o calendário da carteira.',
    links: [{ label: 'Abrir Reservas', path: '/reservations' }],
  },
  {
    keywords: /\b(cadastr|registr|estadia|airbnb|booking|retroativ|venda|aluguel|h(ó|o)spede)\b/i,
    text: 'Para lançar estadia nova ou retroativa, use Registrar estadia. Para muitos registros de uma vez, há importação por planilha.',
    links: [
      { label: 'Registrar estadia', path: '/sales' },
      { label: 'Importar planilha', path: '/sales/import' },
    ],
  },
  {
    keywords: /\b(im(ó|o)vel|im(ó|o)veis|di(á|a)ria|foto|capa|galeria|cadastro)\b/i,
    text: 'Imóveis é onde você edita dados, diária, fotos e configurações de cada propriedade.',
    links: [
      { label: 'Ver imóveis', path: '/properties' },
      { label: 'Novo imóvel', path: '/properties/new' },
    ],
  },
  {
    keywords: /\b(mensagem|chat|conversa|h(ó|o)spede)\b/i,
    text: 'Mensagens reúne as conversas por imóvel com seus hóspedes.',
    links: [{ label: 'Abrir Mensagens', path: '/messages' }],
  },
  {
    keywords: /\b(kit|pedido)\b/i,
    text: 'Pedidos de kit ficam na fila de kits pendentes.',
    links: [{ label: 'Pedidos de kit', path: '/kits/pending' }],
  },
  {
    keywords: /\b(servi(ç|c)o|campo|manuten(ç|c)(ã|a)o)\b/i,
    text: 'Serviços de campo concentram ordens pendentes na propriedade.',
    links: [{ label: 'Serviços de campo', path: '/field-services/pending' }],
  },
  {
    keywords: /\b(conta|senha|perfil|foto de perfil)\b/i,
    text: 'Em Conta você atualiza perfil, senha e dados do proprietário.',
    links: [{ label: 'Abrir Conta', path: '/account' }],
  },
  {
    keywords: /\b(ajuda|como|onde|tutorial|guia)\b/i,
    text: 'A central de Ajuda explica quando usar cada fluxo do portal.',
    links: [{ label: 'Abrir Ajuda', path: '/help' }],
  },
  {
    keywords: /\b(in(í|i)cio|dashboard|painel|resumo)\b/i,
    text: 'O Início mostra o resumo da operação e atalhos do dia.',
    links: [{ label: 'Ir para Início', path: '/dashboard' }],
  },
];

const DEFAULT_REPLY: ClaraSiteHelpReply = {
  text: 'No momento estou disponível só para ajudar com o portal. Posso indicar onde clicar em Finanças, Reservas, Registrar estadia e Imóveis.',
  actionLinks: [
    { label: 'Finanças', path: '/finance' },
    { label: 'Reservas', path: '/reservations' },
    { label: 'Registrar estadia', path: '/sales' },
    { label: 'Imóveis', path: '/properties' },
  ],
};

export function replyClaraSiteHelp(message: string): ClaraSiteHelpReply {
  const normalized = message.trim();
  if (!normalized) return DEFAULT_REPLY;

  for (const rule of HELP_RULES) {
    if (rule.keywords.test(normalized)) {
      return { text: rule.text, actionLinks: rule.links };
    }
  }

  return DEFAULT_REPLY;
}

export const CLARA_SITE_GREETING =
  'Sou a Clara. Posso te ajudar a encontrar telas do portal — finanças, reservas, cadastro de estadias e mais.';

export const CLARA_SITE_SUGGESTIONS = [
  'Onde vejo meu lucro?',
  'Como registrar uma estadia?',
  'O que está pendente?',
  'Onde edito meus imóveis?',
];
