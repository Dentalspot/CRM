# Feature Specification: Audit RLS-Enabled Zero-Policies Tables

**Feature Branch**: `012-audit-rls-enabled-zero-policies`
**Created**: 2026-04-20
**Status**: Draft
**Input**: User description: "audit-rls-enabled-zero-policies — ~20 tablas con RLS ENABLED + 0 policies = deny-all silent; priorizar por impacto de usuario real"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Descubrir features silenciosamente rotas para el usuario final (Priority: P1)

Un usuario (paciente, terapeuta, admin) entra a una sección de la aplicación que consulta una tabla con RLS enabled + 0 policies. PostgreSQL aplica la regla default (deny-all para anon+auth) y devuelve array vacío silenciosamente — sin error en consola, sin 4xx. El frontend muestra "no hay data" cuando la DB sí tiene filas. El usuario asume que la feature está vacía o que él no la usó, no que hay un bug. El producto pierde credibilidad sin que nadie sepa por qué.

Este spec **no fixea** las features rotas. Produce el **inventario priorizado** que permite al equipo decidir qué fixear primero (spec dedicada por grupo de tablas o meta-spec si el grupo crítico supera 5 tablas).

**Why this priority**: la vulnerabilidad operativa está activa hoy. Cada día sin el audit es un día en que features que deberían funcionar están mostrando vacío silencioso. El valor del spec NO es el fix — es saber dónde hay que fixear y en qué orden.

**Independent Test**: al cierre del spec, existe un documento archivable (`specs/012-.../data-model.md` + sección nueva en `architecture.md`) que responde sin ambigüedad: (a) qué tablas tienen RLS enabled + 0 policies hoy, (b) cuántas y cuáles son consumidas por frontend activo, (c) qué features concretas están rotas para el usuario. Un ingeniero externo al spec puede leer el output y decidir el próximo sprint de remediación en < 10 min.

**Acceptance Scenarios**:

1. **Given** el live schema del proyecto Supabase al 2026-04-20, **When** se ejecuta el audit completo (Phases 1-4), **Then** el output identifica al menos las ~20 tablas pre-conocidas + cualquier tabla adicional detectada por la query actual.
2. **Given** el inventario final, **When** un ingeniero lo lee para priorizar remediación, **Then** cada tabla tiene categoría GROUP A/B/C/D con severidad + user impact + recomendación concreta (fix inline / spec dedicada / dejar).
3. **Given** al menos 1 tabla en GROUP A (rojo — feature activa rota hoy), **When** se cierra el spec, **Then** existe un template de spec de remediación lista para invocar `/speckit-specify` de ese follow-up.

---

### User Story 2 - Preparar follow-up specs listas para ejecutar (Priority: P2)

Para tablas en GROUP A (feature activa con impacto actual), el equipo no quiere empezar desde cero cuando vaya a fixear — quiere un template ya listo: nombre sugerido de la spec, policies mínimas propuestas basadas en el patrón de callsites, referencias cruzadas. Este spec genera esos templates como "boilerplate ready" para invocar `/speckit-specify write-policies-<table>` sin reconstruir contexto.

**Why this priority**: acelera la acción post-audit. Sin templates, cada spec de remediación requiere volver a leer callsites y patrones — trabajo duplicado. P2 porque depende del P1 (la matrix) y es acelerador, no bloqueante.

**Independent Test**: por cada tabla GROUP A identificada, el output incluye un bloque "Template spec siguiente: write-policies-<table>" con scope base, policies candidatas, callsites y ref a patterns canónicos. Un ingeniero puede copiarlo como input del próximo `/speckit-specify`.

**Acceptance Scenarios**:

1. **Given** GROUP A tiene ≥1 tabla, **When** se consulta la sección "Follow-up specs preparadas" del output, **Then** hay un template por tabla con al menos (a) nombre de spec sugerido, (b) 2-4 policies candidatas, (c) lista de callsites del grep.

---

### User Story 3 - Documentar estado para backlog priorizado de remediación (Priority: P3)

Tablas en GROUP B (active pero sin usuarios afectados hoy — feature pre-launch) y GROUP C/D (dormant, feature-flagged, o intencionalmente restringidas) van al backlog formal en `architecture.md`. Esto permite que cuando el volumen de esas tablas crezca o se active la feature flag, el equipo tenga contexto sin reauditar.

**Why this priority**: organizational hygiene. P3 porque no requiere acción inmediata pero evita la reauditoria.

**Independent Test**: `architecture.md` tiene una nueva subsección `§RLS enabled zero-policies audit (2026-04-20)` con tabla completa (GROUP A/B/C/D). Preservada para consulta futura.

---

### Edge Cases

- **Tabla no aparece en la lista pre-conocida** (ej. alguna tabla nueva post-audit original): Phase 1 Query A la captura automáticamente. El spec NO se limita a la lista hardcodeada de 20; ejecuta SQL live. La lista del contexto del user es informativa, no definitiva.
- **Tabla aparece pero no está en la lista pre-conocida**: se añade al resultado con nota "nueva detección, no en inventario del audit original 2026-04-20".
- **Tabla en la lista pre-conocida pero ya tiene policies creadas manualmente entre el audit original y ahora** (ej. spec 009 añadió `marketplace_purchases` — ya no aplica): el spec la detecta como "resuelta" y la saca del inventario vigente.
- **Callsite grep retorna match en un archivo que está en feature-flag OFF**: GROUP D (unclear) — depende si el flag se activará.
- **Callsite grep retorna match en `supabase/functions/`** (edge function, usa service_role → bypassa RLS): NO es un callsite afectado por el gap. GROUP C (intencional).
- **Tabla con `n_live_tup = 0` + ≥1 callsite user-facing**: GROUP B (feature pre-launch, preventivo). Si la feature se activa sin fix, se convierte en A.
- **Mismo callsite referencia 2+ tablas del inventario** (ej. un JOIN): cuenta una vez por tabla pero se registra el grupo agrupado en data-model para que el fix considere ambas tablas juntas.
- **GROUP A resulta tener >5 tablas**: ESCALATE — no generar 5+ templates individuales. En su lugar, generar 1 meta-spec sugiriendo agrupación (respeta Principio IV Micro-Bloques: pero aplicado a la siguiente spec, no al actual). El output del audit recomienda explícitamente "abrir meta-spec, no N specs individuales".
- **Inventory live difiere del contexto del user en >5 tablas**: reportar como hallazgo lateral + re-priorizar. Si aparecen 5 tablas nuevas no listadas, quizás hay un problema de drift entre la architecture.md y la DB.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El audit DEBE ejecutar una query live a `pg_tables` + `pg_policies` (via LEFT JOIN) que detecte el conjunto ACTUAL de tablas en schema `public` con `rowsecurity = true` AND `COUNT(policies) = 0`. La lista resultante es la fuente de verdad — la lista pre-conocida del contexto del user es informativa, no definitiva.
- **FR-002**: El audit DEBE capturar `pg_stat_user_tables.n_live_tup` por cada tabla detectada, para distinguir tablas con data (features probablemente usadas) de tablas vacías (dormant probable).
- **FR-003**: El audit DEBE ejecutar grep sistemático por cada tabla detectada en FR-001 (`grep -rn "from\(['\"]\s*<table>\s*['\"]"` en `src/` y en `supabase/functions/`) y contabilizar callsites, clasificándolos en al menos 3 categorías: frontend activo (archivo bajo `src/features/`, `src/pages/`, `src/components/`, `src/hooks/` que consume la tabla sin feature-flag off), edge function (archivo bajo `supabase/functions/` — usa service_role, no afectado por RLS), feature-flagged off (archivo que envuelve la query en `FEATURE_FLAGS.XXX && ...` con flag `false`).
- **FR-004**: Cada tabla DEBE quedar asignada a exactamente una de las 4 categorías:
  - **GROUP A (🔴 rojo)**: `n_live_tup > 0` AND al menos 1 callsite de frontend activo. Significado: la feature está en uso y los usuarios ven vacío cuando no debería.
  - **GROUP B (🟡 amarillo)**: `n_live_tup = 0` AND al menos 1 callsite de frontend activo. Significado: feature pre-launch; fix preventivo antes del primer usuario.
  - **GROUP C (🟢 verde)**: 0 callsites de frontend activo (solo edge functions, o 0 callsites totales). Significado: intencional o dormant; documentar y dejar.
  - **GROUP D (⚪ gris)**: callsites en feature-flagged OFF exclusivamente. Significado: depende de si la flag se activará; reevaluar al activar la flag.
- **FR-005**: Para cada tabla en **GROUP A**, el output DEBE incluir un template de follow-up spec con al menos: (a) nombre sugerido (`write-policies-<table>`), (b) 2-4 policies candidatas basadas en el patrón de callsites (ej. si callsite filtra por `user_id` → "Users read own <table>" FOR SELECT), (c) lista literal de callsites + línea, (d) referencia a patterns canónicos (spec 006, spec 009, PATTERNS.md §§).
- **FR-006**: Si GROUP A contiene **más de 5 tablas**, el output DEBE sugerir **1 meta-spec agrupador** en vez de N specs individuales, con criterio de agrupación (ej. por dominio: paciente, facturación, AI) y referencia a Principio IV Micro-Bloques.
- **FR-007**: El spec NO DEBE crear policies RLS en este ciclo. Las queries son read-only sobre catalogs Postgres + grep local; no hay DDL.
- **FR-008**: El spec NO DEBE modificar código frontend ni aplicar migraciones. El output es exclusivamente documentación (2 archivos .md).
- **FR-009**: Los artefactos a crear/modificar son exactamente 2:
  - **Crear**: `specs/012-audit-rls-enabled-zero-policies/data-model.md` con output de Phases 1-3 (queries, matrix) + Phase 4 (templates).
  - **Modificar**: `.specify/memory/architecture.md` con nueva subsección `#### RLS enabled zero-policies audit (2026-04-20)` que incluye la matrix + backlog priorizado. La sección `§RLS coverage audit` existente queda intacta.
- **FR-010**: El output DEBE ser autosuficiente — un lector externo al spec puede leer solo `architecture.md §RLS enabled zero-policies audit` (y opcionalmente `data-model.md` para detalle) y decidir el próximo sprint de remediación sin volver a ejecutar las queries.
- **FR-011**: El spec NO DEBE extender el alcance a las categorías del audit original que ya están cubiertas (RLS DISABLED + policies, RLS DISABLED + 0 policies, RLS enabled + policies OK). Esas son scope de otras specs (006, 009, futuras). Este spec es exclusivamente **RLS enabled + 0 policies**.

### Key Entities *(include if feature involves data)*

- **`pg_tables.rowsecurity`**: flag booleano por tabla que indica si RLS está habilitada. Fuente de verdad para FR-001.
- **`pg_policies`**: catálogo de policies. Usado en LEFT JOIN para detectar ausencia de policies.
- **`pg_stat_user_tables.n_live_tup`**: estimación de row count (no exacto) para FR-002 distinguir activo vs dormant.
- **Callsite**: línea de código donde el frontend (o edge function) ejecuta query sobre una tabla del inventario. Identificado por grep.
- **GROUP A/B/C/D**: categoría de priorización (FR-004), 4 valores mutuamente excluyentes.
- **Template de follow-up spec**: bloque de texto copy-pasteable al input de un futuro `/speckit-specify` para una tabla GROUP A.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Matrix completa con **≥20 tablas** categorizadas (GROUP A/B/C/D). Si Phase 1 Query A retorna menos de 20, documentar la diferencia vs el contexto del user (algunas pueden haber sido remediadas entre el audit original y ahora — ej. `marketplace_purchases` via spec 009).
- **SC-002**: Al menos 1 spec template preparada (en la sección "Follow-up specs" del output) si GROUP A no es vacío. Si GROUP A está vacío, documentarlo explícitamente como "no urgencia detectada" (non-failure).
- **SC-003**: Cero líneas de código modificadas. `git diff src/` + `git diff supabase/migrations/` + `git diff supabase/policies.sql` = vacíos al cierre del spec. Únicos cambios: `specs/012-.../data-model.md` (nuevo) + `.specify/memory/architecture.md` (nueva subsección).
- **SC-004**: Un ingeniero externo al spec (o el propio futuro-yo tras meses) puede leer el output y decidir el próximo sprint de remediación en ≤10 min sin reejecutar las queries ni los greps.
- **SC-005**: La matrix identifica correctamente las 2 tablas con callsites pre-conocidos del contexto del user (`billing_invoices` con 3 callsites, `patient_evaluations` con 2 callsites), con sus categorías correspondientes (probablemente GROUP A o B según row counts).
- **SC-006**: La sección nueva de `architecture.md` referencia cruzadamente las tablas GROUP A a sus templates de spec follow-up (en `data-model.md §Follow-up specs`) para trazabilidad.

## Assumptions

- El proyecto Supabase activo es `tomremkbuxvedliyywbo` (DentalSpot). Schema `public`.
- Las queries de Phase 1 las corre Danissa en Supabase SQL Editor (MCP `execute_sql` denegado per política de shared infra, patrón ya conocido).
- El grep de Phase 2 lo ejecuta el ejecutor (Claude) localmente — no requiere DB access.
- La lista del contexto del user es **informativa**, no exhaustiva. Phase 1 Query A puede retornar tablas adicionales (o menos) — ese es el output verdadero.
- La categorización GROUP A/B/C/D tiene criterios binarios (row count > 0?, callsite frontend activo?). Casos ambiguos se documentan en notes de la matrix pero no crean categorías intermedias.
- El template de follow-up spec NO pretende ser ejecutable tal cual — es un borrador con scope sugerido que el humano refina antes de invocar `/speckit-specify`.
- Si el número de tablas detectadas (Phase 1) difiere del contexto (20 ± 5), se documenta como hallazgo lateral. Discrepancias grandes (>10) requieren reinspección de `architecture.md §RLS coverage audit`.
- El ejecutor NO aplica ninguna migration ni toca código del frontend. Si se detecta un bug obvio durante el grep (ej. una query sin filtro en un callsite de frontend), se documenta como hallazgo y se difiere a spec separada.

## Scope Bounds

- **Archivos autorizados a crear/modificar**:
  - `specs/012-audit-rls-enabled-zero-policies/data-model.md` (crear).
  - `specs/012-audit-rls-enabled-zero-policies/checklists/requirements.md` (crear).
  - `.specify/memory/architecture.md` (agregar subsección, NO modificar secciones existentes).
- **Archivos NO autorizados a modificar**:
  - Todo `src/**` — FR-008.
  - `supabase/migrations/**` y `supabase/policies.sql` — FR-007.
  - Otros docs (`constitution.md`, `PATTERNS.md`, `data-compliance.md`, `ecosystem-communicare.md`) salvo que el audit revele un cambio tan material que justifique bump de constitución (extremadamente improbable en discovery-pure).
- **Alcance prohibido**:
  - Escribir policies RLS concretas (eso es scope de las specs follow-up).
  - Aplicar DDL.
  - Decidir si una feature pre-launch debe lanzarse o no (el audit solo documenta estado).
- **Si GROUP A > 5 tablas**: el spec CIERRA recomendando meta-spec. NO se amplía este spec para fixear inline — violaría Principio IV (Micro-Bloques) y este spec explícitamente es discovery-pure.
- **Si Phase 1 revela que la lista del user está desactualizada** (ej. 5+ tablas nuevas o 5+ ya remediadas): documentar como "drift entre architecture.md y live DB" y crear hallazgo lateral para sync (no fixear en este spec).
