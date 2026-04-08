import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from './components/NotificationBell';
import UserMenu from './components/UserMenu';
import Breadcrumb from './components/Breadcrumb';

const AdminHeader = ({ 
  onToggleSidebar, 
  notifications, 
  markNotificationAsRead, 
  markAllAsRead 
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b bg-background/95 backdrop-blur px-6 shadow-sm">
      {/* Mobile Sidebar Toggle */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden -ml-2"
        onClick={onToggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs */}
      <div className="hidden md:flex">
        <Breadcrumb />
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <NotificationBell 
          notifications={notifications} 
          onMarkAsRead={markNotificationAsRead}
          onMarkAllAsRead={markAllAsRead}
        />
        <div className="h-6 w-px bg-border mx-1" />
        <UserMenu />
      </div>
    </header>
  );
};

export default AdminHeader;