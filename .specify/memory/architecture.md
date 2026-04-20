# DentalSpot — Architecture
> SaaS odontológico multi-tenant. React 18 SPA + Supabase (PostgreSQL + RLS + Edge Functions). 1.029 archivos JS/JSX, 76 migraciones, 173 tablas, 38 edge functions. En producción desde Q1-2026.
## Stack
| Capa | Tecnología | Versión | Notas |
|---|---|---|---|
| UI framework | React | ^18.2.0 | No 19 |
| Router | react-router-dom | ^6.16.0 | BrowserRouter clásico, flags futuros v7 activos |
| Bundler | Vite | ^4.4.5 | Desactualizado; upgrade rompe externals config |
| Styling | Tailwind CSS | ^3.3.3 | darkMode class, variables HSL |
| Components | shadcn/ui | style new-york | JS puro (`tsx: false`), iconos Lucide |
| Forms | react-hook-form | ^7.54.2 | **Sin resolver** — validación ad-hoc |
| Backend client | @supabase/supabase-js | ^2.99.2 | Cliente singleton |
| Dates | date-fns | ^2.30.0 | |
| Maps | leaflet + react-leaflet | ^1.9.4 / ^4.2.1 | |
| Animation | framer-motion | ^10.16.0 | |
| Charts | recharts | ^2.12.0 | |
| Docs/export | react-markdown, jspdf, xlsx, papaparse | | |
| Security | zxcvbn, dompurify, crypto-js | | |
**Ausencias relevantes:** `zod`, `yup`, `@hookform/resolvers`, `@tanstack/react-query`, `swr`. Data fetching vía `useEffect + fetch` manual. Validación ad-hoc en cada formulario.
## Project layout
```
DENTALSPOT/
├── src/                 # Frontend React
├── supabase/            # Migrations, edge functions, policies
├── public/              # Static assets
├── tools/               # Build-time scripts (generate-llms.js)
├── docs/                # Reportes, auditorías, generadores
├── dist/                # Build output (commiteado para Vercel)
└── .specify/            # Spec Kit (constitution, templates, memory)
```
## Frontend — `src/` anatomy
| Carpeta | Propósito | Estado |
|---|---|---|
| `src/features/` | 37 módulos verticales — pattern objetivo | ✅ activo |
| `src/pages/` | 33 pages legacy + subcarpetas (admin, blog, clinic, therapist) | 🟠 migración incompleta |
| `src/components/` | 26 subcarpetas por dominio (admin, auth, blog, calendar, clinic, consent, dashboard, guards, home, landing, layout, map, modals, onboarding, patient, public, qa, reputation, search, shared, therapist-profile, ui) | ✅ activo |
| `src/contexts/` | AuthContext, OrganizationContext, SubscriptionContext, CartContext, AdminPermissionContext | ✅ activo |
| `src/hooks/` | Shared hooks (useClinicalConsent, useCurrentOrganization, useTherapistDashboard, etc.) | ✅ activo |
| `src/lib/` | Utilities transversales (supabase client, audit logger, helpers) | ✅ activo |
| `src/services/` | Domain services | ✅ activo |
| `src/api/` | API wrappers | ✅ activo |
| `src/app/` | App.jsx, providers.jsx, routers/ | ⚠️ `providers.jsx` no enlazado |
| `src/shared/` | Building blocks transversales | ✅ activo |
| `src/data/` | Static/seed data | ✅ activo |
| `src/types/` | Type shapes (JS, no TS) | ✅ activo |
| `src/constants/` | USER_ROLES, enums | ✅ activo |
| `src/utils/` | Helpers | ✅ activo |
### 37 features verticales
`adir`, `admin`, `ados2`, `assistant`, `auth`, `chatbot`, `clinic-dashboard`, `clinical-passport`, `dashboard`, `educator`, `fonoaudiologo`, `invitations`, `marketplace`, `membership`, `odontogram`, `patient`, `patient-agenda`, `patient-dashboard`, `patient-file`, `patient-import`, `patient-questions`, `patients`, `pie`, `post-session`, `product-import`, `progress`, `recommendations`, `referrals`, `reminders`, `reports`, `sensorial-profile`, `settings`, `symptom-flow`, `tea`, `therapist`, `voice-visualizer`, `wallet`.
**Observación:** `fonoaudiologo` y `voice-visualizer` sugieren herencia cross-app con FONOKIT — evaluar si son activos o candidatos a cleanup.
### Router
Archivo: `src/main.jsx` → `<BrowserRouter>` con `v7_startTransition` + `v7_relativeSplatPath`.
Sub-routers en `src/app/routers/`:
- `AppRouter.jsx` — decide entre 3 sub-routers
- `PublicRouter.jsx` — landing, blog, marketplace público
- `DashboardRouter.jsx` — therapist, clinic, patient autenticados
- `AdminRouter.jsx` — superadmin platform
### Providers (anidamiento top-down desde `src/App.jsx`)
1. `HelmetProvider` — SEO (react-helmet-async)
2. `AuthProvider` — sesión Supabase
3. `SubscriptionProvider` — plan activo
4. `AdminPermissionProvider` — permisos granulares admin
5. `CartProvider` — carrito marketplace
6. `AppRouter`
`OrganizationProvider` **no está en el root** — scoped a `DashboardLayout.jsx` porque rutas públicas no consumen organization. `useCurrentOrganization` maneja el caso público con try/catch. **Diseño intencional, no bug.**
### Guards (5)
| Guard | Responsabilidad | Path |
|---|---|---|
| `AuthGuard` | Login requerido | `src/components/guards/AuthGuard.jsx` |
| `RoleGuard` | USER_ROLES (therapist/assistant/clinic_admin/platform_admin/patient) | `src/components/guards/RoleGuard.jsx` |
| `PlanGuard` | Suscripción activa | `src/components/guards/PlanGuard.jsx` |
| `AddOnGuard` | Add-ons de plan | `src/components/guards/AddOnGuard.jsx` |
| `PermissionGuard` | Permisos admin granulares | `src/features/admin/permissions/` |
Recordatorio (Constitution II): **los guards son UX, no seguridad.** La seguridad real vive en RLS.
### Layouts (3)
- `Layout.jsx` — público (landing, blog, marketplace público)
- `DashboardLayout.jsx` — autenticado (therapist, clinic, patient)
- `AdminLayout.jsx` — superadmin platform
## Data layer — Supabase
**Project ref:** `tomremkbuxvedliyywbo`
### Migrations (76 archivos en `supabase/migrations/`)
Fases identificadas:
1. **Baseline** — archivos `.bak` pre-baseline + baselines iniciales
2. **Phase 1 RLS** (`rls_phase1_administrative`) — profiles, organizations, subscriptions, memberships
3. **Phase 2 RLS** (`rls_phase2_clinical`) — patients, clinical_records, evaluations, treatments + fix `fix_dentist_insert_policies`
4. **Phase 3 RLS** (`rls_phase3_compliance`) — clinical_audit_log, legal_signatures, arco_requests, processing_lawful_basis, exceptional_access_grants + `fix_care_team_recursion`
5. **Post-baseline patches** — `organization_model_schema`, `revoke_anon_privs`, `patient_admin_columns`, `payment_fixes`, `consent_status_rpc`, `resolve_danissa_*`, `resolve_cristobal_*` (drift resuelto manualmente)
6. **Phase 3 sync fix (spec 003, 2026-04-20)** — `20260419000001_repair_patient_care_team.sql`: backfill reparador idempotente + triggers `trg_sync_patient_care_team_insert/update` sobre `patients`. Cierra la brecha de `clinical_audit_log` silencioso (ventana 2026-04-18 06:57 → 2026-04-20 02:04 UTC). Ver `data-compliance.md` §"Historial de compliance".
Última migración registrada: `20260419000001_*`.
### Tables (~173 en `supabase/tables_list.txt`)
| Dominio | Tablas representativas |
|---|---|
| Identidad | `profiles`, `organizations`, `care_team`, `memberships` |
| Clínico | `patients`, `clinical_records`, `evaluations`, `treatment_plans`, `odontogram`, `session_activities` |
| Agenda | `appointments`, `reminders` |
| Servicios | `therapist_services` (precio en `price_clp`) |
| Compliance — audit general | `clinical_audit_log` (append-only, `view_record`/`edit_record`/`create_record`/`export_file`/`print_record`), `patient_care_team` (gate para `is_in_care_team`), `legal_signatures`, `arco_requests`, `consent_records` |
| Compliance — Pasaporte Clínico | `clinical_access_log` (grant/share/revoke/download, módulo `clinical-passport`) — tabla distinta de `clinical_audit_log`, ver data-compliance.md §"Dos tablas distintas" |
| Comercio | `subscriptions`, `payments` (MercadoPago), `wallet`, `marketplace_*` |
| Módulos verticales | `symptom_flow_*`, `sensorial_profile_*`, `tea_*`, `ados2_*`, `adir_*`, `pie_*`, `progress_*`, `recommendations_*` |
### Edge functions (38 en `supabase/functions/`)
| Grupo | Funciones representativas |
|---|---|
| Pagos | `mercadopago-create-preference`, `mercadopago-webhook` |
| Email | `send-welcome-sequence`, `form-auto-responder`, `marketing-campaign`, `process-scheduled-emails` |
| AI clínico | `chat-with-ai`, `rag-query`, `analyze-*`, `generate-*`, `search-evidence`, `recommend-purchases`, `suggest-treatment`, `evaluate-analysis` |
| Ads | `setup-ads`, `meta-ads-manager`, `generate-ad-copy`, `new-meta-capi` |
| Ops | `backup-database`, `export-leads-csv`, `process-notiz` |
### Policies (`supabase/policies.sql`, 3.016 líneas)
Cubre las 3 fases RLS. Convención observada: `{table}_{select|insert|update|delete}_{role}`. Incluye baseline `.bak` para rollback de referencia.
## Frontend ↔ Supabase bridges
| Propósito | Archivo(s) |
|---|---|
| Cliente Supabase | `src/lib/supabase/*` (singleton) |
| Audit logger (escribe a `clinical_audit_log`) | `src/lib/audit/clinicalAuditLogger.js` + `src/lib/audit/useClinicalAccessLogger.js` *(el hook se llama "Access" por historia — escribe a la tabla `clinical_audit_log`, no a `clinical_access_log`)* |
| Pasaporte Clínico (escribe a `clinical_access_log`) | `src/features/clinical-passport/` — implementación parcial del Pasaporte Clínico Universal del ecosistema Communicare. Cubre grant/share/revoke/download de acceso compartido a la ficha entre profesionales. Consumidores: `AcceptPassportPage.jsx`, `useAccessLog.js`, `useCompliance.js`, `AccessGrantsManager.jsx`, `SharePassportModal.jsx`. |
| Consent flow | `src/hooks/useClinicalConsent.js` + `src/components/shared/ClinicalConsentModal.jsx` |
| ARCO paciente self-service | `src/features/settings/components/AccountSecuritySettings.jsx` |
| ARCO gestión admin | `src/features/admin/modules/legal/pages/ArcoRequestsPage.jsx` |
| Legal signatures admin | `src/features/admin/modules/legal/pages/DocumentDetailPage.jsx` + `legalApi.js` |
| Patient access history (derecho ARCO) | `src/features/patient-dashboard/pages/PatientAccessHistoryPage.jsx` |
## ✅ Canonical patterns

### Tabla derivada: "backfill idempotente + trigger de sincronización"

**Problema que resuelve:** mantener una tabla derivada (ej. `patient_care_team`) consistente con su tabla fuente (ej. `patients`). Sin trigger, el backfill one-shot degrada en silencio a medida que la tabla fuente crece/cambia.

**Implementación canónica** (ver migración `20260419000001_repair_patient_care_team.sql`, spec 003, commit `c55d1a5`):

1. **Backfill reparador idempotente** — `INSERT INTO <derivada> (...) SELECT ... FROM <fuente> WHERE <condiciones> AND NOT EXISTS (<fila ya presente>) ON CONFLICT DO NOTHING;`. Condiciones replican el backfill original one-shot + filtro negativo para no duplicar. `ON CONFLICT DO NOTHING` protege contra índices únicos parciales.
2. **Función `SECURITY DEFINER`** con gate de validación (membership, consistencia de org, etc.). Bypasea RLS internamente pero preserva design intent vía su guard propio.
3. **Triggers** `AFTER INSERT` y `AFTER UPDATE OF <columnas clave>` sobre la tabla fuente, llamando a la función. `DROP TRIGGER IF EXISTS` antes de `CREATE TRIGGER` = idempotencia.
4. **No relajar policies RLS** downstream — el fix mantiene el design intent de la policy, sólo asegura que sus pre-requisitos (la fila en la tabla derivada) existan.

**Cuándo usar este patrón:**
- Creaste una tabla derivada con backfill one-shot (ej. en una migración de tipo `populate_*`).
- Otra policy RLS o función SQL depende de la presencia de filas en esa tabla derivada.
- La tabla fuente sigue aceptando INSERT/UPDATE post-backfill.

**Cuándo NO usar:** si la tabla derivada debe tener lógica de desactivación compleja (p.ej. desasignar dentista al reasignar paciente), el trigger simple no alcanza. Esa es spec dedicada aparte.

---

## 🟠 Technical debt inventory
### Duplicación pages ↔ features (migración incompleta)
| Dominio | Legacy (pages/) | Moderno (features/) |
|---|---|---|
| Patient dashboard | `pages/PatientDashboardPage.jsx` | `features/patient-dashboard/PatientDashboardPageV2.jsx` |
| Patient file | `pages/therapist/PatientFilePage.jsx` | `features/patient-file/pages/` |
| Therapist dashboard | `pages/TherapistDashboardPage.jsx` | `features/dashboard/components/` + `hooks/useTherapistDashboard.js` |
**Regla operativa:** feature nueva → `src/features/`. Al tocar pages/ legacy → spec dedicada decide si migrar o mantener (no migrar "de pasada").
### Dead code confirmed (mini-audit 2026-04-19/20)

| Item | Veredicto | Acción propuesta |
|---|---|---|
| `src/app/providers.jsx` (31 líneas) + `src/app/App.jsx` | 🟠 Dead code efectivo — `src/app/App.jsx` importa `providers.jsx` pero es huérfano (main.jsx usa `src/App.jsx` en la raíz, no `src/app/App.jsx`) | `rm` ambos — spec `cleanup-fonokit-dead-code` |
| `src/features/voice-visualizer/` (5 archivos) + `src/pages/VoiceVisualizerPage.jsx` + ruta | 🟠 Dead code efectivo — `FEATURE_FLAGS.VOICE_VISUALIZER = false` (comentario del router: "módulo heredado FonoKit") | `rm` feature + page + ruta + flag — spec `cleanup-fonokit-dead-code` |
| `src/features/fonoaudiologo/` | ✅ Activo (imports reales en `DashboardRouter.jsx:55` + `features/marketplace/pages/tabs/EarningsTab.jsx:22`). **Branding bug crítico:** URLs públicas `/fonoaudiologos` y `/fonoaudiologo/:slug` confunden DentalSpot con app de fonoaudiólogos | Rename folder a `earnings` + migrar URLs con redirects 301 — spec **`rebrand-fonoaudiologo-urls`** (impacto SEO/marca, prioridad alta) |
### Stack obsolescence
- **Vite 4.4** → v5/v6 disponibles. Upgrade rompe config de externals; spec dedicada.
- **Sin librería de validación** (`zod` / `yup` / `@hookform/resolvers`) — cada form valida a mano. Riesgo: inconsistencia, PHI sin sanitizar.
- **Sin data-fetching lib** (`tanstack-query`, `swr`) — cache/retries/estado manuales. Riesgo: re-fetches, race conditions.
### Environment / operations
- `supabase/schema.sql`: restaurado 2026-04-19 al estado del commit `c3f30be` (27.315 líneas, schema del 1-abril). **Desactualizado** — no refleja migración `20260419000001_repair_patient_care_team` de spec 003 ni otras posteriores al 1-abril. Fuente de verdad canónica: `supabase/migrations/` (76+ archivos). Candidato a regenerar con `--db-url` en spec dedicada si se necesita el schema actual consolidado.
- `.playwright-mcp/`: resuelto en commit pre-sesión `d840024` (`chore: ignore .playwright-mcp artifacts`). `.gitignore` ya lo ignora. Sin acción pendiente.
### Data-migration patches
Las migraciones `resolve_danissa_*` y `resolve_cristobal_*` son evidencia de drift resuelto manualmente. No repetir patrón — ver Constitution VI.

### 🚩 Antipatrón: "migración one-shot sin trigger"

**Caso histórico:** `20260415100002_populate_organization_model.sql` pobló `patient_care_team` con un backfill one-shot, sin trigger de sincronización. Consecuencia: todo paciente creado o reasignado post-15-abr cayó fuera del care_team → función `is_in_care_team()` devolvió `false` → policy `cal_dentist_insert` sobre `clinical_audit_log` rechazó writes silenciosamente → **43h de Constitution III violada** (2026-04-18 06:57 → 2026-04-20 02:04 UTC). Detalle completo en `data-compliance.md` §"Historial de compliance".

**Regla operativa:** si una migración pobla una tabla derivada cuyos valores son consultados por policies/funciones downstream, **el trigger de sincronización va en el mismo PR**. No "después, en otra spec" — el gap entre merges es latente de ruptura silenciosa. Solución canónica: patrón documentado arriba en §"Canonical patterns".

**Otras tablas candidatas a auditar** (potencial antipatrón no cerrado): revisar si `organization_members`, `clinic_therapists`, `patient_assigned_plans`, `care_team`-like tablas tienen backfill sin trigger equivalente. Micro-bloque pendiente.
## Hosting & deploy
| Capa | Proveedor |
|---|---|
| Frontend | Vercel (config en `vercel.json`, build `npm run build`) |
| Backend | Supabase managed (`tomremkbuxvedliyywbo`) |
Build pipeline: `tools/generate-llms.js` genera metadata + `vite build` emite `dist/`. `dist/` se commitea como backup de deploy.
## Related docs
- `.specify/memory/constitution.md` — 6 principios no-negociables
- `.specify/memory/ecosystem-communicare.md` — rol en ecosistema Communicare
- `.specify/memory/data-compliance.md` — referencia a compliance implementado
---
**Last updated**: 2026-04-20 | **Audit source**: FASE 1 audit session (19-abr) + `Dentalspot_Estado_y_Roadmap.pdf` (18-abr) + spec 003 commit `c55d1a5` (20-abr) — añade distinción `clinical_audit_log`/`clinical_access_log`, patrón canónico "backfill+trigger", antipatrón "one-shot sin trigger", nueva migración `20260419000001`.
