# Feature Specification: Migrate MercadoPago Integration from FonoKit to DentalSpot Brand

**Feature Branch**: `020-migrate-mp-brand`
**Created**: 2026-04-22
**Status**: Draft
**Input**: User description: "Rebrand MercadoPago edge functions from FonoKit legacy to DentalSpot branding. Pre-requisite of meta-spec fix-mercadopago-critical-bugs."

---

## Context

DentalSpot es un SaaS odontológico del ecosistema Communicare, pre-launch en términos de cobros reales vía MercadoPago. Diagnóstico del 2026-04-22 (ver `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md`) reveló que:

- DentalSpot heredó el código MercadoPago de FonoKit (SaaS hermano fonoaudiológico)
- Cero pagos reales MercadoPago procesados en DentalSpot (base de datos confirma: 18 users totales, única subscription activa proviene del flow `activateFreeCouponPlan` con cupón 100% descuento — bypassa MercadoPago)
- Todas las huellas externas del código MP llevan brand `FONOKIT`: prefijos de `external_reference`, dominios de `back_urls`, `statement_descriptor`, `title` del preference MP
- La cuenta MercadoPago de DentalSpot **no existe aún** (debe crearse como pre-requisite operacional)

Este spec es **pre-requisite absoluto** antes de habilitar cobros reales a dentistas. Sin el rebrand, cualquier dentista que intente pagar vería "FONOKIT" en su estado de cuenta bancario → confusión, desconfianza, potencial disputa de chargeback ante su banco.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Dentista se suscribe y ve marca DentalSpot en el flujo completo (Priority: P1)

Un dentista registrado en DentalSpot navega a la página de planes de suscripción, elige un plan, es redirigido al checkout de MercadoPago, completa el pago y retorna a la aplicación. Durante TODO este flujo, la marca que ve es DentalSpot (nunca FonoKit).

**Why this priority**: Es el único flujo de cobro que DentalSpot va a habilitar en el launch inicial (marketplace está deshabilitado). Sin rebrand, el pago funciona técnicamente pero la experiencia es incoherente y genera riesgo de disputa bancaria.

**Independent Test**: Un dentista de prueba inicia checkout, observa cada superficie (página de checkout MP, email de confirmación MP, statement bancario post-pago, redirección post-checkout, tabla `therapist_subscriptions` en DB). Ninguna mención a FonoKit en ningún punto del flujo.

**Acceptance Scenarios**:

1. **Given** un dentista autenticado en DentalSpot con perfil completo, **When** hace click en "Suscribirse" en un plan, **Then** la página checkout de MercadoPago muestra el nombre del plan con sufijo "DENTALSPOT" (no "FONOKIT") y el `statement_descriptor` que aparecerá en su banco dice "DENTALSPOT".
2. **Given** el dentista completó un pago exitoso en sandbox MercadoPago, **When** es redirigido de vuelta a la aplicación, **Then** la URL de retorno apunta a `dentalspot.cl/...` (no `fonokit.cl/...`) y su subscription en `therapist_subscriptions` tiene `external_reference` que empieza con `dentalspot_sub_` (no `fonokit_sub_`).
3. **Given** MercadoPago envía un webhook de confirmación del pago exitoso, **When** `mercadopago-webhook` procesa el evento con `external_reference` prefijo `dentalspot_sub_`, **Then** la subscription se activa correctamente (status `active`) y el log del handler muestra reconocimiento del prefijo (no cae en la rama "Unknown payment type").

---

### User Story 2 — Administrador verifica configuración de cuenta MP DentalSpot antes de deploy (Priority: P1)

El equipo de DentalSpot (Danissa como founder) crea la aplicación DentalSpot en el panel de desarrolladores de MercadoPago, genera credenciales sandbox y production, las configura en Supabase, y valida que el sistema apunta a la cuenta correcta antes de deployar el rebrand.

**Why this priority**: Sin cuenta MP DentalSpot configurada, el rebrand de código llevaría pagos de dentistas a una cuenta equivocada (FonoKit) o a ninguna cuenta. La configuración operacional es parte del scope de éxito.

**Independent Test**: Post-configuración, ejecutar un curl de prueba con el nuevo access token y verificar que MercadoPago responde con credenciales de DentalSpot (no FonoKit). Supabase CLI `supabase secrets list` muestra el secret configurado.

**Acceptance Scenarios**:

1. **Given** Danissa tiene cuenta empresarial en MercadoPago Chile, **When** crea una nueva aplicación llamada "DentalSpot" en el panel de desarrolladores, **Then** obtiene dos access tokens distintos (sandbox con prefijo `TEST-` y production con prefijo `APP_USR-`) y un webhook secret disponible para uso futuro.
2. **Given** los access tokens generados, **When** ejecuta `supabase secrets set MERCADOPAGO_ACCESS_TOKEN=...` con el token de sandbox, **Then** el secret queda activo en el proyecto Supabase (verificable via `supabase secrets list`) y las edge functions deployadas lo leen correctamente.
3. **Given** el secret configurado con token sandbox DentalSpot, **When** se ejecuta un curl de prueba a `create-mp-checkout`, **Then** la preference creada pertenece a la cuenta DentalSpot (no FonoKit) — verificable en el panel MercadoPago DentalSpot que la payment request aparece listada.

---

### User Story 3 — Sistema preserva compatibilidad con F-014 fix existente (Priority: P2)

El rebrand no introduce regresión en el fix F-014 de validación de precio server-side (commit `3593b12`). Los tests que verifican el exploit de manipulación de precio siguen pasando después del rebrand.

**Why this priority**: El F-014 fix fue un blocker P0 que se cerró recientemente. Una regresión en rebrand sería una vulnerabilidad reintroducida, peligrosa dado que el fix protege revenue futuro.

**Independent Test**: Request POST a `/create-mp-checkout` con `final_price: 1` manipulado sin `coupon_code` debe seguir siendo ignorado (el servidor usa `plan.price` desde DB). Un test con cupón inválido sigue retornando 400 con mensaje claro.

**Acceptance Scenarios**:

1. **Given** el rebrand deployado, **When** un atacante simulado manda `{ final_price: 1 }` a `create-mp-checkout` sin `coupon_code`, **Then** la preference creada usa `plan.price` real (no $1) y el `external_reference` empieza con `dentalspot_sub_` (confirma ambos fixes coexisten).
2. **Given** un cupón válido en `discount_coupons`, **When** un dentista legítimo lo aplica en checkout, **Then** el descuento se calcula server-side contra `plan.price` (no contra input cliente) y el `external_reference` refleja brand DentalSpot.

---

### Edge Cases

- **¿Qué pasa si hay webhooks MercadoPago in-flight con `external_reference` viejo prefijo `fonokit_` cuando se deploya el rebrand?**
  La Query 2 del diagnóstico 2026-04-22 confirmó 0 subscriptions con prefijo `fonokit_` en DB de DentalSpot — no hay pagos in-flight que dependan de ese prefijo. Backward compatibility explícitamente **no requerida**.

- **¿Qué pasa si el access token FonoKit sigue configurado cuando se deploya el código rebrandeado (gap entre deploy código y swap de secret)?**
  El request a MercadoPago se hace con el token configurado. Si el token es de FonoKit, la preference se crea en la cuenta FonoKit pero con `external_reference: dentalspot_sub_*` — inconsistencia. Mitigación: el spec exige que el swap de secret ocurra **antes** del deploy del código rebrandeado (ver FR-009). Validación empírica post-swap es parte del Acceptance Scenario 2.2.

- **¿Qué pasa si el dentista hace back-button en el navegador durante el checkout MP y regresa a DentalSpot sin completar?**
  Los `back_urls` deben estar correctamente mapeados a `dentalspot.cl`. Si apuntan a `fonokit.cl` post-deploy, el usuario aterriza en un dominio que no es el suyo (asumiendo dominios separados) o recibe error. El rebrand cubre esto (FR-003).

- **¿Qué pasa si DentalSpot y FonoKit comparten el mismo proyecto Supabase (`tomremkbuxvedliyywbo`) y un therapist de FonoKit intenta suscribirse usando sus credenciales?**
  Descartado empíricamente (A-02 verificada 2026-04-22): cuenta Supabase de Danissa solo tiene el proyecto DentalSpot. FonoKit está en otra infraestructura. Edge case NO aplicable a este spec.

- **¿Qué pasa si alguien tiene guardado un bookmark a `fonokit.cl/dashboard/membership/status?...` y lo usa post-rebrand?**
  El link apunta al dominio FonoKit, que no es de DentalSpot — el bookmark no sirve. No es bug del rebrand, es expected post-rebrand. No se requiere backward compat de URLs externas porque DentalSpot pre-launch no tiene usuarios con bookmarks activos.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Rebrand de código

- **FR-001**: El sistema DEBE usar el prefijo `dentalspot_sub_` en `external_reference` para subscriptions (reemplaza `fonokit_sub_`) en todas las edge functions que crean o consumen preferences de tipo subscription.
- **FR-002**: El sistema DEBE usar el prefijo `dentalspot_order_` en `external_reference` para marketplace purchases (reemplaza `fonokit_order_`) en todas las edge functions que crean o consumen preferences de tipo marketplace purchase.
- **FR-003**: El sistema DEBE usar el dominio `dentalspot.cl` en `back_urls` (success/failure/pending) en todas las preferences creadas (reemplaza `fonokit.cl`).
- **FR-004**: El sistema DEBE usar el valor `DENTALSPOT` en el `statement_descriptor` de preferences marketplace (reemplaza `FONOKIT`). Este valor es lo que aparecerá en el estado de cuenta bancario del dentista.
- **FR-005**: El sistema DEBE usar el sufijo `- DENTALSPOT` en el `title` de cada item del preference MP (reemplaza `- FONOKIT`). Este texto se muestra al dentista en la página de checkout de MercadoPago.
- **FR-006**: El webhook handler (`mercadopago-webhook`) DEBE reconocer y dispatchar correctamente eventos con `external_reference` prefijo `dentalspot_sub_` (subscriptions) y `dentalspot_order_` (marketplace). El dispatch incorrecto a la rama "Unknown payment type" DEBE disparar error visible para debugging (no silencio).

#### Pre-requisitos operacionales (documentados en el spec, ejecutados fuera de código)

- **FR-007**: Antes del deploy del código rebrandeado, Danissa DEBE crear la aplicación "DentalSpot" en el panel de desarrolladores de MercadoPago (https://www.mercadopago.cl/developers/panel/app) y generar credenciales sandbox (prefijo `TEST-`) y production (prefijo `APP_USR-`).
- **FR-008**: Danissa DEBE guardar el webhook secret (o "signing key") generado por MercadoPago para uso futuro en el meta-spec `fix-mercadopago-critical-bugs` (F-001 signature validation). Este valor no se usa en este spec pero su pérdida obliga a re-generarlo.
- **FR-009**: El secret `MERCADOPAGO_ACCESS_TOKEN` en Supabase DEBE actualizarse con el token DentalSpot (sandbox primero, production después post-validación) **antes** de deployar el código rebrandeado. Si el orden se invierte, las preferences se crean en la cuenta equivocada hasta que el swap se complete.
- **FR-010**: Post-swap de secret y post-deploy de código, se DEBE ejecutar al menos un test funcional end-to-end con sandbox (crear preference → verificar en panel MP DentalSpot → confirmar `external_reference` y `statement_descriptor`) antes de considerar el deploy exitoso.

#### Preservación (no regresión)

- **FR-011**: El rebrand NO DEBE modificar la lógica de validación server-side de precio (F-014 fix, commit `3593b12`). La función `create-mp-checkout` sigue ignorando `final_price` del cliente y usando `plan.price` de DB. La validación de cupones server-side (7 checks) sigue intacta.
- **FR-012**: El rebrand NO DEBE modificar la lógica de validación server-side de precio de marketplace items. La función `create-mercadopago-preference` sigue validando `unit_price` contra DB (`marketplace_plans.price_clp` o `marketplace_items.price` fallback).
- **FR-013**: El rebrand NO DEBE introducir fixes de los otros BLOCKERs (F-001 signature validation, F-002 idempotency, F-003 silent 200 OK, F-005 dunning flow). Esos quedan para el meta-spec subsequent.

### Key Entities

- **Edge function `create-mp-checkout`**: Responsable de crear preferences MP para subscriptions de dentistas. Contiene huellas de brand en `external_reference`, `title`, `back_urls`. Tocada por el rebrand.
- **Edge function `create-mercadopago-preference`**: Responsable de crear preferences MP para marketplace purchases (actualmente OFF via `FEATURE_FLAGS.MARKETPLACE: false` pero el código se mantiene defensive). Contiene huellas de brand en `external_reference`, `back_urls`, `statement_descriptor`. Tocada por el rebrand.
- **Edge function `mercadopago-webhook`**: Responsable de procesar webhooks de MercadoPago post-pago. Contiene lógica de dispatch basada en prefijo de `external_reference`. Tocada por el rebrand (dispatch branches).
- **Tabla `therapist_subscriptions`**: Almacena las subscriptions de dentistas, incluyendo el `external_reference` generado por las edge functions. El rebrand afecta los valores persistidos a partir del deploy (registros previos retienen sus valores originales, pero la DB confirmó 0 registros con prefijo `fonokit_` en DentalSpot — no hay migración de datos necesaria).
- **Secret `MERCADOPAGO_ACCESS_TOKEN` en Supabase**: Variable de entorno leída en runtime por las 3 edge functions para autenticar requests a MercadoPago API. Actualmente probablemente contiene token de FonoKit. Post-spec contiene token de DentalSpot.
- **Aplicación DentalSpot en panel MercadoPago**: Entidad externa en MercadoPago panel de desarrolladores. Debe ser creada como pre-requisite. Genera access tokens (sandbox y production) y webhook secret. No existe al momento de escribir este spec.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Después del rebrand, un dentista puede completar un checkout de subscription sandbox sin ver la palabra "FonoKit" en ningún punto del flujo (checkout MP page, email de confirmación, statement bancario simulado, URL de retorno) — verificación visual end-to-end en menos de 3 minutos.
- **SC-002**: Después del rebrand, búsqueda de texto "fonokit" (case-insensitive) en los 3 archivos de edge functions MP retorna **0 matches**. Búsqueda de "dentalspot_sub_", "dentalspot_order_", o "DENTALSPOT" retorna **al menos 6 matches** distribuidos en los 3 archivos.
- **SC-003**: Post-deploy, un webhook simulado con `external_reference: dentalspot_sub_test123` es procesado correctamente por `mercadopago-webhook` (es decir, ejecuta la rama de dispatch correspondiente al tipo subscription, no cae en la rama "Unknown payment type") — verificable en logs Supabase en menos de 1 minuto después del evento.
- **SC-004**: Post-swap de `MERCADOPAGO_ACCESS_TOKEN`, el panel MercadoPago de la cuenta DentalSpot muestra al menos una preference de prueba creada en las últimas 24 h — verificable visualmente en el dashboard MP DentalSpot.
- **SC-005**: El F-014 fix (validación server-side de precio) sigue funcionando post-rebrand: un request con `final_price: 1` manipulado crea una preference con precio real del plan (no $1) y `external_reference` prefijo `dentalspot_sub_` — verificable con un único test de prueba en menos de 2 minutos.
- **SC-006**: La duración total del ciclo de planificación + tasks + implementación + deploy + smoke test no excede los **90 minutos** de trabajo técnico (excluye el tiempo offline que Danissa pasa creando la app en el panel MP, estimado en 1-2 h).
- **SC-007**: Post-spec closure, DentalSpot queda en condición de "unblocked" para que el meta-spec `fix-mercadopago-critical-bugs` se ejecute inmediatamente a continuación (sin más pre-requisites operacionales).

---

## Assumptions

- **A-01**: DentalSpot y FonoKit son aplicaciones con cuentas MercadoPago **separadas** (o lo serán post-creación de la cuenta DentalSpot). No hay multi-tenant a nivel de MP dentro de la misma cuenta.
- **A-02**: ✅ **VERIFICADO 2026-04-22** — El proyecto Supabase `tomremkbuxvedliyywbo` pertenece exclusivamente a DentalSpot. Verificación empírica: `supabase projects list` con cuenta de Danissa retorna **solo ese único proyecto**. FonoKit vive en otra infraestructura (otra cuenta Supabase, otro backend, o deprecated — fuera del scope de este spec). El swap de `MERCADOPAGO_ACCESS_TOKEN` en `tomremkbuxvedliyywbo` NO tiene efecto cross-app sobre FonoKit.
- **A-03**: No se requiere backward compatibility con `external_reference` prefijo `fonokit_*` en el webhook, porque la Query 2 del diagnóstico confirmó 0 registros con ese prefijo en DB DentalSpot. Si apareciera alguno in-flight (unlikely), se procesaría como "Unknown payment type" con log explícito — revisable manualmente.
- **A-04**: El dominio `dentalspot.cl` está activo y apunta a la misma aplicación React deployada en Vercel. Los paths `/dashboard/membership/status` y `/dashboard/marketplace/purchase-success` existen y manejan los parámetros query correctamente. Si el dominio no existe o no responde, el redirect post-checkout falla y el usuario queda perdido — pre-requisite operacional (ver FR-007).
- **A-05**: Las credenciales MercadoPago DentalSpot (access token + webhook secret) se almacenan en Supabase secrets (no en archivos `.env` ni en código). Este es el patrón existente del proyecto.
- **A-06**: El nombre legal con que se crea la aplicación DentalSpot en MercadoPago determina el `statement_descriptor` que aparece en el banco del cliente. Este spec asume que el nombre "DENTALSPOT" (o similar cercano, máximo 22 caracteres según límites de MP) es acceptable y coincide con el brand comercial. Si Danissa prefiere "Dentalspot SpA" u otra variante, se ajusta en FR-004 sin cambiar el scope técnico.
- **A-07**: El marketplace permanece deshabilitado en producción via `FEATURE_FLAGS.MARKETPLACE: false` durante y post-rebrand. El rebrand de `create-mercadopago-preference` (marketplace function) se incluye como defense-in-depth para el momento futuro en que marketplace se reactive — no bloquea launch actual.
- **A-08**: Danissa (founder) completa los pre-requisites operacionales (crear app MP DentalSpot, guardar credenciales) **antes** del `/speckit-implement` de este spec. Las fases de plan + tasks pueden ejecutarse en paralelo mientras Danissa gestiona panel MP, pero el deploy requiere los tokens listos.
- **A-09**: El equipo (Danissa como única ejecutora) tiene acceso de admin al panel Supabase para configurar secrets, y a la terminal con Supabase CLI instalada y autenticada (ya verificado en sesión 2026-04-22).

---

## Out of Scope

Lista explícita de lo que **no** se toca en este spec para evitar confusión o scope creep:

- **Fixes de seguridad MercadoPago** (F-001 webhook signature, F-002 idempotency, F-003 silent 200 OK, F-005 dunning flow): son P0 pero agrupados en meta-spec subsequent `fix-mercadopago-critical-bugs` (ver `specs/019-audit-mercadopago-flow/data-model.md §P3.3`).
- **Rebrand de admin marketplace pages** (15 páginas en `src/features/admin/modules/marketplace/`): marketplace está OFF, rebrand diferido.
- **Rebrand de `NotizInlineWidget` y pages relacionadas**: módulo OFF via `FEATURE_FLAGS.NOTIZ: false`, diferido.
- **Rebrand de frontend membership pages** (`MembershipPlansPage`, `PaymentStatusPage`, etc.): si contienen strings "FonoKit" hardcoded, es un audit separado. Este spec cubre solo el **backend edge functions** que interactúan con MercadoPago API.
- **Migración de datos históricos**: no hay datos con prefijo `fonokit_` en DB DentalSpot (Query 2 diagnóstico = 0 rows). No se requiere script de backfill ni update masivo.
- **Bifurcación de edge functions por tenant** (si FonoKit y DentalSpot comparten proyecto Supabase): asumido como A-02 que son separados. Si se prueba falso, es un spec arquitectural distinto.
- **Auditoría de compliance MercadoPago** (PCI DSS, Ley 21.719 en contexto datos pago): no toca este spec.
- **Configuración de webhooks URLs en el panel MP DentalSpot**: se documenta en FR-008 como parte del setup operacional pero los endpoints son los mismos de FonoKit (`/functions/v1/mercadopago-webhook`).

---

## Open Questions / Future Considerations

Sin `[NEEDS CLARIFICATION]` bloqueantes. Consideraciones que quedan para planificación futura (no bloquean este spec):

- **¿Qué hacer si FonoKit también usa este proyecto Supabase?** Requiere diagnóstico adicional antes del swap de secret. Pre-flight check recomendado para la fase de plan.
- **¿Configurar webhooks MercadoPago con signing key ahora o en el meta-spec?** El signing key se guarda acá (FR-008) pero el código de validación se implementa en F-001 del meta-spec. Mientras tanto, el webhook endpoint sigue aceptando cualquier payload (vulnerabilidad conocida F-001 aún abierta hasta meta-spec).
- **¿Migrar también las URLs de dominio `dentalspot.cl` a una variable de entorno?** Hardcoding de dominio dificulta futuros tests en staging/preview environments. Candidato para refactor posterior (no en este spec).

---

## References

- Origen del diagnóstico: `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md`
- F-014 fix precedente: commit `3593b12` "fix(mp): server-side price validation F-014"
- Meta-spec dependiente: `specs/019-audit-mercadopago-flow/data-model.md §P3.3` (prompt pre-cocinado)
- Constitution: `.specify/memory/constitution.md` (§I, §II, §IV, §V, §VI aplicables)
- Architecture: `.specify/memory/architecture.md §MercadoPago subscription flow audit (spec 019)`
- Session log inicial spec 019: `docs/session-logs/2026-04-20-extended-session.md`
