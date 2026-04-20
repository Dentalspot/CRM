# Feature Specification: Persistent Organization Context

**Feature Branch**: `013-ux-persistent-org-context`
**Created**: 2026-04-20
**Status**: Draft
**Input**: User description: "ux-persistent-org-context — dentistas con 2+ clínicas pierden `currentOrganizationId` en navegación / refresh / logout-login"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dentista con 2+ clínicas mantiene su selección al navegar (Priority: P1)

Un dentista (Cristóbal, Danissa) pertenece a 2 o más organizaciones (ej. "Odontología Los Álamos" + "Odontologia Bulnes"). Al abrir el dashboard, selecciona explícitamente "Odontología Los Álamos" desde el dropdown de organizaciones. Acto seguido navega a `/dashboard/patients` → el contexto de organización se pierde → la lista de pacientes muestra vacío (o pacientes de otra clínica no intencional) porque la query filtra por `currentOrganizationId` que ya no existe o cambió. El dentista interpreta "no hay pacientes en esta clínica" y puede tomar decisiones erradas (reasignar pacientes, duplicar entradas, dudar del producto).

**Why this priority**: es la fuente principal de frustración reportada para el rol más valioso del sistema (dentista multi-clínica = cliente pagante con alta densidad de uso). El gap es diario y afecta percepción de confiabilidad del producto. P1 porque **nada más en el spec tiene sentido si esto no se arregla**.

**Independent Test**: con una cuenta de prueba con 2+ organizaciones, un evaluador (a) logea, (b) selecciona explícitamente una organización distinta a la default, (c) navega a 3 rutas distintas del dashboard (`/patients`, `/calendar`, `/profile`) y (d) confirma que `currentOrganizationId` permanece en la organización seleccionada en los 3 destinos sin necesidad de re-seleccionar.

**Acceptance Scenarios**:

1. **Given** un dentista logueado con 2+ organizaciones y "Org B" seleccionada, **When** navega de `/dashboard/therapist` a `/dashboard/patients`, **Then** las queries y la UI siguen reflejando "Org B" (no hay fallback silencioso a "Org A" ni array vacío espurio).
2. **Given** el dentista navega entre 5 rutas dashboard consecutivas, **When** las recorre en cualquier orden, **Then** el dropdown de organización sigue mostrando "Org B" sin reset.
3. **Given** un dentista con una sola organización (caso monosite), **When** navega, **Then** el contexto funciona igual que hoy (sin regresión).

---

### User Story 2 - Contexto sobrevive refresh del browser (Priority: P2)

El dentista tiene "Org B" seleccionada, está en el medio de una tarea (ej. filtrando pacientes), y presiona F5 por cualquier razón (pestaña lenta, cambio de wifi, consulta de ficha técnica externa). Hoy el refresh resetea el contexto y vuelve al default (Org A o primera en la lista). El dentista pierde el filtro, pierde el scroll, y si estaba en medio de un flujo crítico, puede confundirse sobre qué clínica estaba operando.

**Why this priority**: es la segunda fuente de frustración pero menos frecuente que User Story 1 (refresh es ocasional; navegación es constante). Arreglar P1 sin P2 deja el gap parcialmente abierto. P2 porque cubre el 20% de casos restantes tras P1.

**Independent Test**: con "Org B" seleccionada, refrescar el browser → confirmar que tras el reload el dropdown sigue mostrando "Org B" y las queries filtran correctamente por esa organización.

**Acceptance Scenarios**:

1. **Given** "Org B" seleccionada en el dashboard, **When** el dentista presiona F5 o Cmd+R, **Then** post-reload el contexto sigue en "Org B".
2. **Given** F5 con un filtro activo (ej. `/patients?search=Danissa`), **When** recarga, **Then** el dashboard reconstruye "Org B" como contexto (el filtro de URL es preservado por React Router; el contexto de org por este fix).

---

### User Story 3 - Logout limpia la selección para evitar leak cross-user (Priority: P3)

Dos usuarios distintos usan la misma máquina (escenario realista en clínicas pequeñas o consultorios compartidos). User A (dentista de 2 clínicas) selecciona "Org X", hace logout. User B (dentista de 3 clínicas distintas, acceso distinto) logea. Si la selección "Org X" de User A persistiera en storage compartido, User B podría ver la selección "Org X" — organización a la que no tiene acceso. El sistema debería rechazar, pero es mala UX.

**Why this priority**: edge case de seguridad UX en máquinas compartidas. Poco frecuente pero importante por higiene. P3 porque el impacto real es menor (el sistema ya valida acceso a la org vía RLS y `organization_users`, así que un usuario sin acceso a "Org X" vería vacío, no data robada).

**Independent Test**: User A selecciona "Org X", logout. User B logea en la misma máquina. El dropdown muestra la **organización default de User B**, no "Org X" residual de User A.

**Acceptance Scenarios**:

1. **Given** User A con "Org X" seleccionada, **When** hace logout, **Then** el storage de selección queda limpio (verifiable por absent key).
2. **Given** post-logout de User A, **When** User B logea, **Then** el dropdown muestra su primera organización válida como default, sin rastro de "Org X".

---

### Edge Cases

- **User perdió acceso a la organización persistida entre sesiones** (ej. admin lo removió de "Org X" mientras estaba deslogueado): al re-loguear, intentar restaurar "Org X" → falla porque la org no está en `userOrgRoles`. **Fallback**: descartar selección persistida y usar primera organización disponible del usuario (no mostrar error; es comportamiento esperado).
- **User con 0 organizaciones** (caso edge, probable dentista nuevo sin onboarding completo): la lógica de restauración debe no-opear sin crashear. El dashboard maneja el caso "sin org" separadamente (fuera del scope de este spec).
- **Multi-tab**: dos tabs abiertos del dashboard. User cambia de org en tab 1. Tab 2 puede seguir mostrando la org anterior hasta que se refresque/navegue. Tradeoff conocido: la persistencia no sincroniza tabs en tiempo real. **Decisión**: aceptable trade-off si se elige storage que sí sincroniza (localStorage con event listener) vs solo persistencia simple (sessionStorage). Spec documenta la decisión en Phase 2.
- **Nueva pestaña del browser desde link del email**: el user click en un link → se abre tab nuevo → no hereda el estado in-memory. Decisión persistence ayuda acá si se elige `localStorage`. Si se elige `sessionStorage`, el link del email cae al default.
- **Browser en modo privado / sessionStorage denied**: el código debe no-crashear ni throw si storage está unavailable. Fallback: comportamiento actual (in-memory state sin persistencia), con `console.warn` para observabilidad.
- **Organización persistida coincide con la default del user**: no hay diferencia observable. Comportamiento igual con o sin fix.
- **User cambia de org explícitamente durante la sesión**: la nueva selección se persiste inmediatamente, sobrescribiendo la previa. Next refresh muestra la nueva.
- **Usuario en ruta pública** (`/blog`, `/legal/*`, `/therapists/:slug`): no consume OrganizationContext. La persistencia no interfiere.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE persistir la selección `currentOrganizationId` del usuario logueado entre navegaciones del dashboard. Tras seleccionar una organización, navegar a 3+ rutas distintas no DEBE cambiar la selección.
- **FR-002**: El sistema DEBE restaurar la organización persistida al inicializar el contexto tras refresh del browser, siempre que la organización siga siendo válida para el usuario (existe en `userOrgRoles`).
- **FR-003**: Si la organización persistida ya no es válida para el usuario (removido del role, org eliminada), el sistema DEBE descartar el valor persistido y usar la primera organización disponible como default, sin mostrar error visible al usuario.
- **FR-004**: El sistema DEBE limpiar la selección persistida al logout del usuario actual, para prevenir filtración de contexto entre sesiones distintas en la misma máquina.
- **FR-005**: La persistencia DEBE funcionar sin throw ni crash si el medio de storage está unavailable (ej. modo privado, storage quota full, browser blocks). Fallback: comportamiento actual (in-memory).
- **FR-006**: Phase 1 del spec DEBE auditar el estado actual del `OrganizationContext.jsx` y el hook `useCurrentOrganization` antes de diseñar el fix (patrón `docs/PATTERNS.md §4`). Output: inventario de callsites + escenarios de pérdida reproducidos + storage actual si existe.
- **FR-007**: Phase 2 del spec DEBE documentar 3 decisiones de diseño explícitas **antes** de escribir código:
  - **Decisión A — Tipo de storage**: `sessionStorage` (limpia al cerrar tab, no sincroniza tabs) vs `localStorage` (persiste cross-sessions, sincroniza tabs con event listener). Trade-offs documentados.
  - **Decisión B — Momento de restauración**: en el init del Provider, en el `useEffect` on mount, o ambos. Confirmar que no introduce flicker de org equivocada.
  - **Decisión C — Fallback si org persistida inválida**: silent discard + default (recomendación P1) vs notificar al user ("Tu organización anterior ya no está disponible").
- **FR-008**: Phase 3 del spec DEBE modificar **máximo 2 archivos** (probablemente `src/contexts/OrganizationContext.jsx` + un hook de cleanup en logout flow). Si el fix requiere >2 archivos, pausar y re-evaluar scope.
- **FR-009**: El spec NO DEBE modificar otros contexts (`AuthContext`), ni routers, ni RLS policies, ni migrations. Scope es UX de persistencia de 1 valor.
- **FR-010**: Phase 4 DEBE verificar manualmente los 3 escenarios del audit (pre-fix rompe → post-fix pasa) + multi-tab test (2 tabs: cambio en tab 1 → refresh en tab 2 → refleja el cambio, o documentar tradeoff si se eligió storage que no sincroniza).

### Key Entities *(include if feature involves data)*

- **`OrganizationContext`**: React Context que expone `currentOrganizationId`, `currentOrganization`, `userOrgRoles`, y el setter `setCurrentOrganization`. Scoped a `DashboardLayout` per decisión arquitectural documentada.
- **`useCurrentOrganization`**: hook de consumo. Tiene try/catch para rutas públicas que no tienen el provider montado.
- **`currentOrganizationId`**: UUID de la organización seleccionada por el usuario en sesión. Valor a persistir.
- **`userOrgRoles`**: array de `{organization_id, role}` derivado de `organization_users` table. Fuente de verdad para validar si una org persistida sigue siendo accesible para el user.
- **Storage medium** (a decidir Phase 2): sessionStorage o localStorage del browser.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Post-fix, un dentista con 2+ organizaciones que selecciona "Org B" y navega a 3 rutas distintas del dashboard sigue viendo "Org B" en el dropdown en las 3 rutas (diferencia vs pre-fix: 100% de casos — antes era 0%).
- **SC-002**: Post-fix, un refresh del browser (F5) preserva la selección de org. Test manual: seleccionar "Org B" → F5 → dropdown sigue "Org B".
- **SC-003**: Post-fix, logout + login del mismo user con selección previa → la selección previa se respeta (consistente con P2). Pero logout + login de un **user distinto** → el nuevo user ve su default, sin rastro del previo (P3).
- **SC-004**: Post-fix, en modo privado del browser (sessionStorage puede estar disabled o fallar), el dashboard sigue funcionando sin throw — se pierde la persistencia pero no crash.
- **SC-005**: `npm run lint` post-fix termina sin errores nuevos atribuibles al cambio (conteo ≤ baseline pre-fix).
- **SC-006**: `npm run build` post-fix termina con exit 0.
- **SC-007**: 0 regresiones en rutas públicas (`/blog`, `/therapists/:slug`, landing) — el hook con try/catch sigue manejando el caso "sin provider". Validado navegando a al menos 2 rutas públicas post-fix sin errores.
- **SC-008**: En los 7 días post-deploy, el número de reportes de "perdí mi organización" atribuibles a este gap es 0 (métrica blanda — ausencia de reportes + feedback del equipo clínico).

## Assumptions

- El `OrganizationContext.jsx` actual vive en `src/contexts/` o equivalente (a confirmar en Phase 1 audit).
- El logout flow vive en `AuthContext` o un hook dedicado `useLogout`. El fix NO modifica el AuthContext pero sí agrega un hook/handler coordinado con el logout (punto a confirmar Phase 2 cuando se decida Decisión B).
- `userOrgRoles` está disponible en el momento de restaurar la org persistida (el Provider primero obtiene roles del usuario, después restaura selección validando).
- El browser del usuario soporta `sessionStorage` y `localStorage` (standard web, soportado >97% browsers según caniuse). Modo privado puede bloquear uno u otro — FR-005 cubre este edge case.
- El deploy lo hace Danissa. Test manual en browser lo hace Danissa en entorno local (`npm run dev`) + opcional sobre producción post-merge.
- No hay test automatizado de Vitest / Playwright en este spec — el test es manual dado que hoy el repo no tiene framework de UI tests configurado (deuda conocida).

## Rollback Plan

### Abort triggers post-deploy

Se dispara rollback si:

1. **Dashboard crashea post-fix** (React error boundary aparece o pantalla blanca) al iniciar sesión en cualquier rol que use el OrganizationProvider. Señal: nuevos errores en consola atribuibles a `OrganizationContext.jsx` o al hook de restauración.
2. **El problema original persiste**: seleccionar "Org B" → navegar/refresh → contexto vuelve a "Org A" (fix no funciona o fue parcial).
3. **Multi-tab roto críticamente**: si la decisión Phase 2 fue "localStorage con sync", y el sync falla causando que cambios en tab 1 corrompan tab 2 (ej. eventos en loop infinito). Si se eligió sessionStorage (sin sync multi-tab), este trigger no aplica.

### Protocolo de rollback

1. **Stop** — no más commits.
2. **`git revert <commit-merge-013>`** para retirar el fix del historial.
3. **Notificar** a Danissa con:
   - Trigger disparado (1, 2, o 3).
   - Output literal del error o descripción del comportamiento.
   - Hipótesis de root cause.
4. **Abrir spec 013.1** con scope ajustado: si el trigger fue tipo 3 (multi-tab), probablemente la decisión A (storage type) necesita revisarse. Si fue tipo 1-2, probablemente la decisión B (momento de restauración) tiene un flicker/race condition.

### Non-rollback triggers (documentar pero NO abortar)

- **Multi-tab no sincroniza en tiempo real** pero los tabs individuales funcionan correctamente (acepted tradeoff si se eligió sessionStorage). Documentar como follow-up candidato si aparece como pain point real post-deploy.
- **Flash/flicker de 100-300ms al iniciar sesión** donde se ve brevemente la default antes de restaurar la persistida (aceptable si es sub-perceptual; si >500ms, spec 013.1 para optimizar).
- **El fix no aplica en modo privado** (sessionStorage blocked) — documentado como edge case en FR-005, no falla, solo no persiste (comportamiento pre-fix).

## Scope Bounds

- **Archivos autorizados a modificar**: máximo **2 archivos** por FR-008. Candidatos (a confirmar en Phase 1):
  - `src/contexts/OrganizationContext.jsx` (o path real que Phase 1 confirme).
  - Un segundo archivo si hace falta para el cleanup en logout (ej. `src/contexts/AuthContext.jsx` o un hook dedicado — **preferible evitar tocar AuthContext**; si se puede hacer todo dentro del OrganizationContext mediante `useEffect` watching `user?.id`, queda en 1 solo archivo).
- **Archivos NO autorizados**:
  - Routers (`src/app/AppRouter.jsx`, `src/app/routers/*`).
  - Otras configuraciones de context.
  - `supabase/**`, `src/types/database.ts`.
  - Cualquier feature específica (`src/features/*`).
- **Si Phase 1 revela que el fix requiere tocar routers o un 3er archivo**: STOP → reportar → decidir con Danissa si se amplía el scope explícitamente o se divide en spec hermano.
- **Fuera de alcance explícito**:
  - Cambiar el rol del OrganizationContext (seguir siendo scoped a DashboardLayout, no root).
  - Agregar multi-tab sync si se eligió sessionStorage (aceptado tradeoff).
  - Agregar UI indicators ("restauraste tu org de la sesión anterior"). La restauración es silenciosa.
  - Refactor de `useCurrentOrganization` más allá de lo estrictamente necesario.
