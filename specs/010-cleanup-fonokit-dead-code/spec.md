# Feature Specification: Cleanup FonoKit Dead Code

**Feature Branch**: `010-cleanup-fonokit-dead-code`
**Created**: 2026-04-20
**Status**: Draft
**Input**: User description: "cleanup-fonokit-dead-code — 2 items confirmados como dead code heredados de FonoKit (voice-visualizer feature + app/providers+App.jsx huérfanos)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un desarrollador nuevo explora el repo sin encontrar código heredado irrelevante (Priority: P1)

Un desarrollador nuevo (o el mismo equipo leyendo el repo meses después) abre `src/features/` o `src/app/` buscando entender la arquitectura. Hoy se encuentra con `voice-visualizer/` (componentes de visualización de voz — patrón de FonoKit, no tiene sentido en un producto dental) y con `src/app/App.jsx` + `src/app/providers.jsx` (archivos huérfanos que el `main.jsx` no usa). La primera reacción es "¿esto se usa? ¿por qué está acá?", lo que genera minutos de pesquisa para confirmar que es muerto. Ese tiempo se pierde en cada onboarding y en cada revisión de arquitectura.

**Why this priority**: El costo acumulado de confusión en cada lectura del repo. El valor es inmediato — el primer dev que lea el repo post-cleanup no pierde esos minutos. Es P1 porque es la razón principal de hacer el spec; sin esto, el spec no vale la pena.

**Independent Test**: un dev que no conoce el historial ingresa al repo post-deploy y no encuentra `src/features/voice-visualizer/`, `src/pages/VoiceVisualizerPage.jsx`, ni los dos archivos huérfanos en `src/app/`. Tampoco encuentra `VOICE_VISUALIZER` en `src/constants/featureFlags.js`. El dev puede confirmar visualmente que el repo está limpio de residuos de FonoKit en los 2 items tratados.

**Acceptance Scenarios**:

1. **Given** el repo post-deploy, **When** un dev ejecuta `ls src/features/voice-visualizer`, **Then** el comando falla con "no such file or directory".
2. **Given** el repo post-deploy, **When** un dev abre `src/app/` en el editor, **Then** no ve ni `App.jsx` ni `providers.jsx` — solo ve `routers/` y otros directorios vivos.
3. **Given** el repo post-deploy, **When** un dev busca `VOICE_VISUALIZER` con grep en `src/`, **Then** 0 matches.

---

### User Story 2 - El bundle de producción no carga código muerto (Priority: P2)

Aunque el feature flag `VOICE_VISUALIZER: false` impide que la UI muestre la ruta, los archivos del feature pueden ser parseados por el bundler en tiempo de build (tree-shaking imperfecto según cómo estén importados). Post-cleanup, el bundler no ve esos archivos y el bundle resultante es levemente más pequeño.

**Why this priority**: ahorro marginal de KB en el bundle. No es la razón principal del spec pero es un beneficio real medible y gratis una vez hecho P1.

**Independent Test**: comparar `npm run build` output pre y post-cleanup en el mismo commit base. Tamaño de `dist/assets/index-*.js` debe disminuir o mantenerse igual (nunca aumentar). No se exige un umbral específico — se toma como confirmación de "no regresión en bundle size".

**Acceptance Scenarios**:

1. **Given** build pre-cleanup y build post-cleanup del mismo código base salvo el delete, **When** se compara el tamaño total de `dist/`, **Then** el post es ≤ al pre.

---

### User Story 3 - Alinear identidad de producto con el dominio dental (Priority: P3)

`voice-visualizer` es visualización de audio/voz — patrón de FonoKit (fonoaudiología). En un repo que se llama DentalSpot y cuyo dominio es odontología, tener código de visualización de voz es ruido identitario. Post-cleanup, el catálogo de features refleja fielmente el dominio del producto.

**Why this priority**: cosmético a nivel codebase. No afecta funcionalidad ni performance más allá de P2. P3 porque es consecuencia natural de P1 y P2, no una razón propia de hacer el trabajo.

**Independent Test**: `ls src/features/` muestra solo directorios con nombres coherentes con el dominio dental (no debería aparecer `voice-visualizer`).

---

### Edge Cases

- **Tests o stories dentro de `voice-visualizer/`**: el directorio se borra recursivamente. Cualquier test unitario colocado ahí desaparece junto con el código que testeaba. Aceptable — no hay tests activos referenciando nada fuera del directorio.
- **Types generados en `src/types/database.ts` con tablas que solo usaba voice-visualizer**: FUERA DE SCOPE. No se toca el generated types file. Si hubiera tablas exclusivas de voice-visualizer (improbable porque el feature es cliente-only), su inclusión en types es inocua post-delete.
- **Import de `src/app/App.jsx` o `src/app/providers.jsx` desde un archivo no-listado**: Phase 1 grep tiene que detectar esto. Si aparece → **STOP & report** (FR-003). El spec no intenta fixear; se defiere.
- **Referencia a `VoiceVisualizerPage` en comentarios o docs** (no imports funcionales): Phase 1 grep lo detecta. Decisión: si es solo un comentario histórico (no compila ni corre), se puede eliminar como parte del cleanup del archivo que lo contenga si está listado. Si está en un archivo NO listado, se defiere.
- **Ruta en `DashboardRouter.jsx:192` que apunte a un componente lazy-loaded**: el delete del archivo `VoiceVisualizerPage.jsx` requiere que el router no siga importando al componente. Phase 2 edita el router tanto para remover el bloque condicional como para remover el import (si existe). Phase 3 `npm run build` es la validación final de que no quedaron imports colgados.
- **Feature flag `VOICE_VISUALIZER` referenciado en tests de configuración**: improbable en DentalSpot (no hay Vitest). Phase 1 grep lo captura; si aparece en un test, se elimina junto con la entrada del objeto.
- **Otros feature flags en `false`** (`PIE_ESCOLAR`, `ADOS2`, `ADIR`, `TEA`, `SENSORIAL_PROFILE`, `EDUCATOR`): **EXPLÍCITAMENTE FUERA DE SCOPE**. Aunque algunos también huelen a dead code, cada uno necesita su propio audit (pueden tener callsites activos via feature flag en tooling o ser re-activados más tarde). Spec futura dedicada si se confirman muertos.
- **`src/features/fonoaudiologo/`**: NO se toca. Audit previo confirmó imports activos en `DashboardRouter.jsx` y `EarningsTab`. Es feature viva.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ejecutar un audit defensivo previo a cualquier delete, con 2 greps mínimos sobre todo el directorio `src/`:
  - (a) Callsites de `voice-visualizer`, `VoiceVisualizerPage`, `VOICE_VISUALIZER` — confirmar que los únicos matches son los archivos/líneas listados en el spec.
  - (b) Imports desde `src/app/App.jsx` o `src/app/providers.jsx` — confirmar 0 imports externos (solo el import interno de `App.jsx → providers.jsx` es aceptable; `main.jsx` en raíz NO debe importar `src/app/App.jsx`).
- **FR-002**: El audit DEBE documentar el output del grep en `data-model.md §Phase 1 audit` antes de cualquier delete, para tener registro archivable.
- **FR-003**: Si el audit revela un callsite NO documentado en el spec (ej. import de `App.jsx` desde un archivo no esperado, o referencia activa a `VOICE_VISUALIZER` en otro módulo), el sistema DEBE detener la ejecución y reportar. NO se procede con delete hasta decidir si se expande scope o se defiere.
- **FR-004**: Phase 2 DEBE eliminar **solo los 7 targets listados**, ni más ni menos:
  - `src/features/voice-visualizer/` (directorio recursivo — 5 archivos reportados por architecture.md).
  - `src/pages/VoiceVisualizerPage.jsx` (archivo único).
  - `src/app/providers.jsx` (archivo único, 31 líneas).
  - `src/app/App.jsx` (archivo único).
  - `src/app/routers/DashboardRouter.jsx`: editar para remover el bloque condicional envuelto en `FEATURE_FLAGS.VOICE_VISUALIZER && ...` (aprox línea 192) + remover el `import` de `VoiceVisualizerPage` si existe en este archivo.
  - `src/constants/featureFlags.js`: editar para remover la entrada `VOICE_VISUALIZER: false` + cualquier comentario asociado específico a voice-visualizer.
- **FR-005**: Phase 2 NO DEBE modificar ningún otro archivo del repo. En particular, NO tocar:
  - Otros feature flags (`PIE_ESCOLAR`, `ADOS2`, `ADIR`, `TEA`, `SENSORIAL_PROFILE`, `EDUCATOR`) aunque estén en `false`.
  - `src/features/fonoaudiologo/`.
  - `src/types/database.ts` (generated types).
  - `supabase/migrations/` o `supabase/policies.sql`.
  - Tests, `CLAUDE.md`, `.specify/memory/`.
- **FR-006**: Phase 3 DEBE ejecutar `npm run lint` y `npm run build`, y ambos DEBEN completar sin errores nuevos introducidos por el delete (0 `broken import`, 0 `module not found`).
- **FR-007**: Si Phase 3 detecta cualquier error de build o lint atribuible al delete, el sistema DEBE revertir el commit de Phase 2 (`git revert`) y reportar. No se intenta fix-forward sin re-evaluar.
- **FR-008**: El spec NO DEBE modificar runtime behavior visible al usuario final. El feature flag estaba en `false` → la ruta nunca se renderizaba → ningún usuario ve diferencia. Validable observando que ninguna página funcional cambia.

### Key Entities *(include if feature involves data)*

Este spec no toca datos persistidos ni entidades de dominio. Las "entidades" tratadas son archivos y configuración del codebase:

- **`src/features/voice-visualizer/`**: directorio completo a eliminar, 5 archivos reportados.
- **`src/pages/VoiceVisualizerPage.jsx`**: página standalone a eliminar.
- **`src/app/App.jsx` + `src/app/providers.jsx`**: par de archivos huérfanos a eliminar.
- **`src/app/routers/DashboardRouter.jsx`**: archivo a editar (remover bloque + import).
- **`src/constants/featureFlags.js`**: archivo a editar (remover entrada).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Post-cleanup, los 4 deletes y 2 edits se completan con resultado verificable por `git diff --stat` (exactamente 4 archivos eliminados más 2 archivos modificados).
- **SC-002**: `npm run lint` post-cleanup termina sin errores NUEVOS atribuibles al cambio. Errores pre-existentes no introducidos por este spec son aceptables siempre que no cambie su conteo.
- **SC-003**: `npm run build` post-cleanup termina con exit code 0 y genera un bundle funcional en `dist/`.
- **SC-004**: Tamaño de `dist/` post-cleanup ≤ tamaño pre-cleanup (SC para P2).
- **SC-005**: `grep -rn "voice-visualizer\|VoiceVisualizerPage\|VOICE_VISUALIZER" src/` post-cleanup retorna **0 matches**.
- **SC-006**: `grep -rn "from.*src/app/App\|from.*app/App\.jsx\|from.*app/providers" src/` post-cleanup retorna **0 matches**.
- **SC-007**: La aplicación web carga sin crashes en `/dashboard/therapist` post-deploy (smoke manual opcional — el P2 lint+build ya da la mayor confianza para un cleanup sin runtime change).
- **SC-008**: 0 regresiones funcionales reportadas por usuarios en los 7 días post-deploy (métrica pasiva — el spec no introduce behavior change por diseño).

## Assumptions

- Los 7 targets de FR-004 son la lista completa. Phase 1 audit lo confirma; si aparecen callsites adicionales → FR-003 dispara stop.
- El import de `src/app/App.jsx → src/app/providers.jsx` es interno y se resuelve automáticamente al eliminar ambos archivos. No hay otro consumidor de `providers.jsx`.
- `main.jsx` (en raíz del `src/`) usa `src/App.jsx` (raíz), NO `src/app/App.jsx`. Esto es confirmado por architecture.md y verificable con `grep -n "App" src/main.jsx`.
- `DashboardRouter.jsx:192` es la única ruta que referencia `VoiceVisualizerPage`. Phase 1 grep lo confirma; si aparecen más routers → FR-003 dispara.
- El tiempo real del spec debería ser 30-45 min (10 audit + 10 delete + 10-15 verify + 5 commit).
- El deploy lo hace Danissa (founder) tras merge a main. El ejecutor (Claude) hace el trabajo local y deja el commit listo.
- No hay integración con features externas (ej. CI que mencione `voice-visualizer`) que requiera actualización en este spec. El repo no tiene CI/CD automatizado configurado hoy.

## Scope Bounds

- **Archivos autorizados a eliminar**:
  - `src/features/voice-visualizer/` (recursivo).
  - `src/pages/VoiceVisualizerPage.jsx`.
  - `src/app/providers.jsx`.
  - `src/app/App.jsx`.
- **Archivos autorizados a editar**:
  - `src/app/routers/DashboardRouter.jsx` (remover bloque + import).
  - `src/constants/featureFlags.js` (remover entrada + comentario asociado).
- **Archivos NO autorizados a modificar** — cualquier cambio aquí dispara FR-003 / FR-005:
  - Todo `src/` fuera de los 6 archivos listados.
  - `src/features/fonoaudiologo/` (feature viva, tiene consumers activos).
  - `src/types/database.ts`.
  - `supabase/**`.
  - Cualquier archivo de `.specify/memory/`, `docs/`, `CLAUDE.md`, `package.json`, `vite.config.js`, `eslint.config.mjs`, etc.
- **Si Phase 1 revela que un archivo fuera de la lista consume el código a eliminar**: STOP → reportar → decidir con Danissa si se amplía scope (1 archivo extra manageable) o se defiere a spec 010.1.
- **Si se detectan otros feature flags que parecen muertos**: documentar como hallazgo en `data-model.md §Hallazgos laterales`, pero **NO tocar**. Spec futura dedicada.

## Rollback Plan

Este spec es una operación simple de `delete + edit + commit` sin data mutations. El rollback es proporcionalmente simple.

### Abort triggers post-Phase 2

Se dispara rollback si se observa CUALQUIERA de:

1. `npm run lint` introduce errores nuevos atribuibles al cambio (no solo warnings; errores que bloqueen CI).
2. `npm run build` falla con error relacionado a los archivos eliminados (módulo no encontrado, import roto).
3. Smoke manual (opcional) muestra crash al cargar `/dashboard/therapist`, `/dashboard/patient`, o `/dashboard/profile`.

### Protocolo de rollback

1. **Stop** — no más cambios.
2. **`git revert <commit-de-Phase-2>`** — restaura los 6 archivos al estado pre-spec.
3. **Notificar** a Danissa con:
   - Trigger disparado (#1, #2, o #3).
   - Output literal del error (lint, build, o consola browser).
   - Hipótesis de root cause.
4. **Re-abrir análisis**: el error probablemente indica un callsite que Phase 1 grep no capturó. Actualizar FR-003 o Assumptions del spec y re-ejecutar desde Phase 1 con el gap cubierto.
5. **Si el error es menor y resoluble <10 min** (ej. un comentario huérfano que rompe lint), puede considerarse fix-forward en lugar de revert — pero requiere consulta explícita con Danissa antes.

### Non-rollback triggers (documentar pero NO abortar)

- Warnings de lint no-bloqueantes (ej. variable no usada en archivo editado, exhaustive-deps fuera del scope del spec).
- Cambio de tamaño de bundle que sube levemente por artifact del bundler (improbable, pero si pasa y los demás checks pasan, no abortar).
- Chunks no reorganizados por el bundler (cosmético).
