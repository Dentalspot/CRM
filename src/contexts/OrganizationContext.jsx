import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [loading, setLoading] = useState(true);

  const storageKey = user?.id ? `${STORAGE_PREFIX}${user.id}` : null;

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

      setOrganizations(uniqueOrgs);

      if (uniqueOrgs.length === 1) {
        setCurrentOrgId(uniqueOrgs[0].id);
      } else if (uniqueOrgs.length > 1 && storageKey) {
        const stored = sessionStorage.getItem(storageKey);
        if (stored && uniqueOrgs.some(o => o.id === stored)) {
          setCurrentOrgId(stored);
        } else {
          // Valor inválido o ausente: limpiar y dejar null
          if (stored) sessionStorage.removeItem(storageKey);
          setCurrentOrgId(null);
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

  const value = {
    currentOrganizationId,
    currentOrganization,
    organizations,
    isMultiOrg,
    loading,
    setCurrentOrganizationId,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
