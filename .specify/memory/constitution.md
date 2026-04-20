# DentalSpot Constitution

> "En Chile, los profesionales de salud no se hablan entre ellos. Y los que pagan el precio son los pacientes."

SaaS odontológico del ecosistema Communicare, operando en producción desde Q1-2026. Esta constitución consagra los principios técnicos y regulatorios no-negociables que permitieron a DentalSpot alcanzar compliance-ready para Ley 20.584 y avanzar sobre Ley 21.719. Toda spec, plan, task e implement pasa primero por el filtro de los 6 principios.

## Core Principles

### I. Compliance-First (NON-NEGOTIABLE)

Rule: Toda feature se diseña desde el día 0 contra Ley 21.719 (protección de datos personales), Ley 20.584 (derechos del paciente) y RGPD como marco de referencia. Sin evaluación compliance documentada, no hay spec.

Why: DentalSpot procesa datos clínicos sensibles (fichas, diagnósticos, alergias, RUT). El prestador de salud es responsable funcional de la ficha. Incumplir expone a sanciones civiles y penales y a daño reputacional irreversible en un segmento donde la confianza es el producto.

Consequence: Una feature que no cumple se revierte antes de llegar a producción, aunque implique bloquear un sprint completo.

### II. RLS-First Security (NON-NEGOTIABLE)

Rule: La seguridad vive en la base de datos — supabase/policies.sql (≈3.000 líneas) y las migraciones rls_phase1_administrative, rls_phase2_clinical, rls_phase3_compliance. Los guards de React (AuthGuard, RoleGuard, PlanGuard, AddOnGuard, PermissionGuard) son UX, no seguridad. Ninguna query crítica puede "funcionar" solo porque el frontend la oculta.

Why: Un atacante con devtools salta cualquier guard frontend en 30 segundos. RLS le pregunta a la DB "¿quién eres?" en cada fila, cada vez. Con policies correctas, nadie ve datos fuera de su organization_id ni fuera de su care_team, aún con token legítimo de otra clínica.

Consequence: Ninguna tabla con PHI vive sin policies de las 3 fases RLS. Regresión detectada en auditoría = rollback inmediato, no "lo arreglamos en el sprint siguiente".

### III. Append-Only Clinical Audit (NON-NEGOTIABLE)

Rule: Todo acceso de **TERCEROS** (roles clínicos: `dentist`, `clinic_admin`, `assistant`) a datos clínicos de un paciente — apertura, impresión, exportación o modificación — se escribe en `clinical_audit_log` vía `src/lib/audit/clinicalAuditLogger.js` + hook `useClinicalAccessLogger` (el hook conserva el nombre "Access" por razones históricas pero escribe a la tabla `clinical_audit_log`, no a `clinical_access_log` — ésa pertenece al módulo `clinical-passport`). La tabla `clinical_audit_log` tiene triggers append-only: no admite UPDATE ni DELETE desde el cliente ni desde roles no-privilegiados.

**El auto-acceso del paciente a su propia ficha NO requiere logging** — está alineado con Ley 20.584 art. 13 y Ley 21.719, que regulan transparencia sobre accesos **por terceros**, no auto-consulta del titular. El hook `useClinicalAccessLogger` implementa este filtro explícitamente (early return si el actor no tiene rol clínico). Componentes del flujo paciente (ej. `PatientDashboardPageV2.jsx`, `MyProgressPage.jsx`) **no están obligados** a invocar el hook aunque lean PHI del propio paciente.

Why: El paciente tiene derecho ARCO a saber quién, cuándo y por qué se accedió a su ficha — donde "quién" se refiere a **terceros** procesadores (Ley 21.719 concepto de "responsable/encargado del tratamiento"). El log es la ventana de confianza del paciente al sistema — y, en dirección opuesta, la defensa del profesional ante reclamos injustos (historia fundacional Communicare #3). Registrar auto-consulta añadiría ruido sin valor legal ni de trazabilidad.

Consequence: Cualquier componente de flujo profesional (dashboard terapeuta, ficha paciente desde staff, odontograma, exports) que lea datos clínicos de paciente **ajeno** sin invocar el hook es una violación documentada. Los edge functions invocados por staff que tocan PHI deben insertar al log vía SQL o RPC dedicada. El log sobrevive aún si el dentista borra al paciente.

**Antipatrón (lección post spec 007/008)**: declarar un gap de §III solo por ausencia de la invocación del hook en un grep, sin leer el body del hook para verificar si el caso de uso está dentro del scope diseñado. Antes de abrir un spec de remediación §III, leer `src/lib/audit/useClinicalAccessLogger.js` y confirmar que el rol del actor está incluido en `isClinicalRole`. Ver `docs/PATTERNS.md §4` — "verificar implementación del consumidor antes de propagar hallazgos".

### IV. Micro-Bloques con Plan Previo (NON-NEGOTIABLE)

Rule: Ningún cambio no-trivial entra sin: (1) mini plan aprobado con archivos exactos y payload exacto, (2) scope cerrado explícitamente (lo que queda fuera se nombra), (3) reporte post-implementación confirmando tanto lo hecho como lo no tocado. Nunca se mezcla refactor + fix + feature en un mismo bloque.

Why: La historia del repo muestra cicatrices de PRs que abrieron frentes en paralelo — migraciones resolve_danissa_* y resolve_cristobal_* existen porque alguna vez se intentó hacer mucho a la vez. Micro-bloques son la vacuna, no una preferencia estética.

Consequence: Un PR con dos frentes se divide antes de mergearse. Scope creep detectado durante implementación se marca como "bloque siguiente" y no se incluye.

### V. UI Honesty (NON-NEGOTIABLE)

Rule: Ningún toast de éxito aparece si la operación afectó 0 filas. Toda mutación Supabase debe validar .select('id') + data.length > 0 antes de reportar éxito al usuario. Banners y modales consultan la fuente de verdad (RPC o función SQL), no columnas cosméticas posiblemente stale. Los patrones .update(...) sin .select() quedan prohibidos fuera de logging interno.

Why: Ya pasó: el paciente veía toast verde "Contacto de emergencia guardado" mientras la policy RLS rechazaba silenciosamente. La UI mentía. Eso es incompatible con compliance, con la misión Communicare y con la confianza profesional-paciente.

Consequence: Toda mutación pasa revisión de este criterio en /speckit-plan. Los handleSave históricos están siendo auditados caso a caso.

### VI. Schema Drift Zero (NON-NEGOTIABLE)

Rule: Toda columna, tabla o ENUM referenciado en código debe existir en supabase/migrations/. El commit que introduce uso de DB nueva incluye su migración. Cambios de nombre (ej. histórico price → price_clp) actualizan TODOS los callers en el mismo PR, no en fases.

Why: Las migraciones de resolución manual (resolve_danissa_*, resolve_cristobal_*) son evidencia fósil de drift pasado. Un código que pide columna inexistente falla silenciosamente en producción — la app "funciona" mientras una feature específica rompe sin alertar, y el usuario pierde datos confiando en el éxito aparente.

Consequence: Revisión obligatoria: cada mención de tabla/columna en src/ tiene contraparte en migraciones. No hay excepciones por "solo es un prototipo" ni por "después lo arreglamos".

## Regulatory Framework

DentalSpot opera bajo:

Ley 21.719 (Chile, protección de datos personales, reemplaza a Ley 19.628 en transición progresiva). Estado: compliance parcial — tablas `arco_requests`, `legal_signatures`, logger `clinical_audit_log` (audit general) + `clinical_access_log` (passport sharing) y RLS phase3 vivas; ARCO self-service desde `AccountSecuritySettings` y módulo admin `ArcoRequestsPage` operativos; pendiente flujo completo de portabilidad y borrado con retención legal. Brecha histórica documentada: ventana 2026-04-18 06:57 → 2026-04-20 02:04 UTC con `clinical_audit_log` silencioso (ver `data-compliance.md` §"Historial de compliance"), cerrada en spec 003 commit `c55d1a5`.
Ley 20.584 (Chile, derechos del paciente y acciones de salud). Estado: compliance-ready — consentimiento informado vía legal_signatures + ClinicalConsentModal + hook useClinicalConsent.
Ley 19.628 (predecesora, vigente durante transición).
RGPD (referencia para expansión futura fuera de Chile).
Toda tabla con PHI debe tener: (a) columna `organization_id` + RLS phase2_clinical, (b) registro en `clinical_audit_log` cuando se lee/edita/crea (vía `useClinicalAccessLogger`), (c) política de retención alineada a la ley que corresponda.

## Development Workflow

DentalSpot opera con el patrón Advisor/Executor validado el 2026-04-18:

Asesor estratégico (Claude en sesión Anthropic): define scope, pasa prompts para Claude Code, valida resúmenes, cuestiona planes, detiene scope creep, mantiene memoria del ecosistema Communicare.
Ejecutor en IDE (Claude Code CLI o extensión VS Code): ejecuta /speckit-specify, /speckit-plan, /speckit-tasks, /speckit-implement; edita código; corre build checks. No hace commit ni push — lo hace Danissa.
Flujo por feature:

```
spec → 5-line review → plan → 5-line review → tasks → 5-line review → implement → manual test → deploy
```

Cada etapa aprobada explícitamente. Pausa obligatoria post-implement para test manual. Una spec = un bug o feature aislado. Sin mezclar specs en la misma sesión.

## Governance

Esta constitución supersede cualquier patrón ad-hoc, comentario de PR o preferencia personal.
Enmiendas requieren: (a) rationale escrito en el PR, (b) incremento del campo Version, (c) aprobación explícita de Danissa Klagges (founder).
Excepciones puntuales a un principio requieren justificación en la spec afectada con etiqueta [CONSTITUTION-EXCEPTION] y un plan de re-alineación.
Los 6 principios son no-negociables; solo "Regulatory Framework" y "Development Workflow" admiten actualizaciones sin cambio de versión mayor.
Versioning: MAJOR = remover principio o cambiar gobernanza; MINOR = principio nuevo; PATCH = aclaración sin cambio de regla.
Version: 1.1.0 | Ratified: 2026-04-19 | Last Amended: 2026-04-20

Changelog:
- 1.1.0 (2026-04-20): MINOR — Principio III refinado para clarificar que **el auto-acceso del paciente a su propia ficha NO requiere logging**. El scope del principio se acota explícitamente a acceso de terceros (roles clínicos `dentist` / `clinic_admin` / `assistant`), alineado con Ley 20.584 art. 13 y Ley 21.719 (transparencia sobre accesos por terceros, no auto-consulta). La redacción previa ("toda apertura... se escribe") era ambigua y provocó el falso positivo F-1 de spec 007. El hook `useClinicalAccessLogger` ya implementaba este filtro correctamente; la constitución ahora lo refleja. Se añade antipatrón "declarar gap §III por grep sin leer body del hook" (lección cerrada en spec 008). Este es el primer refinamiento que ajusta el alcance de un principio sin agregar uno nuevo — se clasifica como MINOR por cambio material de qué cuenta como violación vs no (aunque la regla operativa del hook es la misma de siempre).
- 1.0.1 (2026-04-20): PATCH — aclara que Principio III opera sobre `clinical_audit_log` (no `clinical_access_log`); distingue el hook `useClinicalAccessLogger` (nombre histórico) de la tabla; añade brecha histórica 18-20 abr al Regulatory Framework. Sin cambio de reglas.
- 1.0.0 (2026-04-19): ratificación inicial con 6 principios no-negociables.
