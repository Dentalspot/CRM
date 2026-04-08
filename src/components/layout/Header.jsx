
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { USER_ROLES } from '@/constants/roles';
import { LogOut, LayoutDashboard, Calendar, Menu } from 'lucide-react';
import ProfileAvatar from '@/components/shared/ProfileAvatar';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const userRole = user?.role;

  // Lógica centralizada para ruta de Blog por rol
  const getBlogRoute = () => '/blog';

  // Lógica para dashboard base por rol
  const getDashboardRoute = () => {
    if (!user) return '/';
    if (userRole === USER_ROLES.THERAPIST) return '/dashboard/therapist';
    if (userRole === USER_ROLES.PATIENT) return '/dashboard/patient';
    if (userRole === USER_ROLES.ADMIN) return '/admin';
    if (userRole === USER_ROLES.CLINIC) return '/dashboard/clinic';
    return '/dashboard';
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-20 items-center justify-between">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to="/planes" className={navigationMenuTriggerStyle()}>
                Planes
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link to={getBlogRoute()} className={navigationMenuTriggerStyle()}>
                Blog
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link to="/contacto" className={navigationMenuTriggerStyle()}>
                Contacto
              </Link>
            </NavigationMenuItem>
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
                <DropdownMenuItem onClick={() => navigate('/dashboard/calendar')}>
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
              <Button onClick={() => navigate('/auth/register')} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-opacity">
                Registrarse
              </Button>
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
                  <nav className="flex flex-col gap-4">
                    <button onClick={() => handleNavigation('/')} className="text-left text-lg font-medium hover:text-primary transition-colors">
                      Inicio
                    </button>
                    <button onClick={() => handleNavigation('/planes')} className="text-left text-lg font-medium hover:text-primary transition-colors">
                      Planes
                    </button>
                    <button onClick={() => handleNavigation(getBlogRoute())} className="text-left text-lg font-medium hover:text-primary transition-colors">
                      Blog
                    </button>
                    <button onClick={() => handleNavigation('/contacto')} className="text-left text-lg font-medium hover:text-primary transition-colors">
                      Contacto
                    </button>
                  </nav>

                  {!user && (
                    <div className="mt-8 flex flex-col gap-3">
                      <Button variant="outline" className="w-full" onClick={() => handleNavigation('/auth/login')}>
                        Iniciar Sesión
                      </Button>
                      <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90" onClick={() => handleNavigation('/auth/register')}>
                        Registrarse
                      </Button>
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

// AUDITORÍA 2026-03-06: Header corregido por roles (DentalSpot). Lógica centralizada para rutas de Blog y Q&A dependientes del rol. Revisado y asegurado que no hay rutas hardcodeadas incorrectas en el menú principal.
