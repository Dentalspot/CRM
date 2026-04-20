/**
 * Feature flags para Dentalspot.
 *
 * Controla la visibilidad de módulos heredados de FonoKit
 * que no aplican al dominio dental.
 *
 * Etapa 1 — Contención: todos desactivados.
 * Para reactivar un módulo, cambiar su valor a true.
 */
export const FEATURE_FLAGS = {
  // Módulos de evaluación no-dentales (heredados de FonoKit)
  PIE_ESCOLAR: false,
  ADOS2: false,
  ADIR: false,
  TEA: false,
  SENSORIAL_PROFILE: false,

  // Módulo educativo (no-dental, requiere add-on)
  EDUCATOR: false,
};
