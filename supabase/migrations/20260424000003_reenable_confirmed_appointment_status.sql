-- ============================================================================
-- Migration: re-agregar 'confirmed' al appointments_status_check
-- ----------------------------------------------------------------------------
-- Spec: 024-assistant-rich-calendar (detectado durante smoke test 2026-04-24)
--
-- Contexto:
-- - Migration 20260414000004 eliminó 'confirmed' del CHECK constraint de
--   appointments.status, dejando solo scheduled/completed/cancelled/no-show.
-- - Sin embargo, el componente WeeklyAgendaView YA soporta 'confirmed' con
--   renderizado específico (bg-blue-100 border-blue-500 text-blue-800).
-- - Funciones SQL legacy (baseline_schema líneas 2205, 2783, 2944, 4228,
--   4336) también referencian 'confirmed'.
-- - User pidió durante smoke 024 tener "Confirmada" como estado visible
--   para el asistente (flujo de recepción: paciente llama a confirmar).
--
-- Decisión: restablecer 'confirmed' como valor válido. Conviven los 5 estados:
--   - scheduled  → recién agendada (default)
--   - confirmed  → paciente confirmó (azul)
--   - completed  → atención finalizada (verde)
--   - cancelled  → cancelada (rojo)
--   - no-show    → paciente no asistió (café/amber)
--
-- Alternativa considerada: usar confirmation_status separado (pending/confirmed/
-- cancelled). Descartado: más complejo en UI, y WeeklyAgendaView ya está
-- preparado para status='confirmed'.
-- ============================================================================

ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'));
