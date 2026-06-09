import { inject } from '@angular/core';
import { RedirectFunction, Router, Routes } from '@angular/router';
import { authGuard, guestGuard, landingGuard } from './core/auth/auth.guard';
import { platformAdminGuard } from './core/auth/platform-admin.guard';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { DashboardPage } from './features/dashboard/dashboard.page';

const reservationIdRedirect: RedirectFunction = (snapshot) => {
  const router = inject(Router);
  const id = snapshot.params['id'];
  return router.createUrlTree(['/reservations'], { queryParams: id ? { id } : {} });
};

const financeHealthRedirect: RedirectFunction = (snapshot) => {
  const router = inject(Router);
  const propertyId = snapshot.queryParamMap.get('propertyId');
  const competence = snapshot.queryParamMap.get('competence');
  return router.createUrlTree(['/finance'], {
    queryParams: {
      tab: 'caixa',
      ...(propertyId ? { propertyId } : {}),
      ...(competence ? { competence } : {}),
    },
  });
};

const financeCrmRedirect: RedirectFunction = (snapshot) => {
  const router = inject(Router);
  const propertyId = snapshot.queryParamMap.get('propertyId');
  const competence = snapshot.queryParamMap.get('competence');
  return router.createUrlTree(['/finance'], {
    queryParams: {
      tab: 'performance',
      ...(propertyId ? { propertyId } : {}),
      ...(competence ? { competence } : {}),
    },
  });
};

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [landingGuard],
    loadComponent: () => import('./features/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'privacidade',
    loadComponent: () => import('./features/legal/privacy.page').then((m) => m.PrivacyPage),
  },
  {
    path: 'termos',
    loadComponent: () => import('./features/legal/terms.page').then((m) => m.TermsPage),
  },
  {
    path: 'exclusao-conta',
    loadComponent: () =>
      import('./features/legal/account-deletion.page').then((m) => m.AccountDeletionPage),
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/change-password/change-password.page').then((m) => m.ChangePasswordPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    component: AppShellComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardPage,
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('./features/properties/list/properties-list.page').then((m) => m.PropertiesListPage),
      },
      {
        path: 'properties/new',
        loadComponent: () =>
          import('./features/properties/create/property-create.page').then((m) => m.PropertyCreatePage),
      },
      {
        path: 'properties/:id',
        loadComponent: () =>
          import('./features/properties/detail/property-detail.page').then((m) => m.PropertyDetailPage),
      },
      {
        path: 'reservations',
        loadComponent: () => import('./features/reservations/reservations.page').then((m) => m.ReservationsPage),
      },
      {
        path: 'reservations/new',
        redirectTo: 'sales',
      },
      {
        path: 'reservations/:id',
        redirectTo: reservationIdRedirect,
      },
      {
        path: 'finance',
        loadComponent: () => import('./features/finance/finance-hub.page').then((m) => m.FinanceHubPage),
      },
      {
        path: 'finance/health',
        redirectTo: financeHealthRedirect,
      },
      {
        path: 'finance/crm',
        redirectTo: financeCrmRedirect,
      },
      {
        path: 'sales/import',
        loadComponent: () => import('./features/sales/bulk-import.page').then((m) => m.BulkImportPage),
      },
      {
        path: 'sales',
        loadComponent: () => import('./features/sales/external-sales.page').then((m) => m.ExternalSalesPage),
      },
      {
        path: 'kits/pending',
        loadComponent: () => import('./features/kits/kits-pending.page').then((m) => m.KitsPendingPage),
      },
      {
        path: 'field-services/pending',
        loadComponent: () =>
          import('./features/field-services/field-services-pending.page').then((m) => m.FieldServicesPendingPage),
      },
      {
        path: 'field-services/providers',
        loadComponent: () =>
          import('./features/field-services/service-providers.page').then((m) => m.ServiceProvidersPage),
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/messages/messages.page').then((m) => m.MessagesPage),
      },
      {
        path: 'help',
        loadComponent: () => import('./features/help/owner-help.page').then((m) => m.OwnerHelpPage),
      },
      {
        path: 'account',
        loadComponent: () => import('./features/account/account.page').then((m) => m.AccountPage),
      },
      {
        path: 'platform',
        canActivate: [platformAdminGuard],
        loadComponent: () =>
          import('./features/platform/platform-admin.page').then((m) => m.PlatformAdminPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
