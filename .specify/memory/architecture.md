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
`OrganizationProvider` **no está en el root** — scoped a `DashboardLayout.jsx` porque rutas públicas no consumen organization. `useCurrentOrganization` maneja el caso público con try/catch. **Diseño intencional, no bug.** Persiste selección en `sessionStorage` con key `dentalspot_current_org:<user_id>` + cleanup en logout vía listener interno sobre `user?.id → null` (spec 013, 2026-04-20). Multi-org sin stored default a primera org (evita dropdown ambiguo).
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

| Item | Veredicto | Acción propuesta | Status |
|---|---|---|---|
| `src/app/providers.jsx` (31 líneas) + `src/app/App.jsx` | 🟠 Dead code efectivo — `src/app/App.jsx` importa `providers.jsx` pero es huérfano (main.jsx usa `src/App.jsx` en la raíz, no `src/app/App.jsx`) | `rm` ambos — spec `cleanup-fonokit-dead-code` | ✅ Resuelto spec 010 commit `1c07b26` |
| `src/features/voice-visualizer/` (5 archivos) + `src/pages/VoiceVisualizerPage.jsx` + ruta | 🟠 Dead code efectivo — `FEATURE_FLAGS.VOICE_VISUALIZER = false` (comentario del router: "módulo heredado FonoKit") | `rm` feature + page + ruta + flag — spec `cleanup-fonokit-dead-code` | ✅ Resuelto spec 010 commit `1c07b26` |
| `src/features/fonoaudiologo/` | ✅ Activo (imports reales en `DashboardRouter.jsx:55` + `features/marketplace/pages/tabs/EarningsTab.jsx:22`). **Branding bug crítico:** URLs públicas `/fonoaudiologos` y `/fonoaudiologo/:slug` confunden DentalSpot con app de fonoaudiólogos | Rename folder a `earnings` + migrar URLs con redirects 301 — spec **`rebrand-fonoaudiologo-urls`** (impacto SEO/marca, prioridad alta) | 🔄 Backlog (spec dedicada pendiente) |
### Stack obsolescence
- **Vite 4.4** → v5/v6 disponibles. Upgrade rompe config de externals; spec dedicada.
- **Sin librería de validación** (`zod` / `yup` / `@hookform/resolvers`) — cada form valida a mano. Riesgo: inconsistencia, PHI sin sanitizar.
- **Sin data-fetching lib** (`tanstack-query`, `swr`) — cache/retries/estado manuales. Riesgo: re-fetches, race conditions.
### Environment / operations
- `supabase/schema.sql`: restaurado 2026-04-19 al estado del commit `c3f30be` (27.315 líneas, schema del 1-abril). **Desactualizado** — no refleja migración `20260419000001_repair_patient_care_team` de spec 003 ni otras posteriores al 1-abril. Fuente de verdad canónica: `supabase/migrations/` (76+ archivos). **E1 intento 2026-04-20**: `supabase db dump --linked` requiere Docker Desktop corriendo (error `Cannot connect to docker.sock`). `pg_dump` 14.13 local disponible pero credenciales ephemeral del CLI expiran rápido (auth failed en test). **Regeneración diferida** hasta tener Docker Desktop up o db password canónico. Comando esperado: `supabase db dump --linked -f supabase/schema.sql`.
- **⚠️ Gotcha conocido `supabase db dump -f`:** el CLI abre y **trunca el archivo destino ANTES de chequear Docker**. Si Docker no corre, el archivo queda vacío y el CLI termina con error. Observado 2x (19-abr y 20-abr). **Mitigación:** antes de correr `supabase db dump -f supabase/schema.sql`, verificar `docker ps` responde OK; si trunca por error, recuperar con `git checkout HEAD -- supabase/schema.sql`. Alternativa segura: dump a archivo temporal `-f /tmp/schema.sql.tmp` y `mv` solo si exit code = 0.
- `.playwright-mcp/`: resuelto en commit pre-sesión `d840024` (`chore: ignore .playwright-mcp artifacts`). `.gitignore` ya lo ignora. Sin acción pendiente.
- `.specify/feature.json`: estado transitorio del Spec Kit (apunta al spec activo). Agregado a `.gitignore` 2026-04-20.
### Feature flags inventory (2026-04-20)
Archivo `src/constants/featureFlags.js` — todos en **Etapa 1 Contención** (`false`). Documentación del archivo: "controla la visibilidad de módulos heredados de FonoKit que no aplican al dominio dental".

| Flag | Valor | Call sites | Nota |
|---|---|---|---|
| `PIE_ESCOLAR` | false | 3 (DashboardRouter, PatientFilePage, PatientModal) | Más conectado — reactivar requiere test UX end-to-end |
| `ADOS2` | false | 1 (DashboardRouter) | Candidato a dead code |
| `ADIR` | false | 1 (DashboardRouter) | Candidato a dead code |
| `TEA` | false | 1 (DashboardRouter) | Candidato a dead code |
| `SENSORIAL_PROFILE` | false | 1 (DashboardRouter) | Candidato a dead code |
| ~~`VOICE_VISUALIZER`~~ | — | 0 | 🗑️ Removido spec 010 commit `1c07b26` (flag + feature + page + ruta eliminados) |
| `EDUCATOR` | false | 1 (DashboardRouter) | Candidato a dead code |

**Regla operativa:** si un flag permanece `false` >2 meses sin plan de reactivación, entra en scope de spec `cleanup-fonokit-dead-code`.
### Data-migration patches
Las migraciones `resolve_danissa_*` y `resolve_cristobal_*` son evidencia de drift resuelto manualmente. No repetir patrón — ver Constitution VI.

### Known drift non-urgent (preventive audit 2026-04-20)

Auditoría preventiva post-spec 005 sobre 5 tablas sospechosas de drift similar a `therapist_services.price → price_clp`. **3 verde · 2 amarillo · 0 rojo.**

| Tabla · campo | Estado DB | Estado código | Prioridad | Spec candidata |
|---|---|---|---|---|
| `clinics.modalidad` vs `.modality` | Ambas columnas existen, las 3 clínicas tienen ambos valores poblados | Frontend usa ambos nombres inconsistentemente | 🟡 Amarillo — deuda, no bug (rows completos) | `consolidate-clinics-modality` (30-45min) |
| `patients.full_name / rut / phone / email` | Existen como nullable text (duplicados del JOIN con `profiles`) | Algunas queries leen JOIN, otras directo | 🟡 Amarillo — dual source of truth, potencial stale data | `consolidate-patient-pii-source-of-truth` (1-2h) |
| `appointments.date / start_time / end_time` | date NOT NULL + 2 `time without time zone` NOT NULL | Código usa `date` directo (`useClinicDashboard.js:103`) | ✅ Verde | — |
| `membership_plans.price_clp / price_usd` | Renombrado igual que `therapist_services` (spec 005) | Único consumer `DirectoryPage.jsx:42` solo lee `name, slug` — no toca `price` | ✅ Verde | — (recordar alias `price:price_clp` si agregan UI de pricing) |
| `patients.patient_type` vs `attention_type` | Ambos existen nullable text | `patient_type` = previsión (privado/fonasa/convenio), `attention_type` = modalidad (consulta_privada/pie_escolar) — **conceptos ortogonales, no duplicados** | ✅ Verde (no es drift) | — |

**Técnica aplicada:** 5 queries `information_schema.columns` + `grep` dirigido por candidato. Runtime total ~8 min. Template reusable para micro-auditorías futuras.

#### Drifts resueltos post-audit (spec 007 — 2026-04-20)

Tras el preventive audit, el test manual de spec 006 reveló 3 drifts adicionales no capturados por la auditoría inicial (rutas del patient dashboard y therapist dashboard). Resueltos en spec 007.

| Drift | Archivo | Fix | Commit |
|---|---|---|---|
| `session_activities.patient_id` no existe | `PatientDashboardPageV2.jsx:162,240` | 3-level embed `plan_sessions → patient_assigned_plans → patient_id` | `97c34b6` |
| `appointments.fee` nunca existió | `TherapistDashboardPage.jsx:144` | Structural-join `therapist_services.price_clp` vía `service_id` FK (patrón canónico de `useTherapistDashboard.js`) | `97c34b6` |
| `clinical_reports.file_url` renombrado + `title` inexistente | `PatientDashboardPageV2.jsx:182` | Alias PostgREST `file_url:final_pdf_url` + título default `'Documento'` | `97c34b6` |

**Lecciones operativas:**

- Test manual post-deploy de spec adyacente es un 3er vector de detección de drifts (complementa `information_schema` audit + `grep` dirigido).
- Extensión interpretativa de FR-003.c: replicar patrón canónico existente en archivo adyacente NO es re-modelado semántico — es alineamiento.
- Hallazgo compliance §III (F-1): evaluado y cerrado como **FALSE POSITIVE** en spec 008 pre-plan research — `useClinicalAccessLogger` excluye intencionalmente el rol `patient` (alineado con Ley 20.584 art. 13 y Ley 21.719, que regulan transparencia sobre accesos de terceros, no auto-consulta). Constitution §III v1.0.1 → v1.1.0 con clarificación explícita. Ver `specs/008-fix-audit-logger-missing-on-patient-dashboard/spec.md` §Spec rejected.

#### RLS policies restauradas (spec 009 — 2026-04-20)

Tabla `marketplace_purchases` recuperó su trilogía completa de access patterns + RLS enforcement:

| Policy | CMD | Pattern | Source |
|---|---|---|---|
| `Admins update marketplace_purchases` | UPDATE | `is_admin` | Replaced (legacy) |
| `Buyers read own marketplace_purchases` | SELECT | `auth.uid() = buyer_id` | Created |
| `Buyers insert marketplace_purchases` | INSERT | `auth.uid() = buyer_id` (WITH CHECK) | Created |
| `Admin manage marketplace_purchases` | ALL | `is_admin` via `profiles.role = 'admin'::user_role` | Created (replaces `Admins update`) |
| `Vendors read own plan purchases` | SELECT | Subquery a `marketplace_plans.author_id` | Kept (injected durante Phase 1, X2→X1 pivot) |

Estado final: **4 policies + `rowsecurity = true`**. Baseline tabla vacía (0 purchases) en momento de apply — primera purchase real será smoke test natural.

**Lección operativa (extensión a `PATTERNS.md`):** state-drift entre Phase 1 y Phase 2 de un spec debe siempre re-verificarse con Query A freshly ejecutada antes de aplicar. Caso 2026-04-20: `"Vendors read own plan purchases"` apareció injected fuera de flujo (Danissa experimentando con el preview de Opción X1 entre phases), el re-check pre-Phase 2 la detectó, pivotamos X2→X1 sin perder horas de rework ni dropear/re-crear una policy ya funcional.

### Post-spec health-checks (2026-04-20)

Queries ejecutadas en bloque Express para validar que specs 003/004/005 siguen funcionando en producción:

| Check | Query | Resultado | Verdict |
|---|---|---|---|
| Spec 003 — audit log activo | `SELECT COUNT(*) FROM clinical_audit_log WHERE created_at >= '2026-04-20'` | 9 writes en 2026-04-20 | ✅ Trigger OK, Constitution III restaurada tras gap de 43h |
| Spec 005 — therapist_services pricing | `SELECT COUNT(*) FILTER (WHERE price_clp IS NULL) FROM therapist_services` | 0 null / 4 total | ✅ Data consistente con schema |
| Spec 003 — patient_care_team sync | `COUNT(patients) vs COUNT(DISTINCT pct.patient_id)` | 5/5 sincronizados, 0 missing | ✅ Trigger de sync funcionando 100% |

### Performance audit (2026-04-20) — FKs sin índice

Query a `pg_constraint` + `pg_index` detectó 30+ foreign keys sin índice en la columna de origen. Clasificación por impacto operacional esperado:

**🔴 Alta prioridad — queries frecuentes en UI:** ✅ **Todos resueltos en spec 011 commit `bcb8448`** (migration `20260420000003_add_missing_fk_indexes.sql`)
- `appointments.service_id` → therapist_services (calendar render) ✅
- `commissions.therapist_id` → profiles (dashboard therapist) ✅
- `commissions.sale_id` → sales (admin commissions) ✅
- `clinic_invoices.patient_id` → patients (patient file) ✅
- `clinic_invoices.therapist_id` → profiles (dashboard therapist) ✅
- `clinical_history.entry_type` → clinical_entry_types (patient file filter) ✅
- `clinical_history.diagnosis_id` → patient_diagnoses (diagnosis lookup) ✅

**🟡 Media — features calendaring / LMS:**
- `blocked_times.clinic_id` + `.therapist_id` (calendar)
- `course_modules.course_id` (LMS, feature flag EDUCATOR `false` hoy)
- `clinical_audit_log.grant_id` → exceptional_access_grants

**🟢 Baja — admin / infrecuente:**
`admin_*`, `arco_*`, `blog_*`, `cookie_consents`, `coupon_uses`, etc. (15+).

**Verdict:** ✅ **Alta prioridad cerrada** en spec 011 (2026-04-20). Latencias crecientes con volumen mitigadas para los 7 FKs críticos. 🟡 Media y 🟢 Baja quedan en backlog — spec futura dedicada si el volumen de esas tablas amerita tuning.

#### FKs indexados post-audit (spec 011 — 2026-04-20)

7 FKs de alta prioridad indexados via migration `20260420000003_add_missing_fk_indexes.sql`:

| Índice | Tabla | Columna | Ref |
|---|---|---|---|
| `idx_appointments_service_id` | `appointments` | `service_id` | `therapist_services.id` |
| `idx_clinic_invoices_patient_id` | `clinic_invoices` | `patient_id` | `patients.id` |
| `idx_clinic_invoices_therapist_id` | `clinic_invoices` | `therapist_id` | `profiles.id` |
| `idx_clinical_history_diagnosis_id` | `clinical_history` | `diagnosis_id` | `patient_diagnoses.id` |
| `idx_clinical_history_entry_type` | `clinical_history` | `entry_type` | `clinical_entry_types.code` |
| `idx_commissions_sale_id` | `commissions` | `sale_id` | `sales.id` |
| `idx_commissions_therapist_id` | `commissions` | `therapist_id` | `profiles.id` |

Todos btree default. `CONCURRENTLY` omitido (max 14 rows al apply, innecesario). EXPLAIN ANALYZE `commissions` post-apply confirmó **BITMAP INDEX SCAN** en uso (planner reconoce y prioriza el índice aún en tabla vacía — superó la expectativa FR-009 de Seq Scan tolerado).

Los ~23 FKs de prioridad media/baja (`admin_*`, `arco_*`, `blog_*`, `cookie_consents`, `coupon_uses`, etc.) quedan **EXCLUIDOS** per FR-012 — spec futura dedicada si el volumen de esas tablas amerita performance tuning.

### Schema audit NOT NULL (2026-04-20) — limpio

29 columnas NOT NULL sin default en tablas core (`patients`, `appointments`, `clinics`, `therapist_services`, `patient_care_team`, `clinical_audit_log`, `organizations`, `profiles`, `membership_plans`, `subscriptions`). Todas **semánticamente requeridas por dominio** (appointment necesita date, patient necesita org, audit log necesita user/action/resource). Sin INSERTs silenciosos que puedan fallar por NULL. **Schema bien constrained. 0 findings.**

### ✅ RLS coverage audit (2026-04-20) — 100% CERRADO

**Resumen final post spec 016**: los 12 gaps del audit original están resueltos vía 6 specs secuenciales. 0 gaps pendientes del audit en scope.

| Categoría | Tablas | Spec resuelto |
|---|---|---|
| P0 RLS disabled con policies existentes | `patient_questions` + `blog_posts` | ✅ spec 006 (commit `9e15c80`) — enable RLS |
| P0 RLS disabled + policies parciales | `marketplace_purchases` | ✅ spec 009 (commit `0b89ba3`) — 4 policies restore + enable RLS |
| P0 RLS disabled + 0 policies (PHI-adjacent) | `pie_sessions` + `pie_students` + `pie_paci` + `pie_schedule_blocks` + `pie_therapist_schools` + `debug_signup_logs` | ✅ spec 016 (commit `d38f88c`) — lockdown deny-all + 1 policy minimal pie_therapist_schools |
| P1 RLS enabled + 0 policies (pre-launch) | `billing_invoices` + `patient_evaluations` | ✅ spec 014 (commit `4bac0a4`) — 5 policies |
| P1 RLS enabled + 0 policies (pre-launch) | `patient_goals` + `patient_development_areas` | ✅ spec 015 (commit `8db3c1f`) — 5 policies (shared catalog para dev_areas) |

**Total**: 12 tablas procesadas · ≈20 policies activas · 0 gaps pendientes del audit original.

**Forward-looking §V flag (spec 016)**: cuando `FEATURE_FLAGS.PIE_ESCOLAR` se active a `true` en el futuro, los 5 `pie_*` tablas con deny-all silencioso van a causar empty states para admin users sin policies proper. **Pre-requisito obligatorio antes de flip**: spec `write-pie-policies-full` que escriba policies patient-read, therapist-via-care_team, admin-manage para las 5 tablas (réplica del patrón aplicado a patient_evaluations en spec 014).

---

### 🔴 RLS coverage audit (2026-04-20) — P0 encontrado (histórico)

Query a `pg_tables.rowsecurity` + `pg_policies` reveló gaps críticos de seguridad. Categorización por exposure real (cruzada con frontend greps):

**🔴 P0 — RLS DISABLED pero con policies existentes (policies NO enforced)**

| Tabla | Policies live | Consumers frontend | Impacto | Status |
|---|---|---|---|---|
| `patient_questions` | 5 policies | 14+ callsites | PHI leak: preguntas accesibles a cualquier auth user | ✅ Resuelto spec 006 commit `9e15c80` |
| `marketplace_purchases` | 1 policy (solo `Admins update`) | 13+ callsites | Financial leak + policies faltantes (Buyer read/insert, Admin read/insert/delete, Vendor read) | ✅ Resuelto spec 009 commit `0b89ba3` |
| `blog_posts` | 7 policies | 8+ callsites | Moderation bypass + author integrity | ✅ Resuelto spec 006 commit `9e15c80` |

Spec 006 (`enable-rls-quick-wins`) cerró `patient_questions` + `blog_posts` con 1 line de `ALTER TABLE ENABLE RLS` cada una (policies ya existían, solo faltaba activar enforcement). **`marketplace_purchases` quedó diferido** y se resolvió en spec 009 (`restore-marketplace-purchases-policies`) — requería escribir las policies faltantes antes del enable RLS. Ver §"RLS policies restauradas (spec 009)" más arriba para el detalle de las 4 policies finales.

**🔴 P0 — RLS DISABLED + 0 policies + PHI sensible**

| Tabla | Nota | Spec candidato | Status |
|---|---|---|---|
| `debug_signup_logs` | Logs de signup = emails/RUTs | `lock-down-debug-tables` | ✅ spec 016 (lockdown deny-all) |
| `pie_sessions` + `pie_students` + `pie_paci` + `pie_schedule_blocks` + `pie_therapist_schools` | PHI de menores (PIE Escolar); FEATURE_FLAG=false en UI pero accesible directo | `write-policies-for-pie-cluster` | ✅ spec 016 (lockdown deny-all + 1 policy minimal pie_therapist_schools) |

**🟡 P1 — RLS ENABLED + 0 policies (feature posiblemente rota silenciosamente)**

| Tabla | Consumers frontend |
|---|---|
| `billing_invoices` | 3 callsites (BillingHistory, useInvoices, commissionsApi) |
| `patient_evaluations` | 2 callsites (patientApi) |
| `orders`, `ai_chat_messages`, `course_lessons`, `therapist_insurances`, etc. | Features inactivas o edge-function-only |

Default PG con RLS enabled + 0 policies = "deny all" para anon+auth. Si frontend usa la tabla con anon key, devuelve array vacío silenciosamente. Spec `audit-rls-enabled-zero-policies` (1h) investiga caso por caso si están broken (features visibles) vs intencionales (edge-function-only).

**🟢 OK (reference data público, DISABLED intencional)**

`clinical_entry_types`, `diagnosis_specialty_map`, `measure_scales`, `schools`, `specialty_keywords`, `blog_article_tags`, `blog_tags`, `patient_reviews`, `marketplace_plans`, `favorite_lists`, `moderation_logs`, `review_reports`.

**Ruta de remediación priorizada (ejecutada 2026-04-20):**
1. ✅ Spec 006 — `patient_questions` + `blog_posts` enable RLS (commit `9e15c80`)
2. ✅ Spec 009 — `marketplace_purchases` restore policies (commit `0b89ba3`, Estrategia B + pivot X2→X1)
3. ✅ Spec 016 — PIE cluster + `debug_signup_logs` lockdown (commit `d38f88c`, deny-all + 1 policy minimal)
4. ✅ Spec 012 — audit 22 tablas GROUP A/B/C/D → 3 templates GROUP B resueltos en specs 014+015.

### RLS enabled zero-policies audit (2026-04-20)

22 tablas con `rowsecurity = true` + 0 policies identificadas en audit previo (`§RLS coverage audit` arriba). Discovery completo vía spec 012 con classifier determinístico de 6 categorías de callsites + clasificación final en 4 GROUPs.

**Distribución GROUPs**:

| GROUP | Count | Significado | Acción |
|---|---|---|---|
| 🔴 **A** (activa rota hoy) | **0** | — ningún user impactado actualmente (todas las 22 tablas tienen `row_count = 0` al momento del audit) | — |
| 🟡 **B** (pre-launch preventivo) | **3** | Frontend ya consume, impact llegará al primer INSERT | 3 templates de spec preparados |
| 🟢 **C** (dormant intencional) | **19** | Sin callsites frontend, leave as-is hasta reactivación | Documentar, no fixear |
| ⚪ **D** (feature-flag OFF) | **0** | Ningún callsite wrapped en `FEATURE_FLAGS.X` | — |

**GROUP B (3 tablas originales, ✅ 3/3 RESUELTOS)**:

- ✅ `billing_invoices` — resuelto spec 014 (commit 4bac0a4, 2 policies: Therapists read own + Admins manage)
- ✅ `patient_evaluations` — resuelto spec 014 (commit 4bac0a4, 3 policies: Therapists manage via care_team + Patients read own + Admins manage)
- ✅ `patient_goals` + `patient_development_areas` — resuelto spec 015 (commit 8db3c1f, 5 policies: 3 goals per-patient via care_team + 2 development_areas SHARED CATALOG). Decisión Phase 1 Query D: `patient_development_areas` es catálogo compartido (sin columna `patient_id`) → policy "Authenticated read" USING (true) + "Admins manage". Edge functions (`suggest-treatment`, `rag-query`, `analyze-progress`, `recommend-purchases`) usan service_role → bypass RLS, no afectadas.

**Buenas noticias operativas**: ningún usuario real está viendo "sin data" por bug de policies hoy. La remediación puede ser **preventiva y planificada**, no emergency.

**Priorización GROUP B**: `billing_invoices` (recibe primera data real vía facturación) > `patient_evaluations` (flujo clínico por sesión) > `patient_goals` (downstream de plan terapéutico).

**Bundle note**: `patient_development_areas` cubierta vía FK embed en `patient_goals` → template de `patient_goals` debe cubrir ambas en una sola migration (Template 3 en `specs/012-.../data-model.md §Follow-up specs`).

**Edge functions de `patient_goals`** (`suggest-treatment`, `rag-query`, `analyze-progress`, `recommend-purchases`) usan `service_role` → bypass RLS, **no afectadas** por futuras policies.

**Follow-up specs** (originalmente preparadas en `specs/012-audit-rls-enabled-zero-policies/data-model.md §Follow-up specs`):
- ✅ `write-policies-billing-invoices` → **ejecutado via spec 014** (commit 4bac0a4).
- ✅ `write-policies-patient-evaluations` → **ejecutado via spec 014** (commit 4bac0a4) con ajustes schema: `patient_care_team.dentist_id` + `is_active=true` filter, `patients.profile_id`.
- ✅ `write-policies-patient-goals-and-development-areas` → **ejecutado via spec 015** (commit 8db3c1f). Variante SHARED CATALOG para `patient_development_areas` confirmada en Phase 1.

**Estado final post-spec 015**: GROUP B cerrado. Quedan 19 GROUP C dormant (sin callsites frontend) como backlog pasivo — se revisan si alguna tabla recibe código.

**Hallazgo lateral documentado en spec 015 (follow-up sugerido, no tratado)**: FKs duplicados en `patient_goals` — `patient_id` tiene FK dual a `patients.id` y `profiles.id` (schema debt). Candidato a spec `cleanup-duplicate-fks-patient-goals`.

**Scope bound explícito**: 19 tablas GROUP C quedan como-están hasta reactivación. Si alguna recibe código o flag se activa → mover a GROUP B y re-evaluar. FR-006 no disparó (GROUP A ≤ 5), no se requiere meta-spec.

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
- `docs/PATTERNS.md` — 5 patrones canónicos de DentalSpot (alias SQL · backfill+trigger · dedup audit · audit defensivo · preventive mini-audit)
---
**Last updated**: 2026-04-20 | spec 016 closed — último P0 del RLS coverage audit CERRADO: 6 tablas locked down (pie_sessions, pie_students, pie_paci, pie_schedule_blocks, pie_therapist_schools, debug_signup_logs) via migration `20260420000006` (commit `d38f88c`). 6 ALTER TABLE ENABLE RLS + 1 policy minimal "Therapists manage own pie_therapist_schools" (FR-009 Option 2a — R-01 silent upsert en MyClinicsSection.jsx:205 preservado). **Audit RLS coverage 2026-04-20 = 100% cerrado** (12 tablas, ~20 policies, 0 gaps). Forward-looking §V: reactivación PIE futura requiere spec `write-pie-policies-full` ANTES del flag flip | spec 015 closed — GROUP B 3/3 RESUELTOS: patient_goals (3 policies per-patient via care_team) + patient_development_areas (2 policies SHARED CATALOG) via migration `20260420000005` (commit `8db3c1f`). RLS zero-policies audit completo para GROUP B; quedan 19 GROUP C dormant como backlog pasivo | spec 014 closed — 2/3 GROUP B resueltos: billing_invoices (2 policies) + patient_evaluations (3 policies) via migration `20260420000004` (commit `4bac0a4`) | spec 013 closed — OrganizationContext persistence fix (commit `478dde4`, merged `a203768`) | spec 012 closed — RLS zero-policies audit 22 tablas categorizadas GROUP A/B/C/D (commit `ca2fb9e`) | spec 011 closed — 7 FK indexes alta prioridad aplicados (commit `bcb8448`) | spec 010 closed — voice-visualizer + src/app/ orphans eliminados (commit `1c07b26`) | spec 009 closed — marketplace_purchases RLS 4 policies (commit `0b89ba3`) | spec 007 closed — 3 drifts resueltos + F-1 compliance finding diferido | **Audit source**: FASE 1 audit session (19-abr) + `Dentalspot_Estado_y_Roadmap.pdf` (18-abr) + spec 003 commit `c55d1a5` (20-abr) + preventive schema drift audit post-spec 005 (20-abr) + Express block 2026-04-20 (health-checks + FK performance audit + NOT NULL audit + feature flags inventory + PATTERNS.md) + spec 007 post-audit drift resolution (20-abr, commit `97c34b6`) + spec 009 marketplace_purchases RLS restoration (20-abr, commit `0b89ba3`) + spec 010 dead code cleanup (20-abr, commit `1c07b26`) + spec 011 FK indexes high-priority (20-abr, commit `bcb8448`) — añade distinción `clinical_audit_log`/`clinical_access_log`, patrón canónico "backfill+trigger", antipatrón "one-shot sin trigger", nueva migración `20260419000001`, sección "Known drift non-urgent" con 2 amarillos backlog, inventario de 7 feature flags (reducido a 6 tras spec 010), health-checks confirmando specs 003/004/005 en producción, 30+ FKs sin índice categorizados por prioridad (🔴 alta cerrada en spec 011, 🟡 media + 🟢 baja en backlog), subsección "Drifts resueltos post-audit (spec 007)" con 3 drifts patient/therapist dashboard cerrados, subsección "RLS policies restauradas (spec 009)" con 4 policies finales de marketplace_purchases, Dead code table con columna Status tracking spec 010 resolution, subsección "FKs indexados post-audit (spec 011)" con 7 índices btree + BITMAP INDEX SCAN confirmado.
