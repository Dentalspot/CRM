# DentalSpot — Data Compliance (estado implementado)
> **Este documento es un INVENTARIO de compliance ya implementado, no un plan.** DentalSpot opera en producción con cobertura compliance-ready para Ley 20.584 y cobertura parcial de Ley 21.719. Cada ítem referencia código, tablas y migraciones reales — son la evidencia de que la compliance no es nice-to-have, es el producto.
## Marco normativo cubierto
| Ley | Alcance | Estado DentalSpot |
|---|---|---|
| Ley 20.584 | Derechos del paciente y acciones de salud (Chile) | ✅ Compliance-ready |
| Ley 21.719 | Protección de datos personales (Chile, reemplaza 19.628) | 🟡 Cobertura parcial (ARCO vivo, portabilidad y borrado pendientes) |
| Ley 19.628 | Predecesora aún vigente en transición | ✅ Heredado por 21.719 |
| RGPD | Referencia para expansión | 📚 Diseño alineado |
---
## Ley 20.584 — Consentimiento informado
### Firma del paciente (no del dentista)
**Historia:** antes el dentista podía "firmar por el paciente" desde el modal en la ficha. La firma quedaba con `user_id` del dentista — jurídicamente falsa. Se hardenó el flujo.
**Implementación actual:**
| Elemento | Path / tabla |
|---|---|
| Tabla firma | `legal_signatures` |
| Columnas clave | `user_id` (paciente real), `user_agent`, `ip_address`, `document_version` |
| Modal firma (desde el portal del paciente) | `src/components/shared/ClinicalConsentModal.jsx` |
| Hook firma | `src/hooks/useClinicalConsent.js` |
| Estado consent consultado vía | RPC `get_patient_consent_status` (fuente de verdad, no columna mutable `patients.clinical_consent_signed`) |
| Banner en ficha del dentista | Consume el RPC y muestra estado real; modal del dentista es sólo informativo |
| Admin — detalle de documentos firmados | `src/features/admin/modules/legal/pages/DocumentDetailPage.jsx` + `src/features/admin/modules/legal/api/legalApi.js` |
### Hardening del rol paciente (puede leer, no editar clínico)
**Trigger DB:** `prevent_patient_clinical_edit` (migración RLS phase 3). Si el `user_id` del UPDATE coincide con el dueño de la fila (paciente), rechaza cambios en:
- `medical_history`, `diagnosis`, `allergies`, `medications` (datos clínicos)
- `organization_id`, `therapist_id` (asignaciones)
El paciente sí puede editar campos administrativos propios: teléfono, email, dirección.
**UI paciente:** los campos clínicos ya no se muestran como editables — evita el toast falso "Guardado" cuando RLS rechaza (Constitution V).

### Hardening roles asistente + clinic_admin (editan administrativo, NO clínico) — 2026-05-24
**Trigger DB:** `prevent_assistant_clinical_edit` (migraciones `20260524000012` creación + `20260524000013` extensión a clinic_admin). Análogo al del paciente. `BEFORE UPDATE` en `patients`:
- Si el editor es **dentista** (dueño/tratante `OLD.therapist_id = auth.uid()` o member `dentist`) → permite editar todo.
- Si es **asistente** o **clinic_admin** de la org → rechaza cambios en campos clínicos: `medical_history`, `diagnosis`, `diagnosis_summary`, `allergies`, `other_info`, `medications`, `systemic_diseases`, `pregnancy`, `surgical_history`, `clinical_alerts`, `consultation_reason`, `treatment_stage`, `notes`, `anamnesis_template`, `evaluation_template`.
- Ambos **sí** pueden editar datos administrativos (nombre, contacto, estado, fechas operativas).

**Clave del modelo:** el dueño-dentista tiene roles `clinic_admin` **+** `dentist` (verificado: Cristobal en Los Álamos), por lo que sigue editando clínico vía su rol `dentist`. Un admin puro tiene solo `clinic_admin` (Teo en Igeldo) → queda limitado a administrativo. La regla es "solo el profesional tratante edita la ficha" (Ley 20.584).

**Contexto:** las policies `pat_assistant_update` / `pat_admin_update` dan UPDATE sin restricción de columnas; el trigger es la capa que acota qué columnas. Defensa en profundidad (Constitution II).

**Visualización (Constitution III) — ya cubierta, sin gap:** el `clinic_admin` NO accede a fichas clínicas detalladas. Su vista (`ClinicPatientsPage`) es admin-level (contacto + citas, sin `clinical_history`), y la ruta de ficha completa (`patients/:id/*` → `PatientFilePage`) tiene `RoleGuard allowedRoles={[THERAPIST]}`. Además `useClinicalAccessLogger` ya incluye `clinic_admin`/`assistant` en `isClinicalRole`, así que cualquier acceso futuro a una página instrumentada queda auditado en `clinical_audit_log`.
---
## Ley 21.719 — Protección de datos personales
### Auditoría clínica (derecho de acceso ARCO)
**Historia:** el paciente tiene derecho a saber quién ha accedido a su ficha. Sin log append-only, ese derecho es papel mojado.
**Implementación actual:**
| Elemento | Path / tabla |
|---|---|
| Tabla log | `clinical_audit_log` (append-only con triggers `trg_audit_log_no_update` / `trg_audit_log_no_delete`) |
| Migración creadora de la tabla | `supabase/migrations/20260415100000_organization_model_schema.sql:157-200` |
| Policies RLS sobre la tabla | `supabase/migrations/20260416000001_rls_phase3_compliance.sql` (phase 3 compliance) |
| Sync trigger `patient_care_team` | `supabase/migrations/20260419000001_repair_patient_care_team.sql` (spec 003, 2026-04-20) |
| Logger (util) | `src/lib/audit/clinicalAuditLogger.js` — inserta en `clinical_audit_log` |
| Hook consumidor | `src/lib/audit/useClinicalAccessLogger.js` *(nombre del hook incluye "Access" por razones históricas, pero escribe a `clinical_audit_log` — ver subsección "Dos tablas distintas" abajo)* |
| Consumidores confirmados | `src/pages/therapist/PatientFilePage.jsx:24,136` · `src/features/odontogram/pages/OdontogramEvaluationPage.jsx:24,81` |
| UI paciente (ver accesos a su ficha) | `src/features/patient-dashboard/pages/PatientAccessHistoryPage.jsx` |
**Doble seguro contra spam:** si el dentista entra y sale 5 veces en la misma hora sobre la misma ficha, se graba UNA línea, no 5.
**Constraint no-negociable (Constitution III):** ningún componente lee datos clínicos sin invocar el hook. Edge functions que tocan PHI escriben al log vía SQL/RPC dedicada.

### Dos tablas distintas: `clinical_audit_log` vs `clinical_access_log`

Ambas existen en la DB y son activas, con propósitos diferentes que deben mantenerse separados:

| Tabla | Propósito | Acciones permitidas | Consumidores |
|---|---|---|---|
| **`clinical_audit_log`** | Audit trail general del acceso/edición de PHI clínica por parte del dentista. | `view_record`, `edit_record`, `create_record`, `export_file`, `print_record`, `grant_exceptional_access`, `exceptional_access` | `src/lib/audit/*` (logger y hook) |
| **`clinical_access_log`** | Auditoría del **módulo Pasaporte Clínico** (`src/features/clinical-passport/`): grants, shares, revokes y descargas de acceso compartido entre profesionales. | `grant`, `share`, `revoke`, `download_pdf`, `export`, `auto_grant`, `view` | `src/features/clinical-passport/*`, `src/features/admin/modules/clinical-history/hooks/useAccessLog.js`, `AcceptPassportPage.jsx` |

Los CHECK constraints de cada tabla hacen los sets de acciones **mutuamente excluyentes**: una fila de `clinical_audit_log` nunca puede existir en `clinical_access_log` y viceversa. El módulo `clinical-passport` (≈6 archivos frontend) es la **implementación parcial del Pasaporte Clínico Universal** del ecosistema Communicare (ver `ecosystem-communicare.md`).
### Base jurídica del tratamiento (`processing_lawful_basis`)
**Estado:** referenciado en las tablas con PHI (columna o ENUM — a confirmar tras regenerar `schema.sql`). Migrations que lo mencionan:
- `20260415100000_organization_model_schema.sql`
- `20260416000001_rls_phase3_compliance.sql`
- (3 migraciones adicionales)
**Pendiente:** confirmación exacta de si es columna, ENUM o dominio SQL — no aparece como tabla dedicada en `supabase/tables_list.txt`.
### Exceptional access grants (acceso fuera del `care_team`)
**Propósito:** permitir que un dentista lea la ficha de un paciente que no es suyo, con autorización temporal y auditada (urgencia, cobertura de colega, interconsulta).
**Estado:** mecanismo presente en migraciones, sin UI de gestión visual todavía.
**Migrations que lo mencionan:**
- `20260415100000_organization_model_schema.sql`
- `20260415100008_rls_phase2_clinical.sql`
- `20260416000001_rls_phase3_compliance.sql`
### ARCO — derechos del titular
**Acceso · Rectificación · Cancelación · Oposición · Portabilidad.**
| Interfaz | Path |
|---|---|
| Tabla de solicitudes | `arco_requests` |
| Self-service paciente (crear solicitud) | `src/features/settings/components/AccountSecuritySettings.jsx` |
| Historial de accesos del paciente (derecho de acceso) | `src/features/patient-dashboard/pages/PatientAccessHistoryPage.jsx` |
| Gestión admin de solicitudes | `src/features/admin/modules/legal/pages/ArcoRequestsPage.jsx` |
| Módulo admin legal completo | `src/features/admin/modules/legal/` |
**Cobertura:**
- ✅ Crear solicitud ARCO desde portal paciente
- ✅ Ver historial de accesos a la propia ficha
- ✅ Gestión admin de solicitudes (plazo legal 15 días hábiles)
- 🟡 Pendiente: exportación completa de datos del paciente (formato portable)
- 🟡 Pendiente: borrado de cuenta con retención legal (soft delete + purga diferida)
- 🟡 Pendiente: notificación automática al paciente cuando hay nuevo tratamiento de sus datos
### Aislamiento entre clínicas (multi-tenant)
**Mecanismo:** columna `organization_id` en cada tabla con PHI + RLS que filtra por el `organization_id` del usuario autenticado.
**Cobertura RLS:**
| Fase | Migración | Scope |
|---|---|---|
| Phase 1 — Administrativa | `20260415100007_rls_phase1_administrative.sql` | profiles, organizations, subscriptions, memberships |
| Phase 2 — Clínica | `20260415100008_rls_phase2_clinical.sql` + fix `20260415100009_fix_dentist_insert_policies.sql` | patients, clinical_records, evaluations, treatments |
| Phase 3 — Compliance | `20260416000001_rls_phase3_compliance.sql` + fix `20260416000002_fix_care_team_recursion.sql` | clinical_audit_log, legal_signatures, arco_requests, processing_lawful_basis, exceptional_access_grants |
| Phase 3 — Sync fix (spec 003) | `20260419000001_repair_patient_care_team.sql` | backfill reparador `patient_care_team` + triggers `trg_sync_patient_care_team_insert/update` |
| Baseline | Archivos `.bak` | Rollback de referencia |
**Total policies:** ≈ 3.016 líneas en `supabase/policies.sql`.
---
## Historial de compliance — brechas conocidas

Registro honesto de ventanas donde Constitution III / Ley 21.719 estuvieron violadas en producción. Cada ítem es **irrecuperable** (append-only significa que las entradas perdidas no pueden fabricarse retroactivamente) y queda documentado por transparencia con pacientes y auditores.

| Ventana | Principio violado | Causa raíz | Resolución |
|---|---|---|---|
| **2026-04-18 06:57 UTC → 2026-04-20 02:04 UTC** (≈43h) | Constitution III + Ley 21.719 ARCO | `clinical_audit_log` silencioso: policy `cal_dentist_insert` exige `is_in_care_team(patient_id)`; la función consulta `patient_care_team`; ésta se pobló una vez (15-abr, migración `20260415100002`) y no existía trigger de sincronización. Pacientes creados post-backfill caían fuera del care_team → policy rechazaba INSERT silenciosamente (console.warn solo en DEV). | Commit `c55d1a5` + migración `20260419000001_repair_patient_care_team.sql` (spec 003): backfill reparador idempotente + triggers `AFTER INSERT / AFTER UPDATE OF therapist_id, organization_id` mantienen la tabla sincronizada. Policy RLS sin tocar — design intent Phase 3 preservado. |
| **Inicio desconocido → 2026-04-20** (multi-semanas, posiblemente desde Apr 1) | Constitution II (RLS-First Security) + Ley 20.584 (PHI) + Ley 21.719 (datos personales) | 3 tablas (`patient_questions`, `marketplace_purchases`, `blog_posts`) con policies definidas pero `rowsecurity = false` → policies decoración, no enforcement. Cualquier usuario autenticado podía leer/escribir filas de otros. Detectado por audit preventivo post-Express block ejecutando `pg_tables.rowsecurity` vs `pg_policies` coverage check. | Spec 006 (`enable-rls-quick-wins`, migración `20260420000001`): `ALTER TABLE ENABLE ROW LEVEL SECURITY` en `patient_questions` + `blog_posts`. `marketplace_purchases` diferido a spec separado (solo 1 de las 3 policies históricas sobrevive en live state — necesita restore antes de enable RLS). Las policies ya existentes y diseñadas para Phase 1/2/3 se activan automáticamente al encender el flag. |

**Lección operativa:**
1. Toda tabla derivada poblada por backfill one-shot debe tener un trigger de sincronización en el mismo PR.
2. **Audit `pg_tables.rowsecurity` vs `pg_policies` en cada corte de release** — crear 1 policy no implica tabla protegida; requiere además `ALTER TABLE ENABLE ROW LEVEL SECURITY`. Caso 2026-04-20 fue detectable con query de 4 líneas y permaneció invisible por semanas.
3. Patrón canónico de ambas lecciones en `architecture.md` §"Canonical patterns" y §"RLS coverage audit".

---
## Deuda compliance conocida
Checklist de backlog regulatorio. Cada ítem es candidato a spec dedicada.
| Ítem | Ley | Prioridad | Tamaño |
|---|---|---|---|
| Exportación completa de datos del paciente (portabilidad) | 21.719 | Alta | Medio (edge function + UI paciente) |
| Borrado de cuenta con retención legal (soft delete + purga diferida) | 21.719 | Alta | Grande (flujo legal + técnico) |
| Notificación al paciente sobre nuevo procesamiento de sus datos | 21.719 | Media | Chico (email + UI opt-in) |
| UI de gestión de `exceptional_access_grants` | 21.719 | Media | Medio |
| ~~Hardening rol `assistant`~~ ✅ **HECHO 2026-05-24** (trigger `prevent_assistant_clinical_edit`, migración `20260524000012`) | 20.584 | — | — |
| ~~Scope refinado de `clinic_admin`~~ ✅ **HECHO 2026-05-24** (no edita campos clínicos — trigger extendido en `20260524000013`; no visualiza fichas — `ClinicPatientsPage` admin-level + ruta ficha THERAPIST-only) | 20.584 | — | — |
| Auditoría de impresión/exportación de documentos clínicos | 21.719 | Media | Chico (extender logger existente) |
| Fallback legacy `therapist_id` en SELECTs clínicos → migrar a `patient_care_team` (spec 003 cerró la parte de writes al audit log via trigger sync; los SELECTs del modelo Phase 2 con fallback siguen pendientes) | 21.719 | Media | Grande (migración datos + queries) |
| Regeneración de `supabase/schema.sql` tras levantar Docker o usar MCP | — | Baja | Chico |
| Limpieza `.playwright-mcp/` pushado accidentalmente al repo | — | Baja | Chico |
---
## Qué hacer con este doc
1. **Antes de escribir una spec que toque PHI:** releer "Auditoría clínica" y "Aislamiento entre clínicas"; replicar patrón.
2. **Antes de aprobar `/speckit-plan`:** verificar que el plan usa el logger, no consulta columnas cosméticas, y respeta RLS 3 fases.
3. **Al abrir un bug que involucra consent/firma:** recordar que el banner y modal del dentista son informativos — no firman. Confirmar cualquier cambio contra el RPC `get_patient_consent_status`.
4. **Al añadir una tabla con PHI:** obligatorio incluir `organization_id` + policy phase2_clinical + invocación al logger desde el hook del módulo.
## Docs relacionados
- `.specify/memory/constitution.md` — los 6 principios, especialmente I (Compliance-First), II (RLS-First) y III (Append-Only Audit)
- `.specify/memory/architecture.md` — mapa técnico con paths exactos
- `.specify/memory/ecosystem-communicare.md` — por qué el estándar de DentalSpot no puede bajar
---
**Last updated**: 2026-04-20 | **Estado**: Ley 20.584 compliance-ready · Ley 21.719 cobertura parcial (brecha 18-20 abr documentada y cerrada) | **Fuentes**: FASE 1 audit (19-abr) + `Dentalspot_Estado_y_Roadmap.pdf` (18-abr) + spec 003 commit `c55d1a5` (20-abr)
