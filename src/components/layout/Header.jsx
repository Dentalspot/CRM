
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Logo from '@/components/shared/Logo';
import { useAuth } from '@/contexts/AuthContext';
import useEffectiveDashboardRoute from '@/hooks/useEffectiveDashboardRoute';
import { LogOut, LayoutDashboard, Calendar, Menu } from 'lucide-react';
import ProfileAvatar from '@/components/shared/ProfileAvatar';

/**
 * Header con nav condicional por audiencia (spec 027):
 *  - `/` (patient home): Blog · Contacto · Iniciar sesión
 *  - `/para-dentistas`: Features · Pricing · Blog · Contacto · Iniciar sesión
 *      + badge visual "para profesionales" al lado del logo
 *  - Otras rutas anónimas: Planes · Blog · Contacto · Iniciar sesión + Registrarse
 *    (comportamiento legacy preservado para no romper /planes, /blog/*, etc.)
 *  - Logueado: dropdown user → dashboard, agenda, logout (sin cambios)
 *
 * El click en logo SIEMPRE va a `/` (raíz patient) — comportamiento estándar web.
 */
const Header = () => {
  const { user, signOut } = useAuth();
  // Spec 028 priority swap: si el user es admin+dentista en una org, debe ir al
  // dashboard admin, NO al dashboard dentista invitado. Hook propio porque este
  // Header vive FUERA del OrganizationProvider (que solo envuelve /dashboard/*).
  const { dashboardPath, agendaPath } = useEffectiveDashboardRoute();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isPatientHome = location.pathname === '/';
  const isDentistLanding = location.pathname === '/para-dentistas' || location.pathname === '/para-dentistas/';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const getBlogRoute = () => '/blog';
  const getDashboardRoute = () => (user ? dashboardPath : '/');
  const getAgendaRoute = () => agendaPath;

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  // Smooth-scroll a anchor dentro de /para-dentistas
  const handleAnchorClick = (e, anchor) => {
    e.preventDefault();
    const el = document.querySelector(anchor);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setIsMobileMenuOpen(false);
  };

  // ── Nav items por contexto ──────────────────────────────────────────────
  const renderDesktopNav = () => {
    if (isDentistLanding) {
      return (
        <>
          <NavigationMenuItem>
            <a href="#features" onClick={(e) => handleAnchorClick(e, '#features')} className={navigationMenuTriggerStyle()}>
              Features
            </a>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <a href="#pricing" onClick={(e) => handleAnchorClick(e, '#pricing')} className={navigationMenuTriggerStyle()}>
              Pricing
            </a>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to={getBlogRoute()} className={navigationMenuTriggerStyle()}>Blog</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/contacto" className={navigationMenuTriggerStyle()}>Contacto</Link>
          </NavigationMenuItem>
        </>
      );
    }
    if (isPatientHome) {
      return (
        <>
          <NavigationMenuItem>
            <Link to={getBlogRoute()} className={navigationMenuTriggerStyle()}>Blog</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/contacto" className={navigationMenuTriggerStyle()}>Contacto</Link>
          </NavigationMenuItem>
        </>
      );
    }
    // Legacy: otras rutas anónimas (preserva /planes accesible)
    return (
      <>
        <NavigationMenuItem>
          <Link to="/planes" className={navigationMenuTriggerStyle()}>Planes</Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link to={getBlogRoute()} className={navigationMenuTriggerStyle()}>Blog</Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link to="/contacto" className={navigationMenuTriggerStyle()}>Contacto</Link>
        </NavigationMenuItem>
      </>
    );
  };

  const renderMobileNav = () => {
    if (isDentistLanding) {
      return (
        <>
          <button onClick={(e) => handleAnchorClick(e, '#features')} className="text-left text-lg font-medium hover:text-primary transition-colors">
            Features
          </button>
          <button onClick={(e) => handleAnchorClick(e, '#pricing')} className="text-left text-lg font-medium hover:text-primary transition-colors">
            Pricing
          </button>
          <button onClick={() => handleNavigation(getBlogRoute())} className="text-left text-lg font-medium hover:text-primary transition-colors">
            Blog
          </button>
          <button onClick={() => handleNavigation('/contacto')} className="text-left text-lg font-medium hover:text-primary transition-colors">
            Contacto
          </button>
        </>
      );
    }
    if (isPatientHome) {
      return (
        <>
          <button onClick={() => handleNavigation(getBlogRoute())} className="text-left text-lg font-medium hover:text-primary transition-colors">
            Blog
          </button>
          <button onClick={() => handleNavigation('/contacto')} className="text-left text-lg font-medium hover:text-primary transition-colors">
            Contacto
          </button>
        </>
      );
    }
    // Legacy
    return (
      <>
        <button onClick={() => handleNavigation('/')} className="text-left text-lg font-medium hover:text-primary transition-colors">Inicio</button>
        <button onClick={() => handleNavigation('/planes')} className="text-left text-lg font-medium hover:text-primary transition-colors">Planes</button>
        <button onClick={() => handleNavigation(getBlogRoute())} className="text-left text-lg font-medium hover:text-primary transition-colors">Blog</button>
        <button onClick={() => handleNavigation('/contacto')} className="text-left text-lg font-medium hover:text-primary transition-colors">Contacto</button>
      </>
    );
  };

  // Patient home oculta el botón "Registrarse" (foco: paciente describe síntoma)
  const showRegisterButton = !isPatientHome && !isDentistLanding;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-20 items-center justify-between">
        <Link to="/" className="hover:opacity-80 transition-opacity inline-flex items-center gap-2">
          <Logo />
          {/* Badge "para profesionales" — solo en /para-dentistas */}
          {isDentistLanding && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-teal-700 bg-teal-50 rounded-full whitespace-nowrap">
              para profesionales
            </span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {renderDesktopNav()}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center space-x-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <ProfileAvatar
                    profile={user}
                    className="h-10 w-10 border-primary"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.full_name || 'Usuario'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(getDashboardRoute())}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Panel Principal</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(getAgendaRoute())}>
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Agenda</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="ghost" onClick={() => navigate('/auth/login')}>
                Iniciar Sesión
              </Button>
              {showRegisterButton && (
                <Button onClick={() => navigate('/auth/register')} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-opacity">
                  Registrarse
                </Button>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full mt-6">
                  {isDentistLanding && (
                    <span className="self-start mb-4 px-2 py-0.5 text-[11px] font-medium text-teal-700 bg-teal-50 rounded-full">
                      para profesionales
                    </span>
                  )}
                  <nav className="flex flex-col gap-4">
                    {renderMobileNav()}
                  </nav>

                  {!user && (
                    <div className="mt-8 flex flex-col gap-3">
                      <Button variant="outline" className="w-full" onClick={() => handleNavigation('/auth/login')}>
                        Iniciar Sesión
                      </Button>
                      {showRegisterButton && (
                        <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90" onClick={() => handleNavigation('/auth/register')}>
                          Registrarse
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
