import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
/**
 * Layout specifically for the Admin Panel.
 * Includes the AdminSidebar and AdminHeader.
 * AdminPermissionProvider is already at App.jsx level.
 */
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={handleSidebarClose}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader onMenuToggle={handleMenuToggle} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/5">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;