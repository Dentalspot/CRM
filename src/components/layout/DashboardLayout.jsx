import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import LegalAcceptanceGate from '@/features/legal/components/LegalAcceptanceGate';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { USER_ROLES } from '@/constants/roles';
import {
  LayoutDashboard,
  User,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
  Activity,
  Users,
  CreditCard,
  ShieldCheck
} from 'lucide-react';

const therapistNavLinks = [
  { href: '/dashboard/therapist', label: 'Mi Panel', icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'Mi Perfil', icon: User },
  { href: '/dashboard/calendar', label: 'Calendario', icon: Calendar },
  { href: '/dashboard/patients', label: 'Mis Pacientes', icon: Users },
  { href: '/dashboard/reports', label: 'Reportes', icon: FileText },
  { href: '/dashboard/membership', label: 'Mi Plan', icon: CreditCard },
];

const patientNavLinks = [
  { href: '/dashboard/patient', label: 'Mi Panel', icon: LayoutDashboard },
  { href: '/dashboard/my-agenda', label: 'Mi Agenda', icon: Calendar },
  { href: '/dashboard/my-activities', label: 'Actividades', icon: Activity },
  { href: '/dashboard/questions', label: 'Preguntas', icon: MessageSquare },
  { href: '/dashboard/reports', label: 'Documentos', icon: FileText },
];

const adminNavLinks = [
  { href: '/dashboard/admin', label: 'Admin Panel', icon: LayoutDashboard },
  { href: '/dashboard/admin/memberships', label: 'Membresías', icon: ShieldCheck },
  { href: '/dashboard/patients', label: 'Pacientes', icon: Users },
  { href: '/dashboard/therapists', label: 'Terapeutas', icon: Users },
];

const commonLinks = [
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
];

const DashboardLayout = () => {
  const { profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  let navLinks = [];
  switch (profile?.role) {
    case USER_ROLES.THERAPIST:
      navLinks = therapistNavLinks;
      break;
    case USER_ROLES.PATIENT:
      navLinks = patientNavLinks;
      break;
    case USER_ROLES.ADMIN:
      navLinks = adminNavLinks;
      break;
    default:
      navLinks = [];
  }

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <OrganizationProvider>
      <div className="flex h-screen bg-background">
        <Sidebar
          navLinks={navLinks}
          commonLinks={commonLinks}
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
          <DashboardHeader onMenuToggle={handleMenuToggle} />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/5">
            <Outlet />
          </main>
        </div>

        {/* Interceptor de re-aceptación legal (solo se muestra si hay docs pendientes) */}
        <LegalAcceptanceGate />
      </div>
    </OrganizationProvider>
  );
};

export default DashboardLayout;