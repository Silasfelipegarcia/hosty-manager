import { inject } from '@angular/core';
import { RedirectFunction, Router, Routes } from '@angular/router';
import { authGuard, guestGuard, landingGuard } from './core/auth/auth.guard';
import { AppShellComponent } from './layout/app-shell/app-shell.component';

const reservationIdRedirect: RedirectFunction = (snapshot) => {
  const router = inject(Router);
  const id = snapshot.params['id'];
  return router.createUrlTree(['/reservations'], { queryParams: id ? { id } : {} });
};

const financeHealthRedirect: RedirectFunction = () => {
  const router = inject(Router);
  return router.createUrlTree(['/finance'], { queryParams: { tab: 'caixa' } });
};

const financeCrmRedirect: RedirectFunction = () => {
  const router = inject(Router);
  return router.createUrlTree(['/finance'], { queryParams: { tab: 'performance' } });
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
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
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
        loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
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
    ],
  },
  { path: '**', redirectTo: '' },
];
