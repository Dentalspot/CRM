# Feature Specification: Restore Marketplace Purchases RLS Policies

**Feature Branch**: `009-restore-marketplace-purchases-policies`
**Created**: 2026-04-20
**Status**: Draft
**Input**: User description: "restore-marketplace-purchases-policies — RLS coverage audit detectó `marketplace_purchases` con rowsecurity=DISABLED y 2 de 3 policies históricas dropeadas; spec 006 difirió porque enable RLS con solo 'Admins update' habría roto 13+ callsites"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Proteger datos de compras entre usuarios (buyer isolation) (Priority: P1)

Un usuario que es buyer en el marketplace (compró recursos, planes, plantillas, material clínico) espera que **solo él** pueda ver sus propias compras — ni otros pacientes, ni otros terapeutas, ni otros clínicos sin rol admin. Hoy, con `rowsecurity=DISABLED` en `marketplace_purchases`, cualquier usuario autenticado que haga `SELECT FROM marketplace_purchases` obtiene el dataset completo (incluyendo compras de otros), y el filtro por `buyer_id` que hace el frontend es cosmético: si alguien evita el filtro, ve todo.

**Why this priority**: Es violación directa de Principios I (Compliance-First) y II (RLS-First Security). Un buyer viendo compras ajenas es exposición de datos con implicancias legales (Ley 19.628 / 21.719 — dato personal con relación comercial) y reputacionales. Es el único de los 3 user stories que resuelve una vulnerabilidad activa; los otros dos son mantener capacidades admin/vendor ya en uso.

**Independent Test**: desde 2 cuentas de buyer distintas con al menos 1 compra cada una, post-deploy (a) cada buyer consulta sus compras y ve **solo las propias**, (b) un buyer que intenta consultar `SELECT id, buyer_id FROM marketplace_purchases WHERE buyer_id = <otro_user_id>` vía cliente PostgREST obtiene resultset vacío, no un error explícito pero tampoco las filas del otro buyer.

**Acceptance Scenarios**:

1. **Given** buyer A con 3 compras y buyer B con 2 compras, **When** buyer A hace la query que usa `TherapistMarketplacePage.jsx:60`, **Then** recibe exactamente 3 filas y ninguna con `buyer_id = B`.
2. **Given** un buyer sin compras, **When** abre la sección "Mis compras", **Then** ve estado vacío correcto (no error de RLS bloqueando prematuramente).
3. **Given** buyer A, **When** intenta `INSERT` de una compra en nombre de buyer B (`buyer_id = B.id, actor = A`), **Then** el INSERT es rechazado por la policy de inserción (inserta solo si `auth.uid() = buyer_id`).

---

### User Story 2 - Admin mantiene visibilidad completa del marketplace (Priority: P2)

El admin del sistema (staff DentalSpot con flag `is_admin`) opera los dashboards de métricas del marketplace (`MarketplaceMetricsPage`, `SalesPage`, `SaleDetailPage`, `VendorPerformancePage`). Estas vistas hoy funcionan porque `rowsecurity=DISABLED` permite a cualquier rol autenticado leer todo. Post-enable RLS, si no existe una policy explícita "Admin manage", esas páginas mostrarían 0 ventas y romperían métricas.

**Why this priority**: Afecta solo al rol admin (equipo reducido) y las métricas son un feature secundario comparado con la seguridad del buyer. Pero si se rompe, el equipo pierde el panel operativo completo del marketplace. P2 porque es crítico pero contenido a un rol.

**Independent Test**: un admin post-deploy abre `MarketplaceMetricsPage` y ve el total de ventas igual al que veía pre-deploy (diferencia absoluta = 0 sobre el universo completo de compras). Si en su cuenta de prueba había 47 ventas históricas, sigue viendo 47.

**Acceptance Scenarios**:

1. **Given** un admin con flag `is_admin = true`, **When** abre `MarketplaceMetricsPage`, **Then** ve todas las compras registradas (no solo las suyas), con métricas consistentes pre/post deploy.
2. **Given** un admin, **When** abre `SaleDetailPage` de una venta que no es suya, **Then** ve el detalle completo (buyer, vendor, producto, monto, status) sin error 406.
3. **Given** un admin, **When** aplica un UPDATE a una venta (caso canónico de la policy "Admins update" que ya existe), **Then** la operación sigue funcionando como hoy.

---

### User Story 3 - Vendor ve performance de sus propios productos (Priority: P3)

Un vendor (terapeuta o clínica que publica productos en el marketplace) abre `VendorPerformancePage` para ver métricas de sus ventas. Hoy la página funciona porque RLS está desactivada. Post-enable RLS, si no existe una policy "Vendor read own sales" y el código no filtra explícitamente por `vendor_id`, el vendor vería 0 ventas o vería ventas de otros vendors.

**Why this priority**: Afecta el rol vendor en una página específica. Los vendors pueden seguir publicando productos y recibiendo ventas — solo se les ciega el panel de performance. P3 porque Phase 1 puede revelar que el schema **no tiene `vendor_id` en marketplace_purchases** (y entonces este user story se re-encuadra o descarta), o que los vendors ya leen su performance vía otra tabla (ej. `marketplace_products` + JOIN implícito).

**Independent Test**: Phase 1 determina si existe la columna `vendor_id` o equivalente. Si existe, un vendor post-deploy abre `VendorPerformancePage` y ve su performance con los mismos números que pre-deploy. Si no existe la columna, este user story se cierra como "out of scope — vendors acceden vía otro camino".

**Acceptance Scenarios**:

1. **Given** un vendor con ≥1 venta de producto propio, **When** abre `VendorPerformancePage`, **Then** ve sus propias ventas y no ve ventas de otros vendors.
2. **Given** Phase 1 revela que no existe columna que identifique al vendor en `marketplace_purchases`, **Then** este user story se marca "N/A" y se documenta en data-model.md antes de Phase 2.

---

### Edge Cases

- **Buyer con status de compra `pending` vs `completed`**: la policy de SELECT no filtra por status — buyer ve todas sus compras sin importar estado. Correcto funcionalmente; si el frontend quiere filtrar, lo hace en la query.
- **Compra legacy creada por un script sin `buyer_id`** (posible si schema permite NULL): post-enable RLS queda huérfana — nadie puede leerla salvo admin. Aceptable; quedan como registros de admin-only, no bloquean buyers actuales.
- **Admin sin el flag `is_admin` correctamente seteado**: el admin pierde acceso al marketplace. No es regresión del spec 009 (es precondición del sistema), pero Phase 1 verifica que `is_admin` está correctamente seteado en la cuenta admin de prueba antes de Phase 3.
- **`OnboardingChecklist.jsx:171` ejecutado por un therapist que aún no ha comprado nada**: query devuelve lista vacía (buyer sin compras es válido). Policy de buyer-read permite el query aunque resultset sea vacío.
- **Callsite usando `select('*')` con alias**: post-enable RLS, el select sigue funcionando siempre que el filtro implícito por `buyer_id` ya esté (o que el usuario sea admin). No hay cambios de shape requeridos.
- **Phase 1 revela que `marketplace_purchases` tiene una columna adicional (ej. `organization_id`, `clinic_id`) usada para tenant isolation**: Phase 1 debe decidir si policies adicionales son necesarias antes de Phase 2. Si aparece `organization_id` se puede requerir una policy "Clinic admin read org purchases".
- **Phase 1 detecta drift ENTRE `supabase/policies.sql` y live**: documentar el drift, pero el foco del spec es restaurar policies de `marketplace_purchases`, no sincronizar todo el policies.sql. Eventual sync queda como candidato a spec hermano.
- **Post-migration el policy_count sube pero rowsecurity no se habilita** (caso inusual, bug en ALTER): el post-check debe detectar esto y fallar con error visible. Si pasa, es rollback trigger extra.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ejecutar un audit defensivo previo que consulte el live schema (`pg_policies` + `pg_class.rowsecurity`) para `marketplace_purchases` y documentar las policies reales vigentes al momento de ejecutar el spec (no confiar en el snapshot de spec 006).
- **FR-002**: El audit defensivo DEBE categorizar los 13+ callsites del frontend por patrón de acceso — `buyer-read`, `buyer-insert`, `admin-read`, `admin-write`, `vendor-read`, `other` — con grep de `from('marketplace_purchases')` y lectura del contexto de cada match.
- **FR-003**: El audit defensivo DEBE inventariar el schema real de `marketplace_purchases` consultando `information_schema.columns` (query explícita sobre `table_schema = 'public' AND table_name = 'marketplace_purchases'`) para capturar columnas, `data_type`, `is_nullable` y FKs. **El audit NO DEBE pre-asumir el nombre de la columna que identifica al buyer** — debe verificar cuál de los candidatos existe en el schema real: `buyer_id` (default asumido por los callsites y por `supabase/policies.sql` histórico), `user_id`, `purchaser_id`, `customer_id`, o variante. Si el nombre real difiere del asumido `buyer_id`, **todas las policies y referencias del plan/migration deben usar el nombre real**, y Phase 1 reporta el delta antes de Phase 2.
- **FR-004**: Si el audit revela un patrón de acceso no contemplado en las 4 policies candidatas iniciales (Buyer read own + Buyer insert + Admin manage + Vendor read), el sistema DEBE detener la ejecución y reportar antes de aplicar cualquier migration (respeta Principio IV Micro-Bloques).
- **FR-005**: La migration restauradora DEBE crearse como archivo `supabase/migrations/20260420000002_restore_marketplace_purchases_policies.sql`, seguir el patrón canónico de la migration `20260420000001` (spec 006) con pre-check + creación de policies + `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + post-check, y ser idempotente (`DROP POLICY IF EXISTS` antes de `CREATE POLICY`).
- **FR-006**: La migration DEBE incluir, **como mínimo**, las 2 policies buyer (SELECT por `auth.uid() = <buyer_col>` y INSERT por `auth.uid() = <buyer_col>`, donde `<buyer_col>` = nombre real confirmado por FR-003). Otras policies (Admin coverage, Vendor read) se incluyen si Phase 1 confirma que son necesarias.
- **FR-006a (decisión admin, sale de Phase 1)**: el audit DEBE evaluar explícitamente **3 estrategias alternativas** para la cobertura admin y documentar cuál se elige en `data-model.md §Policy strategy decision` con justificación:
  - **Estrategia A — Coexistencia**: mantener `"Admins update marketplace_purchases"` existente (UPDATE, `EXISTS is_admin`) y agregar solo policies buyer. Cobertura admin quedaría **parcial**: admin puede UPDATE pero NO SELECT/INSERT/DELETE. Rompería `MarketplaceMetricsPage` (admin no puede leer). Opción viable solo si Phase 1 confirma que las 4 páginas admin ya NO usan `SELECT FROM marketplace_purchases` directo (leen via vista/RPC con bypass).
  - **Estrategia B — Replace con ALL**: reemplazar `"Admins update"` por una policy única `"Admin manage marketplace_purchases"` (ALL, `EXISTS is_admin`) que cubre SELECT/INSERT/UPDATE/DELETE. Simple; reduce surface de policies. Requiere `DROP POLICY "Admins update"` como paso explícito del migration. Alineado con el patrón del `policies.sql` histórico.
  - **Estrategia C — Granular**: mantener `"Admins update"` y agregar policies admin separadas por operación: `"Admin select marketplace_purchases"`, `"Admin insert marketplace_purchases"`, `"Admin delete marketplace_purchases"` (sin duplicar UPDATE). Máxima fidelidad al estado histórico pero más policies a mantener.
  - La decisión **no está pre-tomada**. Sale de Phase 1 luego de categorizar los 13+ callsites admin por operación efectiva.
- **FR-006b (naming convention)**: los nombres de las policies nuevas DEBEN seguir la convención canónica vigente en `supabase/policies.sql` histórico:
  - `"Buyers read own marketplace_purchases"` para la policy SELECT del buyer.
  - `"Buyers insert marketplace_purchases"` para la policy INSERT del buyer.
  - `"Admin manage marketplace_purchases"` si se elige Estrategia B (ALL).
  - `"Admin select|insert|delete marketplace_purchases"` si se elige Estrategia C (granular, una por operación).
  - `"Vendors read own marketplace_purchases"` si Phase 1 confirma user story 3.
  - No se inventan nombres nuevos. Si Phase 1 encuentra un nombre histórico distinto en `policies.sql` para la misma policy, se usa el histórico (compat con posibles referencias en tooling Supabase / dashboards).
- **FR-007**: La migration DEBE incluir al final, comentado (no ejecutable), el bloque de rollback (`DROP POLICY ... IF EXISTS; ALTER TABLE ... DISABLE ROW LEVEL SECURITY;`) para usar en caso de abort.
- **FR-008**: Post-migration, las 13+ rutas/callsites del inventario DEBEN seguir funcionando sin errores HTTP 4xx ni UI rota — validado por test manual con cuentas de prueba de cada rol afectado (buyer, admin, vendor si aplica).
- **FR-009**: El post-check de la migration DEBE verificar que `rowsecurity = true` y `COUNT(*) FROM pg_policies WHERE tablename = 'marketplace_purchases' >= policy_count_esperado` antes de cerrar.
- **FR-010**: El spec NO DEBE modificar el schema de `marketplace_purchases` (no agregar columnas ni índices nuevos). Si Phase 1 revela que falta una columna necesaria, se abre spec hermano y se pausa 009.
- **FR-011**: El spec NO DEBE modificar callsites del frontend (no se toca `.jsx` ni `.js`). Si un callsite está explícitamente mal construido (ej. falta filtro por `buyer_id`), se documenta como hallazgo y se abre spec hermano — NO se fixea en 009 (violaría Principio IV Micro-Bloques: este spec es solo la restauración de policies).
- **FR-012**: Si en Phase 3 un callsite rompe por la enable de RLS (ej. feature flag desactivada, query con shape incorrecto), el Rollback Plan manda `DISABLE ROW LEVEL SECURITY` + `DROP POLICY` de las nuevas, **NO** fixear inline.

### Key Entities *(include if feature involves data)*

- **`marketplace_purchases`**: tabla donde vive el gap RLS. Atributos clave (a confirmar en Phase 1): `id`, `buyer_id` (FK a auth.users o profiles), `product_id` (FK a marketplace_products), posiblemente `vendor_id`, `organization_id`, `amount`, `status`, `created_at`. Tiene trigger o handler externo para UPDATE (`Admins update` policy ya cubre ese caso).
- **`pg_policies`** (view interna Postgres): fuente de verdad de policies vigentes en live. Se consulta en Phase 1 para confirmar estado antes de migrar.
- **`pg_class.rowsecurity`**: flag booleano por tabla que indica si RLS está habilitada. Objetivo del spec: llevar esto de `false` a `true` para `marketplace_purchases`.
- **`supabase/migrations/20260420000002_restore_marketplace_purchases_policies.sql`**: archivo artefacto que este spec crea. Nuevo fichero, nunca se modifica post-merge (las migraciones son append-only).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Post-deploy, la query `SELECT rowsecurity FROM pg_class WHERE relname = 'marketplace_purchases'` devuelve `true`.
- **SC-002**: Post-deploy, `SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_purchases'` devuelve un número ≥ al policy_count esperado decidido en Phase 1 (mínimo 3 — Admin update ya existente + Buyer read own + Buyer insert).
- **SC-003**: Un buyer de prueba (A) con N compras propias y 0 acceso a compras ajenas, post-deploy ejecuta `SELECT COUNT(*) FROM marketplace_purchases` y obtiene exactamente **N**, no el total del sistema.
- **SC-004**: Un admin de prueba post-deploy ve en `MarketplaceMetricsPage` la misma cantidad de ventas totales que veía pre-deploy (diferencia = 0). Validado por snapshot manual del dashboard antes y después.
- **SC-005**: 0 de los 13+ callsites listados introduce un error nuevo en consola (HTTP 4xx, PostgREST error, 406). Validado con DevTools Console abierta durante el test manual de cada callsite.
- **SC-006**: En los 7 días post-deploy, el número de errores de producción relacionados con `marketplace_purchases` es 0 (métrica = logs/Sentry si existe, o ausencia de reportes de usuario en su defecto).
- **SC-007**: La migration es idempotente — ejecutarla dos veces seguidas no genera error (Phase 3 Parte 2 incluye test explícito: correr la migration → re-correr → verificar que policy_count se mantiene estable).

## Assumptions

- Proyecto Supabase activo del CLAUDE.md (ref `tomremkbuxvedliyywbo`). Schema `public`.
- El snapshot de spec 006 sobre policies vigentes podría estar desactualizado — por eso FR-001 exige re-query defensivo en Phase 1.
- La columna `buyer_id` existe en `marketplace_purchases` (confirmado por múltiples callsites del inventario que la usan en `.eq('buyer_id', ...)`). Phase 1 verifica formalmente.
- La existencia de `vendor_id` / `organization_id` es hipótesis, no confirmada. Phase 1 decide si el user story 3 y policies adicionales aplican.
- La policy `"Admins update marketplace_purchases"` existente sobre UPDATE **puede mantenerse, reemplazarse o complementarse** según la estrategia admin elegida por Phase 1 (FR-006a: Estrategia A coexistencia / Estrategia B replace con ALL / Estrategia C granular). No está pre-decidido por el spec — sale del análisis de callsites admin.
- El `is_admin` flag / función está implementado vía `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)` o función `is_admin()` similar — spec 006 lo usó con éxito. Phase 1 confirma la sintaxis exacta revisando la policy "Admins update" ya existente.
- Los 13+ callsites listados son exhaustivos al 2026-04-20. Si Phase 1 grep encuentra más callsites, se incluyen en el inventario; si encuentra menos, se documenta la diferencia (posiblemente el inventario de spec 006 era aspiracional).
- El test manual post-deploy lo hace Danissa (founder) con cuentas de prueba de los roles afectados — buyer (2 cuentas), admin (1 cuenta), vendor (1 cuenta si aplica).
- Los rollback commands son idempotentes (`DROP POLICY IF EXISTS`) y no dependen de un orden particular.
- La ejecución sigue el workflow asesor/ejecutor: Claude escribe spec/plan/migration/tests; Danissa aplica migration via SQL Editor en producción y ejecuta test manual.

## Rollback Plan

Criterios de abort y protocolo si el fix rompe el marketplace post-enable RLS.

### Abort triggers post-migration

Se dispara rollback si se observa CUALQUIERA de:

1. **≥2 callsites del marketplace rompen post-enable RLS** — entendido como: de los 13+ callsites del inventario, 2 o más generan HTTP 4xx (400/403/406) o UI en blanco / crash React boundary durante el test manual de Phase 3 parte 3.
2. **Buyer dashboard muestra array vacío cuando debería tener datos propios** — un buyer de prueba con compras conocidas (pre-deploy ≥1 fila) abre "Mis compras" post-deploy y ve lista vacía. Síntoma de policy SELECT mal condicionada (ej. alias incorrecto en la condición `auth.uid() = buyer_id`).
3. **Admin dashboard muestra 0 sales cuando debería ver todas** — admin de prueba abre `MarketplaceMetricsPage` y las métricas son 0 o muy inferiores al baseline pre-deploy. Síntoma de policy Admin manage no creada o mal condicionada.
4. **Vendor performance page crashea o muestra data de otros vendors** — sea error de ejecución, sea leak cross-vendor. Síntoma de policy Vendor read ausente o demasiado permisiva.

### Protocolo de rollback

1. **Stop** — no más cambios.
2. **Ejecutar en SQL Editor el bloque de rollback** (descomentar el bloque al final de la migration): `DROP POLICY IF EXISTS ...` para las policies nuevas + `ALTER TABLE marketplace_purchases DISABLE ROW LEVEL SECURITY`.
3. **`git revert <commit-del-merge-de-spec-009>`** para retirar la migration del historial (para que un re-deploy no la vuelva a aplicar).
4. **Notificar** a Danissa con:
   - Trigger disparado (cuál de los 4 arriba).
   - Evidencia (screenshot, console error literal, callsite específico).
   - Root cause hipotetizado.
5. **Abrir spec 009.1** con scope ajustado:
   - Si rompieron admin flows → hipótesis: policy Admin manage faltó o está mal → 009.1 adds/corrects.
   - Si rompieron buyer flows → hipótesis: la condición `auth.uid() = buyer_id` necesita ajuste (quizá buyer_id referencia `profiles.id` en vez de `auth.users.id`) → 009.1 revisa.
   - Si rompió vendor flow → hipótesis: schema no tiene `vendor_id`, requiere JOIN a `marketplace_products` → 009.1 policy con subquery.
6. **Ejecutar** spec 009.1 con el mismo ciclo `/speckit-*`.

### Non-rollback triggers (documentar pero NO abortar)

1. **1 callsite aislado con error resolvible en <10 min** (ej. una feature flag lo tenía desactivado y el error no bloquea flujo) — documentar y seguir.
2. **Edge case menor en admin con workaround disponible** (ej. SalesPage tarda 200ms más; filtro de búsqueda no disponible en una vista secundaria) — documentar como follow-up candidato.
3. **Callsite de feature desactivada por feature flag** en producción (ej. `OnboardingChecklist.jsx:171` protegido por flag `onboarding_v2 = false`) — no se puede ejercitar → se marca "not testable", no cuenta para abort.

## Scope Bounds

- **Archivos autorizados a crear**: `supabase/migrations/20260420000002_restore_marketplace_purchases_policies.sql` (único archivo nuevo).
- **Archivos autorizados a leer** (para audit y documentación): `supabase/policies.sql`, cualquier archivo bajo `src/` que invoque `marketplace_purchases`, `.specify/memory/architecture.md §RLS coverage audit`.
- **Archivos NO autorizados a modificar**:
  - Código frontend bajo `src/**` — FR-011 lo prohíbe explícitamente.
  - `supabase/policies.sql` (master file) — se actualiza en un spec separado de sync, no acá.
  - Otras migraciones pre-existentes en `supabase/migrations/` — FR-010 / Principio IV.
- **Si Phase 1 revela que se requiere tocar archivos fuera del bound**: STOP → reportar → decidir con Danissa (amplía spec o divide).
- **Si se detecta patrón idéntico en otras tablas RLS-disabled** (ej. `marketplace_plans_purchases`, `marketplace_products`): documentar y abrir spec hermano. NO fixear en 009.
