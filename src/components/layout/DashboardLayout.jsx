import React, { useState, useEffect } from 'react';
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
  { href: '/dashboard/calendar', label: 'Agenda', icon: Calendar },
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

  // Bloquear scroll del body cuando el drawer mobile está abierto.
  // En desktop (md+) el sidebar es estático y no necesita lock.
  useEffect(() => {
    if (!sidebarOpen) return;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [sidebarOpen]);

  // Cerrar drawer con Escape (estándar a11y).
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') handleSidebarClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  return (
    <OrganizationProvider>
      <div className="flex h-screen bg-background">
        <Sidebar
          navLinks={navLinks}
          commonLinks={commonLinks}
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
        />

        {/* Backdrop con fade. Mantenemos el div siempre montado para animación
            opacity, controlamos pointer-events para no bloquear cuando cerrado. */}
        <div
          className={`fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={handleSidebarClose}
          aria-hidden={!sidebarOpen}
        />

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