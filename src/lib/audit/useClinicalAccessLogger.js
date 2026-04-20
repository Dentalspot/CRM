import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { logClinicalAccess } from './clinicalAuditLogger';

// Dedupe por hora: decisión anti-spam de UX, NO un control de seguridad.
// Evita registrar re-aperturas repetidas del mismo recurso por el mismo usuario
// dentro de la misma hora (p.ej. navegar ficha → odontograma → ficha).
function hourBucketKey({ userId, patientId, action, resourceType, resourceId }) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  return `clinical_audit:${userId}:${patientId}:${action}:${resourceType}:${resourceId ?? ''}:${y}-${m}-${d}-${h}`;
}

export default function useClinicalAccessLogger({
  patientId,
  action,
  resourceType,
  resourceId = null,
}) {
  const { user } = useAuth();
  const { currentOrganizationId, userOrgRoles } = useOrganization();
  const loggedRef = useRef(null);

  useEffect(() => {
    if (!patientId || !user?.id || !currentOrganizationId) return;

    const isClinicalRole =
      Array.isArray(userOrgRoles) &&
      (userOrgRoles.includes('dentist') ||
        userOrgRoles.includes('clinic_admin') ||
        userOrgRoles.includes('assistant'));
    if (!isClinicalRole) return;

    const tupleKey = `${patientId}|${action}|${resourceType}|${resourceId ?? ''}`;
    if (loggedRef.current === tupleKey) return;

    const bucketKey = hourBucketKey({
      userId: user.id,
      patientId,
      action,
      resourceType,
      resourceId,
    });

    try {
      if (sessionStorage.getItem(bucketKey)) {
        loggedRef.current = tupleKey;
        return;
      }
    } catch (_) {
      // sessionStorage puede fallar en modo privado; continuamos sin bucket.
    }

    loggedRef.current = tupleKey;

    logClinicalAccess({
      organization_id: currentOrganizationId,
      user_id: user.id,
      patient_id: patientId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      grant_id: null,
      reason: null,
      ip_address: null,
    }).then((res) => {
      if (res.ok) {
        try {
          sessionStorage.setItem(bucketKey, '1');
        } catch (_) {
          // noop
        }
      }
    });
  }, [patientId, action, resourceType, resourceId, user?.id, currentOrganizationId, userOrgRoles]);
}
