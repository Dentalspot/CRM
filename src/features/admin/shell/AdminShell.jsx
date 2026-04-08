import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAdminShell } from './useAdminShell';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * Main Layout for Admin Dashboard
 */
const AdminShell = () => {
  const {
    sidebarOpen,
    isMobileOpen,
    expandedGroups,
    searchQuery,
    notifications,
    filteredStructure,
    toggleSidebar,
    toggleMobileSidebar,
    setIsMobileOpen,
    toggleGroup,
    setSearchQuery,
    markNotificationAsRead,
    markAllAsRead
  } = useAdminShell();

  // Desktop check using media query hook
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Always show AdminPanel sidebar for all admin roles
  const showAdminSidebar = filteredStructure.length > 0;

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950">
      {/* Desktop Sidebar — only for multi-group admins */}
      {isDesktop && showAdminSidebar && (
        <div>
          <AdminSidebar
            collapsed={!sidebarOpen}
            structure={filteredStructure}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            expandedGroups={expandedGroups}
            toggleGroup={toggleGroup}
          />
        </div>
      )}

      {/* Mobile Sidebar (Sheet) */}
      {showAdminSidebar && (
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <AdminSidebar
            collapsed={false}
            structure={filteredStructure}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            expandedGroups={expandedGroups}
            toggleGroup={toggleGroup}
            className="w-full h-full border-none"
          />
        </SheetContent>
      </Sheet>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300">
        <AdminHeader 
          onToggleSidebar={toggleMobileSidebar}
          notifications={notifications}
          markNotificationAsRead={markNotificationAsRead}
          markAllAsRead={markAllAsRead}
        />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminShell;