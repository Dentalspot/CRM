import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Settings,
  Building2,
  Package,
  Activity,
  LogOut,
  Tag,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/admin/dashboard' },
  { icon: Package, label: 'Planes', to: '/admin/plans' },
  { icon: Activity, label: 'Suscripciones', to: '/admin/subscriptions' },
  { icon: Tag, label: 'Cupones', to: '/admin/coupons' },
  { icon: Users, label: 'Terapeutas', to: '/admin/therapists' },
  { icon: Sparkles, label: 'Gestor de Especialidades', to: '/admin/especialidades', requiredRole: ['admin', 'specialty_admin'] },
  { icon: Building2, label: 'Clínicas', to: '/admin/clinics' },
  { icon: CreditCard, label: 'Pagos', to: '/admin/payments' },
  { icon: FileText, label: 'Reportes', to: '/admin/reports' },
  { icon: Settings, label: 'Configuración', to: '/admin/settings' },
];

const AdminSidebar = () => {
  const { logout, user } = useAuth();
  
  // Helper to check role if item has requiredRole
  const hasAccess = (item) => {
    if (!item.requiredRole) return true;
    const userRole = user?.role || user?.user_metadata?.role;
    // Assuming 'admin' includes everything, but explicitly checking for 'specialty_admin' too
    if (userRole === 'admin') return true;
    return item.requiredRole.includes(userRole);
  };

  return (
    <aside className="hidden w-64 flex-col border-r bg-slate-900 text-slate-50 md:flex">
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <span className="text-lg font-bold tracking-tight text-blue-400">
          Admin<span className="text-white">Panel</span>
        </span>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {navItems.filter(hasAccess).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950/30 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;