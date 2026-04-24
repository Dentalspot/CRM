-- ============================================================================
-- Migration: add responsible_role column to clinics
-- ----------------------------------------------------------------------------
-- Feature: rediseño "Mi Clínica" — unifica datos de clínica + responsable legal
--   en un solo tab, eliminando el incoherente "Sobre Mí" para users clinic.
--
-- Contexto Ley 20.584 art. 5 Chile:
--   Todo establecimiento de salud debe identificar al responsable del mismo
--   (director técnico / dueño / administrador). Este campo captura ese rol
--   para cumplimiento legal + claridad operativa.
--
-- Valores esperados (enforcement client-side en ResponsibleCard.jsx, no enum
-- DB para permitir evolución sin migration):
--   - 'owner'               → Dueño/a
--   - 'technical_director'  → Director/a técnico/a
--   - 'administrator'       → Administrador/a
--   - 'other'               → Otro (campo libre en UI, persistido como 'other')
--
-- Nullable por default — clínicas existentes quedan sin valor hasta que el
-- admin edite desde la UI. El form puede pedirlo pero no es hard-blocker DB.
-- ============================================================================

ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS responsible_role text;

COMMENT ON COLUMN public.clinics.responsible_role IS
  'Rol del responsable legal del establecimiento (Ley 20.584 art. 5). '
  'Valores: owner | technical_director | administrator | other. '
  'Enforcement y labels en UI.';
