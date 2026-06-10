# Quickstart — Treatment Budget With Progress

**Spec**: 030 | **Date**: 2026-06-03

Smoke E2E end-to-end manual con la cuenta de Cristobal Tagle (dentista titular de Odontología Los Álamos) y paciente Solange Vulasich.

---

## Prerrequisitos

- [ ] Migration `20260604000001_budget_items_status_and_audit.sql` aplicada en prod (vía `npx supabase db query --linked < ...`)
- [ ] Frontend Bloque 1+2+5 deployado (o corriendo local con `npm run dev`)
- [ ] Cristobal Tagle puede loguearse (cuenta dentista titular de Los Álamos)
- [ ] Solange Vulasich existe como paciente vinculado a la clínica
- [ ] Los Álamos tiene `clinics.payment_commission_percent` configurado (verificar — si no, default 0)
- [ ] Cristobal tiene catálogo `therapist_services` con al menos: Endodoncia ($80.000), Limpieza ($25.000), Obturación ($30.000)

---

## Smoke 1 — Crear presupuesto desde odontograma (US3)

**Objetivo**: validar que marcar tratamientos en el odontograma crea items automáticamente.

1. Loguearse como Cristobal en `/auth/login`
2. Ir a ficha de Solange → tab Odontograma
3. Marcar tratamiento "Endodoncia" en diente 36
4. **Esperado**:
   - Toast verde "✓ Item agregado al presupuesto — Endodoncia diente 36 — $80.000"
   - Verificar en SQL: `SELECT * FROM treatment_budgets WHERE patient_id = '<solange_uuid>' AND status='draft';` → 1 row con title "Plan de tratamiento — Solange Vulasich"
   - Verificar: `SELECT description, unit_price, status FROM treatment_budget_items WHERE budget_id = '<budget_uuid>';` → 1 row, status='pending', unit_price=80000
5. Marcar "Limpieza" en boca completa (sin diente específico) → similar toast → 2do item creado
6. Marcar "Obturación" en diente 22 → 3er item creado
7. **Esperado total**: 3 items pending, total $135.000

**Pass criterion**: 3 rows en `treatment_budget_items` con `status='pending'` + budget activo en `'draft'`.

---

## Smoke 2 — PostSession lista items pending al cerrar sesión (US1)

**Objetivo**: validar que al marcar cita como completada, modal lista items pending del budget.

1. Cristobal sigue logueado
2. Ir a `/dashboard/agenda` (calendario dentista) o `/dashboard/clinic/agendas` si es admin+dentista (priority swap spec 028)
3. Crear nueva cita con Solange para hoy a las 14:00 en box 1
4. Click sobre la cita → cambiar estado a "Completada"
5. **Esperado**: PostSessionModal se abre automáticamente (callback `onSessionCompleted` ya cableado en spec 028)
6. Step 1 "Nota" — escribir resumen "Se realizó endodoncia y limpieza"
7. Click "Siguiente"
8. **Esperado**: Step 2 "Hecho" muestra checklist con 3 items pending:
   - [ ] Endodoncia diente 36 — $80.000
   - [ ] Limpieza — $25.000
   - [ ] Obturación diente 22 — $30.000

**Pass criterion**: los 3 items aparecen como pending en el checklist.

---

## Smoke 3 — Tildar 2 items + UI de monto sugerido (US1)

**Objetivo**: validar UPDATE batch + cálculo de monto.

1. Continuar desde Smoke 2
2. Tildar checkboxes de "Endodoncia" + "Limpieza" (NO Obturación)
3. **Esperado footer**: "Total seleccionado: $105.000" + botón "Continuar al pago"
4. Click "Continuar al pago"
5. **Esperado**:
   - 2 items en DB pasan a `status='completed'`, `completed_at=now()`, `completed_in_appointment_id=<apt_id>`
   - Verificar SQL: `SELECT description, status, completed_at FROM treatment_budget_items WHERE budget_id='<uuid>' ORDER BY sort_order;`
   - Esperado: 2 rows `completed`, 1 row `pending` (Obturación)
6. Step 3 "Pago" abre con `monto` pre-rellenado a `$105.000`

**Pass criterion**: monto pre-cargado = $105.000 exacto.

---

## Smoke 4 — Registrar pago efectivo (US2)

**Objetivo**: validar INSERT en `patient_payments` + audit log + balance.

1. Continuar desde Smoke 3
2. En step Pago: método = "Efectivo", monto = $105.000 (default), fecha = hoy
3. Click "Registrar pago"
4. **Esperado**:
   - Toast verde "✓ Pago registrado — $105.000 efectivo"
   - Verificar SQL: `SELECT amount, payment_method, status, budget_id, appointment_id FROM patient_payments WHERE patient_id='<solange>' ORDER BY created_at DESC LIMIT 1;`
   - Esperado: 1 row, amount=105000, payment_method='efectivo', status='completed', budget_id NOT NULL, appointment_id = cita actual
5. Verificar audit log:
   - `SELECT action, resource_type, reason FROM clinical_audit_log WHERE patient_id='<solange>' AND created_at > now() - interval '5 minutes' ORDER BY created_at DESC;`
   - Esperado: al menos 4 entries — 2 `update budget_item` (uno por item tildado), 1 `update appointment` (cita completada, spec 028) y 1 `create payment`
6. Step 4 "Siguiente cita" — saltar
7. Step 5 "Done" — cerrar modal

**Pass criterion**: pago en DB + 4 entries de audit log.

---

## Smoke 5 — Verificar balance actualizado en v_budget_balance (SC-007)

**Objetivo**: validar VIEW + performance < 500ms.

```sql
SELECT budget_id, title, subtotal, total, total_paid, balance_due, payment_count
FROM v_budget_balance
WHERE patient_id = '<solange_uuid>';
```

**Esperado**:
- subtotal = 135000 (todos los items, no solo completed)
- total = 135000 (sin descuento)
- total_paid = 105000
- balance_due = 30000
- payment_count = 1

**Pass criterion**: balance_due = $30.000 ($30k = la obturación pendiente).

---

## Smoke 6 — Reversión autorizada (FR-016, US1.4)

**Objetivo**: validar trigger BEFORE UPDATE rechaza reversión no autorizada y acepta la autorizada.

### 6a — Cristobal revierte su propio item (debe pasar)

1. Cristobal abre PostSessionModal de la cita anterior (re-edit)
2. En step "Hecho", des-tildar "Limpieza"
3. **Esperado**:
   - Toast verde "Item revertido"
   - Item vuelve a `status='pending'`, `completed_at=NULL`, `completed_in_appointment_id=NULL`
   - Audit log entry `update budget_item` con reason `reverted_by:<cristobal>;original_appointment:<apt>`

### 6b — Pablo Ceballos intenta revertir item de Cristobal (debe fallar)

1. Logout Cristobal → login Pablo Ceballos (otro dentista de la org)
2. Abrir mismo budget de Solange
3. Intentar des-tildar "Endodoncia"
4. **Esperado**:
   - Toast rojo "No tenés permiso para revertir este item. Pedile a Cristobal Tagle (o a un admin) que lo haga."
   - Item NO cambia en DB
   - Trigger `check_budget_item_revert` lanzó `unauthorized_revert`

### 6c — Admin de Los Álamos revierte (debe pasar)

1. Logout Pablo → login Danissa como `clinic_admin` (o el admin que corresponda)
2. Abrir budget de Solange
3. Des-tildar "Endodoncia"
4. **Esperado**: pasa OK (admin tiene autoridad)

**Pass criterion**: 3 sub-smokes pasan según predicción.

---

## Smoke 7 — Edge case "paciente sin budget" (FR-022)

**Objetivo**: validar UI alternativa "crear rápido".

1. Crear paciente nuevo "Test Sin Budget" (cuenta nueva, sin odontograma previo)
2. Crear cita + marcar completada
3. PostSessionModal abre
4. Step "Hecho": **esperado** mostrar UI alternativa con dos opciones:
   - "Crear presupuesto rápido"
   - "Saltar al pago"
5. Click "Crear presupuesto rápido" → inputs descripción + precio
6. Llenar "Consulta inicial" + $20.000 → "Crear y marcar completado"
7. **Esperado**:
   - Budget creado en draft con 1 item completed
   - Avanza a step Pago con monto $20.000 pre-rellenado
8. Registrar pago

**Pass criterion**: edge case maneja gracefully sin crashear.

---

## Smoke 8 — Assistant NO puede UPDATE items (FR-014)

**Objetivo**: validar RLS rechaza assistant.

1. Loguearse como Kobe Bean Bryant (asistente de prueba, ya existe en `organization_members` con `is_active=false`)
2. Si está inactivo, activarlo temporalmente: `UPDATE organization_members SET is_active=true WHERE user_id='<kobe>';`
3. Abrir budget de Solange (puede leer, ver checklist)
4. Intentar tildar un item pending → **Esperado**:
   - Frontend: el checkbox podría estar disabled (UX), pero idealmente probar bypass directo
   - Bypass via console: `await supabase.from('treatment_budget_items').update({status:'completed'}).eq('id','<item>')`
   - Esperado: error RLS `new row violates row-level security policy`
5. Re-desactivar Kobe: `UPDATE organization_members SET is_active=false WHERE user_id='<kobe>';`

**Pass criterion**: RLS bloquea la operación.

---

## Smoke 9 — Audit logs no editables (FR-020, Constitution §III)

**Objetivo**: validar trigger append-only.

```sql
-- Intentar UPDATE de un audit log (debe fallar)
UPDATE public.clinical_audit_log
SET reason = 'malicious_tamper'
WHERE patient_id = '<solange>'
ORDER BY created_at DESC LIMIT 1;
```

**Esperado**: error del trigger `trg_audit_log_no_update` "audit log is append-only".

**Pass criterion**: UPDATE rechazado.

---

## Smoke 10 — Performance (SC-004, SC-007)

**Objetivo**: validar tiempos meta.

1. Cronometrar flow completo Smoke 2-4 (cierre + tildar 2 + cobro)
2. **Esperado**: < 90 segundos total (SC-004)
3. Cronometrar fetch `v_budget_balance` con 50 items en un budget de prueba
4. **Esperado**: < 500ms (SC-007)

**Pass criterion**: ambos tiempos meta cumplidos.

---

## Cleanup post-smoke

```sql
-- Revertir cambios del smoke en Solange
DELETE FROM patient_payments WHERE patient_id='<solange>' AND notes LIKE '%smoke%';
DELETE FROM treatment_budget_items WHERE budget_id IN (
  SELECT id FROM treatment_budgets WHERE patient_id='<solange>' AND title LIKE 'Plan de tratamiento%'
);
DELETE FROM treatment_budgets WHERE patient_id='<solange>' AND title LIKE 'Plan de tratamiento%';
-- NO borrar audit logs (append-only).
```

---

## Sign-off

- [ ] Smoke 1 — Crear presupuesto desde odontograma
- [ ] Smoke 2 — PostSession lista items pending
- [ ] Smoke 3 — Tildar 2 items + monto sugerido
- [ ] Smoke 4 — Registrar pago efectivo + audit log
- [ ] Smoke 5 — Balance actualizado en VIEW
- [ ] Smoke 6 — Reversión autorizada (6a + 6b + 6c)
- [ ] Smoke 7 — Edge case sin budget
- [ ] Smoke 8 — Assistant RLS rechazada
- [ ] Smoke 9 — Audit append-only
- [ ] Smoke 10 — Performance < 90s + < 500ms

Reportar a Danissa con screenshots de:
- v_budget_balance row final (balance_due = $30.000)
- audit log de los 4 events
- toasts verdes de cada operación
