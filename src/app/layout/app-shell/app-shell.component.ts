import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/auth/auth.service';
import { BadgeService } from '../../core/api/badge.service';
import { environment } from '../../../environments/environment';
import { ClaraAssistantWidget } from '../clara-assistant/clara-assistant.widget';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: () => number;
  exact?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatBadgeModule,
    ClaraAssistantWidget,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly badges = inject(BadgeService);

  readonly appName = environment.appName;

  readonly nav: NavItem[] = [
    { label: 'Início', path: '/dashboard', icon: 'dashboard' },
    { label: 'Imóveis', path: '/properties', icon: 'home_work' },
    {
      label: 'Reservas',
      path: '/reservations',
      icon: 'event',
      badge: () => this.badges.ownerActionRequired(),
    },
    { label: 'Finanças', path: '/finance', icon: 'payments', exact: true },
    { label: 'Performance', path: '/finance/crm', icon: 'analytics' },
    { label: 'Caixa', path: '/finance/health', icon: 'savings' },
    { label: 'Vendas', path: '/sales', icon: 'point_of_sale' },
    { label: 'Mensagens', path: '/messages', icon: 'chat' },
    { label: 'Conta', path: '/account', icon: 'person' },
  ];

  get email(): string | null {
    return this.auth.email;
  }

  ngOnInit(): void {
    void this.badges.refresh();
    setInterval(() => void this.badges.refresh(), 180_000);
  }

  logout(): void {
    this.auth.logout();
  }
}
