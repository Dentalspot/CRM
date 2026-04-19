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
---
## Ley 21.719 — Protección de datos personales
### Auditoría clínica (derecho de acceso ARCO)
**Historia:** el paciente tiene derecho a saber quién ha accedido a su ficha. Sin log append-only, ese derecho es papel mojado.
**Implementación actual:**
| Elemento | Path / tabla |
|---|---|
| Tabla log | `clinical_access_log` (append-only con triggers) |
| Migración creadora | `supabase/migrations/20260416000001_rls_phase3_compliance.sql` |
| Logger (util) | `src/lib/audit/clinicalAuditLogger.js` |
| Hook consumidor | `src/lib/audit/useClinicalAccessLogger.js` |
| Consumidores confirmados | `src/pages/therapist/PatientFilePage.jsx:24,136` · `src/features/odontogram/pages/OdontogramEvaluationPage.jsx:24,81` |
| UI paciente (ver accesos a su ficha) | `src/features/patient-dashboard/pages/PatientAccessHistoryPage.jsx` |
**Doble seguro contra spam:** si el dentista entra y sale 5 veces en la misma hora sobre la misma ficha, se graba UNA línea, no 5.
**Constraint no-negociable (Constitution III):** ningún componente lee datos clínicos sin invocar el hook. Edge functions que tocan PHI escriben al log vía SQL/RPC dedicada.
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
| Phase 3 — Compliance | `20260416000001_rls_phase3_compliance.sql` + fix `20260416000002_fix_care_team_recursion.sql` | clinical_access_log, legal_signatures, arco_requests, processing_lawful_basis, exceptional_access_grants |
| Baseline | Archivos `.bak` | Rollback de referencia |
**Total policies:** ≈ 3.016 líneas en `supabase/policies.sql`.
---
## Deuda compliance conocida
Checklist de backlog regulatorio. Cada ítem es candidato a spec dedicada.
| Ítem | Ley | Prioridad | Tamaño |
|---|---|---|---|
| Exportación completa de datos del paciente (portabilidad) | 21.719 | Alta | Medio (edge function + UI paciente) |
| Borrado de cuenta con retención legal (soft delete + purga diferida) | 21.719 | Alta | Grande (flujo legal + técnico) |
| Notificación al paciente sobre nuevo procesamiento de sus datos | 21.719 | Media | Chico (email + UI opt-in) |
| UI de gestión de `exceptional_access_grants` | 21.719 | Media | Medio |
| Hardening rol `assistant` (hoy UPDATE amplio sobre `patients`) | 20.584 | Alta | Chico (análogo al hecho con patient) |
| Scope refinado de `clinic_admin` | 20.584 | Media | Medio |
| Auditoría de impresión/exportación de documentos clínicos | 21.719 | Media | Chico (extender logger existente) |
| Fallback legacy `therapist_id` en SELECTs clínicos → migrar a `care_team` | 21.719 | Media | Grande (migración datos + queries) |
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
**Last updated**: 2026-04-19 | **Estado**: Ley 20.584 compliance-ready · Ley 21.719 cobertura parcial | **Fuentes**: FASE 1 audit (19-abr) + `Dentalspot_Estado_y_Roadmap.pdf` (18-abr)
