import React from 'react';
import { useLegalAcceptance } from '../hooks/useLegalAcceptance';
import LegalReacceptModal from './LegalReacceptModal';

/**
 * Componente que se monta en el layout del dashboard y muestra el modal
 * de re-aceptación legal SOLO si el usuario tiene documentos pendientes.
 *
 * Es self-contained: no rompe el layout si no hay nada pendiente.
 */
const LegalAcceptanceGate = () => {
  const { pending, needsAcceptance, accepting, acceptAll } = useLegalAcceptance();

  if (!needsAcceptance) return null;

  return (
    <LegalReacceptModal
      open={true}
      pending={pending}
      accepting={accepting}
      onAccept={acceptAll}
    />
  );
};

export default LegalAcceptanceGate;
