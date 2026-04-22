# Feature Specification: Add Subscription Plans Tier Model

**Feature Branch**: `022-add-plans-tier-model`
**Created**: 2026-04-22
**Status**: Draft
**Input**: User description: "Implementar modelo de planes de suscripción tier para DentalSpot pre-launch. 4 planes (Free, Individual, Clínica Pro, Clínica Premium) + trial 30 días + descuento anual 15% + cupón beta 3 meses."

---

## Context

DentalSpot está en pre-launch. Tras los specs recientes (019 audit MercadoPago, 020 rebrand MP a DentalSpot, 021 cleanup FonoKit legacy), la integración MercadoPago funciona en sandbox con cuenta DentalSpot. **El último bloqueante operacional para abrir cobros reales a dentistas es definir el modelo de planes con pricing real.**

La tabla `subscription_plans` solo contiene un placeholder `profesional @ $20.000 CLP` insertado manualmente durante smoke test del spec 020. Este spec reemplaza ese placeholder con el modelo definitivo.

El research de competencia (Dentalink, AgendaPro, CIMADent, Dentalware) ejecutado el 2026-04-22 confirma posicionamiento agresivo: DentalSpot 45-84% más barato que líderes dental Chile, estrategia pre-launch para acquisition de primeros usuarios.

**Scope MVP explícito**: agenda + gestión de pacientes + cobros de suscripción funcionando. Triage IA NO se activa en este launch (el código backend existe pero se mantiene oculto del UX actual — activación se difiere a Fase A del pivot marketplace).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Dentista individual elige plan y completa pago suscripción mensual (Priority: P1)

Un dentista visita la página de planes de DentalSpot, compara las 4 opciones disponibles, elige "Individual" ($14.990/mes), hace click en "Prueba 30 días gratis", completa el checkout de MercadoPago, y comienza a usar la app con todas las features del plan.

**Why this priority**: Es el flujo **central de monetización** de DentalSpot. Sin esto, la plataforma no puede generar revenue. Es el flujo que genera **primera conversión real** de dentistas pagando.

**Independent Test**: un dentista puede completar el viaje completo desde landing → página de planes → selección Individual → checkout MP → pago aprobado → acceso a features pagos. Zero errores ni ambigüedad en el flujo.

**Acceptance Scenarios**:

1. **Given** un dentista sin suscripción activa visita `/dashboard/membership/plans`, **When** ve la página, **Then** encuentra 4 cards visibles (Free, Individual, Clínica Pro, Clínica Premium) con precios, features y un toggle "Mensual / Anual -15%" arriba.
2. **Given** el dentista hace click en "Prueba 30 días gratis" del plan Individual, **When** es redirigido a MercadoPago, **Then** el checkout muestra plan "Individual - DENTALSPOT" con precio $14.990 CLP (o $12.742/mes si elige anual).
3. **Given** el dentista completa el pago en sandbox MP, **When** regresa a DentalSpot, **Then** su `therapist_subscriptions` queda con `status=active`, `plan_name=individual`, `current_period_end` 30 días en el futuro.
4. **Given** el dentista con plan Individual activo intenta usar features del plan, **When** crea pacientes/citas sin límite, **Then** el sistema permite sin bloqueos.

---

### User Story 2 — Clínica elige Clínica Pro y obtiene multi-usuario + múltiples sillones (Priority: P1)

Una clínica dental con 3 dentistas y 2 sillones visita la página de planes, elige "Clínica Pro" ($24.990/mes), completa el checkout, y los 3 dentistas comienzan a usar la app compartiendo calendario + fichas.

**Why this priority**: Clínicas representan el **mayor revenue por usuario** (LTV alto) y son el target dulce del pricing ($24.990 cubre hasta 5 dentistas + 3 sillones sin add-ons). Es el plan marcado "POPULAR".

**Independent Test**: una clínica con 2+ dentistas puede completar checkout + invitar a los otros dentistas + operar en la app con múltiples calendarios + fichas compartidas sin errores.

**Acceptance Scenarios**:

1. **Given** un administrador de clínica en `/dashboard/membership/plans`, **When** ve el plan "Clínica Pro", **Then** identifica claramente "Hasta 5 dentistas" + "Hasta 3 sillones" + badge "POPULAR".
2. **Given** el admin completa checkout Clínica Pro, **When** la suscripción queda activa, **Then** puede invitar hasta 5 dentistas totales (se mismo + 4 más) a la clínica via `ClinicInvitationsPanel`.
3. **Given** 4 dentistas activos en la clínica, **When** el admin intenta invitar al 5º y luego 6º dentista, **Then** el 5º es aceptado y al 6º se bloquea con mensaje claro "Plan Clínica Pro permite hasta 5 dentistas. Upgrade a Clínica Premium para dentistas ilimitados."

---

### User Story 3 — Usuario free llega al límite de 5 pacientes y recibe prompt de upgrade (Priority: P1)

Un dentista empezó en el plan Free (5 pacientes / 15 citas mes). Al crear el 6º paciente, el sistema lo bloquea con un modal claro explicando el límite y ofreciendo upgrade a Individual.

**Why this priority**: El **plan Free es la entrada del funnel de adquisición**. Si el enforcement está roto (permite crear sin límites), la conversión a planes pagos colapsa. Si está demasiado estricto (bloquea sin UX clara), los usuarios abandonan.

**Independent Test**: un dentista Free puede crear hasta 5 pacientes sin fricción, en el 6º recibe un modal con CTA claro, y tras upgrade el enforcement se libera.

**Acceptance Scenarios**:

1. **Given** un dentista con plan Free y 4 pacientes activos, **When** crea el 5º paciente, **Then** se guarda exitosamente sin warnings.
2. **Given** el mismo dentista con 5 pacientes, **When** intenta crear el 6º, **Then** ve un modal "Plan Free llegó al límite de 5 pacientes" + CTA "Upgrade a Individual - $14.990/mes".
3. **Given** el dentista upgrade a Individual, **When** regresa a intentar crear el paciente, **Then** se guarda exitosamente (límite removido post-upgrade).
4. **Given** el mismo dentista tiene 14 citas este mes, **When** agenda la 15ª, **Then** se guarda. **When** intenta la 16ª, **Then** ve modal similar con contexto "15 citas/mes — upgrade a Individual para citas ilimitadas".

---

### User Story 4 — Primeros dentistas beta usan cupón de 3 meses gratis (Priority: P2)

Un dentista en programa beta recibe el cupón `BETA-3M-2026` de DentalSpot, lo ingresa en el checkout de Clínica Pro, paga $0 CLP, y durante 3 meses renueva automáticamente sin cobro. Al día 91, el sistema cobra precio real ($24.990/mes).

**Why this priority**: Es el mecanismo para **validar producto con 10-30 dentistas pioneros** antes del launch público. Reduce fricción (acceso gratis 3 meses) + genera feedback temprano + convierte a usuarios pagos post-trial extended.

**Independent Test**: un dentista con cupón beta puede completar checkout pagando $0, mantiene suscripción activa por 3 ciclos mensuales consecutivos sin cobros, y al 4º ciclo se cobra automáticamente el precio real del plan.

**Acceptance Scenarios**:

1. **Given** un dentista beta con cupón `BETA-3M-2026`, **When** ingresa código en checkout Clínica Pro, **Then** el precio en MP es $0 CLP.
2. **Given** el pago se aprueba, **When** la suscripción queda activa, **Then** el sistema registra en la suscripción que usa cupón con `max_renewals=3` y counter inicial `current_renewal_count=1`.
3. **Given** 30 días después, **When** MP genera el pago recurrente #2, **Then** el cupón aplica nuevamente ($0) y el counter pasa a 2.
4. **Given** 90 días después, **When** MP genera el pago #4, **Then** el cupón ya NO aplica (counter 3 ≥ max 3) y se cobra precio real $24.990.
5. **Given** el dentista NO ingresa método de pago válido pre-ciclo 4, **When** MP rechaza el pago, **Then** la suscripción pasa a `payment_status=failed` (hoy sin dunning automático — operacional manual hasta meta-spec MP).

---

### User Story 5 — Clínica elige pago anual y ahorra 15% (Priority: P2)

Un admin de clínica decide pagar anual prepago para ahorrar. Selecciona "Anual -15%" en el toggle, el precio mensual muestra el equivalente con descuento ($21.241 efectivo vs $24.990 normal para Clínica Pro), y completa checkout único anual.

**Why this priority**: Pago anual mejora **cashflow upfront** de DentalSpot (12 meses de revenue en 1 pago) + reduce churn (commitment más alto) + es práctica estándar en SaaS B2B Chile.

**Independent Test**: toggle anual muestra precios correctos, checkout MP cobra el total anual, suscripción queda activa por 12 meses sin cobros intermedios.

**Acceptance Scenarios**:

1. **Given** dentista en página de planes con toggle "Mensual" activo, **When** cambia a "Anual -15%", **Then** los precios de Individual/Pro/Premium se muestran como precio-anual-total (ej. Individual $152.898 o equivalente "$12.742/mes facturado anual").
2. **Given** dentista selecciona Clínica Pro anual, **When** completa checkout, **Then** MP cobra $254.898 CLP únicos (= $24.990 × 12 × 0.85).
3. **Given** pago anual aprobado, **When** la suscripción queda activa, **Then** `billing_cycle=annual`, `current_period_end` 365 días en el futuro, sin cobros recurrentes hasta entonces.

---

### Edge Cases

- **¿Qué pasa si un usuario en Clínica Premium intenta aplicar el cupón `BETA-3M-2026`?**
  El cupón NO es aplicable a Premium (definido en `applicable_plans=['individual','clinic_pro']`). El edge function validator rechaza con 400 "Cupón no aplicable a este plan" (mecanismo existente post-spec 020 F-014).

- **¿Qué pasa si un usuario Free quiere hacer upgrade a Individual mid-mes, habiendo ya creado 3 pacientes?**
  Los 3 pacientes existentes se mantienen. El upgrade libera el límite de 5 → ∞. No hay proración (simplificación Out of Scope): el primer pago de Individual se cobra completo al activar.

- **¿Qué pasa si un usuario Clínica Pro llega a los 5 dentistas y quiere añadir el 6º sin upgrade a Premium?**
  El sistema lo bloquea con modal claro. No hay opción de "per-seat add-on" para Pro (decisión de producto: si necesita más, upgrade a Premium $39.990 ilimitado).

- **¿Qué pasa si la suscripción Clínica Pro anual expira y el usuario no renueva pero tiene 5 dentistas activos?**
  Post-expiración, la suscripción queda `status=expired`. Los 5 dentistas quedan vinculados a la clínica pero ninguno puede acceder a features pagos (downgrade implícito a Free). Los dentistas no se pueden desvincular automáticamente (eso sería operacional de rebalanceo que no está en scope).

- **¿Qué pasa si un dentista individual intenta crear un sillón cuando su plan Individual permite 1 y ya tiene 1?**
  Modal claro "Plan Individual permite 1 sillón. Upgrade a Clínica Pro para 3 sillones."

- **¿Qué pasa si el contador `current_renewal_count` para un cupón se desincroniza con los pagos MP reales (por ej. webhook perdido)?**
  Riesgo conocido (F-002 idempotency del audit 019 aún no cerrado). Si el counter no se incrementa por webhook perdido, el cupón podría aplicarse más veces de las debidas. Mitigación de este spec: logging explícito del counter + dashboard admin para revisarlo manualmente. Fix permanente: meta-spec MP posterior.

- **¿Qué pasa si un usuario Free llega a las 15 citas el día 25 del mes?**
  Se bloquea en la 16ª cita ese mes. El contador se resetea el 1º del mes siguiente (appointment_limit es por mes calendario). Permite al usuario mantenerse en Free si su volumen es bajo mensualmente.

- **¿Qué pasa con el plan placeholder `profesional @ $20.000` actualmente en DB (insertado en spec 020 smoke test)?**
  Migration hace UPSERT: el plan se actualiza/deprecan según decisión. Opción: `profesional` se convierte en `individual` con precio actualizado a $14.990, O se marca `is_active=false` y se inserta `individual` nuevo. Phase 1 del plan decide la migración exacta.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Schema + planes

- **FR-001**: El sistema DEBE definir 4 planes activos en la tabla `subscription_plans` con los siguientes atributos exactos:
  - `free`: precio $0, 1 dentista max, 0 sillones max, límite 5 pacientes, límite 15 citas/mes, 0 trial days (permanente).
  - `individual`: precio $14.990, 1 dentista max, 1 sillón max, pacientes ilimitados, citas ilimitadas, 30 trial days.
  - `clinic_pro`: precio $24.990, 5 dentistas max, 3 sillones max, pacientes ilimitados, citas ilimitadas, 30 trial days.
  - `clinic_premium`: precio $39.990, dentistas ilimitados (NULL), sillones ilimitados (NULL), pacientes ilimitados, citas ilimitadas, 30 trial days.
- **FR-002**: El sistema DEBE definir el descuento anual del 15% aplicable a `individual`, `clinic_pro`, `clinic_premium` (NO a `free`).
- **FR-003**: El sistema DEBE definir el cupón `BETA-3M-2026` con 100% descuento, renovable 3 ciclos mensuales, aplicable SOLO a `individual` y `clinic_pro` (NO a `free` ni `premium`).
- **FR-004**: El placeholder `profesional` existente DEBE ser migrado: convertirse en `individual` con precio actualizado, O desactivarse (`is_active=false`) e insertar `individual` como nuevo plan. La decisión debe preservar cualquier suscripción activa existente sin romper referencias.

#### UX página de planes

- **FR-005**: La página de planes DEBE mostrar los 4 planes en cards visualmente comparables (equivalente a 4 columnas en desktop, con comportamiento responsive en mobile).
- **FR-006**: La página DEBE incluir un toggle "Mensual / Anual -15%" que alterna los precios mostrados sin cambiar de página.
- **FR-007**: El plan `clinic_pro` DEBE mostrar badge "POPULAR" para guiar a clínicas al plan recomendado.
- **FR-008**: Cada plan DEBE mostrar CTA accionable:
  - Free: "Empezar gratis" (registrar sin checkout MP).
  - Planes pagos: "Prueba 30 días gratis" (lleva a checkout con flag de trial).
- **FR-009**: La página DEBE mostrar tooltip educativo sobre "sillón/box dental" al pasar el cursor sobre el icono ⓘ junto a "sillones" en Individual / Clinic Pro / Premium (explicación: "Un sillón es un puesto de atención dental, también conocido como 'box'. Una clínica puede tener múltiples sillones separados para atender pacientes en paralelo.").

#### Enforcement de límites

- **FR-010**: El sistema DEBE enforcar el `patient_limit` del plan Free: si un dentista Free intenta crear el paciente N+1 donde N es el límite, la operación DEBE ser bloqueada con un modal de UX clara que ofrezca upgrade al plan Individual.
- **FR-011**: El sistema DEBE enforcar el `appointment_limit` del plan Free por mes calendario. Contador se resetea el 1º de cada mes. Cita N+1 bloqueada con modal similar a FR-010.
- **FR-012**: El sistema DEBE enforcar el `max_dentists` del plan al momento de invitar un nuevo dentista a una clínica. Invitación N+1 donde N es el límite bloqueada con mensaje claro + CTA upgrade.
- **FR-013**: El sistema DEBE enforcar el `max_boxes` al momento de crear un sillón. Creación N+1 bloqueada con mensaje + CTA upgrade.
- **FR-014**: El enforcement DEBE ser server-side también (NO solo UX): las operaciones de crear paciente/cita/invitación/sillón DEBEN validar límites en el backend antes de persistir.

#### Cupón beta con renovación controlada

- **FR-015**: El sistema DEBE trackear `current_renewal_count` en cada suscripción activada con cupón. Valor inicial = 1 al crear la suscripción, se incrementa en cada pago recurrente procesado.
- **FR-016**: El sistema DEBE, en el momento del pago recurrente, validar si `current_renewal_count < cupon.max_renewals`. Si sí, aplicar descuento del cupón. Si no, cobrar precio real del plan.
- **FR-017**: El sistema DEBE respetar el `max_renewals` del cupón BETA (3) — tras los 3 ciclos de $0, el 4º ciclo cobra precio real sin requerir acción manual del admin.
- **FR-018**: El sistema DEBE preservar el F-014 fix de spec 020 — precio validado server-side desde `subscription_plans.price` (no confiar en cliente).

#### Pago anual y cobros

- **FR-019**: El sistema DEBE calcular el precio anual con 15% descuento correctamente: `anual = mensual × 12 × 0.85`. Ejemplos: Individual $152.898/año, Clínica Pro $254.898/año, Clínica Premium $407.898/año.
- **FR-020**: El sistema DEBE distinguir `billing_cycle=monthly` vs `billing_cycle=annual` en la suscripción y procesar cobros apropiadamente (mensual recurrente vs un solo cobro anual).

### Key Entities

- **Plan de suscripción**: cada una de las 4 ofertas comerciales (Free, Individual, Clínica Pro, Clínica Premium). Tiene precio, límites numéricos, features incluidas.
- **Suscripción activa**: vínculo entre un dentista/clínica y el plan que pagó. Tiene estado (active/cancelled/expired), ciclo (mensual/anual), fechas de cobertura, counter de renewals si usa cupón.
- **Cupón de descuento**: código aplicable en checkout. BETA-3M-2026 tiene max_renewals=3.
- **Límites por plan**: max_dentists, max_boxes, patient_limit, appointment_limit. NULL significa ilimitado.
- **Contador de renovaciones (cupón)**: tracking por suscripción de cuántos ciclos lleva el cupón aplicado.
- **Página de planes (UI)**: surface visible al dentista donde compara y elige.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Post-spec, un dentista puede completar el viaje desde `/dashboard/membership/plans` hasta suscripción activa en menos de 3 minutos (elegir plan, checkout MP, pago aprobado, redirect exitoso).
- **SC-002**: Post-spec, la tabla `subscription_plans` contiene exactamente 4 registros `is_active=true`: Free, Individual, Clínica Pro, Clínica Premium con los precios exactos ($0 / $14.990 / $24.990 / $39.990).
- **SC-003**: Post-spec, un dentista con plan Free intentando crear el 6º paciente recibe un modal de UX claro en menos de 1 segundo + CTA funcional al plan Individual.
- **SC-004**: Post-spec, el cupón BETA-3M-2026 completa 3 ciclos de $0 y en el 4º ciclo cobra precio real sin intervención manual. Verificable con 4 pagos simulados sandbox.
- **SC-005**: Post-spec, el toggle Anual -15% muestra precios correctos calculados como `mensual × 12 × 0.85` con precisión de pesos chilenos (sin decimales).
- **SC-006**: Post-spec, una clínica con plan Clínica Pro activa puede invitar hasta 5 dentistas. La 6ª invitación es bloqueada con modal UX claro.
- **SC-007**: Post-spec, el F-014 fix sigue intacto: request con `final_price` manipulado al checkout retorna precio real del plan (no el manipulado).
- **SC-008**: Post-spec, la página de planes carga en menos de 2 segundos en conexión estándar (sin performance regression vs la página actual).
- **SC-009**: Post-spec, la duración total del ciclo de implementación (plan + tasks + implement + deploy + smoke) no excede las **12 horas** de trabajo técnico partibles en 2-3 sesiones.

---

## Assumptions

- **A-01**: Los precios ($0 / $14.990 / $24.990 / $39.990) son definitivos para el launch y NO van a cambiar durante el desarrollo del spec. Si cambian después, se aplican con UPDATE simple en DB.
- **A-02**: Los límites numéricos (5 pacientes / 15 citas / 5 dentistas / 3 sillones) son firmes. Si la práctica demuestra que son muy estrictos o muy laxos, se ajustan post-launch basado en data de uso real.
- **A-03**: El descuento anual del 15% es estándar del mercado SaaS B2B Chile. No se ajusta hasta tener ≥6 meses de data de conversión mensual vs anual.
- **A-04**: El cupón `BETA-3M-2026` es para los primeros 30 dentistas (max_uses). Si se necesitan más slots beta, se crea un nuevo cupón con código variante.
- **A-05**: El F-014 fix del spec 020 (validación server-side de precio) se preserva intacto. Ningún edit en las edge functions MP debe afectarlo.
- **A-06**: La tabla `therapist_subscriptions` existente tiene las columnas necesarias para trackear `current_renewal_count` mediante ALTER ADD COLUMN (no requiere nueva tabla separada).
- **A-07**: MercadoPago procesa correctamente pagos anuales únicos de montos en rango de hasta $500.000 CLP (precios anuales están por debajo). Sin límites de procesamiento MP conocidos en este rango.
- **A-08**: La decisión de NO hacer proración al cambiar de plan mid-ciclo es aceptable para el MVP. Usuarios que suben esperan hasta el próximo ciclo para el cobro ajustado. Post-launch se puede refinar.
- **A-09**: El plan placeholder `profesional` existente (spec 020 smoke test) puede ser transformado en `individual` con UPDATE sin romper nada, porque no hay suscripciones pagadas reales (Query η de spec 019 confirmó 0 pagos reales MP procesados en DentalSpot).
- **A-10**: El Triage IA se mantiene deshabilitado del UX actual pero su código backend no se elimina — se preserva para activación futura (Fase A pivot). Este spec NO toca triage IA.
- **A-11**: La enforcement del `appointment_limit` usa mes calendario (resetea el 1º), no rolling 30 días, por simplicidad de implementación y UX claro para el usuario.
- **A-12**: El dominio `dentalspot.cl` sigue respondiendo correctamente (verificado spec 020). Los redirects post-checkout MP continúan funcionando.

---

## Out of Scope

- **Triage IA feature en planes** — diferido a Fase A pivot (spec futuro). Código backend preservado, UX oculto.
- **Downgrade flow detallado** — si un usuario baja de plan, este spec permite hacerlo técnicamente pero NO implementa UX de "data migration": qué pasa con pacientes 6+ si Individual → Free, qué pasa con dentistas 6+ si Clínica Pro → Individual. Decisión simplificada: bloquear downgrade si el uso excede límites del plan nuevo.
- **Proración al cambiar plan mid-ciclo** — MVP simplifica: cambios aplican en el próximo ciclo de cobro. Sin reembolsos parciales.
- **Features enterprise que diferencien Premium vs Pro más allá de límites** — por ahora Premium = Pro + límites ∞. Features exclusivas (reports avanzados, API, priority support, multi-clínica, etc.) se agregan en specs futuros.
- **Fixes de seguridad MP restantes** (F-001 signature, F-002 idempotency, F-003 silent-200, F-005 dunning) — meta-spec `fix-mercadopago-critical-bugs` separado. Este spec acepta los riesgos conocidos pre-launch (volumen bajo, 0 pagos reales, monitoring manual).
- **Tier de "Enterprise Custom"** para clínicas super-grandes (10+ dentistas con acuerdos especiales) — escalada manual con admin, no tier público.
- **Integración de Stripe u otro gateway alternativo** — solo MercadoPago en este spec.
- **Facturación electrónica (boletas SII)** — fuera de scope, decisión separada de compliance tributario.
- **Multi-currency** — solo CLP. USD/ARS/etc. son specs futuros.
- **Impuestos (IVA) automáticos** — precio en tabla es sin IVA, el IVA se agrega en display UI y checkout. No hay cálculo automático server-side del IVA (MP maneja su propia lógica de facturación).
- **Test de pago anual real end-to-end con MP** (Anual requires preapproval o suscripción MP que no está 100% diseñada en el código actual) — smoke test puede ser solo conceptual si MP sandbox no soporta el flow anual fácil.

---

## Dependencies

- **Spec 019 audit MercadoPago** (concluido) — scope + reveladores de BLOCKERs pre-launch.
- **Spec 020 migrate-mp-brand** (concluido) — cuenta MP DentalSpot activa con Access Token sandbox + webhook configurado.
- **Spec 021 cleanup FonoKit** (concluido) — repo limpio de branding legacy, solo código DentalSpot funcional.
- **Tabla `subscription_plans` existente** — se extiende con nuevas columnas.
- **Tabla `discount_coupons` existente** — se extiende con `max_renewals`.
- **Tabla `therapist_subscriptions` existente** — se extiende con `current_renewal_count`.
- **Edge function `create-mp-checkout`** (post-spec 020) — se extiende con lógica de renewal tracking.
- **Edge function `mercadopago-webhook`** (post-spec 020) — se extiende para incrementar counter + respetar annual cycle.
- **F-014 fix precedente** (commit 3593b12) — preservación mandatoria.

---

## References

- Spec 019 MP audit: `specs/019-audit-mercadopago-flow/data-model.md`
- Spec 020 MP rebrand: `specs/020-migrate-mp-brand/`
- Spec 021 FonoKit cleanup: `specs/021-cleanup-fonokit-legacy/`
- Session log diagnóstico: `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md`
- F-014 fix: commit `3593b12`
- Constitution: `.specify/memory/constitution.md` §I, §II, §IV, §V, §VI
- Architecture: `.specify/memory/architecture.md` §"MP brand migration (spec 020)" + §"Legacy FonoKit cleanup (spec 021)"
- Research competencia: sesión 2026-04-22 (CIMADent, Dentalink, AgendaPro, Dentalware via WebSearch)
