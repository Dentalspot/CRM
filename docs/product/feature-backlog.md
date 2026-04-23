# Feature Backlog — DentalSpot

**Última actualización**: 2026-04-23

Registro oficial de features que **existen conceptualmente en el código** (definidas en `PLAN_FEATURES` / `FEATURE_INFO`, listadas en pricing anterior, etc.) pero están **diferidas intencionalmente**. Este doc existe para:

1. Evitar que se vuelvan a prometer en UI / pricing sin implementarlas
2. Tener un lugar claro al que volver cuando se decide activarlas
3. Capturar el "por qué no se activan todavía"

**Regla**: si una feature vive acá, está en `false` en todos los planes de `PLAN_FEATURES` y NO aparece en PricingPage.jsx ni UpgradeModal priority list. Si eventualmente se implementa, sacarla de este doc y activarla en el plan correspondiente.

---

## 🟡 WhatsApp — Recordatorios + Asistente IA

**Estado**: Diferido, sin fecha · **Intención**: ALTA, es value prop del producto

### Qué es
- **Fase 1**: recordatorios automáticos de cita por WhatsApp al paciente (24h + 2h antes)
- **Fase 2**: asistente IA por WhatsApp que responde consultas de paciente (precios, disponibilidad, FAQ) con data real del dentista

### Por qué diferido
- Fase 1 requiere: cuenta WhatsApp Business verificada (Meta), templates pre-aprobados, provider (Twilio o Cloud API direct), scheduler externo (pg_cron ausente), ~2-3 semanas de implementación
- Fase 2 requiere Fase 1 + RAG sobre therapist_services/appointments + LLM integration + safety guardrails, ~4-8 semanas adicionales
- Hoy prometerlo sin implementarlo = falsa publicidad (Ley del Consumidor) + churn inmediato del primer dentista que intente usarlo

### Costo estimado
- Fase 1: $80-120 USD/mes para 10 dentistas (Twilio) — margen OK como feature de plan pagado
- Fase 2: +$7 USD/mes LLM por dentista activo

### Dónde vive el código actualmente
- `src/constants/planFeatures.js`: `whatsappReminders` en FEATURE_INFO con flag `deferred: true`, `false` en todos los planes
- `supportLevel: 'whatsapp'` (era el canal soporte del plan Professional) → cambiado a `'priority'` genérico hasta definir canal soporte

### Lo que NO es esta feature
El código tiene varias referencias legítimas a WhatsApp que **no** son el feature:
- Links `https://wa.me/+56...` en email templates → outbound al WhatsApp personal del dentista (fine, keep)
- Links en landing/SymptomFlow "Prefiero agendar por WhatsApp" → flow alternativo de captura
- `supportLevel` del plan → canal soporte al dentista (aún por definir)

### Plan de activación
1. Definir provider (Twilio para arranque, Meta Cloud API cuando escalemos)
2. Setup Meta Business verification + número WhatsApp Business DentalSpot
3. Aprobar templates de mensaje
4. Spec formal `whatsapp-reminders-phase1` via `/speckit-specify`
5. Implementar reminders + test con 1-2 dentistas voluntarios
6. Activar en planes Pro + Premium (setear a `true`, remover de este backlog)
7. Update pricing + comparison table

---

## 🟡 Marketplace — Comprar y Vender Materiales

**Estado**: Diferido, sin fecha · **Intención**: BAJA-MEDIA, depende de product-market fit

### Qué es
Plataforma donde dentistas:
- **Compran**: plantillas, materiales educativos, recursos clínicos de otros dentistas
- **Venden**: sus propios templates/materiales y ganan comisión

### Por qué diferido
- MVP DentalSpot se enfoca en **cobros dentista → DentalSpot** (suscripciones). Habilitar cobros paciente → dentista o dentista ↔ dentista (marketplace) complica MP integration.
- Diferenciar DentalSpot primero como "mejor agenda + ficha + cobros" antes de meterse en marketplace
- Requiere: onboarding de vendedores, moderación de contenido, sistema de reviews, comisión split MP, facturación dual (comprador + comisión DentalSpot)

### Dónde vive el código
- `src/constants/planFeatures.js`: `marketplaceBuy` y `marketplaceSell` con flag `deferred: true`, `false` en todos los planes
- `src/app/routers/DashboardRouter.jsx`: rutas `/marketplace/*` **siguen existiendo** protegidas por `<PlanGuard feature="marketplace*">`. Como la feature está en `false` en todos los planes, PlanGuard muestra fallback (upgrade prompt). Funcionalmente inaccesible.
- Tablas DB `marketplace_*` existen (baseline schema) pero no se escribe ni consulta desde UI

### Plan de activación
1. Decidir si marketplace es parte del roadmap post-launch
2. Si sí → spec completo con modelo comercial (comisiones, fees, SLA)
3. Setup adicional MP (split payment entre vendor + DentalSpot)
4. Redesign onboarding dentistas como vendors
5. Setear features a `true` en planes Pro/Premium, remover de backlog

**Alternativa**: si se decide que marketplace NO es roadmap, eliminar tablas + rutas + referencias en un cleanup futuro (spec tipo `remove-marketplace-legacy`).

---

## 🟢 Cobros Paciente → Dentista via Plataforma

**Estado**: Diferido, decisión explícita 2026-04-22 · **Intención**: Por definir post-beta

### Qué es
El paciente paga al dentista por sus tratamientos **dentro de DentalSpot** (en vez de que el dentista cobre afuera con Transbank/Flow y DentalSpot se lo pierda como feature).

### Por qué diferido
- Decisión explícita de la founder: "MercadoPago solo para suscripciones de dentistas, marketplace no se habilita aún"
- Agrega complejidad fiscal significativa (boleta electrónica al paciente en nombre del dentista, split fee)
- Requiere integración SII o provider tipo OpenFactura/Haulmer
- Competencia (Dentalink, AgendaPro) SI tiene esto — diferenciador potencial para la segunda etapa

### Dónde vive el código
- `src/features/clinic-dashboard/components/InvoicingPanel.jsx` existe (no auditado a fondo)
- Tablas `marketplace_purchases`, `subscription_payments` existen — no se usan para paciente↔dentista
- `create-mercadopago-preference` edge function (general purpose) hidden behind FEATURE_FLAGS.MARKETPLACE=false

### Plan de activación (post-launch)
1. Validar con beta dentists cuál es el pain real (muchos ya usan Transbank y están OK)
2. Si hay señal → spec de cobros paciente con integración boleta electrónica
3. Modelo comercial: fee por transacción? % MP? Flat mensual?

---

## 📋 Checklist de coherencia (antes de mergear features a este backlog)

Cuando diferís una feature:
- [ ] Setear `false` en todas las entries de `PLAN_FEATURES`
- [ ] Agregar flag `deferred: true` en `FEATURE_INFO`
- [ ] Remover menciones de UI pública (PricingPage.jsx, landing)
- [ ] Remover de priorityFeatures en UpgradeModal
- [ ] Agregar entrada a este doc con: qué es, por qué, costo, cómo vive en código, plan de activación
- [ ] Si la feature tenía rutas, confirmar que PlanGuard las bloquea (fallback o redirect)

Cuando activás una feature:
- [ ] Implementar completamente
- [ ] Test end-to-end
- [ ] Setear `true` en planes correspondientes de `PLAN_FEATURES`
- [ ] Remover flag `deferred: true` de `FEATURE_INFO`
- [ ] Agregar a PricingPage + comparison table
- [ ] Agregar a UpgradeModal priorityFeatures si aplica
- [ ] **Remover entrada de este backlog**
- [ ] Commit claro con "feat(plans): activate <feature> in <planes>"
