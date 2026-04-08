import React from 'react';
import { FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NotFoundState = ({ 
  title = "No encontrado", 
  description = "No pudimos encontrar el recurso que estás buscando.", 
  icon: Icon = FileQuestion,
  backLink,
  backLabel = "Volver",
  className,
  children
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in duration-500", className)}>
      <div className="bg-muted/50 p-4 rounded-full mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
      {children}
      {backLink && (
        <Button asChild variant="outline" className="mt-2">
          <Link to={backLink}>
            {backLabel}
          </Link>
        </Button>
      )}
    </div>
  );
};

export default NotFoundState;