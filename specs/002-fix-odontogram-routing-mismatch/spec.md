# Feature Specification: Fix — Odontogram Routing Mismatch (callsites alignment)

**Feature Branch**: `002-fix-odontogram-routing-mismatch`
**Created**: 2026-04-19
**Status**: Draft — upstream blocker of spec 001
**Input**: User description: "mismatch entre rutas registradas del módulo Odontograma y callsites que navegan a él — actualizar 7 callsites en 4 archivos al prefijo `therapist/` (enfoque A2). Las rutas están registradas bajo `<Route path="therapist">` en `DashboardRouter.jsx:123-206`, pero Sidebar y 6 navigates apuntan a `/dashboard/odontograma/*` sin el prefijo, cayendo en NotFoundPage. Spec 001 está pausada hasta que 002 cierre."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Dentista accede al módulo Odontograma desde la UI sin 404 (Priority: P1)

El dentista autenticado puede llegar al listado de evaluaciones de odontograma haciendo click en el menú lateral "Odontograma", sin ver la página 404.

**Why this priority**: sin este camino, el módulo Odontograma entero es inalcanzable desde la UI estándar. El dentista tiene dos vías legítimas (sidebar + botón "Nueva Evaluación" desde ficha), y ambas están rotas hoy. Este bug bloquea todo el resto del módulo y bloquea spec 001 (el fix del audit log) porque no se puede validar un hook en una página que nunca se monta.

**Independent Test**: con una cuenta `therapist` en staging o producción, click en el ítem "Odontograma" del Sidebar debe mostrar el listado de evaluaciones (`OdontogramListPage`), no la página 404.

**Acceptance Scenarios**:

1. **Given** un dentista autenticado viendo el Dashboard, **When** hace click en "Odontograma" del menú lateral, **Then** la URL del browser es `/dashboard/therapist/odontograma`, se renderiza el listado de evaluaciones (título "Evaluaciones Odontológicas"), y no aparece el mensaje de NotFoundPage.
2. **Given** el dentista en el listado de evaluaciones, **When** hace click en "Nueva Evaluación" (botón superior derecho), **Then** navega a `/dashboard/therapist/odontograma/nueva` y se renderiza el formulario de Step 1 (Configuración), sin 404.
3. **Given** un dentista en la ficha de un paciente (`PatientFilePage`), **When** hace click en "Nueva Evaluación" del tab Odontograma, **Then** navega a `/dashboard/therapist/odontograma/nueva?patient=<id>` con el `patient` query param preservado, y el formulario de Step 1 se abre sin 404.

---

### User Story 2 — Dentista re-abre y navega entre evaluaciones existentes sin 404 (Priority: P2)

El dentista puede abrir una evaluación ya creada desde el listado y volver al listado desde la vista de detalle, sin ver 404 en ningún punto del flujo.

**Why this priority**: es la continuidad del flujo principal. Si el listado funciona pero los items no se abren, o si el botón "volver" rompe la navegación, el dentista no puede operar el módulo. Es independiente de US1 porque asume que el listado ya fue alcanzado, y cubre los callsites de "abrir detalle" + "volver al listado".

**Independent Test**: con una evaluación pre-existente visible en el listado, click en el item lleva al detalle sin 404; desde el detalle, el botón "Volver" regresa al listado sin 404.

**Acceptance Scenarios**:

1. **Given** el dentista en `/dashboard/therapist/odontograma` con al menos una evaluación listada, **When** hace click en el botón de ver/abrir item, **Then** navega a `/dashboard/therapist/odontograma/<uuid>` y se renderiza `OdontogramEvaluationPage` en el step correspondiente al estado de la evaluación (borrador → Step 2, completada → Step 3).
2. **Given** el dentista dentro de una evaluación (`/dashboard/therapist/odontograma/<uuid>`), **When** hace click en el botón "Volver" (arriba a la izquierda), **Then** navega a `/dashboard/therapist/odontograma` (el listado), sin 404.
3. **Given** el dentista editando una evaluación inexistente (id inválido que fetch rechaza), **When** el componente ejecuta `navigate('/dashboard/therapist/odontograma')` como fallback, **Then** el listado se renderiza sin 404.

---

### Edge Cases

- **Botón atrás del browser tras alcanzar el listado**: una vez arreglados los callsites, el historial del navegador tendrá entradas válidas (`/dashboard/therapist/odontograma/...`) y el atrás/adelante del navegador debe funcionar naturalmente. No requiere requisito específico — se deriva del comportamiento normal de React Router una vez que las rutas matcheen.
- **`window.history.replaceState` en `OdontogramEvaluationPage.jsx:176`** sigue usando el path sin prefijo. Esta spec **NO** lo corrige — queda para spec 001 (paused) que reemplaza `replaceState` por `navigate` con el path correcto. Durante esta spec 002, el `replaceState` seguirá escribiendo `/dashboard/odontograma/<uuid>` al `window.location` sin pasar por React Router — comportamiento silencioso actual que no produce 404 visible. Convivencia temporal aceptada por Constitution IV (micro-bloques).
- **Otros módulos bajo el bloque `therapist`** (notiz, create-template, questions, pie, ados2, tea, adir, sensorial) ya usan el prefijo correcto; esta spec no los toca y deben seguir funcionando.
- **Sidebar para roles no-therapist** (patient, clinic, assistant): sus items en el Sidebar ya usan sus prefijos correctos (`/dashboard/patient/...`, `/dashboard/clinic/...`); no se tocan en esta spec.
- **Links externos/emails apuntando al path antiguo**: si existe algún link externo hacia `/dashboard/odontograma/*`, seguirá dando 404. Fuera de scope — no hay evidencia actual de tales links y corregir eso implicaría redirect rules (otro bloque).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST aceptar navegación hacia `/dashboard/therapist/odontograma` desde el Sidebar sin renderizar 404.
- **FR-002**: El sistema MUST aceptar navegación hacia `/dashboard/therapist/odontograma/nueva` (con y sin query param `patient`) desde `PatientFilePage` y desde `OdontogramListPage` sin renderizar 404.
- **FR-003**: El sistema MUST aceptar navegación hacia `/dashboard/therapist/odontograma/<uuid>` desde `OdontogramListPage` (click en item) sin renderizar 404.
- **FR-004**: El sistema MUST aceptar navegación hacia `/dashboard/therapist/odontograma` desde `OdontogramEvaluationPage` (botones "Volver" y fallback de error) sin renderizar 404.
- **FR-005**: El fix MUST limitarse a los 7 callsites enumerados en el input, distribuidos en 4 archivos: `src/components/layout/Sidebar.jsx` (1), `src/pages/therapist/PatientFilePage.jsx` (1), `src/features/odontogram/pages/OdontogramListPage.jsx` (3), `src/features/odontogram/pages/OdontogramEvaluationPage.jsx` (2 — líneas 112 y 346; **la línea 176 NO entra**).
- **FR-006**: El sistema MUST NO modificar las rutas registradas en `DashboardRouter.jsx` (líneas 154–156). El router es la fuente de verdad y expresa correctamente que Odontograma es un módulo del rol THERAPIST.
- **FR-007**: El sistema MUST NO introducir regresiones en los módulos bajo `<Route path="therapist">` que ya navegan correctamente (notiz, create-template, questions, pie, ados2, tea, adir, sensorial, voice-visualizer). Ningún archivo fuera de los 4 enumerados es tocado por esta spec.
- **FR-008**: El query string (`?patient=<id>`) MUST preservarse en la navegación desde `PatientFilePage` hacia el formulario de creación. El único cambio en ese callsite es el prefijo del path, no la estructura de la URL.
- **FR-009**: La línea 176 de `OdontogramEvaluationPage.jsx` (el `window.history.replaceState` del flujo post-creación) MUST permanecer sin cambios — pertenece a spec 001 (paused), que resolverá el acoplamiento entre ese método y React Router.

### Key Entities

Esta spec no introduce ni modifica entidades de datos. Opera exclusivamente sobre strings de path en callsites de navegación del frontend.

- **Callsite de navegación**: invocación de `navigate(...)` o `Link`/`path` en un componente/config que dispara cambio de URL. Esta spec corrige 7 callsites.
- **Ruta registrada**: entrada `<Route path=...>` en `DashboardRouter.jsx` que matchea una URL y renderiza un componente. Esta spec NO modifica ninguna ruta registrada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% de los 7 flujos de acceso al módulo Odontograma (Sidebar click, Nueva Evaluación desde listado, Nueva Evaluación desde ficha, abrir item del listado × 2, volver al listado × 2) llegan a su pantalla esperada sin renderizar NotFoundPage, verificado en recorrido manual del dentista en staging.
- **SC-002**: 0 regresiones observables en los módulos hermanos bajo `<Route path="therapist">` tras el cambio (notiz, create-template, questions, pie, ados2, tea, adir, sensorial, voice-visualizer). Validado entrando a al menos 2 de esos módulos durante el test manual.
- **SC-003**: El query param `patient` MUST preservarse en el 100% de los casos donde el path original lo contiene (FR-008). Verificado leyendo `useSearchParams` o `useParams` en la página destino.
- **SC-004**: `grep -rn "/dashboard/odontograma" src/` tras el fix devuelve exactamente 1 resultado — la línea 176 de `OdontogramEvaluationPage.jsx` (explícitamente fuera de scope por FR-009). Todos los demás callsites usan el prefijo `/dashboard/therapist/odontograma`.
- **SC-005**: 0 nuevos warnings de ESLint en los 4 archivos modificados comparado con el baseline pre-fix. 0 errores de `npm run build` tras el cambio.

## Assumptions

- El rol `therapist` (cuenta `dentalspot.cl@gmail.com`, `user_id 4e55fb74-b3b5-4233-9b5d-88d7a01a9046`) tiene acceso efectivo a rutas bajo `<Route path="therapist">` gracias al `RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}` ya presente en cada `<Route>` de odontograma.
- La constante `USER_ROLES.THERAPIST` coincide con el rol efectivo del usuario de prueba — confirmable en `src/constants/roles.js` (out of scope; solo se lee si hace falta para el test manual).
- Todos los 7 callsites del input se encuentran en las líneas indicadas de la tabla. Si durante la implementación alguna línea no coincide (refactor reciente), `/speckit-plan` lo reporta antes de tocar código.
- El módulo Odontograma **ya estaba 404 antes** del fix del spec 001 — la presente spec es independiente cronológicamente y su resolución habilita que el módulo sea funcional por primera vez desde la UI estándar.
- No existe redirect/rewrite externo (Vercel, Cloudflare, etc.) que mapee `/dashboard/odontograma/*` → `/dashboard/therapist/odontograma/*` en producción. Si existiera, este fix seguiría siendo correcto (la fuente de verdad es el router SPA y los callsites deben alinearse con él).

## Out of Scope

Enumeración explícita por Constitution IV (Micro-Bloques):

- **Línea 176 de `OdontogramEvaluationPage.jsx`** — el `window.history.replaceState`. Pertenece a spec 001. Esta spec NO la toca.
- Mover las rutas de odontograma fuera de `<Route path="therapist">` (enfoque A1 — rechazado por consistencia arquitectónica).
- Cambios a `DashboardRouter.jsx` (rutas registradas son la fuente de verdad y están correctas).
- Cambios a `src/lib/audit/*` y al logger clínico.
- Cambios a migraciones, policies RLS, edge functions.
- Refactor del módulo Odontograma más allá de los 2 callsites en `OdontogramEvaluationPage.jsx` (líneas 112 y 346).
- Redirects de `/dashboard/odontograma/*` → `/dashboard/therapist/odontograma/*` (tanto a nivel router SPA con `<Route path="odontograma" element={<Navigate ... />}`  como a nivel hosting).
- Actualización de los 4 docs fundacionales (`constitution.md`, `architecture.md`, `ecosystem-communicare.md`, `data-compliance.md`) y de `CLAUDE.md` — se mantiene como micro-bloque futuro ("docs-schema-drift-correction" u otro).
- Commits/push — los hace Danissa tras aprobar el test manual.

## Compliance Alignment

- **Constitution I (Compliance-First)**: habilitar el acceso efectivo al módulo Odontograma es un paso indirecto pero necesario para que el audit log empiece a recibir entradas y así cumplir Ley 21.719 (derecho ARCO). Sin esta spec, el audit está intacto pero no recibe tráfico real.
- **Constitution IV (Micro-Bloques)**: scope cerrado a 7 callsites en 4 archivos. Lo no tocado está enumerado explícitamente. Reporte post-implementación obligatorio.
- **Constitution VI (Schema Drift Zero)**: las rutas registradas ya son correctas en el router; el drift está en los callsites, no en el schema del router. Esta spec NO introduce drift nuevo, lo resuelve.

## Relationship with Spec 001

Esta spec es el **bloqueador upstream** declarado en el bloque PAUSED de `specs/001-fix-odontogram-audit-log/spec.md`. Al cerrarse 002:

1. Los 7 callsites usan el prefijo correcto `/dashboard/therapist/odontograma`.
2. El módulo Odontograma se vuelve alcanzable desde la UI estándar por primera vez.
3. El componente `OdontogramEvaluationPage` queda efectivamente montado al crear/abrir evaluaciones, lo que permite que el hook `useClinicalAccessLogger` pueda disparar (condicionado al fix pendiente del spec 001 sobre `replaceState`).
4. Spec 001 se reanuda con ajuste mínimo: reemplazar `replaceState` por `navigate('/dashboard/therapist/odontograma/${data.id}', { replace: true })` — path con prefijo. El resto del plan, tasks, y criterios de test manual de spec 001 permanecen válidos.

## References

- `.specify/memory/constitution.md` — Principios IV (Micro-Bloques), VI (Schema Drift Zero).
- `.specify/memory/architecture.md` — Sección "Router" + "Technical debt inventory" (la duplicación pages/features está registrada allí, este routing mismatch es una cicatriz relacionada).
- `specs/001-fix-odontogram-audit-log/spec.md` — bloque PAUSED con trazabilidad completa del descubrimiento.
- `Dentalspot_Estado_y_Roadmap.pdf` (18-abril-2026) — entrada original "Routing roto del módulo Odontograma: /dashboard/odontograma da 404".
- Investigación read-only de routing (2026-04-19) — sesión del asesor que confirmó el mismatch con evidencia citada de `DashboardRouter.jsx` + Sidebar + 7 callsites.
