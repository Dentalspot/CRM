import React from 'react'; //renderiza la lista que le pasan como sections. El archivo que define esas secciones es el padre
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming ScrollArea exists or will be created

const ProfileSidebarNav = ({ sections, activeSection, onNavigate }) => {
  return (
    <ScrollArea className="h-full max-h-[calc(100vh-8rem)]"> {/* Adjust max-h as needed */}
      <nav className="space-y-1 p-4">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(section.id);
            }}
            className={cn(
              'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
              activeSection === section.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground'
            )}
          >
            {section.icon && React.cloneElement(section.icon, { className: "mr-3 h-5 w-5"})}
            {section.title}
          </a>
        ))}
      </nav>
    </ScrollArea>
  );
};

export default ProfileSidebarNav;