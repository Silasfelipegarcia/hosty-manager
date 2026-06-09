# Hosty Manager

Portal web (Angular) para proprietários e co-proprietários gerenciarem imóveis, reservas, finanças e operação — usando a mesma API do app Hosty (`hosty-app-api`).

## Stack

- Angular 21 (standalone)
- Angular Material
- Chart.js / ng2-charts
- JWT auth com refresh automático

## Desenvolvimento local

```bash
npm install
npm start
```

API local (padrão): `http://localhost:8080` — edite `src/environments/environment.ts`.

Produção: `src/environments/environment.prod.ts` aponta para Railway.

## Build

```bash
npm run build
```

Saída: `dist/hosty-manager/browser/`

## Rotas principais

| Rota | Descrição |
|------|-----------|
| `/login` | Autenticação (OWNER) |
| `/dashboard` | CRM — KPIs, fila, gráficos |
| `/properties` | Imóveis |
| `/reservations` | Reservas + chat |
| `/finance` | Finanças + custos fixos |
| `/messages` | Inbox |
| `/account` | Perfil |

## Conta de teste (proprietário)

Após deploy da API com migration `V71`:

| Campo | Valor |
|-------|-------|
| E-mail | `teste@gmail.com` |
| Senha | `123456` |
| Plano | Plus++ (seed) |

Local (`profile=local`): mesma conta é criada pelo `LocalUserSeedInitializer`.

## Deploy

### Vercel / Railway (SPA)

- Build: `ng build --configuration=production`
- Publish: `dist/hosty-manager/browser`
- Redirect SPA: todas as rotas → `index.html`

### CORS

A API já permite `https://*.railway.app`, `https://*.vercel.app` e `localhost`.

## Documentação

- [docs/API_MAPPING.md](docs/API_MAPPING.md)
- [docs/SCREENS.md](docs/SCREENS.md)

## Repositório relacionado

- API: [hosty-app-api](https://github.com/Silasfelipegarcia/hosty-app-api)
- App mobile: [hosty-frontend](https://github.com/Silasfelipegarcia/hosty-frontend)
