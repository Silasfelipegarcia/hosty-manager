# Paridade de telas — Flutter ↔ Hosty Manager

| Flutter (owner) | Angular route | Status |
|-----------------|---------------|--------|
| `owner_home_inbox_page.dart` | `/dashboard` | KPIs + fila + gráficos |
| `property_hub_page.dart` | `/properties` | Lista owner |
| `property_create_wizard_page.dart` | `/properties/new` | Stepper 5 passos |
| `property_owner_actions_page.dart` | `/properties/:id` | Tabs gerenciar + aba Financeiro |
| `property_local_recommendations_page.dart` | tab Dicas locais | CRUD |
| `property_kits_catalog_page.dart` | tab Kits | CRUD |
| `property_co_owners_dialog.dart` | tab Co-proprietários | Convite/lista |
| `admin_setup_page` / guia | tab Playbook | Guia + checklist |
| `reservations_manage_page.dart` | `/reservations` | Master-detail |
| `create_booking_page.dart` | `/reservations/new` | Form criar |
| `owner_guest_chat_page.dart` | painel reserva | Chat inline |
| `finance_dashboard_page.dart` | `/finance` | Dashboard + fixos + YTD + break-even |
| `external_sales_page.dart` (CRM) | `/sales` | Vendas externas + backfill histórico |
| `financial_health_page.dart` (CRM) | `/finance/health` | Saúde financeira + gráfico YTD |
| `pending_kit_orders_page.dart` | `/kits/pending` | Fila |
| `field_tasks_page.dart` | `/field-services/pending` | Fila |
| `property_messages_hub_page.dart` | `/messages` | Inbox |
| `tenant_account_page.dart` | `/account` | Perfil |

Fora do escopo v1: Admin hub, tenant explore, provider link `/t/{token}`.
