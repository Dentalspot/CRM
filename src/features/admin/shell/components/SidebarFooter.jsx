import React from 'react';
import { LogOut, HelpCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import logger from '@/lib/utils/logger';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SidebarFooter = ({ collapsed }) => {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      logger.error('Logout failed', error);
    }
  };

  const wrapperClass = collapsed ? "flex flex-col gap-2 items-center" : "space-y-1";

  return (
    <div className={cn("p-3 mt-auto border-t bg-muted/10", wrapperClass)}>
      {collapsed ? (
        <>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Ayuda</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Cerrar Sesión</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      ) : (
        <>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground h-8 text-xs font-normal">
            <HelpCircle className="mr-2 h-3 w-3" />
            Centro de Ayuda
          </Button>
          <div className="flex items-center justify-between px-2 py-1 text-[10px] text-muted-foreground/60">
            <span>v2.4.0</span>
            <a href="#" className="hover:text-primary flex items-center gap-1">
              Changelog <ExternalLink className="h-2 w-2" />
            </a>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 h-9"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </>
      )}
    </div>
  );
};

export default SidebarFooter;