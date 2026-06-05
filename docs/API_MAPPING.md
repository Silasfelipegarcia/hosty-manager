# API Mapping — Hosty Manager

Base URL: `environment.apiBaseUrl` + `/api/v1`

## Auth

| Angular | Method | Path |
|---------|--------|------|
| LoginPage | POST | `/auth/login` |
| AuthService.refresh | POST | `/auth/refresh` |
| ForgotPasswordPage | POST | `/auth/forgot-password` |
| ChangePasswordPage | POST | `/account/password` |

## Dashboard

| Widget | Method | Path |
|--------|--------|------|
| KPI badges | GET | `/operations/bookings/counts` |
| Estadias | GET | `/operations/bookings/stays-summary` |
| Finance KPIs | GET | `/finance/dashboard/bundle?competence=` |
| Fila acesso | GET | `/properties/access-requests/pending` |
| Inbox preview | GET | `/operations/messages/inbox` |
| Export CSV | GET | `/finance/export/csv?from=&to=` |

## Imóveis

| Tela | Method | Path |
|------|--------|------|
| Lista | GET | `/properties/owner` |
| Criar wizard | POST | `/properties` |
| Detalhe/editar | PUT | `/properties/{id}` |
| Excluir | DELETE | `/properties/{id}` |
| Dicas locais | GET/POST/PATCH/DELETE | `/properties/{id}/local-recommendations` |
| Kits catálogo | GET/POST/PUT/DELETE | `/properties/{id}/kits` |
| Co-owners | GET/POST/DELETE | `/properties/{id}/co-owners`, `/co-owner-invitations` |
| Playbook | GET/PUT | `/admin/properties/{id}/local-guide`, checklist |

## Reservas

| Ação | Method | Path |
|------|--------|------|
| Lista | GET | `/operations/bookings` |
| Detalhe | GET | `/operations/bookings/{id}` |
| Criar | POST | `/operations/bookings` |
| Aprovar estadia | POST | `/operations/bookings/{id}/owner-confirm` |
| Check-out | POST | `/operations/bookings/{id}/checkout/approve` |
| Chat | GET/POST | `/tenant/bookings/{id}/messages` |

## Finanças

| Ação | Method | Path |
|------|--------|------|
| Bundle | GET | `/finance/dashboard/bundle` |
| Custos fixos | GET/POST/PUT/DELETE | `/finance/fixed-costs` |
| Custos variáveis | POST | `/finance/bookings/{id}/variable-costs` |

## Filas

| Fila | Method | Path |
|------|--------|------|
| Kits | GET/POST | `/operations/kit-requests/pending`, `.../approve` |
| Field services | GET/POST | `/field-services/pending-approval`, `/{id}/approve` |

## Conta

| Ação | Method | Path |
|------|--------|------|
| Perfil | GET/PUT | `/tenant/profile` |
