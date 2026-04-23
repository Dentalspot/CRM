# Launch beta — DentalSpot

**Estado actual**: 🟡 **PRE-LAUNCH** — preparado, pendiente ejecución del preflight + definir canal comunicación.

**Scope beta**: 5-10 dentistas usando cupón `BETA-3M-2026` (100% off, 3 meses de renovación). Ventana: 180 días desde 2026-04-22 (expira ~2026-10-19). Primeros 30 usos permitidos.

---

## Cómo usar estos docs

Orden recomendado:

1. **`checklist-preflight.md`** — [TÚ, antes de invitar] Marcá los ~25 items antes de mandar la primera invitación. Detecta fallos conocidos antes de que los encuentre un dentista.
2. **`onboarding-dentista.md`** — [Dentista, al invitar] 1-pager enviable por WhatsApp/email. Explica qué es DentalSpot, el beta, y los 3 pasos para arrancar.
3. **`metrics-manual.md`** — [TÚ, cadencia semanal] Queries SQL copy-paste para saber si el beta está funcionando (subs activas, signups, errores).

---

## Criterios mínimos para empezar

No inviteís a nadie hasta que estos 4 bloqueos estén en verde (detalle en `checklist-preflight.md`):

- [ ] Preflight DB: cupón BETA-3M-2026 verificado activo con `max_renewals=3`
- [ ] Preflight enforcement: dentista test Free no puede crear 6° paciente
- [ ] Preflight MP: pago sandbox aprobado → sub queda `active` en DB
- [ ] Preflight comunicación: canal soporte definido + template de invitación listo

---

## Criterios "verde": cuándo el beta está yendo bien

Revisar semanal con `metrics-manual.md`. Verde si:

- ≥1 signup por semana los primeros 30 días
- 0 errores críticos en Supabase logs (webhook, create-mp-checkout)
- ≥50% de signups crean ≥1 paciente (= actually using)
- 0 tickets de soporte sobre "no puedo pagar" o "no puedo crear paciente"

Rojo si:
- >20% de invitados no completan signup
- Cualquier error 500 repetido en edge functions
- Churn manifestado antes de los 3 meses del cupón

---

## Salida del beta (futuro)

Cuando ≥5 dentistas lleven >1 mes activos sin errores:
1. Ejecutar meta-spec `fix-mercadopago-critical-bugs` P0 (hardening pre-scale)
2. Phase F smoke E2E con dentistas reales
3. Abrir invitaciones sin cupón (pago real) a 10-20 dentistas más
4. Decisión: scale a público general con paid ads

Ver `CLAUDE.md` §Active feature + `docs/session-logs/2026-04-22-pm-enforcement-branding-schema.md` §Follow-ups para roadmap completo.
