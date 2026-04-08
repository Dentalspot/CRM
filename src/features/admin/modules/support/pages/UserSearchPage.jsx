import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import UserSearchResults from '../components/UserSearchResults';
import { useUserSearch } from '../hooks/useUserSearch';

/**
 * Page to search users for support.
 */
const UserSearchPage = () => {
  const { results, search } = useUserSearch();

  return (
    <PermissionGuard module="support" action="read">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Buscar Usuario</h1>
        <input 
          type="text" 
          className="border p-2 rounded" 
          placeholder="Email, ID, Nombre..." 
          onChange={(e) => search(e.target.value)}
        />
        <UserSearchResults results={results} />
      </div>
    </PermissionGuard>
  );
};

export default UserSearchPage;