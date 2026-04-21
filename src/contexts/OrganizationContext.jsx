import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_PREFIX = 'dentalspot_current_org:';

const OrganizationContext = createContext({});

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganizationId, setCurrentOrgId] = useState(null);
  const [userOrgRoles, setUserOrgRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const storageKey = user?.id ? `${STORAGE_PREFIX}${user.id}` : null;

  const previousUserIdRef = useRef(null);
  useEffect(() => {
    if (user?.id) {
      previousUserIdRef.current = user.id;
    } else if (previousUserIdRef.current) {
      // Transición user → null: logout detectado. Limpiar storage del user previo.
      try {
        sessionStorage.removeItem(`${STORAGE_PREFIX}${previousUserIdRef.current}`);
      } catch { /* private mode */ }
      previousUserIdRef.current = null;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setOrganizations([]);
      setCurrentOrgId(null);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations(id, name)')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const uniqueOrgs = [];
      const seen = new Set();
      for (const row of (data || [])) {
        if (!seen.has(row.organization_id)) {
          seen.add(row.organization_id);
          uniqueOrgs.push({
            id: row.organization_id,
            name: row.organizations?.name || '',
          });
        }
      }

      // Guardar todos los roles del usuario (deduplicados)
      const allRoles = [...new Set((data || []).map(r => r.role))];
      setUserOrgRoles(allRoles);

      setOrganizations(uniqueOrgs);

      if (uniqueOrgs.length === 1) {
        setCurrentOrgId(uniqueOrgs[0].id);
      } else if (uniqueOrgs.length > 1 && storageKey) {
        let stored = null;
        try { stored = sessionStorage.getItem(storageKey); } catch { /* private mode */ }
        if (stored && uniqueOrgs.some(o => o.id === stored)) {
          setCurrentOrgId(stored);
        } else {
          // Multi-org sin stored válido: default a primera org + persistir
          // (evita dropdown "Seleccionar organización" ambiguo en primer login)
          const defaultOrgId = uniqueOrgs[0].id;
          setCurrentOrgId(defaultOrgId);
          try {
            if (stored) sessionStorage.removeItem(storageKey);
            sessionStorage.setItem(storageKey, defaultOrgId);
          } catch { /* private mode: degrada a in-memory */ }
        }
      }

      setLoading(false);
    };

    load();
  }, [user?.id, storageKey]);

  const setCurrentOrganizationId = useCallback((orgId) => {
    setCurrentOrgId(orgId);
    if (storageKey) {
      if (orgId) {
        sessionStorage.setItem(storageKey, orgId);
      } else {
        sessionStorage.removeItem(storageKey);
      }
    }
  }, [storageKey]);

  const isMultiOrg = organizations.length > 1;
  const currentOrganization = organizations.find(o => o.id === currentOrganizationId) || null;

  // Rol operativo efectivo: dentist > clinic_admin > assistant
  const effectiveRole = userOrgRoles.includes('dentist')
    ? 'therapist'
    : userOrgRoles.includes('clinic_admin')
      ? 'clinic'
      : userOrgRoles.includes('assistant')
        ? 'assistant'
        : null;

  const value = {
    currentOrganizationId,
    currentOrganization,
    organizations,
    isMultiOrg,
    loading,
    setCurrentOrganizationId,
    userOrgRoles,
    effectiveRole,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
