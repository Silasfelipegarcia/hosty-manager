import { Component, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { BadgeService } from '../../core/api/badge.service';
import { OwnerProfileStore } from '../../core/profile/owner-profile.store';
import { ProfileAvatarComponent } from '../../shared/components/profile-avatar/profile-avatar.component';
import { environment } from '../../../environments/environment';
import { ClaraAssistantWidget } from '../clara-assistant/clara-assistant.widget';
import { CommandPaletteComponent } from '../../shared/components/command-palette/command-palette.component';
import { CommandPaletteService } from '../../core/command-palette/command-palette.service';
import { OWNER_LABELS } from '../../core/i18n/owner-labels';
import { OwnerEntitlementsStore } from '../../core/entitlements/owner-entitlements.store';
import { OWNER_FEATURES } from '../../core/models/entitlements.models';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: () => number;
  exact?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Início',
  '/properties': 'Imóveis',
  '/reservations': 'Reservas',
  '/finance': 'Finanças',
  '/sales': 'Registrar estadia',
  '/kits/pending': 'Pedidos de kit',
  '/field-services/pending': 'Serviços de campo',
  '/field-services/providers': 'Prestadores',
  '/messages': 'Mensagens',
  '/help': 'Ajuda',
  '/account': 'Conta',
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    ClaraAssistantWidget,
    CommandPaletteComponent,
    ProfileAvatarComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly badges = inject(BadgeService);
  readonly palette = inject(CommandPaletteService);
  readonly profileStore = inject(OwnerProfileStore);
  readonly entitlements = inject(OwnerEntitlementsStore);

  readonly appName = environment.appName;
  readonly labels = OWNER_LABELS;
  readonly pageTitle = signal('Início');

  get navGroups(): NavGroup[] {
    const e = this.entitlements;
    const groups: NavGroup[] = [
    {
      title: 'Operação',
      items: [
        { label: OWNER_LABELS.dashboard, path: '/dashboard', icon: 'space_dashboard', exact: true },
        { label: 'Imóveis', path: '/properties', icon: 'home_work' },
        {
          label: OWNER_LABELS.reservations,
          path: '/reservations',
          icon: 'calendar_month',
          badge: () => this.badges.ownerActionRequired(),
        },
        { label: OWNER_LABELS.registerStay, path: '/sales', icon: 'add_circle_outline' },
      ],
    },
    {
      title: 'Gestão',
      items: [
        { label: OWNER_LABELS.finances, path: '/finance', icon: 'insights' },
        ...(e.featureEnabled(OWNER_FEATURES.kits)
          ? [{
              label: OWNER_LABELS.kitOrders,
              path: '/kits/pending',
              icon: 'inventory_2',
              badge: () => this.badges.pendingKitOrders(),
            }]
          : []),
        ...(e.featureEnabled(OWNER_FEATURES.fieldServices)
          ? [
              {
                label: OWNER_LABELS.fieldServices,
                path: '/field-services/pending',
                icon: 'engineering',
                badge: () => this.badges.pendingFieldServices(),
              },
              {
                label: 'Prestadores',
                path: '/field-services/providers',
                icon: 'groups',
              },
            ]
          : []),
        { label: OWNER_LABELS.messages, path: '/messages', icon: 'forum' },
      ],
    },
    {
      title: 'Conta',
      items: [
        { label: OWNER_LABELS.help, path: '/help', icon: 'help_outline' },
        { label: OWNER_LABELS.account, path: '/account', icon: 'manage_accounts' },
        ...(this.auth.isPlatformAdmin()
          ? [{ label: 'Admin Master', path: '/platform', icon: 'admin_panel_settings' }]
          : []),
      ],
    },
    ];
    return groups;
  }

  readonly showUpgradeBanner = () => this.entitlements.ownerPlan() === 'FREE';

  get email(): string | null {
    return this.auth.email;
  }

  ngOnInit(): void {
    this.auth.startSessionWatch();
    void this.profileStore.ensureLoaded();
    void this.entitlements.ensureLoaded();
    void this.badges.refresh();
    setInterval(() => void this.badges.refresh(), 180_000);
    this.syncTitle(this.router.url);
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.syncTitle((e as NavigationEnd).urlAfterRedirects);
    });
  }

  logout(): void {
    this.auth.logout();
  }

  private syncTitle(url: string): void {
    const path = url.split('?')[0];
    const base = '/' + (path.split('/').filter(Boolean)[0] ?? '');
    const nested = path.startsWith('/properties/') ? '/properties' : path.startsWith('/reservations/') ? '/reservations' : base;
    this.pageTitle.set(PAGE_TITLES[nested] ?? PAGE_TITLES[base] ?? 'Portal');
  }
}
