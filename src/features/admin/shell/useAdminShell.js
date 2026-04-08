import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAdminPermissions } from '@/contexts/AdminPermissionContext';
import { permissionMap, MODULE_GROUPS, getModulesByGroup } from '@/features/admin/permissions/permissionMap';

/**
 * Hook to manage the Admin Shell state (Sidebar, Search, Notifications)
 */
export function useAdminShell() {
  // --- Sidebar State (Persisted) ---
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_sidebar_open');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  // --- Expanded Groups State (Persisted) ---
  const [expandedGroups, setExpandedGroups] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_sidebar_groups');
      return saved !== null ? JSON.parse(saved) : ['clinical', 'billing', 'marketplace', 'content'];
    }
    return ['clinical', 'billing', 'marketplace', 'content'];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // --- Permissions Context ---
  const { getAccessibleModules, isSuperAdmin, loading: permsLoading } = useAdminPermissions();

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('admin_sidebar_open', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem('admin_sidebar_groups', JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  // --- Actions ---
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const toggleMobileSidebar = useCallback(() => setIsMobileOpen(prev => !prev), []);
  
  const toggleGroup = useCallback((groupKey) => {
    setExpandedGroups(prev => 
      prev.includes(groupKey) 
        ? prev.filter(k => k !== groupKey)
        : [...prev, groupKey]
    );
  }, []);

  // --- Notifications Mock ---
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Nueva venta', message: 'Plan Premium vendido', time: '2 min', read: false },
    { id: 2, title: 'Ticket soporte', message: 'Usuario reporta error login', time: '1h', read: false },
    { id: 3, title: 'Alerta sistema', message: 'Uso de CPU alto', time: '3h', read: true },
  ]);

  const markNotificationAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // --- Filtered Modules Logic ---
  const filteredStructure = useMemo(() => {
    if (permsLoading) return [];

    const accessibleKeys = getAccessibleModules();
    const query = searchQuery.toLowerCase().trim();

    // Modules that inherit access from a parent module
    const INHERIT_PERMISSION = {
      ai_playground: 'ai_tools',
      ai_models: 'ai_tools',
      ai_prompts: 'ai_tools',
      marketing_mission_control: 'marketing',
      marketing_meta_ads: 'marketing',
    };

    // Helper to check if a module is accessible (with inheritance)
    const hasAccess = (key) => {
      if (isSuperAdmin || accessibleKeys.includes('all')) return true;
      if (accessibleKeys.includes(key)) return true;
      const parent = INHERIT_PERMISSION[key];
      return parent ? accessibleKeys.includes(parent) : false;
    };

    // If searching, return flat list of matches
    if (query) {
      return Object.entries(permissionMap)
        .filter(([key, module]) => {
          if (!hasAccess(key)) return false;
          return (
            module.label.toLowerCase().includes(query) ||
            module.description.toLowerCase().includes(query)
          );
        })
        .map(([key, module]) => ({
          type: 'item',
          key,
          ...module
        }));
    }

    // Otherwise return grouped structure
    return Object.entries(MODULE_GROUPS)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([groupKey, groupInfo]) => {
        const modules = getModulesByGroup(groupKey).filter(m => hasAccess(m.key));
        
        if (modules.length === 0) return null;

        return {
          type: 'group',
          key: groupKey,
          label: groupInfo.label,
          items: modules
        };
      })
      .filter(Boolean); // Remove empty groups

  }, [searchQuery, getAccessibleModules, isSuperAdmin, permsLoading]);

  return {
    sidebarOpen,
    isMobileOpen,
    expandedGroups,
    searchQuery,
    notifications,
    filteredStructure,
    toggleSidebar,
    toggleMobileSidebar,
    setSidebarOpen,
    setIsMobileOpen,
    toggleGroup,
    setSearchQuery,
    markNotificationAsRead,
    markAllAsRead,
    isLoading: permsLoading
  };
}