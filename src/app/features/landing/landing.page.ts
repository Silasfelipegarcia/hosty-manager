import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment';

interface FeatureCard {
  icon: string;
  title: string;
  text: string;
}

interface StepCard {
  n: string;
  title: string;
  text: string;
}

interface BentoCard {
  icon: string;
  title: string;
  text: string;
  accent?: boolean;
}

interface FaqItem {
  q: string;
  a: string;
}

interface ClaraCapability {
  icon: string;
  title: string;
  text: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
})
export class LandingPage {
  readonly brandName = environment.brandName;
  readonly tagline = environment.tagline;
  readonly tenantAppUrl = environment.tenantAppUrl;
  readonly year = new Date().getFullYear();

  readonly trustChannels = ['Airbnb', 'Booking.com', 'Venda direta', 'WhatsApp', 'iCal'];

  readonly metrics = [
    { value: '360°', label: 'Operação completa', sub: 'Reserva → check-out' },
    { value: '1', label: 'Plataforma unificada', sub: 'App + portal + API' },
    { value: 'IA', label: 'Clara copiloto', sub: 'CRM que age no portal' },
    { value: '24/7', label: 'Guia na estadia', sub: 'Hóspede autônomo' },
  ];

  readonly bento: BentoCard[] = [
    {
      icon: 'hub',
      title: 'Tudo sincronizado',
      text: 'App do hóspede, portal do dono e API única. Sem dados duplicados.',
      accent: true,
    },
    {
      icon: 'sync',
      title: 'Calendário + iCal',
      text: 'Airbnb, Booking e vendas diretas no mesmo quadro.',
    },
    {
      icon: 'payments',
      title: 'Lucro por imóvel',
      text: 'Bruto, taxas, custos fixos e margem real.',
    },
    {
      icon: 'verified_user',
      title: 'Operação com prova',
      text: 'Checklist, fotos e check-out aprovado.',
    },
    {
      icon: 'smart_toy',
      title: 'Clara, copiloto IA',
      text: 'Finanças, estadias, check-in e check-out — direto no chat.',
    },
  ];

  readonly claraCapabilities: ClaraCapability[] = [
    {
      icon: 'payments',
      title: 'Finanças na conversa',
      text: 'Lucro, custos fixos, break-even e quanto faturar por imóvel — com os números reais do portal.',
    },
    {
      icon: 'event_available',
      title: 'Cadastra estadias',
      text: 'Venda direta, Airbnb manual ou histórico: ela verifica disponibilidade e registra no calendário.',
    },
    {
      icon: 'photo_camera',
      title: 'Check-in e check-out',
      text: 'Vê a fila, fotos do checklist e aprova chegada ou saída — sem perder evidência na operação.',
    },
    {
      icon: 'playlist_add_check',
      title: 'Fila do proprietário',
      text: 'Reservas pendentes, check-ins próximos e ocupação — prioriza o que precisa da sua ação hoje.',
    },
  ];

  readonly ownerFeatures: FeatureCard[] = [
    { icon: 'payments', title: 'Lucro real por imóvel', text: 'Bruto, taxas, custos e margem — sem planilha.' },
    { icon: 'event_available', title: 'Reservas centralizadas', text: 'Airbnb, Booking, direto e iCal no mesmo quadro.' },
    { icon: 'fact_check', title: 'Check-in com evidência', text: 'QR, checklist e aprovação antes de liberar a estadia.' },
    { icon: 'chat', title: 'Chat com o hóspede', text: 'Conversa por imóvel, sem perder contexto no WhatsApp.' },
    { icon: 'inventory_2', title: 'Kits e extras', text: 'Churrasco, café da manhã — venda na jornada da estadia.' },
    { icon: 'smart_toy', title: 'Clara, sua copiloto', text: 'Pergunte, cadastre estadias e aprove check-in — no chat flutuante.' },
  ];

  readonly tenantFeatures: FeatureCard[] = [
    { icon: 'travel_explore', title: 'Explorar imóveis', text: 'Descubra casas e chalés com guia, fotos e regras claras.' },
    { icon: 'calendar_month', title: 'Solicitar estadia', text: 'Datas, proposta e acompanhamento até a confirmação.' },
    { icon: 'qr_code_scanner', title: 'Check-in digital', text: 'QR na chegada, termos e checklist no celular.' },
    { icon: 'map', title: 'Guia local', text: 'Wi‑Fi, regras da casa e dicas da região na palma da mão.' },
    { icon: 'loyalty', title: 'Fidelidade', text: 'Benefícios para quem volta a se hospedar.' },
    { icon: 'support_agent', title: 'Suporte na estadia', text: 'Chat, kits e mediação se algo sair do combinado.' },
  ];

  readonly ownerSteps: StepCard[] = [
    { n: '01', title: 'Cadastre o imóvel', text: 'Playbook, fotos, iCal e co-proprietários em minutos.' },
    { n: '02', title: 'Receba e opere', text: 'Aprove pedidos, registre estadias e acompanhe o calendário.' },
    { n: '03', title: 'Veja o lucro', text: 'Performance, caixa e Clara com contexto do seu negócio.' },
  ];

  readonly tenantSteps: StepCard[] = [
    { n: '01', title: 'Encontre o lugar', text: 'Navegue pelo catálogo e veja o que cada imóvel oferece.' },
    { n: '02', title: 'Reserve com clareza', text: 'Solicite datas, receba resposta e prepare a chegada.' },
    { n: '03', title: 'Viva a estadia', text: 'Check-in, guia, extras e check-out — tudo no app.' },
  ];

  readonly testimonials = [
    {
      quote: 'Parei de misturar planilha com WhatsApp. Agora sei o lucro de cada imóvel no mesmo lugar.',
      role: 'Proprietária · 2 chalés em SP',
    },
    {
      quote: 'O hóspede chega sabendo Wi‑Fi, regras e check-in. Menos ligação, mais experiência.',
      role: 'Anfitrião · temporada no interior',
    },
  ];

  readonly faqs: FaqItem[] = [
    {
      q: `O ${environment.brandName} substitui Airbnb ou Booking?`,
      a: 'Não. Ele centraliza a operação depois da reserva — e também registra vendas diretas e histórico em massa.',
    },
    {
      q: 'Preciso usar os dois apps?',
      a: `Proprietários usam o portal web (Manager). Hóspedes usam o app ${environment.brandName}. Tudo na mesma base de dados.`,
    },
    {
      q: 'O que a Clara consegue fazer?',
      a: 'Ela lê finanças e a fila operacional, cadastra estadias, checa disponibilidade e orienta aprovações de check-in e check-out — sempre com link para a tela certa no Manager.',
    },
    {
      q: 'Posso importar aluguéis antigos?',
      a: 'Sim — planilha CSV para backfill de Airbnb, Booking e vendas diretas.',
    },
  ];

  readonly compare = [
    { bad: 'Planilha + WhatsApp solto', good: 'Operação e chat por imóvel' },
    { bad: 'Lucro “no feeling”', good: 'Margem e caixa por período' },
    { bad: 'Check-in informal', good: 'QR, checklist e evidências' },
  ];
}
