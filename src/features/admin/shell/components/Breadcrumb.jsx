import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Map route segments to readable names if needed
  const nameMap = {
    admin: 'Dashboard',
    patients: 'Pacientes',
    clinical: 'Clínico',
    settings: 'Configuración',
    marketplace: 'Marketplace',
    blog: 'Blog',
    qa: 'Q&A'
  };

  return (
    <nav className="flex items-center text-sm text-muted-foreground">
      <Link to="/admin" className="flex items-center hover:text-foreground transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      
      {pathnames.length > 0 && pathnames[0] !== 'admin' && (
        <span className="mx-2 text-muted-foreground/40"><ChevronRight className="h-4 w-4" /></span>
      )}

      {pathnames.map((value, index) => {
        if (value === 'admin' && index === 0) return null; // Already handled Home icon

        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const name = nameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

        return (
          <div key={to} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/40" />}
            {isLast ? (
              <span className="font-medium text-foreground">{name}</span>
            ) : (
              <Link to={to} className="hover:text-foreground transition-colors">
                {name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;