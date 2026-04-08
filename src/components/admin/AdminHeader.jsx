import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AdminHeader = ({ title }) => {
  const { user, profile } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm dark:bg-slate-950 dark:border-slate-800">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>
        </Button>
        
        <div className="flex items-center gap-3 pl-4 border-l dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {profile?.full_name || 'Admin'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Super Administrador</p>
          </div>
          <Avatar>
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-blue-600 text-white">SA</AvatarFallback>
          </Avatar>
        </div>
        
        <Link to="/" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
          Ver sitio
        </Link>
      </div>
    </header>
  );
};

export default AdminHeader;